import { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_MAP_CENTER, formatDate, formatCurrency } from '../utils/dashboard';

const INITIAL_MAP_ZOOM = 6;
const MAX_INDIVIDUAL_POINT_ZOOM = 10;

function getClusterCellSize(zoom) {
  if (zoom >= MAX_INDIVIDUAL_POINT_ZOOM) {
    return null;
  }

  return Math.max(0.05, 1.6 / 2 ** Math.max(zoom - 4, 0));
}

function buildBounds(points) {
  return points.map((point) => [point.latitude, point.longitude]);
}

function buildClusterLabel(points) {
  const cityNames = [...new Set(points.map((point) => point.city))];

  if (cityNames.length <= 3) {
    return cityNames.join(', ');
  }

  return `${cityNames.slice(0, 3).join(', ')} +${cityNames.length - 3}`;
}

function clusterPoints(points, zoom) {
  const cellSize = getClusterCellSize(zoom);

  if (!cellSize) {
    return points.map((point, index) => ({
      id: `${point.city}-${point.date}-${index}`,
      kind: 'point',
      latitude: point.latitude,
      longitude: point.longitude,
      points: [point]
    }));
  }

  const groups = new Map();

  points.forEach((point, index) => {
    const latBucket = Math.floor(point.latitude / cellSize);
    const lngBucket = Math.floor(point.longitude / cellSize);
    const key = `${latBucket}:${lngBucket}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.points.push(point);
      existingGroup.totalLatitude += point.latitude;
      existingGroup.totalLongitude += point.longitude;
      return;
    }

    groups.set(key, {
      id: `${key}-${index}`,
      points: [point],
      totalLatitude: point.latitude,
      totalLongitude: point.longitude
    });
  });

  return [...groups.values()].map((group) => {
    const count = group.points.length;

    return {
      id: group.id,
      kind: count === 1 ? 'point' : 'cluster',
      latitude: group.totalLatitude / count,
      longitude: group.totalLongitude / count,
      points: group.points
    };
  });
}

function MapViewportTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });

  return null;
}

function ClusteredPointsLayer({ points, zoom }) {
  const map = useMap();
  const clusters = useMemo(() => clusterPoints(points, zoom), [points, zoom]);

  return clusters.map((cluster) => {
    if (cluster.kind === 'cluster') {
      const demandTotal = cluster.points.reduce((sum, point) => sum + point.demand_count, 0);
      const cityLabel = buildClusterLabel(cluster.points);

      return (
        <CircleMarker
          key={cluster.id}
          center={[cluster.latitude, cluster.longitude]}
          radius={10 + Math.min(16, cluster.points.length * 1.8)}
          color="#8f6a00"
          fillColor="#f2c300"
          fillOpacity={0.72}
          eventHandlers={{
            click: () => {
              map.flyToBounds(buildBounds(cluster.points), {
                padding: [40, 40],
                maxZoom: Math.min(map.getZoom() + 2, MAX_INDIVIDUAL_POINT_ZOOM + 1)
              });
            }
          }}
        >
          <Popup>
            <div>
              <strong>{cluster.points.length} points regroupes</strong>
            </div>
            <div>{cityLabel}</div>
            <div>Demande cumulee: {demandTotal}</div>
            <div>Cliquez pour zoomer</div>
          </Popup>
        </CircleMarker>
      );
    }

    const point = cluster.points[0];

    return (
      <CircleMarker
        key={cluster.id}
        center={[point.latitude, point.longitude]}
        radius={5 + Math.min(10, point.demand_count / 50)}
        color="#111111"
        fillOpacity={0.8}
      >
        <Popup>
          <div>
            <strong>{point.city}</strong>
            <br />
            {point.region} {formatDate(point.date)}
          </div>
          <div>Prix: {formatCurrency(point.price_eur)}</div>
          <div>
            Demande {point.demand_count}; Offre {point.supply_count}
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

export function MapSection({ points }) {
  const mapCenter = points.length ? [points[0].latitude, points[0].longitude] : DEFAULT_MAP_CENTER;
  const [zoom, setZoom] = useState(INITIAL_MAP_ZOOM);

  return (
    <article className="surface-card map-card">
      <div className="section-heading">
        <p className="eyebrow">Carte</p>
        <h3>Repartition des points</h3>
        <p className="map-card__hint">
          Les points proches se regroupent automatiquement quand la carte est dezoomee.
        </p>
      </div>

      <MapContainer center={mapCenter} zoom={INITIAL_MAP_ZOOM} style={{ height: '480px', width: '100%' }}>
        <MapViewportTracker onZoomChange={setZoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClusteredPointsLayer points={points} zoom={zoom} />
      </MapContainer>
    </article>
  );
}

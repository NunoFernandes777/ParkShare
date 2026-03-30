import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { DEFAULT_MAP_CENTER, formatDate, formatCurrency } from '../utils/dashboard';

export function MapSection({ points }) {
  const mapCenter = points.length ? [points[0].latitude, points[0].longitude] : DEFAULT_MAP_CENTER;

  return (
    <article className="surface-card map-card">
      <div className="section-heading">
        <p className="eyebrow">Carte</p>
        <h3>Repartition des points</h3>
      </div>

      <MapContainer center={mapCenter} zoom={6} style={{ height: '480px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {points.map((point, index) => (
          <CircleMarker
            key={`${point.city}-${index}-${point.date}`}
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
        ))}
      </MapContainer>
    </article>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';
import { mockKpis, mockPoints } from './mockData';

const formatDate = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);
const formatCurrency = (value) => `${value.toFixed(2)} EUR`;

const getRegionsFromKpis = (rows) => [...new Set(rows.map((row) => row.region))].sort();

const getCitiesForRegion = (rows, region) => {
  const filteredRows = region ? rows.filter((row) => row.region === region) : rows;
  return [...new Set(filteredRows.map((row) => row.city))].sort();
};

const filterBySelection = (rows, region, city, dateRange) =>
  rows.filter((row) => {
    if (region && row.region !== region) return false;
    if (city && row.city !== city) return false;
    if (dateRange[0] && row.date < dateRange[0]) return false;
    if (dateRange[1] && row.date > dateRange[1]) return false;
    return true;
  });

const getPriceBand = (price) => {
  if (price < 3.5) return 'Economique';
  if (price < 5.5) return 'Intermediaire';
  return 'Premium';
};

const priceBandClassName = (price) => {
  if (price < 3.5) return 'tariff-chip tariff-chip--low';
  if (price < 5.5) return 'tariff-chip tariff-chip--mid';
  return 'tariff-chip tariff-chip--high';
};

export default function App() {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [dateRange, setDateRange] = useState(['2025-01-01', '2025-12-31']);
  const [kpis, setKpis] = useState([]);
  const [points, setPoints] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const params = new URLSearchParams();
      if (selectedRegion) params.append('region', selectedRegion);
      if (selectedCity) params.append('city', selectedCity);
      if (dateRange[0]) params.append('start_date', dateRange[0]);
      if (dateRange[1]) params.append('end_date', dateRange[1]);

      try {
        const requests = [
          fetch('/api/regions'),
          fetch(selectedRegion ? `/api/cities?region=${encodeURIComponent(selectedRegion)}` : '/api/cities'),
          fetch(`/api/kpis?${params.toString()}`),
          fetch(`/api/points?${params.toString()}`)
        ];

        const [regionsResponse, citiesResponse, kpisResponse, pointsResponse] = await Promise.all(requests);

        if (![regionsResponse, citiesResponse, kpisResponse, pointsResponse].every((response) => response.ok)) {
          throw new Error('API unavailable');
        }

        const [regionsData, citiesData, kpisData, pointsData] = await Promise.all([
          regionsResponse.json(),
          citiesResponse.json(),
          kpisResponse.json(),
          pointsResponse.json()
        ]);

        if (!isMounted) return;

        setRegions(regionsData);
        setCities(citiesData);
        setKpis(kpisData);
        setPoints(pointsData);
        setIsOfflineMode(false);
      } catch {
        if (!isMounted) return;

        const filteredKpis = filterBySelection(mockKpis, selectedRegion, selectedCity, dateRange);
        const filteredPoints = filterBySelection(mockPoints, selectedRegion, selectedCity, dateRange);

        setRegions(getRegionsFromKpis(mockKpis));
        setCities(getCitiesForRegion(mockKpis, selectedRegion));
        setKpis(filteredKpis);
        setPoints(filteredPoints);
        setIsOfflineMode(true);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedRegion, selectedCity, dateRange]);

  const kpisByRegion = useMemo(() => {
    const grouping = {};

    kpis.forEach((row) => {
      grouping[row.region] = grouping[row.region] || [];
      grouping[row.region].push(row);
    });

    return grouping;
  }, [kpis]);

  const summary = useMemo(() => {
    if (!kpis.length) {
      return {
        avgPrice: 0,
        avgOccupancy: 0,
        topCity: '-'
      };
    }

    const totals = kpis.reduce(
      (accumulator, row) => {
        accumulator.price += row.avg_price;
        accumulator.occupancy += row.avg_occupancy;
        accumulator.cityObservations[row.city] = (accumulator.cityObservations[row.city] || 0) + row.observations;

        return accumulator;
      },
      { price: 0, occupancy: 0, cityObservations: {} }
    );

    const topCity = Object.entries(totals.cityObservations).sort((left, right) => right[1] - left[1])[0]?.[0];

    return {
      avgPrice: totals.price / kpis.length,
      avgOccupancy: totals.occupancy / kpis.length,
      topCity: topCity || '-'
    };
  }, [kpis]);

  const chartPriceData = Object.entries(kpisByRegion).map(([region, rows]) => ({
    region,
    avg_price: rows.reduce((sum, row) => sum + row.avg_price, 0) / rows.length
  }));

  const tariffOverview = useMemo(() => {
    if (!kpis.length) {
      return {
        average: 0,
        min: 0,
        max: 0,
        spread: 0,
        cheapestRegion: '-',
        highestRegion: '-'
      };
    }

    const prices = kpis.map((row) => row.avg_price);
    const regionAverages = Object.entries(kpisByRegion).map(([region, rows]) => ({
      region,
      average: rows.reduce((sum, row) => sum + row.avg_price, 0) / rows.length
    }));

    const cheapestRegion = [...regionAverages].sort((left, right) => left.average - right.average)[0];
    const highestRegion = [...regionAverages].sort((left, right) => right.average - left.average)[0];

    return {
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      spread: Math.max(...prices) - Math.min(...prices),
      cheapestRegion: cheapestRegion?.region || '-',
      highestRegion: highestRegion?.region || '-'
    };
  }, [kpis, kpisByRegion]);

  const tariffDetails = useMemo(
    () =>
      Object.entries(kpisByRegion)
        .map(([region, rows]) => {
          const prices = rows.map((row) => row.avg_price);
          const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          const occupancy = rows.reduce((sum, row) => sum + row.avg_occupancy, 0) / rows.length;
          const topCity = [...rows].sort((left, right) => right.observations - left.observations)[0];

          return {
            region,
            average,
            min: Math.min(...prices),
            max: Math.max(...prices),
            occupancy,
            topCity: topCity?.city || '-',
            topObservations: topCity?.observations || 0,
            priceBand: getPriceBand(average)
          };
        })
        .sort((left, right) => left.average - right.average),
    [kpisByRegion]
  );

  const mapCenter = points.length
    ? [points[0].latitude, points[0].longitude]
    : [46.5, 2.5];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#hero">
          <span className="brand__park">Park</span>
          <span className="brand__share">share</span>
        </a>

        <nav className="topbar__nav" aria-label="Navigation principale">
          <a href="#story">A propos</a>
          <a href="#insights">Tarifs</a>
          <a href="#filters">Contact</a>
        </nav>
      </header>

      <main>
        <section className="insights-grid" id="insights">
          <article className="insight-card insight-card--accent">
            <span className="insight-card__label">Observations</span>
            <strong>{kpis.length}</strong>
            <p>{isOfflineMode ? 'Source demo locale' : 'Source API temps reel'}</p>
          </article>

          <article className="insight-card">
            <span className="insight-card__label">Prix moyen</span>
            <strong>{summary.avgPrice.toFixed(2)} EUR</strong>
            <p>Lecture transversale des tarifs moyens sur la selection.</p>
          </article>

          <article className="insight-card">
            <span className="insight-card__label">Occupation moyenne</span>
            <strong>{(summary.avgOccupancy * 100).toFixed(1)}%</strong>
            <p>Indique la tension moyenne entre demande et disponibilite.</p>
          </article>

          <article className="insight-card">
            <span className="insight-card__label">Ville la plus suivie</span>
            <strong>{summary.topCity}</strong>
            <p>Ville la plus observee sur la plage de dates active.</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <aside className="control-panel" id="filters">
            <div className="section-heading">
              <p className="eyebrow">Filtres</p>
              <h3>Affiner la vue</h3>
            </div>

            <label htmlFor="region">Region</label>
            <select
              id="region"
              value={selectedRegion}
              onChange={(event) => {
                setSelectedRegion(event.target.value);
                setSelectedCity('');
              }}
            >
              <option value="">Toutes</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <label htmlFor="city">Ville</label>
            <select id="city" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)}>
              <option value="">Toutes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <label htmlFor="start-date">Date debut</label>
            <input
              id="start-date"
              type="date"
              value={dateRange[0]}
              onChange={(event) => setDateRange([event.target.value, dateRange[1]])}
            />

            <label htmlFor="end-date">Date fin</label>
            <input
              id="end-date"
              type="date"
              value={dateRange[1]}
              onChange={(event) => setDateRange([dateRange[0], event.target.value])}
            />

            <div className="control-panel__summary">
              <div>
                <span>Region active</span>
                <strong>{selectedRegion || 'Toutes'}</strong>
              </div>
              <div>
                <span>Ville active</span>
                <strong>{selectedCity || 'Toutes'}</strong>
              </div>
            </div>
          </aside>

          <section className="content-stack">
            <div className="chart-grid">
              <article className="surface-card">
                <div className="section-heading">
                  <p className="eyebrow">Tarifs</p>
                  <h3>Prix par region, avec plus de contexte</h3>
                </div>
                <div className="tariff-overview">
                  <div className="tariff-stat">
                    <span>Moyenne observee</span>
                    <strong>{formatCurrency(tariffOverview.average)}</strong>
                  </div>
                  <div className="tariff-stat">
                    <span>Fourchette</span>
                    <strong>
                      {formatCurrency(tariffOverview.min)} - {formatCurrency(tariffOverview.max)}
                    </strong>
                  </div>
                  <div className="tariff-stat">
                    <span>Ecart de prix</span>
                    <strong>{formatCurrency(tariffOverview.spread)}</strong>
                  </div>
                  <div className="tariff-stat">
                    <span>Zone la plus accessible</span>
                    <strong>{tariffOverview.cheapestRegion}</strong>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartPriceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#d7d2c7" />
                    <XAxis dataKey="region" stroke="#5a5a5a" />
                    <YAxis stroke="#5a5a5a" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="avg_price" fill="#111111" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="tariff-details">
                  {tariffDetails.map((detail) => (
                    <article key={detail.region} className="tariff-detail-card">
                      <div className="tariff-detail-card__header">
                        <div>
                          <h4>{detail.region}</h4>
                          <p>Ville leader: {detail.topCity}</p>
                        </div>
                        <span className={priceBandClassName(detail.average)}>{detail.priceBand}</span>
                      </div>
                      <div className="tariff-detail-card__grid">
                        <div>
                          <span>Tarif moyen</span>
                          <strong>{formatCurrency(detail.average)}</strong>
                        </div>
                        <div>
                          <span>Min / Max</span>
                          <strong>
                            {formatCurrency(detail.min)} / {formatCurrency(detail.max)}
                          </strong>
                        </div>
                        <div>
                          <span>Occupation moyenne</span>
                          <strong>{(detail.occupancy * 100).toFixed(1)}%</strong>
                        </div>
                        <div>
                          <span>Observations cle</span>
                          <strong>{detail.topObservations}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </div>

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
                      <div>Prix: {point.price_eur} EUR</div>
                      <div>
                        Demande {point.demand_count}; Offre {point.supply_count}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </article>

            <article className="surface-card table-card">
              <div className="section-heading">
                <p className="eyebrow">Classement</p>
                <h3>KPI par ville</h3>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Region</th>
                      <th>Ville</th>
                      <th>Prix moyen</th>
                      <th>Taux occupation</th>
                      <th>Observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.slice(0, 80).map((row, index) => (
                      <tr key={`${row.region}-${row.city}-${row.date}-${index}`}>
                        <td>{row.date}</td>
                        <td>{row.region}</td>
                        <td>{row.city}</td>
                        <td>{row.avg_price.toFixed(2)}</td>
                        <td>{(row.avg_occupancy * 100).toFixed(1)}%</td>
                        <td>{row.observations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </section>
      </main>
    </div>
  );
}

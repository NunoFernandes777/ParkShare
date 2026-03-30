import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { FiltersPanel } from './components/FiltersPanel';
import { InsightsSection } from './components/InsightsSection';
import { KpiTableSection } from './components/KpiTableSection';
import { MapSection } from './components/MapSection';
import { TariffSection } from './components/TariffSection';
import { mockKpis, mockPoints } from './mockData';
import {
  DEFAULT_DATE_RANGE,
  buildChartPriceData,
  buildSummary,
  buildTariffDetails,
  buildTariffOverview,
  filterBySelection,
  getCitiesForRegion,
  getRegionsFromKpis,
  groupKpisByRegion
} from './utils/dashboard';

export default function App() {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [kpis, setKpis] = useState([]);
  const [points, setPoints] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // On centralise les filtres dans les query params pour garder
      // le meme comportement entre l'API et le mode demo local.
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

  const kpisByRegion = useMemo(() => groupKpisByRegion(kpis), [kpis]);
  const summary = useMemo(() => buildSummary(kpis), [kpis]);
  const chartPriceData = useMemo(() => buildChartPriceData(kpisByRegion), [kpisByRegion]);
  const tariffOverview = useMemo(() => buildTariffOverview(kpis, kpisByRegion), [kpis, kpisByRegion]);
  const tariffDetails = useMemo(() => buildTariffDetails(kpisByRegion), [kpisByRegion]);

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    setSelectedCity('');
  };

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
        <InsightsSection kpisCount={kpis.length} isOfflineMode={isOfflineMode} summary={summary} />

        <section className="dashboard-grid">
          <FiltersPanel
            regions={regions}
            cities={cities}
            selectedRegion={selectedRegion}
            selectedCity={selectedCity}
            dateRange={dateRange}
            onRegionChange={handleRegionChange}
            onCityChange={setSelectedCity}
            onDateRangeChange={setDateRange}
          />

          <section className="content-stack">
            <div className="chart-grid">
              <TariffSection
                chartPriceData={chartPriceData}
                tariffOverview={tariffOverview}
                tariffDetails={tariffDetails}
              />
            </div>

            <MapSection points={points} />

            <KpiTableSection kpis={kpis} />
          </section>
        </section>
      </main>
    </div>
  );
}

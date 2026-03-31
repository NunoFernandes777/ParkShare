import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { FiltersPanel } from './components/FiltersPanel';
import { InsightsSection } from './components/InsightsSection';
import { KpiTableSection } from './components/KpiTableSection';
import { MapSection } from './components/MapSection';
import { TariffSection } from './components/TariffSection';
import { ChatbotPanel } from './components/ChatbotPanel';
import { mockKpis, mockPoints } from './mockData';
import {
  buildChartPriceData,
  buildSummary,
  buildTariffDetails,
  buildTariffOverview,
  filterBySelection,
  getCitiesForRegion,
  getRegionsFromKpis,
  groupKpisByRegion
} from './utils/dashboard';

const API_ENDPOINTS = {
  regions: '/api/regions',
  cities: '/api/cities',
  kpis: '/api/kpis',
  points: '/api/points'
};

function buildFilterParams(region, city) {
  const params = new URLSearchParams();

  if (region) params.append('region', region);
  if (city) params.append('city', city);

  return params;
}

function buildApiUrls(region, city) {
  const params = buildFilterParams(region, city);
  const queryString = params.toString();
  const querySuffix = queryString ? `?${queryString}` : '';
  const citySuffix = region ? `?region=${encodeURIComponent(region)}` : '';

  return {
    regions: API_ENDPOINTS.regions,
    cities: `${API_ENDPOINTS.cities}${citySuffix}`,
    kpis: `${API_ENDPOINTS.kpis}${querySuffix}`,
    points: `${API_ENDPOINTS.points}${querySuffix}`
  };
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }

  return response.json();
}

async function loadApiData(region, city) {
  const urls = buildApiUrls(region, city);
  const [regions, cities, kpis, points] = await Promise.all([
    fetchJson(urls.regions),
    fetchJson(urls.cities),
    fetchJson(urls.kpis),
    fetchJson(urls.points)
  ]);

  return { regions, cities, kpis, points };
}

function loadOfflineData(region, city) {
  return {
    regions: getRegionsFromKpis(mockKpis),
    cities: getCitiesForRegion(mockKpis, region),
    kpis: filterBySelection(mockKpis, region, city),
    points: filterBySelection(mockPoints, region, city)
  };
}

export default function App() {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [kpis, setKpis] = useState([]);
  const [points, setPoints] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const data = await loadApiData(selectedRegion, selectedCity);
        if (!isMounted) return;

        setRegions(data.regions);
        setCities(data.cities);
        setKpis(data.kpis);
        setPoints(data.points);
        setIsOfflineMode(false);
      } catch {
        if (!isMounted) return;

        const data = loadOfflineData(selectedRegion, selectedCity);

        setRegions(data.regions);
        setCities(data.cities);
        setKpis(data.kpis);
        setPoints(data.points);
        setIsOfflineMode(true);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedRegion, selectedCity]);

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
            onRegionChange={handleRegionChange}
            onCityChange={setSelectedCity}
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

      <ChatbotPanel
        selectedRegion={selectedRegion}
        selectedCity={selectedCity}
        summary={summary}
        tariffOverview={tariffOverview}
        kpis={kpis}
      />
    </div>
  );
}

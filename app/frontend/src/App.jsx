import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { AnalyticsSection } from './components/AnalyticsSection';
import { FiltersPanel } from './components/FiltersPanel';
import { HighlightsSection } from './components/HighlightsSection';
import { InsightsSection } from './components/InsightsSection';
import { KpiTableSection } from './components/KpiTableSection';
import { MapSection } from './components/MapSection';
import { TariffSection } from './components/TariffSection';
import { ChatbotPanel } from './components/ChatbotPanel';
import {
  buildChartScoreData,
  buildInterestingHighlights,
  buildKpi1CityScoreData,
  buildKpi1DepartmentScoreData,
  buildKpi3AgeStackData,
  buildKpi3StatusData,
  buildKpi4OfferDemandBounds,
  buildKpi4OfferDemandData,
  buildKpi4ProfileData,
  buildMotorizationScatterBounds,
  buildMotorizationScatterData,
  buildPotentialDetails,
  buildPotentialOverview,
  buildSummary,
  getCitiesForRegion,
  groupKpisByRegion
} from './utils/dashboard';

const API_ENDPOINTS = {
  regions: '/api/regions',
  cities: '/api/cities',
  kpis: '/api/kpis',
  points: '/api/points',
  kpi3: '/api/kpi3',
  kpi4: '/api/kpi4'
};

function buildFilterParams(region, city) {
  const params = new URLSearchParams();

  if (region) params.append('department', region);
  if (city) params.append('city', city);

  return params;
}

function buildApiUrls(region, city) {
  const params = buildFilterParams(region, city);
  const queryString = params.toString();
  const querySuffix = queryString ? `?${queryString}` : '';
  const citySuffix = region ? `?department=${encodeURIComponent(region)}` : '';

  return {
    regions: API_ENDPOINTS.regions,
    cities: `${API_ENDPOINTS.cities}${citySuffix}`,
    kpis: `${API_ENDPOINTS.kpis}${querySuffix}`,
    points: `${API_ENDPOINTS.points}${querySuffix}`,
    kpi3: `${API_ENDPOINTS.kpi3}${querySuffix}`,
    kpi4: `${API_ENDPOINTS.kpi4}${querySuffix}`
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
  const cityParams = new URLSearchParams();
  if (region) cityParams.append('department', region);
  const cityOptionsUrl = `${API_ENDPOINTS.kpis}${cityParams.toString() ? `?${cityParams.toString()}` : ''}`;

  const [regions, cityRows, kpis, points, kpi3Rows, kpi4Rows] = await Promise.all([
    fetchJson(urls.regions),
    fetchJson(cityOptionsUrl),
    fetchJson(urls.kpis),
    fetchJson(urls.points),
    fetchJson(urls.kpi3),
    fetchJson(urls.kpi4)
  ]);

  return {
    regions,
    cities: getCitiesForRegion(cityRows, region),
    kpis,
    points,
    kpi3Rows,
    kpi4Rows
  };
}

export default function App() {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [kpis, setKpis] = useState([]);
  const [points, setPoints] = useState([]);
  const [kpi3Rows, setKpi3Rows] = useState([]);
  const [kpi4Rows, setKpi4Rows] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState('');

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
        setKpi3Rows(data.kpi3Rows);
        setKpi4Rows(data.kpi4Rows);
        setIsOfflineMode(false);
        setApiErrorMessage('');
      } catch (error) {
        if (!isMounted) return;

        setRegions([]);
        setCities([]);
        setKpis([]);
        setPoints([]);
        setKpi3Rows([]);
        setKpi4Rows([]);
        setIsOfflineMode(true);
        setApiErrorMessage(error.message || 'Le dashboard ne parvient pas a recuperer les donnees.');
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedRegion, selectedCity]);

  const kpisByRegion = useMemo(() => groupKpisByRegion(kpis), [kpis]);
  const summary = useMemo(() => buildSummary(kpis), [kpis]);
  const chartScoreData = useMemo(() => buildChartScoreData(kpisByRegion), [kpisByRegion]);
  const interestingHighlights = useMemo(() => buildInterestingHighlights(kpis), [kpis]);
  const kpi1CityScoreData = useMemo(() => buildKpi1CityScoreData(kpis), [kpis]);
  const kpi1DepartmentScoreData = useMemo(() => buildKpi1DepartmentScoreData(kpis), [kpis]);
  const kpi3StatusData = useMemo(() => buildKpi3StatusData(kpi3Rows), [kpi3Rows]);
  const kpi3AgeStackData = useMemo(() => buildKpi3AgeStackData(kpi3Rows), [kpi3Rows]);
  const kpi4ProfileData = useMemo(() => buildKpi4ProfileData(kpi4Rows), [kpi4Rows]);
  const kpi4OfferDemandData = useMemo(() => buildKpi4OfferDemandData(kpi4Rows), [kpi4Rows]);
  const kpi4OfferDemandBounds = useMemo(
    () => buildKpi4OfferDemandBounds(kpi4OfferDemandData),
    [kpi4OfferDemandData]
  );
  const motorizationScatterData = useMemo(() => buildMotorizationScatterData(kpis), [kpis]);
  const motorizationScatterBounds = useMemo(
    () => buildMotorizationScatterBounds(motorizationScatterData),
    [motorizationScatterData]
  );
  const potentialOverview = useMemo(() => buildPotentialOverview(kpis, kpisByRegion), [kpis, kpisByRegion]);
  const potentialDetails = useMemo(() => buildPotentialDetails(kpisByRegion), [kpisByRegion]);

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
        {isOfflineMode ? (
          <section className="status-banner status-banner--error" aria-live="polite">
            <strong>Connexion API indisponible.</strong>
            <span>
              {apiErrorMessage || 'Le dashboard ne peut pas charger le dataset consolide pour le moment.'}
            </span>
            <span>Verifiez que le backend tourne bien sur `http://localhost:4000`, puis rechargez la page.</span>
          </section>
        ) : null}

        <InsightsSection kpisCount={kpis.length} isOfflineMode={isOfflineMode} summary={summary} />

        <HighlightsSection highlights={interestingHighlights} />

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
                chartScoreData={chartScoreData}
                potentialOverview={potentialOverview}
                potentialDetails={potentialDetails}
              />
            </div>

            <AnalyticsSection
              kpi1CityScoreData={kpi1CityScoreData}
              kpi1DepartmentScoreData={kpi1DepartmentScoreData}
              motorizationScatterData={motorizationScatterData}
              motorizationScatterBounds={motorizationScatterBounds}
              averageMotorization={potentialOverview.averageMotorization}
              kpi3StatusData={kpi3StatusData}
              kpi3AgeStackData={kpi3AgeStackData}
              kpi4ProfileData={kpi4ProfileData}
              kpi4OfferDemandData={kpi4OfferDemandData}
              kpi4OfferDemandBounds={kpi4OfferDemandBounds}
            />

            <MapSection points={points} />

            <KpiTableSection kpis={kpis} />
          </section>
        </section>
      </main>

      <ChatbotPanel
        selectedRegion={selectedRegion}
        selectedCity={selectedCity}
        summary={summary}
        potentialOverview={potentialOverview}
        kpis={kpis}
      />
    </div>
  );
}

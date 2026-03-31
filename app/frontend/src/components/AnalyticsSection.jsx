import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';
import { formatInteger, formatPercent, formatScore } from '../utils/dashboard';

function Kpi1BarColor({ payload, x, y, width, height }) {
  const fill =
    payload.score_potentiel >= 60 ? '#f2c300' : payload.score_potentiel >= 35 ? '#d49a00' : '#6f7d73';

  return <rect x={x} y={y} width={width} height={height} rx={10} ry={10} fill={fill} />;
}

function Kpi1ValueLabel({ x, y, width, height, value }) {
  return (
    <text
      x={x + width + 10}
      y={y + height / 2}
      fill="#3d3a34"
      fontSize="11"
      dominantBaseline="middle"
    >
      {formatScore(value)}
    </text>
  );
}

function Kpi4ScatterPoint(props) {
  const { cx, cy, payload } = props;

  if (typeof cx !== 'number' || typeof cy !== 'number') {
    return null;
  }

  const radius = Math.max(5, Math.sqrt(payload.bubble_size) / 2.8);

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill="#f2c300" fillOpacity={0.72} stroke="#4b3a00" strokeWidth={1.1} />
      {payload.showLabel ? (
        <text x={cx + radius + 6} y={cy - 6} fill="#3d3a34" fontSize="11">
          {payload.city}
        </text>
      ) : null}
    </g>
  );
}

function Kpi4ScatterTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="analytics-tooltip">
      <strong>{label || point.city}</strong>
      <span>Offre copro : {formatInteger(point.lots_stat_copro)}</span>
      <span>Demande non couverte : {formatInteger(point.parking_gap)}</span>
      <span>Ratio/logement : {Number(point.ratio_stat_par_logement || 0).toFixed(3)}</span>
      <span>Menages sans parking : {formatPercent(point.pct_motorises_sans_parking)}</span>
    </div>
  );
}

function MotorizationScatterTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="analytics-tooltip">
      <strong>{label || point.city}</strong>
      <span>Taux de motorisation : {formatPercent(point.taux_motorisation_pct)}</span>
      <span>Lots stationnement : {formatInteger(point.lots_stationnement_copro)}</span>
      <span>Score potentiel : {formatScore(point.score_potentiel)}</span>
      <span>Appartements : {formatInteger(point.nb_appartements)}</span>
    </div>
  );
}

function getMotorizationScatterColor(score) {
  if (score >= 60) return '#f2c300';
  if (score >= 35) return '#d49a00';
  return '#6f7d73';
}

function MotorizationScatterPoint(props) {
  const { cx, cy, payload } = props;

  if (typeof cx !== 'number' || typeof cy !== 'number') {
    return null;
  }

  const radius = Math.max(4, Math.sqrt(payload.bubble_size) / 3.2);
  const fill = getMotorizationScatterColor(payload.score_potentiel);

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={fill} fillOpacity={0.72} stroke="#ffffff" strokeWidth={1.2} />
      {payload.showLabel ? (
        <text x={cx + radius + 6} y={cy - payload.labelOffsetY} fill="#3d3a34" fontSize="11">
          {payload.city}
        </text>
      ) : null}
    </g>
  );
}

const KPI3_STACK_KEYS = [
  { key: 'Actif', color: '#1f8c5d' },
  { key: 'Fin imminente', color: '#c99a00' },
  { key: 'Mandat termine', color: '#d96b4d' },
  { key: 'Expire', color: '#b13a30' }
];

export function AnalyticsSection({
  kpi1CityScoreData,
  kpi1DepartmentScoreData,
  motorizationScatterData,
  motorizationScatterBounds,
  averageMotorization,
  kpi3StatusData,
  kpi3AgeStackData,
  kpi4ProfileData,
  kpi4OfferDemandData,
  kpi4OfferDemandBounds
}) {
  const [kpi1View, setKpi1View] = useState('city');
  const kpi1Data = kpi1View === 'department' ? kpi1DepartmentScoreData : kpi1CityScoreData;
  const kpi1CategoryKey = kpi1View === 'department' ? 'department' : 'city';
  const kpi1Subtitle =
    kpi1View === 'department'
      ? 'Top 20 departements classes par score potentiel moyen.'
      : 'Top 20 villes classees du potentiel le plus fort au plus faible.';

  if (
    !kpi1CityScoreData.length &&
    !kpi1DepartmentScoreData.length &&
    !motorizationScatterData.length &&
    !kpi3StatusData.length &&
    !kpi3AgeStackData.length &&
    !kpi4ProfileData.length &&
    !kpi4OfferDemandData.length
  ) {
    return null;
  }

  const averageLots =
    motorizationScatterData.length > 0
      ? motorizationScatterData.reduce((sum, row) => sum + row.lots_stationnement_copro, 0) / motorizationScatterData.length
      : 0;
  const scatterWithLabels = motorizationScatterData.map((row, index) => ({
    ...row,
    labelOffsetY: index % 2 === 0 ? 10 : -2
  }));

  return (
    <section className="analytics-stack">
      <article className="surface-card">
        <div className="section-heading">
          <h3>Score potentiel</h3>
        </div>

        <div className="analytics-toggle" role="tablist" aria-label="Choix du classement KPI 1">
          <button
            type="button"
            className={`analytics-toggle__button ${kpi1View === 'city' ? 'analytics-toggle__button--active' : ''}`}
            aria-pressed={kpi1View === 'city'}
            onClick={() => setKpi1View('city')}
          >
            Ville
          </button>
          <button
            type="button"
            className={`analytics-toggle__button ${kpi1View === 'department' ? 'analytics-toggle__button--active' : ''}`}
            aria-pressed={kpi1View === 'department'}
            onClick={() => setKpi1View('department')}
          >
            Departement
          </button>
        </div>

        <p className="analytics-subtitle">{kpi1Subtitle}</p>

        <ResponsiveContainer width="100%" height={520}>
          <BarChart
            data={kpi1Data}
            layout="vertical"
            margin={{ top: 6, right: 22, left: 84, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#d7d2c7" />
            <XAxis type="number" stroke="#5a5a5a" />
            <YAxis dataKey={kpi1CategoryKey} type="category" width={170} stroke="#5a5a5a" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name, payload) => {
                if (name === 'score_potentiel') return [formatScore(value), 'Score potentiel'];
                return [value, name];
              }}
              labelFormatter={(_, payload) =>
                kpi1View === 'department'
                  ? payload?.[0]?.payload?.leaderCity
                    ? `Ville leader: ${payload[0].payload.leaderCity}`
                    : ''
                  : payload?.[0]?.payload?.department || ''
              }
              contentStyle={{ borderRadius: '16px', border: '1px solid rgba(17, 17, 17, 0.08)' }}
            />
            <Bar dataKey="score_potentiel" shape={<Kpi1BarColor />} label={<Kpi1ValueLabel />}>
              {kpi1Data.map((entry) => (
                <Cell key={`${kpi1View}-${entry[kpi1CategoryKey]}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <p className="analytics-hint">
          {kpi1View === 'department'
            ? 'Classement limite aux 20 meilleurs departements selon le score potentiel moyen du dataset consolide.'
            : 'Classement limite aux 20 meilleures communes selon le score potentiel du dataset consolide.'}
        </p>
      </article>

      <article className="surface-card">
        <div className="section-heading">
          <h3>Motorisation vs stock de places</h3>
        </div>

        <div className="analytics-legend" aria-hidden="true">
          <span><i style={{ backgroundColor: '#f2c300' }} /> Prioritaire</span>
          <span><i style={{ backgroundColor: '#d49a00' }} /> Solide</span>
          <span><i style={{ backgroundColor: '#6f7d73' }} /> A renforcer</span>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 10, right: 36, left: 6, bottom: 24 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#d7d2c7" />
            <XAxis
              type="number"
              dataKey="taux_motorisation_pct"
              name="Taux de motorisation"
              unit="%"
              stroke="#5a5a5a"
              domain={motorizationScatterBounds.xDomain}
              tickCount={6}
            >
              <Label value="Taux de motorisation (%)" position="insideBottom" offset={-8} fill="#5a5a5a" />
            </XAxis>
            <YAxis
              type="number"
              dataKey="lots_stationnement_copro"
              name="Lots stationnement"
              stroke="#5a5a5a"
              width={80}
              domain={motorizationScatterBounds.yDomain}
              tickCount={6}
            >
              <Label
                value="Lots de stationnement en copropriete"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }}
                fill="#5a5a5a"
              />
            </YAxis>
            <ReferenceLine x={averageMotorization} stroke="#bdb6aa" strokeDasharray="3 3" />
            <ReferenceLine y={averageLots} stroke="#bdb6aa" strokeDasharray="3 3" />
            <ZAxis type="number" dataKey="bubble_size" range={[30, 800]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={<MotorizationScatterTooltip />}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.city || ''}
              contentStyle={{ borderRadius: '16px', border: '1px solid rgba(17, 17, 17, 0.08)' }}
            />
            <Scatter name="Communes" data={scatterWithLabels} shape={<MotorizationScatterPoint />} />
          </ScatterChart>
        </ResponsiveContainer>

        <p className="analytics-hint">
          Top 40 communes par score potentiel. La taille des bulles represente le nombre d appartements.
        </p>
      </article>

      <article className="surface-card">
        <div className="section-heading">
          <h3>Analyse des mandats de copropriete</h3>
        </div>

        <div className="analytics-grid analytics-grid--duo">
          <div className="analytics-panel">
            <h4>Repartition commerciale</h4>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={kpi3StatusData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={104}
                  paddingAngle={2}
                >
                  {kpi3StatusData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatInteger(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="analytics-legend">
              {kpi3StatusData.map((entry) => (
                <span key={entry.label}>
                  <i style={{ backgroundColor: entry.color }} />
                  {entry.label}
                </span>
              ))}
            </div>
          </div>

          <div className="analytics-panel">
            <h4>Anciennete des mandats</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={kpi3AgeStackData} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#d7d2c7" />
                <XAxis dataKey="ageLabel" stroke="#5a5a5a" />
                <YAxis stroke="#5a5a5a" />
                <Tooltip formatter={(value) => formatInteger(value)} />
                {KPI3_STACK_KEYS.map((entry) => (
                  <Bar key={entry.key} dataKey={entry.key} stackId="mandats" fill={entry.color} radius={[8, 8, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="analytics-hint">Le donut suit les alertes commerciales, puis les barres montrent l anciennete des mandats.</p>
      </article>

      <article className="surface-card">
        <div className="section-heading">
          <h3>Ratio et tension de stationnement</h3>
        </div>

        <div className="analytics-grid analytics-grid--duo">
          <div className="analytics-panel">
            <h4>Profils de stationnement</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={kpi4ProfileData} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#d7d2c7" />
                <XAxis dataKey="label" stroke="#5a5a5a" />
                <YAxis stroke="#5a5a5a" allowDecimals={false} />
                <Tooltip formatter={(value) => formatInteger(value)} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {kpi4ProfileData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-panel">
            <h4>Matrice offre / demande</h4>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 28, left: 6, bottom: 18 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#d7d2c7" />
                <XAxis
                  type="number"
                  dataKey="lots_stat_copro"
                  name="Offre copro"
                  stroke="#5a5a5a"
                  domain={kpi4OfferDemandBounds.xDomain}
                />
                <YAxis
                  type="number"
                  dataKey="parking_gap"
                  name="Demande non couverte"
                  stroke="#5a5a5a"
                  width={86}
                  domain={kpi4OfferDemandBounds.yDomain}
                />
                <ZAxis type="number" dataKey="bubble_size" range={[40, 420]} />
                <Tooltip
                  content={<Kpi4ScatterTooltip />}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.city || ''}
                />
                <Scatter name="Communes" data={kpi4OfferDemandData} shape={<Kpi4ScatterPoint />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="analytics-hint">Top 50 communes du KPI 4. Les bulles mettent en regard l offre en copropriete et la demande non couverte.</p>
      </article>
    </section>
  );
}

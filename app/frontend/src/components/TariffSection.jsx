import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatInteger, formatPercent, formatScore, getScoreBandClassName } from '../utils/dashboard';

const MAX_VISIBLE_DEPARTMENT_CARDS = 4;

export function TariffSection({
  chartScoreData,
  potentialOverview,
  potentialDetails
}) {
  const visibleDepartmentDetails = potentialDetails.slice(0, MAX_VISIBLE_DEPARTMENT_CARDS);

  return (
    <article className="surface-card">
      <div className="section-heading">
        <p className="eyebrow">Prospection</p>
        <h3>Potentiel par departement</h3>
      </div>

      <div className="tariff-overview">
        <div className="tariff-stat">
          <span>Score moyen</span>
          <strong>{formatScore(potentialOverview.averageScore)}</strong>
        </div>
        <div className="tariff-stat">
          <span>Fourchette des scores</span>
          <strong>
            {formatScore(potentialOverview.minScore)} - {formatScore(potentialOverview.maxScore)}
          </strong>
        </div>
        <div className="tariff-stat">
          <span>Ecart de score</span>
          <strong>{formatScore(potentialOverview.spread)}</strong>
        </div>
        <div className="tariff-stat">
          <span>Departement leader</span>
          <strong>{potentialOverview.topDepartment}</strong>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#d7d2c7" />
          <XAxis dataKey="department" stroke="#5a5a5a" interval={0} angle={-18} textAnchor="end" height={74} />
          <YAxis stroke="#5a5a5a" />
          <Tooltip formatter={(value) => formatScore(value)} />
          <Bar dataKey="score_potentiel" fill="#111111" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="tariff-details">
        {visibleDepartmentDetails.map((detail) => (
          <article key={detail.department} className="tariff-detail-card">
            <div className="tariff-detail-card__header">
              <div>
                <h4>{detail.department}</h4>
                <p>Commune leader: {detail.leadCity}</p>
              </div>
              <span className={getScoreBandClassName(detail.averageScore)}>{detail.scoreBand}</span>
            </div>

            <div className="tariff-detail-card__grid">
              <div>
                <span>Score moyen</span>
                <strong>{formatScore(detail.averageScore)}</strong>
              </div>
              <div>
                <span>Lots stationnement</span>
                <strong>{formatInteger(detail.totalLots)}</strong>
              </div>
              <div>
                <span>Taux motorisation moyen</span>
                <strong>{formatPercent(detail.averageMotorization)}</strong>
              </div>
              <div>
                <span>Communes suivies</span>
                <strong>{formatInteger(detail.totalCommunes)}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      {potentialDetails.length > MAX_VISIBLE_DEPARTMENT_CARDS ? (
        <p className="tariff-details__hint">
          Seuls les 4 departements les plus prometteurs sont affiches ici pour garder la page lisible.
        </p>
      ) : null}
    </article>
  );
}

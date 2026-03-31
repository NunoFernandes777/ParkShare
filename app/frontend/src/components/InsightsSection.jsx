import { formatInteger, formatPercent } from '../utils/dashboard';

export function InsightsSection({ kpisCount, isOfflineMode, summary }) {
  return (
    <section className="insights-grid" id="insights">
      <article className="insight-card insight-card--accent">
        <span className="insight-card__label">Communes visibles</span>
        <strong>{formatInteger(kpisCount)}</strong>
        <p>{isOfflineMode ? 'API indisponible ou dataset non charge' : 'Source dataset consolide communes'}</p>
      </article>

      <article className="insight-card">
        <span className="insight-card__label">Taux de motorisation moyen</span>
        <strong>{formatPercent(summary.averageMotorization)}</strong>
        <p>Part moyenne des menages equipes d un vehicule.</p>
      </article>

      <article className="insight-card">
        <span className="insight-card__label">Ville la mieux dotee</span>
        <strong>{summary.topCity}</strong>
        <p>{formatInteger(summary.totalLots)} lots de stationnement copro sur la selection.</p>
      </article>
    </section>
  );
}

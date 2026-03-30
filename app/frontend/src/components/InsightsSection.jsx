import { formatCurrency } from '../utils/dashboard';

export function InsightsSection({ kpisCount, isOfflineMode, summary }) {
  return (
    <section className="insights-grid" id="insights">
      <article className="insight-card insight-card--accent">
        <span className="insight-card__label">Observations</span>
        <strong>{kpisCount}</strong>
        <p>{isOfflineMode ? 'Source demo locale' : 'Source API temps reel'}</p>
      </article>

      <article className="insight-card">
        <span className="insight-card__label">Prix moyen</span>
        <strong>{formatCurrency(summary.avgPrice)}</strong>
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
  );
}

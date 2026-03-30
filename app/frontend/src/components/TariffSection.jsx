import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatCurrency, getPriceBandClassName } from '../utils/dashboard';

export function TariffSection({ chartPriceData, tariffOverview, tariffDetails }) {
  return (
    <article className="surface-card">
      <div className="section-heading">
        <p className="eyebrow">Tarifs</p>
        <h3>Prix par region</h3>
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
          <Tooltip formatter={(value) => formatCurrency(value)} />
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
              <span className={getPriceBandClassName(detail.average)}>{detail.priceBand}</span>
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
  );
}

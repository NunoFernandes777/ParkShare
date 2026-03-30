import { formatCurrency } from '../utils/dashboard';

export function KpiTableSection({ kpis }) {
  return (
    <article className="surface-card table-card">
      <div className="section-heading">
        <p className="eyebrow">Indicateurs</p>
        <h3>Synthese par ville</h3>
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
                <td>{formatCurrency(row.avg_price)}</td>
                <td>{(row.avg_occupancy * 100).toFixed(1)}%</td>
                <td>{row.observations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

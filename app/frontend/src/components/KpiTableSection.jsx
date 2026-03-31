import { formatDepartment, formatInteger, formatPercent, formatScore } from '../utils/dashboard';

export function KpiTableSection({ kpis }) {
  return (
    <article className="surface-card table-card">
      <div className="section-heading">
        <p className="eyebrow">Indicateurs</p>
        <h3>Synthese par commune</h3>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Departement</th>
              <th>Ville</th>
              <th>Score</th>
              <th>Lots stationnement</th>
              <th>Taux motorisation</th>
              <th>Copros</th>
            </tr>
          </thead>
          <tbody>
            {kpis.slice(0, 80).map((row) => (
              <tr key={row.code_commune}>
                <td>{formatDepartment(row.department)}</td>
                <td>{row.city}</td>
                <td>{formatScore(row.score_potentiel)}</td>
                <td>{formatInteger(row.nb_lots_stat_total)}</td>
                <td>{formatPercent(row.taux_motorisation_pct)}</td>
                <td>{formatInteger(row.nb_copros)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

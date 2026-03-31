import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, "app.db");
const OUTPUT_DIR = path.resolve(__dirname, "botpress-knowledge");

const DEPARTMENT_NAMES = {
  "01": "Ain",
  "02": "Aisne",
  "03": "Allier",
  "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes",
  "07": "Ardeche",
  "08": "Ardennes",
  "09": "Ariege",
  "10": "Aube",
  "11": "Aude",
  "12": "Aveyron",
  "13": "Bouches-du-Rhone",
  "14": "Calvados",
  "15": "Cantal",
  "16": "Charente",
  "17": "Charente-Maritime",
  "18": "Cher",
  "19": "Correze",
  "21": "Cote-d'Or",
  "22": "Cotes-d'Armor",
  "23": "Creuse",
  "24": "Dordogne",
  "25": "Doubs",
  "26": "Drome",
  "27": "Eure",
  "28": "Eure-et-Loir",
  "29": "Finistere",
  "2A": "Corse-du-Sud",
  "2B": "Haute-Corse",
  "30": "Gard",
  "31": "Haute-Garonne",
  "32": "Gers",
  "33": "Gironde",
  "34": "Herault",
  "35": "Ille-et-Vilaine",
  "36": "Indre",
  "37": "Indre-et-Loire",
  "38": "Isere",
  "39": "Jura",
  "40": "Landes",
  "41": "Loir-et-Cher",
  "42": "Loire",
  "43": "Haute-Loire",
  "44": "Loire-Atlantique",
  "45": "Loiret",
  "46": "Lot",
  "47": "Lot-et-Garonne",
  "48": "Lozere",
  "49": "Maine-et-Loire",
  "50": "Manche",
  "51": "Marne",
  "52": "Haute-Marne",
  "53": "Mayenne",
  "54": "Meurthe-et-Moselle",
  "55": "Meuse",
  "56": "Morbihan",
  "57": "Moselle",
  "58": "Nievre",
  "59": "Nord",
  "60": "Oise",
  "61": "Orne",
  "62": "Pas-de-Calais",
  "63": "Puy-de-Dome",
  "64": "Pyrenees-Atlantiques",
  "65": "Hautes-Pyrenees",
  "66": "Pyrenees-Orientales",
  "67": "Bas-Rhin",
  "68": "Haut-Rhin",
  "69": "Rhone",
  "70": "Haute-Saone",
  "71": "Saone-et-Loire",
  "72": "Sarthe",
  "73": "Savoie",
  "74": "Haute-Savoie",
  "75": "Paris",
  "76": "Seine-Maritime",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "79": "Deux-Sevres",
  "80": "Somme",
  "81": "Tarn",
  "82": "Tarn-et-Garonne",
  "83": "Var",
  "84": "Vaucluse",
  "85": "Vendee",
  "86": "Vienne",
  "87": "Haute-Vienne",
  "88": "Vosges",
  "89": "Yonne",
  "90": "Territoire de Belfort",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d'Oise",
  "971": "Guadeloupe",
  "972": "Martinique",
  "973": "Guyane",
  "974": "La Reunion",
  "976": "Mayotte"
};

function formatDepartment(code) {
  const key = String(code || "").trim();
  return DEPARTMENT_NAMES[key] ? `${DEPARTMENT_NAMES[key]} (${key})` : key || "-";
}

function formatInteger(value) {
  return new Intl.NumberFormat("fr-FR").format(Number(value) || 0);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildTxt({ totals, topCities, topDepartments }) {
  const lines = [
    "PARKSHARE KNOWLEDGE BASE",
    "",
    "Project summary",
    "ParkShare is a dashboard about parking-sharing opportunity at commune level in France.",
    "The source used here is the consolidated communes dataset imported into SQLite.",
    "",
    "Key definitions",
    "score_potentiel: weighted opportunity score used to rank communes and departments.",
    "taux_motorisation_pct: share of households equipped with a vehicle.",
    "nb_lots_stat_total: number of parking lots in copropriete.",
    "nb_copros: number of coproprietes in the commune.",
    "nb_appartements: number of apartments.",
    "parking_gap: estimated motorized households without parking coverage.",
    "",
    "Current totals",
    `Visible communes: ${formatInteger(totals.communes)}`,
    `Average score potentiel: ${formatScore(totals.averageScore)}`,
    `Average motorization: ${formatPercent(totals.averageMotorization)}`,
    `Total copro parking lots: ${formatInteger(totals.totalLots)}`,
    "",
    "Top 20 communes by score potentiel"
  ];

  topCities.forEach((row, index) => {
    lines.push(
      `${index + 1}. ${row.city} | ${formatDepartment(row.department)} | score ${formatScore(row.score_potentiel)} | motorization ${formatPercent(row.taux_motorisation_pct)} | parking lots ${formatInteger(row.nb_lots_stat_total)}`
    );
  });

  lines.push("", "Top departments by average score potentiel");

  topDepartments.forEach((row, index) => {
    lines.push(
      `${index + 1}. ${formatDepartment(row.department)} | average score ${formatScore(row.average_score)} | communes ${formatInteger(row.commune_count)} | leader city ${row.leader_city}`
    );
  });

  lines.push(
    "",
    "Usage guidance for chatbot",
    "When answering, prefer factual summaries from these indicators.",
    "Do not invent data beyond the exported communes and departments.",
    "If a commune is absent from this knowledge file, say that the commune is not present in the exported dataset."
  );

  return lines.join("\n");
}

function buildHtml({ totals, topCities, topDepartments }) {
  const topCitiesItems = topCities
    .map(
      (row, index) => `
        <li>
          <strong>${index + 1}. ${escapeHtml(row.city)}</strong><br />
          ${escapeHtml(formatDepartment(row.department))} |
          score ${escapeHtml(formatScore(row.score_potentiel))} |
          motorization ${escapeHtml(formatPercent(row.taux_motorisation_pct))} |
          parking lots ${escapeHtml(formatInteger(row.nb_lots_stat_total))}
        </li>`
    )
    .join("\n");

  const topDepartmentsItems = topDepartments
    .map(
      (row, index) => `
        <li>
          <strong>${index + 1}. ${escapeHtml(formatDepartment(row.department))}</strong><br />
          average score ${escapeHtml(formatScore(row.average_score))} |
          communes ${escapeHtml(formatInteger(row.commune_count))} |
          leader city ${escapeHtml(row.leader_city)}
        </li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ParkShare Knowledge Base</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; margin: 32px; color: #111; }
      h1, h2 { margin-bottom: 8px; }
      section { margin-bottom: 24px; }
      ul { padding-left: 20px; }
      li { margin-bottom: 10px; }
    </style>
  </head>
  <body>
    <h1>ParkShare Knowledge Base</h1>

    <section>
      <h2>Project summary</h2>
      <p>ParkShare is a dashboard about parking-sharing opportunity at commune level in France.</p>
      <p>The source used here is the consolidated communes dataset imported into SQLite.</p>
    </section>

    <section>
      <h2>Key definitions</h2>
      <ul>
        <li><strong>score_potentiel</strong>: weighted opportunity score used to rank communes and departments.</li>
        <li><strong>taux_motorisation_pct</strong>: share of households equipped with a vehicle.</li>
        <li><strong>nb_lots_stat_total</strong>: number of parking lots in copropriete.</li>
        <li><strong>nb_copros</strong>: number of coproprietes in the commune.</li>
        <li><strong>nb_appartements</strong>: number of apartments.</li>
        <li><strong>parking_gap</strong>: estimated motorized households without parking coverage.</li>
      </ul>
    </section>

    <section>
      <h2>Current totals</h2>
      <ul>
        <li>Visible communes: ${escapeHtml(formatInteger(totals.communes))}</li>
        <li>Average score potentiel: ${escapeHtml(formatScore(totals.averageScore))}</li>
        <li>Average motorization: ${escapeHtml(formatPercent(totals.averageMotorization))}</li>
        <li>Total copro parking lots: ${escapeHtml(formatInteger(totals.totalLots))}</li>
      </ul>
    </section>

    <section>
      <h2>Top 20 communes by score potentiel</h2>
      <ul>${topCitiesItems}</ul>
    </section>

    <section>
      <h2>Top departments by average score potentiel</h2>
      <ul>${topDepartmentsItems}</ul>
    </section>

    <section>
      <h2>Usage guidance for chatbot</h2>
      <ul>
        <li>Prefer factual summaries from these indicators.</li>
        <li>Do not invent data beyond the exported communes and departments.</li>
        <li>If a commune is absent from this knowledge file, say that the commune is not present in the exported dataset.</li>
      </ul>
    </section>
  </body>
</html>`;
}

async function main() {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

  const totals = await db.get(`
    SELECT
      COUNT(*) AS communes,
      AVG(score_potentiel) AS averageScore,
      AVG(taux_motorisation_pct) AS averageMotorization,
      SUM(nb_lots_stat_total) AS totalLots
    FROM communes_data
  `);

  const topCities = await db.all(`
    SELECT code_commune, department, city, score_potentiel, taux_motorisation_pct, nb_lots_stat_total
    FROM communes_data
    ORDER BY score_potentiel DESC, city ASC
    LIMIT 20
  `);

  const topDepartments = await db.all(`
    WITH department_stats AS (
      SELECT
        department,
        AVG(score_potentiel) AS average_score,
        COUNT(*) AS commune_count
      FROM communes_data
      GROUP BY department
    ),
    leader_city AS (
      SELECT
        department,
        city AS leader_city,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY score_potentiel DESC, city ASC) AS row_num
      FROM communes_data
    )
    SELECT
      stats.department,
      stats.average_score,
      stats.commune_count,
      leader.leader_city
    FROM department_stats stats
    LEFT JOIN leader_city leader
      ON leader.department = stats.department
     AND leader.row_num = 1
    ORDER BY stats.average_score DESC, stats.department ASC
    LIMIT 20
  `);

  await db.close();
  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeFile(path.join(OUTPUT_DIR, "parkshare_knowledge.txt"), buildTxt({ totals, topCities, topDepartments }), "utf8");
  await writeFile(path.join(OUTPUT_DIR, "parkshare_knowledge.html"), buildHtml({ totals, topCities, topDepartments }), "utf8");

  console.log(`Botpress knowledge exports created in ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, "app.db");
const DATA_DIRECTORY = path.resolve(__dirname, "..", "data", "converted");
const COORDINATES_CACHE_FILE = path.join(DATA_DIRECTORY, "commune_coordinates_cache.json");
const EXCLUDED_COMMUNE_CODES = new Set(["91182", "93059"]);

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function parseCsv(content) {
  const normalized = content.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeCommuneName(value, fallback = "") {
  let text = toText(value, fallback);

  if (!text) {
    return fallback;
  }

  // Repair common mojibake patterns when a UTF-8 string was decoded as Latin-1/CP1252.
  if (/[ÃÂâ]/.test(text)) {
    const repaired = Buffer.from(text, "latin1").toString("utf8");

    if (repaired && !repaired.includes("�")) {
      text = repaired;
    }
  }

  return text.normalize("NFC");
}

function getDepartmentCode(codeCommune) {
  const code = toText(codeCommune).padStart(5, "0");

  if (code.startsWith("97") || code.startsWith("98")) {
    return code.slice(0, 3);
  }

  return code.slice(0, 2);
}

function computePotentialScore(row, maxima) {
  if (row.nb_logements <= 50 || row.nb_copros <= 0 || row.nb_lots_stat_total <= 0) {
    return 0;
  }

  const score =
    (row.taux_moto / Math.max(maxima.tauxMoto, 1)) * 25 +
    (row.nb_lots_stat_total / Math.max(maxima.nbLotsStatTotal, 1)) * 30 +
    (row.nb_copros_avec_stat / Math.max(maxima.nbCoprosAvecStat, 1)) * 20 +
    (row.nb_appartements / Math.max(maxima.nbAppartements, 1)) * 15 +
    (row.nb_menages_avec_voiture / Math.max(maxima.nbMenagesAvecVoiture, 1)) * 10;

  return Number(score.toFixed(1));
}

function getPotentialProfile(score) {
  if (score >= 60) return "Prioritaire";
  if (score >= 35) return "Solide";
  return "A renforcer";
}

async function findConsolidatedDatasetPath() {
  const filenames = await readdir(DATA_DIRECTORY);
  const match = filenames.find((filename) => filename.startsWith("dataset_consolid") && filename.endsWith("communes.csv"));

  if (!match) {
    throw new Error(`Dataset consolide introuvable dans ${DATA_DIRECTORY}`);
  }

  return path.join(DATA_DIRECTORY, match);
}

async function loadCommunesDataset() {
  const datasetPath = await findConsolidatedDatasetPath();
  const content = await readFile(datasetPath, "utf8");
  const rows = parseCsv(content);
  let coordinatesByCode = new Map();

  try {
    const coordinatesContent = await readFile(COORDINATES_CACHE_FILE, "latin1");
    const coordinateRows = JSON.parse(coordinatesContent);
    coordinatesByCode = new Map(
      coordinateRows.map((row) => [
        toText(row.code_commune).padStart(5, "0"),
        {
          latitude: toNumber(row.latitude),
          longitude: toNumber(row.longitude),
          nom: normalizeCommuneName(row.nom)
        }
      ])
    );
  } catch {
    coordinatesByCode = new Map();
  }

  const normalizedRows = rows
    .map((row) => {
      const codeCommune = toText(row.code_commune).padStart(5, "0");
      const coordinates = coordinatesByCode.get(codeCommune);
      const nbLogements = toNumber(row.nb_logements);
      const nbLotsStatTotal = toNumber(row.nb_lots_stat_total);
      const nbMenagesAvecVoiture = toNumber(row.nb_menages_avec_voiture);
      const nbMenagesAvecParking = toNumber(row.nb_menages_avec_parking);
      const parkingGap = Math.max(nbMenagesAvecVoiture - nbMenagesAvecParking, 0);
      const tauxMoto = toNumber(row.taux_moto);
      const tauxMotorisationPct = tauxMoto <= 1 ? tauxMoto * 100 : tauxMoto;

      return {
        code_commune: codeCommune,
        department: getDepartmentCode(codeCommune),
        city: normalizeCommuneName(row.nom_commune || coordinates?.nom, codeCommune),
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
        nb_copros: toNumber(row.nb_copros),
        nb_lots_hab_total: toNumber(row.nb_lots_hab_total),
        nb_lots_stat_total: nbLotsStatTotal,
        nb_copros_avec_stat: toNumber(row.nb_copros_avec_stat),
        nb_copros_sans_stat: toNumber(row.nb_copros_sans_stat),
        nb_logements: nbLogements,
        nb_res_principales: toNumber(row.nb_res_principales),
        nb_appartements: toNumber(row.nb_appartements),
        nb_places_publiques: toNumber(row.nb_places_publiques),
        nb_parkings_publics: toNumber(row.nb_parkings_publics),
        nb_menages_avec_parking: nbMenagesAvecParking,
        nb_menages_avec_voiture: nbMenagesAvecVoiture,
        taux_moto: tauxMoto,
        taux_motorisation_pct: Number(tauxMotorisationPct.toFixed(1)),
        ratio_stat_par_logement: nbLogements > 0 ? Number((nbLotsStatTotal / nbLogements).toFixed(3)) : 0,
        pct_motorises_sans_parking:
          nbLogements > 0
            ? Number(((parkingGap / Math.max(toNumber(row.nb_menages), 1)) * 100).toFixed(1))
            : 0,
        parking_gap: parkingGap
      };
    })
    .filter((row) => row.code_commune && row.city && !EXCLUDED_COMMUNE_CODES.has(row.code_commune));

  const eligibleRows = normalizedRows.filter((row) => row.nb_logements > 50 && row.nb_copros > 0 && row.nb_lots_stat_total > 0);

  const maxima = eligibleRows.reduce(
    (accumulator, row) => ({
      tauxMoto: Math.max(accumulator.tauxMoto, row.taux_moto),
      nbLotsStatTotal: Math.max(accumulator.nbLotsStatTotal, row.nb_lots_stat_total),
      nbCoprosAvecStat: Math.max(accumulator.nbCoprosAvecStat, row.nb_copros_avec_stat),
      nbAppartements: Math.max(accumulator.nbAppartements, row.nb_appartements),
      nbMenagesAvecVoiture: Math.max(accumulator.nbMenagesAvecVoiture, row.nb_menages_avec_voiture)
    }),
    {
      tauxMoto: 0,
      nbLotsStatTotal: 0,
      nbCoprosAvecStat: 0,
      nbAppartements: 0,
      nbMenagesAvecVoiture: 0
    }
  );

  return normalizedRows.map((row) => {
    const scorePotentiel = computePotentialScore(row, maxima);

    return {
      ...row,
      score_potentiel: scorePotentiel,
      profil_potentiel: getPotentialProfile(scorePotentiel)
    };
  });
}

async function setupDatabase() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  const rows = await loadCommunesDataset();

  await db.exec(`
    DROP TABLE IF EXISTS communes_data;

    CREATE TABLE communes_data (
      code_commune TEXT PRIMARY KEY,
      department TEXT NOT NULL,
      city TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      nb_copros REAL NOT NULL,
      nb_lots_hab_total REAL NOT NULL,
      nb_lots_stat_total REAL NOT NULL,
      nb_copros_avec_stat REAL NOT NULL,
      nb_copros_sans_stat REAL NOT NULL,
      nb_logements REAL NOT NULL,
      nb_res_principales REAL NOT NULL,
      nb_appartements REAL NOT NULL,
      nb_places_publiques REAL NOT NULL,
      nb_parkings_publics REAL NOT NULL,
      nb_menages_avec_parking REAL NOT NULL,
      nb_menages_avec_voiture REAL NOT NULL,
      taux_moto REAL NOT NULL,
      taux_motorisation_pct REAL NOT NULL,
      ratio_stat_par_logement REAL NOT NULL,
      pct_motorises_sans_parking REAL NOT NULL,
      parking_gap REAL NOT NULL,
      score_potentiel REAL NOT NULL,
      profil_potentiel TEXT NOT NULL
    );
  `);

  const insert = await db.prepare(`
    INSERT INTO communes_data (
      code_commune, department, city, latitude, longitude, nb_copros, nb_lots_hab_total, nb_lots_stat_total,
      nb_copros_avec_stat, nb_copros_sans_stat, nb_logements, nb_res_principales, nb_appartements,
      nb_places_publiques, nb_parkings_publics, nb_menages_avec_parking, nb_menages_avec_voiture,
      taux_moto, taux_motorisation_pct, ratio_stat_par_logement, pct_motorises_sans_parking,
      parking_gap, score_potentiel, profil_potentiel
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const row of rows) {
    await insert.run(
      row.code_commune,
      row.department,
      row.city,
      row.latitude,
      row.longitude,
      row.nb_copros,
      row.nb_lots_hab_total,
      row.nb_lots_stat_total,
      row.nb_copros_avec_stat,
      row.nb_copros_sans_stat,
      row.nb_logements,
      row.nb_res_principales,
      row.nb_appartements,
      row.nb_places_publiques,
      row.nb_parkings_publics,
      row.nb_menages_avec_parking,
      row.nb_menages_avec_voiture,
      row.taux_moto,
      row.taux_motorisation_pct,
      row.ratio_stat_par_logement,
      row.pct_motorises_sans_parking,
      row.parking_gap,
      row.score_potentiel,
      row.profil_potentiel
    );
  }

  await insert.finalize();
  await db.close();

  console.log(`Base de donnees creee : ${DB_FILE} (${rows.length} communes importees)`);
}

setupDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});

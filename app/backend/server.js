import "dotenv/config";
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, "..", "app.db");
const DATA_DIRECTORY = path.resolve(__dirname, "..", "..", "data", "converted");
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const app = express();
app.use(cors());
app.use(express.json());

const getDb = () => open({ filename: DB_FILE, driver: sqlite3.Database });

const buildContextBlock = (context = {}) => JSON.stringify(context, null, 2);

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

function toText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value, fallback = "") {
  let text = toText(value, fallback);

  if (!text) {
    return fallback;
  }

  if (/[ÃƒÃ‚Ã¢]/.test(text)) {
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

async function loadConvertedCsv(filename) {
  const content = await readFile(path.join(DATA_DIRECTORY, filename), "utf8");
  return parseCsv(content);
}

async function loadKpi3Rows() {
  const rows = await loadConvertedCsv("kpi3_mandats_coproprietes.csv");

  return rows.map((row) => ({
    ...row,
    ville: normalizeText(row.ville),
    department: getDepartmentCode(row.code_commune),
    nb_lots_habitation: toNumber(row.nb_lots_habitation),
    nb_lots_stationnement: toNumber(row.nb_lots_stationnement),
    pct_places_par_logement: toNumber(row.pct_places_par_logement),
    anciennete_mois: toNumber(row.anciennete_mois),
    jours_avant_fin: toNumber(row.jours_avant_fin)
  }));
}

async function loadKpi4Rows() {
  const rows = await loadConvertedCsv("kpi4_ratio_stationnement_communes.csv");

  return rows.map((row) => ({
    ...row,
    ville: normalizeText(row.ville),
    department: getDepartmentCode(row.code_commune),
    nb_logements: toNumber(row.nb_logements),
    nb_appartements: toNumber(row.nb_appartements),
    lots_stat_copro: toNumber(row.lots_stat_copro),
    places_publiques: toNumber(row.places_publiques),
    copros_sans_stat: toNumber(row.copros_sans_stat),
    menages_motorises: toNumber(row.menages_motorises),
    menages_avec_parking: toNumber(row.menages_avec_parking),
    ratio_stat_par_logement: toNumber(row.ratio_stat_par_logement),
    pct_motorises_sans_parking: toNumber(row.pct_motorises_sans_parking),
    index_partageabilite: toNumber(row.index_partageabilite),
    parking_gap: Math.max(toNumber(row.menages_motorises) - toNumber(row.menages_avec_parking), 0)
  }));
}
const buildFilters = (query) => {
  const department = query.department || query.region;
  const { city } = query;
  const where = [];
  const params = [];

  if (department) {
    where.push("department = ?");
    params.push(department);
  }

  if (city) {
    where.push("city = ?");
    params.push(city);
  }

  return {
    params,
    whereClause: where.length ? `WHERE ${where.join(" AND ")}` : ""
  };
};

function extractResponseText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("\n")
    .trim();
}

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/regions", async (req, res) => {
  const db = await getDb();
  const rows = await db.all("SELECT DISTINCT department FROM communes_data ORDER BY department");
  await db.close();
  res.json(rows.map((r) => r.department));
});

app.get("/api/cities", async (req, res) => {
  const department = req.query.department || req.query.region;
  const db = await getDb();
  let rows;
  if (department) {
    rows = await db.all("SELECT DISTINCT city FROM communes_data WHERE department = ? ORDER BY city", department);
  } else {
    rows = await db.all("SELECT DISTINCT city FROM communes_data ORDER BY city");
  }
  await db.close();
  res.json(rows.map((r) => r.city));
});

app.get("/api/kpis", async (req, res) => {
  const db = await getDb();
  const { params, whereClause } = buildFilters(req.query);
  const q = `SELECT * FROM communes_data ${whereClause} ORDER BY score_potentiel DESC, city`;
  const rows = await db.all(q, ...params);
  await db.close();
  res.json(rows);
});

app.get("/api/points", async (req, res) => {
  const db = await getDb();
  const { params, whereClause } = buildFilters(req.query);
  const q = `
    SELECT
      code_commune,
      department,
      city,
      latitude,
      longitude,
      score_potentiel,
      nb_lots_stat_total,
      nb_copros,
      taux_motorisation_pct,
      profil_potentiel
    FROM communes_data
    ${whereClause ? `${whereClause} AND latitude IS NOT NULL AND longitude IS NOT NULL` : "WHERE latitude IS NOT NULL AND longitude IS NOT NULL"}
    ORDER BY score_potentiel DESC, city
  `;
  const rows = await db.all(q, ...params);
  await db.close();
  res.json(rows);
});

app.get("/api/kpi3", async (req, res) => {
  const department = req.query.department || req.query.region;
  const { city } = req.query;
  const rows = await loadKpi3Rows();
  const filteredRows = rows.filter((row) => {
    if (department && row.department !== department) return false;
    if (city && row.ville !== city) return false;
    return true;
  });
  res.json(filteredRows);
});

app.get("/api/kpi4", async (req, res) => {
  const department = req.query.department || req.query.region;
  const { city } = req.query;
  const rows = await loadKpi4Rows();
  const filteredRows = rows.filter((row) => {
    if (department && row.department !== department) return false;
    if (city && row.ville !== city) return false;
    return true;
  });
  res.json(filteredRows);
});

app.post("/api/chat", async (req, res) => {
  const { message, history = [], context = {} } = req.body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Le message est requis." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "Le chatbot n est pas configure. Ajoutez OPENAI_API_KEY dans votre environnement."
    });
  }

  try {
    // Le prompt limite le chatbot au contexte du dashboard
    // pour garder des reponses concretes et utiles.
    const systemPrompt = `
Tu es l assistant analytique du dashboard ParkShare.
Reponds en francais, de facon concise, concrete et utile.
Utilise uniquement les informations du contexte fourni.
Si l information n est pas presente, dis-le clairement.
Ne fais pas semblant d avoir acces a des donnees non fournies.

Contexte dashboard:
${buildContextBlock(context)}
    `.trim();

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_output_tokens: 350,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }]
          },
          ...history
            .filter((entry) => entry && typeof entry.content === "string")
            .slice(-6)
            .map((entry) => ({
              role: entry.role === "assistant" ? "assistant" : "user",
              content: [{ type: "input_text", text: entry.content }]
            })),
          {
            role: "user",
            content: [{ type: "input_text", text: message.trim() }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      console.error("Erreur OpenAI:", errorPayload);
      return res.status(502).json({ error: "Le service de reponse IA a echoue." });
    }

    const payload = await response.json();
    const reply = extractResponseText(payload);

    if (!reply) {
      return res.status(502).json({ error: "Aucune reponse exploitable n a ete retournee." });
    }

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Le chatbot a rencontre une erreur inattendue." });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API serveur démarré sur http://localhost:${port}`);
});

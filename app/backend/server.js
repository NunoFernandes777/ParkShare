import "dotenv/config";
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DB_FILE = "app.db";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const app = express();
app.use(cors());
app.use(express.json());

const getDb = () => open({ filename: DB_FILE, driver: sqlite3.Database });

const buildContextBlock = (context = {}) => JSON.stringify(context, null, 2);

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
  const rows = await db.all("SELECT DISTINCT region FROM kpi_data ORDER BY region");
  await db.close();
  res.json(rows.map((r) => r.region));
});

app.get("/api/cities", async (req, res) => {
  const region = req.query.region;
  const db = await getDb();
  let rows;
  if (region) {
    rows = await db.all("SELECT DISTINCT city FROM kpi_data WHERE region = ? ORDER BY city", region);
  } else {
    rows = await db.all("SELECT DISTINCT city FROM kpi_data ORDER BY city");
  }
  await db.close();
  res.json(rows.map((r) => r.city));
});

app.get("/api/kpis", async (req, res) => {
  const { region, city, start_date, end_date } = req.query;
  const db = await getDb();

  let where = [];
  let params = [];

  if (region) { where.push("region = ?"); params.push(region); }
  if (city) { where.push("city = ?"); params.push(city); }
  if (start_date) { where.push("date >= ?"); params.push(start_date); }
  if (end_date) { where.push("date <= ?"); params.push(end_date); }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const q = `SELECT * FROM kpi_data ${whereClause} ORDER BY date, region, city`;
  const rows = await db.all(q, ...params);
  await db.close();
  res.json(rows);
});

app.get("/api/points", async (req, res) => {
  const { region, city, start_date, end_date } = req.query;
  const db = await getDb();

  let where = [];
  let params = [];

  if (region) { where.push("region = ?"); params.push(region); }
  if (city) { where.push("city = ?"); params.push(city); }
  if (start_date) { where.push("date >= ?"); params.push(start_date); }
  if (end_date) { where.push("date <= ?"); params.push(end_date); }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const q = `SELECT region, city, latitude, longitude, price_eur, demand_count, supply_count, date FROM transformed_data ${whereClause}`;
  const rows = await db.all(q, ...params);
  await db.close();
  res.json(rows);
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

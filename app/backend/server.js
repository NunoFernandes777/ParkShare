import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DB_FILE = "app.db";
const app = express();
app.use(cors());
app.use(express.json());

const getDb = () => open({ filename: DB_FILE, driver: sqlite3.Database });

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

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API serveur démarré sur http://localhost:${port}`);
});
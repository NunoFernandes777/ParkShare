import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DB_FILE = "app.db";

const regions = ["Nord", "Sud", "Est", "Ouest", "Centre"];
const citiesByRegion = {
  Nord: ["Lille", "Rouen"],
  Sud: ["Marseille", "Nice"],
  Est: ["Strasbourg", "Metz"],
  Ouest: ["Nantes", "Bordeaux"],
  Centre: ["Lyon", "Clermont-Ferrand"]
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randint(min, max) {
  return Math.floor(rand(min, max + 1));
}

async function setupDatabase() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.exec("PRAGMA foreign_keys=ON;");

  await db.exec(`
    DROP TABLE IF EXISTS kpi_data;
    DROP TABLE IF EXISTS transformed_data;
    DROP TABLE IF EXISTS raw_data;
  `);

  await db.exec(`
    CREATE TABLE raw_data (
      source_id INTEGER PRIMARY KEY,
      region TEXT NOT NULL,
      city TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      date TEXT NOT NULL,
      price_eur REAL NOT NULL,
      demand_count INTEGER NOT NULL,
      supply_count INTEGER NOT NULL,
      source_received_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE transformed_data AS
      SELECT *,
        (supply_count * 1.0 / (demand_count + 1)) AS supply_ratio,
        (demand_count * 1.0 / (supply_count + 1)) AS occupancy_rate,
        CASE
          WHEN price_eur < 3.5 THEN 'Bas'
          WHEN price_eur < 5.5 THEN 'Moyen'
          ELSE 'Élevé'
        END AS price_category
      FROM raw_data
      WHERE 0;
  `);

  await db.exec(`
    CREATE TABLE kpi_data (
      region TEXT,
      city TEXT,
      date TEXT,
      observations INTEGER,
      avg_price REAL,
      avg_demand REAL,
      avg_supply REAL,
      avg_occupancy REAL,
      avg_supply_ratio REAL,
      score REAL,
      rank_in_region INTEGER
    );
  `);

  const insert = await db.prepare(`
    INSERT INTO raw_data (source_id, region, city, latitude, longitude, date, price_eur, demand_count, supply_count, source_received_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let id = 1;
  const startDate = new Date("2025-01-01");

  for (let i = 0; i < 800; i++) {
    const region = regions[randint(0, regions.length - 1)];
    const city = citiesByRegion[region][randint(0, citiesByRegion[region].length - 1)];

    const lat = 45 + rand(0, 5);
    const lon = 0 + rand(-3, 3);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + randint(0, 180));
    const dateStr = date.toISOString().slice(0, 10);

    const price = Number(rand(2.2, 7.8).toFixed(2));
    const demand = Math.max(10, randint(50, 450));
    const supply = Math.max(10, randint(60, 520));

    const source_received_at = new Date().toISOString();

    await insert.run(id, region, city, lat, lon, dateStr, price, demand, supply, source_received_at);
    id += 1;
  }

  await insert.finalize();

  await db.exec(`
    INSERT INTO transformed_data
    SELECT *,
      (supply_count * 1.0 / (demand_count + 1)) AS supply_ratio,
      (demand_count * 1.0 / (supply_count + 1)) AS occupancy_rate,
      CASE
        WHEN price_eur < 3.5 THEN 'Bas'
        WHEN price_eur < 5.5 THEN 'Moyen'
        ELSE 'Élevé'
      END AS price_category
    FROM raw_data;
  `);

  await db.exec(`
    INSERT INTO kpi_data
      (region, city, date, observations, avg_price, avg_demand, avg_supply, avg_occupancy, avg_supply_ratio, score, rank_in_region)
    SELECT
      region,
      city,
      date,
      COUNT(*) AS observations,
      AVG(price_eur) AS avg_price,
      AVG(demand_count) AS avg_demand,
      AVG(supply_count) AS avg_supply,
      AVG(occupancy_rate) AS avg_occupancy,
      AVG(supply_ratio) AS avg_supply_ratio,
      AVG(occupancy_rate) * 0.6 + AVG(1.0 - supply_ratio) * 0.3 + AVG(1.0 / (1.0 + price_eur)) * 0.1 AS score,
      0 AS rank_in_region
    FROM transformed_data
    GROUP BY region, city, date;
  `);

  const rows = await db.all(`SELECT rowid, region, date, score FROM kpi_data ORDER BY region, date, score DESC`);
  let currentRegionDate = null;
  let rank = 0;

  for (const row of rows) {
    const key = `${row.region}_${row.date}`;
    if (key !== currentRegionDate) {
      currentRegionDate = key;
      rank = 1;
    }
    await db.run("UPDATE kpi_data SET rank_in_region = ? WHERE rowid = ?", rank, row.rowid);
    rank += 1;
  }

  await db.close();
  console.log(`Base de données créée : ${DB_FILE}`);
}

setupDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});

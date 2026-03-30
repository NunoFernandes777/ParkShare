# App

Ce dossier contient le livrable principal du profil Dev :

- base de donnees SQLite d'exemple
- script d'initialisation des tables
- API Node/Express
- dashboard React avec carte, filtres et graphiques

## Structure

- [init-db.js](/c:/Programmation/ParkshareChallenge/app/init-db.js) : creation et peuplement de `app.db`
- [backend/server.js](/c:/Programmation/ParkshareChallenge/app/backend/server.js) : API REST
- [frontend/src/App.jsx](/c:/Programmation/ParkshareChallenge/app/frontend/src/App.jsx) : dashboard React
- [frontend/src/mockData.js](/c:/Programmation/ParkshareChallenge/app/frontend/src/mockData.js) : donnees de secours pour affichage sans API
- `app.db` : base SQLite de demonstration

## Schema de base de donnees

Le schema suit trois niveaux pour assurer tracabilite et affichage des indicateurs.

### 1. Table source brute : `raw_data`

Role :
conserver la donnee telle qu'elle est recue de la couche Data, avant enrichissement.

Colonnes :

- `source_id INTEGER PRIMARY KEY`
- `region TEXT NOT NULL`
- `city TEXT NOT NULL`
- `latitude REAL NOT NULL`
- `longitude REAL NOT NULL`
- `date TEXT NOT NULL`
- `price_eur REAL NOT NULL`
- `demand_count INTEGER NOT NULL`
- `supply_count INTEGER NOT NULL`
- `source_received_at TEXT NOT NULL`

### 2. Table transformee : `transformed_data`

Role :
preparer la donnee pour le calcul des KPIs en ajoutant des colonnes derivees.

Colonnes heritees :

- toutes les colonnes de `raw_data`

Colonnes ajoutees :

- `supply_ratio`
- `occupancy_rate`
- `price_category`

Formules actuelles :

- `supply_ratio = supply_count / (demand_count + 1)`
- `occupancy_rate = demand_count / (supply_count + 1)`
- `price_category` :
  - `Bas` si `price_eur < 3.5`
  - `Moyen` si `price_eur < 5.5`
  - `Eleve` sinon

### 3. Table KPI : `kpi_data`

Role :
exposer une vue agregee directement utilisable dans le dashboard.

Colonnes :

- `region TEXT`
- `city TEXT`
- `date TEXT`
- `observations INTEGER`
- `avg_price REAL`
- `avg_demand REAL`
- `avg_supply REAL`
- `avg_occupancy REAL`
- `avg_supply_ratio REAL`
- `score REAL`
- `rank_in_region INTEGER`

### Relations logiques

Le projet fonctionne actuellement avec une logique de pipeline :

- `raw_data` alimente `transformed_data`
- `transformed_data` alimente `kpi_data`

Relation metier :

- une ligne de `kpi_data` correspond a un regroupement par `region`, `city`, `date`
- une ligne de `transformed_data` correspond a une observation source enrichie

## Diagramme textuel

```text
raw_data
  -> cleaned + enriched metrics
transformed_data
  -> grouped by region / city / date
kpi_data
```

## Fonctionnalites du dashboard

Le dashboard couvre les besoins suivants :

- carte interactive
- filtres par region, ville et plage de dates
- graphiques dynamiques
- tableau de classement KPI

### Comportement sans API

Le frontend essaie d'abord de charger les endpoints `/api/...`.
Si l'API n'est pas disponible, il passe automatiquement en mode demo avec des donnees locales.

Cela permet :

- d'afficher la page sans backend
- de presenter l'interface a l'equipe ou au jury
- de continuer a travailler sur l'UX avant livraison Data

## Endpoints API

- `GET /api/health`
- `GET /api/regions`
- `GET /api/cities?region=...`
- `GET /api/kpis?region=&city=&start_date=&end_date=`
- `GET /api/points?region=&city=&start_date=&end_date=`

## Lancement local

### Option 1 : frontend seul

```powershell
cd c:\Programmation\ParkshareChallenge\app\frontend
npm install
npm run dev
```

Resultat :

- le dashboard s'ouvre sur `http://localhost:5173`
- si l'API ne repond pas, le mode demo prend le relais

### Option 2 : API + frontend

Terminal 1 :

```powershell
cd c:\Programmation\ParkshareChallenge\app
npm install
npm run init-db
npm run start:api
```

Terminal 2 :

```powershell
cd c:\Programmation\ParkshareChallenge\app\frontend
npm install
npm run dev
```

## Connexion a la base

La base est un fichier SQLite local :

- chemin : [app.db](/c:/Programmation/ParkshareChallenge/app/app.db)

Le backend y accede depuis [server.js](/c:/Programmation/ParkshareChallenge/app/backend/server.js) avec :

```js
const DB_FILE = "app.db";
```

## Limites actuelles

- le dataset actuel est un dataset de demonstration
- la structure est prete pour recevoir une vraie livraison Data, mais l'import reelle reste a brancher selon le format fourni
- `transformed_data` est aujourd'hui creee a partir d'un `CREATE TABLE AS SELECT`, donc les contraintes SQL sont minimales

## Recommandations avant livraison finale

- remplacer les donnees mockees par les livraisons de `data/`
- ajouter une vraie cle de traçabilite entre brut, transforme et KPI
- consolider les types et contraintes SQL
- documenter les formules KPI finales de l'equipe Data

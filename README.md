# Parkshare Challenge

Projet de challenge organise autour de trois profils qui travaillent en pipeline :

- `data` : collecte, nettoyage, analyse et production des KPIs
- `app` : base de donnees, API et dashboard interactif
- `infra` : containerisation, reverse proxy et deploiement

## Structure du repo

- [data/README.md](/c:/Programmation/ParkshareChallenge/data/README.md) : contrat de livraison Data et structure attendue
- [app/README.md](/c:/Programmation/ParkshareChallenge/app/README.md) : documentation Dev, schema de base, lancement et usage du dashboard
- [infra/README.md](/c:/Programmation/ParkshareChallenge/infra/README.md) : execution via Docker et reverse proxy
- [.env.example](/c:/Programmation/ParkshareChallenge/.env.example) : variables d'environnement a renseigner

## Objectif produit

Construire un outil d'analyse pour identifier les zones geographiques a fort potentiel commercial pour Parkshare, avec :

- conservation des donnees brutes livrees par l'equipe Data
- tables transformees pour le calcul des indicateurs
- tables KPI pretes a afficher
- dashboard interactif avec carte, filtres et graphiques

## Etat actuel du projet

- Le dashboard React dans `app/frontend` fonctionne meme sans API grace a un mode demo local.
- Une API Node/Express est disponible dans `app/backend`.
- Une base SQLite d'exemple est initialisee via `app/init-db.js`.
- Le socle `infra` permet de builder le frontend, lancer l'API et exposer le tout derriere Nginx.

## Demarrage rapide

### Frontend seul

```powershell
cd app/frontend
npm install
npm run dev
```

Le frontend s'affiche meme si l'API n'est pas encore disponible.

### App complete en local

```powershell
cd app
npm install
npm run init-db
npm run start:api
```

Dans un second terminal :

```powershell
cd app/frontend
npm install
npm run dev
```

## Transmission entre profils

### Attendu de Data vers Dev

- un fichier source brut versionne dans `data/raw/`
- un fichier nettoye ou enrichi dans `data/processed/`
- une documentation des colonnes et des KPIs dans `data/delivery/README.md`

### Attendu de Dev vers Infra

- une application runnable depuis `app/`
- des variables documentees dans `.env.example`
- des endpoints connus et un comportement clair si l'API est absente

## Points d'attention

- Le dataset actuel dans `app/app.db` est un dataset de demonstration.
- Des donnees reelles provenant de l'equipe Data devront remplacer ces donnees mockees pour la livraison finale.

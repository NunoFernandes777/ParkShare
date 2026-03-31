# Readme DATA
🅿️ Analyse Data — App Web ParkShare

📌 Projet B3 YNOV — 48h | Identification des zones de prospection prioritaires pour une application de partage de places de parking entre voisins en copropriété.

---

## 🎯 Contexte & Objectif

### Le problème métier

Dans les copropriétés françaises, deux profils coexistent :

- 🚗 **Des résidents motorisés sans place** — ils cherchent à se garer, souvent loin de chez eux
- 🅿️ **Des résidents avec une place inutilisée** — en résidence secondaire, sans voiture, ou avec une place en trop

L'application met ces deux profils en relation directe, comme un **Airbnb du stationnement** entre voisins.

### Notre rôle data

Répondre à la question : **dans quelles villes et copropriétés faut-il concentrer la prospection commerciale ?**

Pour cela, on a croisé 4 sources de données publiques françaises pour produire des KPIs actionnables par l'équipe commerciale.

---

## 📁 Sources de données

| Dataset | Source officielle | Granularité | Volume |
|---|---|---|---|
| `copropriete.csv` | Registre National des Copropriétés — ANAH | 1 ligne = 1 copropriété | 10 000 lignes |
| `Parking.csv` | Data.gouv — Parkings publics | 1 ligne = 1 parking public | 826 lignes |
| `recensement-logements.csv` | INSEE — Recensement 2021 | 1 ligne = 1 IRIS (quartier) | 10 000 lignes |
| `Taux_de_motorisation.csv` | INSEE / SDES | 1 ligne = 1 IRIS (quartier) | 10 000 lignes |

### 💡 Pourquoi ces 4 sources ?

Chaque dataset apporte une dimension différente : la copropriété donne l'offre de places, le recensement donne la structure du parc de logements et les ménages motorisés, la motorisation confirme la demande, et les parkings publics permettent d'identifier les zones sans alternative — donc à **fort potentiel pour le partage privé**.

---

## 🧹 Nettoyage des données

### Copropriétés
- Renommage de 20+ colonnes longues pour lisibilité (ex: `nombre_de_lots_de_stationnement` → `nb_lots_stat`)
- Valeurs manquantes : toutes les occurrences de `"non connu"` remplacées par `NaN`
- Parse des dates : `date_immatriculation` et `date_fin_mandat` converties en `datetime` Python
- Normalisation INSEE : code commune converti en string 5 chiffres avec zéro de tête (`str.zfill(5)`) — critique pour les jointures
- Suppression des lignes sans code commune valide
- Exclusion business : mandats expirés sans successeur déclaré → interlocuteur instable, non prospectable

### Parkings publics
- Séparateur détecté : `;` (point-virgule)
- Normalisation code INSEE sur 5 chiffres
- Suppression des parkings sans nombre de places renseigné

### Recensement logements (INSEE)
- Séparateur `,` + BOM UTF-8 (`\ufeff`) supprimé sur la première colonne
- Conversion décimales françaises → `0,963576` devient `0.963576` sur toutes les colonnes numériques
- Agrégation IRIS → Commune par `sum()` : les données INSEE sont au niveau quartier (IRIS), on les remonte à la commune pour les jointures

### Taux de motorisation
- Séparateur `;` + BOM UTF-8 supprimé
- Conversion décimales françaises → points
- Agrégation IRIS → Commune par `mean()` du taux

---

## 🔗 Consolidation

Les 4 sources sont fusionnées en un seul dataset à la maille commune via des `LEFT JOIN` sur `code_commune` (code INSEE 5 chiffres).

```
coproprietes (agrégé par commune)
    LEFT JOIN  recensement_logements  (agrégé par commune)
    LEFT JOIN  taux_motorisation      (agrégé par commune)
    LEFT JOIN  parkings_publics       (agrégé par commune)
```

> ⚠️ **Fallback nom de ville** : si le nom de commune est absent dans les données copropriété, on le récupère depuis le dataset motorisation qui le contient systématiquement.

Résultat : une table `communes` (~500 communes représentées) et une table `coproprietes` gardée en détail pour les analyses par immeuble. Les deux tables sont chargées dans **SQLite in-memory** — toutes les requêtes analytiques sont du SQL pur.

---

## 📊 KPI 1 — Score de Potentiel de Partage

**Objectif** : noter chaque commune sur 100 points pour prioriser la prospection.

### Méthode de calcul

Chaque composante est normalisée par rapport au maximum national (0–1), puis pondérée :

| Composante | Poids | Logique métier |
|---|---|---|
| Taux de motorisation | ×25 pts | Les gens ont des voitures → ils ont besoin de se garer |
| Lots de stationnement en copro | ×30 pts | Stock de places potentiellement à partager |
| Copros avec stationnement | ×20 pts | Présence de l'offre dans la commune |
| Nombre d'appartements | ×15 pts | Densité résidentielle = taille du marché |
| Ménages motorisés | ×10 pts | Vivier actif de la demande |

> Score final = somme des 5 composantes normalisées × leurs poids

🚫 Les communes sans aucun lot de stationnement en copropriété sont exclues : sans offre, l'app n'a rien à proposer.

### Profils automatiques

| Score | Profil |
|---|---|
| Taux moto > 80% + stationnement | 🔥 Fort potentiel |
| Taux moto > 60% + stationnement | ✅ Bon potentiel |
| Stationnement présent | 🟡 Potentiel modéré |

---

## 📊 KPI 2 — Classement des Zones Géographiques

**Objectif** : donner à l'équipe commerciale une liste ordonnée de cibles avec niveau de priorité.

- **Top N villes** (N paramétrable) avec label automatique :
  - 🔴 Priorité 1 — top 20% → à cibler en urgence
  - 🟠 Priorité 2 — top 50% → à planifier
  - 🟡 Priorité 3 — reste → à surveiller
- **Top 20 départements** : score agrégé avec nombre total de copros, lots de stationnement, taux de motorisation moyen

---

## 📊 KPI 3 — Analyse des Mandats de Copropriété

**Objectif** : aider le commercial à savoir QUI contacter et QUAND — éviter de démarcher au mauvais moment.

### Ancienneté du mandat

Calculée depuis la date d'immatriculation jusqu'à aujourd'hui :

| Durée | Label |
|---|---|
| < 6 mois | 🆕 Nouveau |
| 6 à 24 mois | 🟢 Récent |
| 2 à 5 ans | 🔵 Établi |
| > 5 ans | ⚫ Historique |

### Règle commerciale : alertes sur la fin de mandat

| Statut | Alerte | Action commerciale |
|---|---|---|
| Mandat actif, fin > 90 jours | ✅ Actif | À prospecter |
| Fin dans < 90 jours | ⚠️ Fin imminente | Éviter — syndic en transition |
| Date passée | ❌ Mandat terminé | Ne pas contacter |
| Expiré sans successeur | ❌ Expiré | Ne pas contacter |

> 💡 Le seuil de 90 jours est paramétrable (`SEUIL_FIN_PROCHE_JOURS` en tête de notebook).

Tri du tableau : les copropriétés avec le plus de lots de stationnement ET un mandat actif remontent automatiquement en tête.

---

## 📊 KPI 4 — Ratio Stationnement / Logements

**Objectif** : mesurer la pression sur le stationnement dans chaque zone et identifier les profils de marché.

| Ratio lots stat / logements | Profil | Opportunité pour l'app |
|---|---|---|
| > 1.0 | 🟢 Surplus | Beaucoup de places à louer → fort potentiel offre |
| 0.5 – 1.0 | 🟡 Équilibre | Marché actif des deux côtés |
| 0.1 – 0.5 | 🟠 Tension | Forte demande, peu d'offre → fort potentiel demande |
| < 0.1 | 🔴 Forte tension | Marché de la demande pure |

**Index de partageabilité** = `lots_stat × (ménages_motorisés − ménages_avec_parking) / logements`

Croise l'offre ET la demande dans la même commune — plus il est élevé, plus le marché est actif des deux côtés.

---

## 🏆 Synthèse finale

Croisement de tous les KPIs en une seule vue :
- Score potentiel de la ville
- Nombre de copropriétés avec mandat actif (pas en fin de mandat)
- Lots de stationnement disponibles à prospecter
- Recommandation finale 🔴🟠🟡⛔

---

## ⚙️ Stack technique

```
Python 3.9+  ---> Connaissance déjà adopté en DATA
├── pandas          → chargement, nettoyage, agrégation
├── sqlite3         → requêtes analytiques SQL in-memory
└── matplotlib      → visualisations dark theme
Jupyter Notebook   → exécution cellule par cellule
```

---

## 🗂️ Structure du notebook

```
0. Configuration        ← paramètres TOP_N, seuils, chemins fichiers
1. Chargement CSV       ← lecture des 4 sources
2. Nettoyage            ← par dataset (copros / parking / logements / motorisation)
3. Consolidation        ← fusion → SQLite in-memory
4. Setup graphiques     ← style matplotlib dark theme teal/coral
   ── KPI 1  SQL + graphique barres
   ── KPI 2  SQL villes + depts + graphique scatter
   ── KPI 3  SQL mandats + synthèse + graphique donut
   ── KPI 4a SQL communes + graphique distribution
   ── Synthèse SQL + bubble chart
5. Export CSV           ← 7 fichiers
```

---

*Projet réalisé dans le cadre du cursus B3 Data — YNOV Campus Nanterre*

| Rôle | Membre |
|---|---|
| Data | Quentin OTT & Imane GUARRAZ |
| Dev | MALHEIRO FERNANDES Pedro Nuno |
| Infra | MASSOULLE Hugo |

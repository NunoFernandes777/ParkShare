Voici **ton README Infra réécrit**, **professionnel**, **propre**, **clair**,  
**sans le BONUS (scheduler / ETL)**  
et adapté **exactement** à ton projet Parkshare (frontend React/Vite + backend Node.js + MySQL + Docker + Proxmox).

Tu peux le mettre tel quel dans :

    /root/parkshare/infra/README.md

***

# 📘 README – Infrastructure Parkshare

## 1. Présentation générale

L’infrastructure du projet **Parkshare** permet d’héberger l’ensemble des composants :

*   Une **application web frontend** (React/Vite, servie via Nginx)
*   Un **backend** en Node.js (API REST)
*   Une **base de données MySQL/MariaDB**
*   Des données sources au format CSV, importables via un script dédié (`init-db.js`)

Le tout est déployé dans un **conteneur Debian 12** sous **Proxmox VE**, avec une exposition sécurisée via NAT.

***

## 2. Architecture technique

    Proxmox (hôte)
    │
    └── Conteneur LXC Debian 12 (parkshare-app)
        │
        ├── Docker Engine
        ├── Docker Compose
        │
        ├── parkshare-frontend  (Nginx + React build)
        ├── parkshare-backend   (Node.js API)
        └── parkshare-mysql     (MariaDB)

Services :

*   Frontend : exposé sur **port 8082**
*   Backend : exposé sur **port 3001**
*   MySQL : interne au réseau Docker
*   Accès externe géré par **iptables (NAT)** sur le nœud Proxmox

***

## 3. Installation et configuration du conteneur

### 3.1 Outils de base

```bash
apt update
apt install sudo curl wget nano git unzip -y
```

### 3.2 Installation de Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

### 3.3 Installation Docker + Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y
```

Vérification :

```bash
docker --version
docker compose version
```

***

## 4. Structure du projet

    /root/parkshare/
    │
    ├── app/
    │   ├── frontend/   → Code React/Vite
    │   ├── backend/    → API Node.js
    │   ├── data/       → CSV fournis par les équipes
    │   └── init-db.js  → Script d’initialisation MySQL via CSV
    │
    └── infra/
        ├── docker-compose.yml
        ├── frontend.Dockerfile
        ├── backend.Dockerfile
        └── README.md

***

## 5. Déploiement du projet (Docker Compose)

Toutes les commandes se font dans :

    /root/parkshare/infra/

### 5.1 Lancement des services

```bash
cd /root/parkshare/infra
docker compose up -d --build
```

Cette commande :

*   Lance MySQL (MariaDB)
*   Build & lance le backend Node.js
*   Build le frontend React/Vite puis sert avec Nginx
*   Configure le réseau interne Docker

### 5.2 Vérifier les conteneurs

```bash
docker ps
```

Vous devez voir :

*   parkshare-frontend
*   parkshare-backend
*   parkshare-mysql

***

## 6. Initialisation de la base de données

Une fois MySQL lancé :

```bash
cd /root/parkshare/app
node init-db.js
```

Ce script :

*   Crée les tables dans MySQL
*   Lit les fichiers CSV présents dans `app/data/`
*   Alimente la base automatiquement

***

## 7. Accès aux services

### Frontend (application web)

    http://IP_PUBLIC:8082

### Backend (API REST)

    http://IP_PUBLIC:3001

### Connexion MySQL interne Docker

    host = mysql
    user = root
    password = root
    database = parkshare

MySQL n’est **pas** exposé publiquement (sécurité).

***

## 8. NAT / Exposition des ports (Proxmox)

Sur le **nœud Proxmox**, pas dans le conteneur :

```bash
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 8082 -j DNAT --to 10.0.0.10:8082
iptables -I FORWARD -p tcp -d 10.0.0.10 --dport 8082 -j ACCEPT

iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 3001 -j DNAT --to 10.0.0.10:3001
iptables -I FORWARD -p tcp -d 10.0.0.10 --dport 3001 -j ACCEPT
```

(10.0.0.10 = IP interne du conteneur)

***

## 9. Commandes utiles

### Redémarrer la stack

```bash
docker compose restart
```

### Logs backend

```bash
docker logs parkshare-backend -f
```

### Logs frontend

```bash
docker logs parkshare-frontend -f
```

### Arrêter tous les services

```bash
docker compose down
```

***

## 10. Points d’amélioration (feedback)

*   Mieux anticiper les besoins Dev/Data avant l'intégration
*   Clarifier plus tôt l'architecture globale (front/back/BDD)
*   Centraliser les conventions (ports, formats CSV, endpoints API)
*   Ajouter une documentation commune Dev/Data/Infra
*   Tester plus tôt l’intégration front → back → MySQL

***

# ✔ Conclusion

L’infrastructure Parkshare fournit :

*   Un environnement isolé sous Proxmox
*   Une stack Docker complète (frontend, backend, MySQL)
*   Un déploiement reproductible via Docker Compose
*   Une base importée automatiquement depuis les données CSV
*   Une exposition publique maîtrisée via NAT

Elle garantit un fonctionnement stable de l’application et facilite la collaboration entre Dev, Data et Infra.



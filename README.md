# MyShop — Marketplace multi-boutiques

Plateforme marketplace **MyShop** avec 3 rôles (client, vendeur, manager), architecture **microservices**, frontends **Angular** (web) et **Flutter** (mobile).

## Architecture

```
Clients (Angular / Flutter)
         │
         ▼
   API Gateway :8080
         │
    ┌────┴────┬─────────┬─────────┬─────────┬─────────┬──────────┐
    ▼         ▼         ▼         ▼         ▼         ▼          ▼
  Auth     Store    Catalog    Order    Seller     User     Analytics
  :3001    :3002     :3003     :3004    :3005     :3006      :3007
    │         │         │         │         │         │          │
    └─────────┴─────────┴─────────┴─────────┴─────────┴──────────┘
                              PostgreSQL
                         Meilisearch + Redis
```

| Service | Framework | Rôle |
|---------|-----------|------|
| auth-service | NestJS | JWT, login, register, refresh |
| store-service | NestJS | CRUD boutiques, codes d'accès vendeurs |
| catalog-service | NestJS + Meilisearch | Produits, catégories, recherche |
| order-service | NestJS | Panier, checkout, QR codes, commandes |
| seller-service | NestJS | Vendeurs, avis, performance |
| user-service | NestJS | Préférences, favoris, onboarding |
| analytics-service | NestJS | KPIs, monitoring, profit |

## Démarrage rapide (débutant)

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (lancé)
- Node.js 20+ (frontends locaux)
- Flutter 3.x (mobile local)

### 1. Configuration

```powershell
cd "shop implement"
copy .env.example .env
```

Modifiez `JWT_SECRET` dans `.env` (64 caractères minimum en production).

### 2. Lancer tout le backend

```powershell
docker compose up -d --build
```

Attendez ~2 min que PostgreSQL initialise les schémas.

### 3. Initialiser les données démo

```powershell
.\scripts\seed.ps1
```

Comptes démo :
- **Manager** : `manager@myshop.app` / `Manager2026!`
- **Vendeurs** : voir sortie du script seed

### 4. Frontend web (Angular)

```powershell
cd frontend\web
npm install
npm start
```

Ouvrir http://localhost:4200

### 5. Frontend mobile (Flutter)

```powershell
cd frontend\mobile
flutter pub get
flutter run
```

API gateway : `http://localhost:8080/api` (web) ou `http://10.0.2.2:8080/api` (émulateur Android).

## URLs utiles

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:8080/api |
| Auth Swagger | http://localhost:3001/docs |
| Store Swagger | http://localhost:3002/docs |
| Catalog Swagger | http://localhost:3003/docs |
| Order Swagger | http://localhost:3004/docs |
| Seller Swagger | http://localhost:3005/docs |
| User Swagger | http://localhost:3006/docs |
| Analytics Swagger | http://localhost:3007/docs |
| Meilisearch | http://localhost:7700 |

## Structure du projet

```
shop implement/
├── backend/services/     # 7 microservices NestJS
├── frontend/
│   ├── web/              # Angular 19
│   └── mobile/           # Flutter
├── infra/
│   ├── postgres/         # init.sql (schémas DB)
│   └── gateway/          # nginx.conf
├── scripts/              # seed, utilitaires
├── docker-compose.yml
└── .env.example
```

## Workflow Git

- `main` — version stable
- `develop` — intégration
- `feature/*` — nouvelles fonctionnalités

## Branches et déploiement

Le projet est conçu pour un déploiement **Docker Compose** en dev/staging. Pour la production, chaque service a son `Dockerfile` et peut être déployé sur Kubernetes, Railway ou un VPS.

## Licence

Projet privé — dépôt GitHub : https://github.com/ngmiguel/MyShop.git

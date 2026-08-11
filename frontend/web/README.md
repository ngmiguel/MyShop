# MyShop Web Frontend

Frontend Angular 19 pour la marketplace MyShop (client, vendeur, manager).

## Prerequis

- Node.js 20+
- npm 10+
- API Gateway demarre sur `http://localhost:8080`

## Installation

```bash
npm install
```

## Demarrage

```bash
npm start
```

Application disponible sur `http://localhost:4200`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Serveur de dev (port 4200) |
| `npm run start:host` | Dev accessible sur le reseau local |
| `npm run build` | Build development |
| `npm run build:prod` | Build production |
| `npm test` | Tests unitaires |

## Architecture

- **Standalone components** Angular 19
- **Angular Material** pour l'UI mobile-first
- **Services** : ApiService, AuthService, CatalogService, StoreService, OrderService, SellerService, UserService
- **Interceptors** : JWT (`Authorization`) et session (`X-Session-Id`)
- **Labels UI** en francais

## Routes

### Client
`/client/feed`, `/client/product/:id`, `/client/store/:id`, `/client/cart`, `/client/checkout`, `/client/codes`, `/client/favorites`, `/client/settings`

### Auth
`/auth/login`, `/auth/seller`, `/auth/manager`

### Vendeur
`/seller/scanner`, `/seller/queue`, `/seller/performance`, `/seller/profit`, `/seller/settings`

### Manager
`/manager/dashboard`, `/manager/stores`, `/manager/sellers`, `/manager/analytics`, `/manager/monitoring`, `/manager/profit`, `/manager/settings`

## Configuration

API URL dans `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
```

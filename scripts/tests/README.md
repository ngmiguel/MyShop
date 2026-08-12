# Tests MyShop

Scripts d'automatisation séparés par **type** et **module**.

## Structure

```
scripts/tests/
  run-all.ps1          # Windows - lance tout
  run-all.sh           # Linux/macOS/CI
  unit/
    backend.ps1        # Tests unitaires NestJS (7 services)
    web.ps1            # Tests unitaires Angular
    mobile.ps1         # Tests unitaires Flutter
  integration/
    backend.ps1        # Tests intégration controllers NestJS
  build/
    all.ps1            # Build backend + frontends
```

## Types de tests

| Type | Emplacement | Commande par service |
|------|-------------|----------------------|
| **Unitaire** | `*.spec.ts` / `test/unit/` | `npm run test:unit` |
| **Intégration** | `*.integration.spec.ts` | `npm run test:integration` |
| **Build** | CI compile | `npm run build` |

## Lancer tout (sans erreur attendue)

```powershell
cd "shop implement"
.\scripts\tests\run-all.ps1
```

Par type seulement :

```powershell
.\scripts\tests\run-all.ps1 -Type unit
.\scripts\tests\run-all.ps1 -Type integration
.\scripts\tests\run-all.ps1 -Type build
```

## Modules backend

| Service | Tests unitaires | Tests intégration |
|---------|-----------------|-------------------|
| auth-service | AuthService | AuthController |
| store-service | access-code.util | - |
| catalog-service | CategoriesService | - |
| order-service | utils (QR, ref) | - |
| seller-service | JwtStrategy | - |
| user-service | UsersService | - |
| analytics-service | AnalyticsService | - |

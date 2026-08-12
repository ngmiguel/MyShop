#!/usr/bin/env bash
# MyShop - run all tests (unit + integration + build)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TYPE="${1:-all}"

SERVICES=(auth-service store-service catalog-service order-service seller-service user-service analytics-service)

run_backend_unit() {
  for s in "${SERVICES[@]}"; do
    echo "=== Backend unit: $s ==="
    (cd "$ROOT/backend/services/$s" && npm install --no-fund --no-audit && npm run test:unit)
  done
}

run_backend_integration() {
  for s in "${SERVICES[@]}"; do
    echo "=== Backend integration: $s ==="
    (cd "$ROOT/backend/services/$s" && npm run test:integration)
  done
}

run_build() {
  for s in "${SERVICES[@]}"; do
    echo "=== Backend build: $s ==="
    (cd "$ROOT/backend/services/$s" && rm -f tsconfig.build.tsbuildinfo && npm run build)
  done
  echo "=== Frontend web build ==="
  (cd "$ROOT/frontend/web" && npm ci && npm run build)
  echo "=== Frontend mobile analyze ==="
  (cd "$ROOT/frontend/mobile" && flutter pub get && flutter analyze --no-fatal-infos --no-fatal-warnings)
}

case "$TYPE" in
  unit)
    run_backend_unit
    (cd "$ROOT/frontend/web" && npm run test:unit)
    (cd "$ROOT/frontend/mobile" && flutter test test/unit)
    ;;
  integration) run_backend_integration ;;
  build) run_build ;;
  all)
    run_backend_unit
    run_backend_integration
    (cd "$ROOT/frontend/web" && npm run test:unit)
    (cd "$ROOT/frontend/mobile" && flutter test test/unit)
    run_build
    ;;
esac

echo "Tous les tests ont reussi."

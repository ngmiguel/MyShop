# Installe les dependances npm de tous les microservices backend
$services = @(
  "auth-service", "store-service", "catalog-service", "order-service",
  "seller-service", "user-service", "analytics-service"
)

Write-Host "=== Installation backend MyShop ===" -ForegroundColor Cyan

foreach ($service in $services) {
  $path = Join-Path $PSScriptRoot "..\backend\services\$service"
  Write-Host "-> $service" -NoNewline
  Push-Location $path
  npm install --no-fund --no-audit 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green }
  else { Write-Host " ERREUR" -ForegroundColor Red }
  Pop-Location
}

Write-Host "Termine." -ForegroundColor Cyan

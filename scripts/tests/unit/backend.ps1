$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$services = @('auth-service','store-service','catalog-service','order-service','seller-service','user-service','analytics-service')
$failed = @()

foreach ($s in $services) {
  Write-Host "-> $s" -NoNewline
  Push-Location "$Root\backend\services\$s"
  if (-not (Test-Path node_modules)) { npm install --no-fund --no-audit 2>&1 | Out-Null }
  npm run test:unit 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { $failed += $s; Write-Host " ECHEC" -ForegroundColor Red } else { Write-Host " OK" -ForegroundColor Green }
  Pop-Location
}

if ($failed.Count) { exit 1 }

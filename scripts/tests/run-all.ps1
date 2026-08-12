# MyShop - Scripts d'automatisation des tests
# Usage: .\scripts\tests\run-all.ps1 [-Type unit|integration|build|all]

param(
  [ValidateSet('unit', 'integration', 'build', 'all')]
  [string]$Type = 'all'
)

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ErrorActionPreference = 'Stop'
$failed = @()

function Run-Step($Name, [scriptblock]$Action) {
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  try {
    & $Action
    if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) { throw "Exit code $LASTEXITCODE" }
    Write-Host "OK: $Name" -ForegroundColor Green
  } catch {
    Write-Host "ECHEC: $Name - $_" -ForegroundColor Red
    $script:failed += $Name
  }
}

$services = @(
  'auth-service', 'store-service', 'catalog-service', 'order-service',
  'seller-service', 'user-service', 'analytics-service'
)

if ($Type -in @('unit', 'all')) {
  foreach ($s in $services) {
    Run-Step "Backend unit: $s" {
      Push-Location "$Root\backend\services\$s"
      if (-not (Test-Path node_modules)) { npm install --no-fund --no-audit | Out-Null }
      npm run test:unit
      Pop-Location
    }
  }

  Run-Step 'Frontend web unit' {
    Push-Location "$Root\frontend\web"
    npm run test:unit
    Pop-Location
  }

  Run-Step 'Frontend mobile unit' {
    Push-Location "$Root\frontend\mobile"
    flutter test test/unit
    Pop-Location
  }
}

if ($Type -in @('integration', 'all')) {
  foreach ($s in $services) {
    Run-Step "Backend integration: $s" {
      Push-Location "$Root\backend\services\$s"
      npm run test:integration
      Pop-Location
    }
  }
}

if ($Type -in @('build', 'all')) {
  foreach ($s in $services) {
    Run-Step "Backend build: $s" {
      Push-Location "$Root\backend\services\$s"
      if (Test-Path tsconfig.build.tsbuildinfo) { Remove-Item tsconfig.build.tsbuildinfo -Force }
      npm run build
      Pop-Location
    }
  }

  Run-Step 'Frontend web build' {
    Push-Location "$Root\frontend\web"
    npm run build
    Pop-Location
  }

  Run-Step 'Frontend mobile analyze' {
    Push-Location "$Root\frontend\mobile"
    flutter analyze --no-fatal-infos --no-fatal-warnings
    Pop-Location
  }
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($failed.Count -eq 0) {
  Write-Host "Tous les tests ont reussi." -ForegroundColor Green
  exit 0
} else {
  Write-Host "Echecs ($($failed.Count)):" -ForegroundColor Red
  $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  exit 1
}

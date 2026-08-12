$Root = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
Push-Location "$Root\frontend\web"
npm run test:unit
exit $LASTEXITCODE

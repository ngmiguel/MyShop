$Root = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
Push-Location "$Root\frontend\mobile"
flutter test test/unit
exit $LASTEXITCODE

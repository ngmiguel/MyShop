# MyShop - Script d'initialisation des données démo
$base = "http://localhost:8080/api"

Write-Host "=== MyShop Seed ===" -ForegroundColor Cyan

function Invoke-Seed {
    param([string]$Name, [string]$Method, [string]$Url, [object]$Body = $null)
    Write-Host "-> $Name..." -NoNewline
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json) }
        $r = Invoke-RestMethod @params
        Write-Host " OK" -ForegroundColor Green
        return $r
    } catch {
        Write-Host " SKIP ($($_.Exception.Message))" -ForegroundColor Yellow
        return $null
    }
}

Start-Sleep -Seconds 3

# 1. Manager
$auth = Invoke-Seed "Manager" POST "$base/auth/seed"
$login = Invoke-Seed "Login manager" POST "$base/auth/login" @{
    email = "manager@myshop.app"
    password = "Manager2026!"
}

$token = $login.accessToken
$headers = @{ Authorization = "Bearer $token" }

# 2. Stores
try {
    Invoke-RestMethod -Uri "$base/stores/seed" -Method POST -Headers $headers | Out-Null
    Write-Host "-> Stores demo... OK" -ForegroundColor Green
} catch {
    Write-Host "-> Stores demo... SKIP" -ForegroundColor Yellow
}

# 3. Catalog
Invoke-Seed "Catalog" POST "$base/catalog/seed"

# 4. Sellers
Invoke-Seed "Sellers" POST "$base/sellers/sellers/seed"

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Cyan
Write-Host "Manager : manager@myshop.app / Manager2026!"
Write-Host "Gateway : http://localhost:8080/api"

# One-Click Permanent Cloudflare Tunnel & Auto-Start Provisioning Script
$ErrorActionPreference = "Stop"

$CloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $CloudflaredExe)) {
    $CloudflaredExe = "C:\Program Files\cloudflared\cloudflared.exe"
}
if (-not (Test-Path $CloudflaredExe)) {
    Write-Error "cloudflared.exe not found. Please install via: winget install --id Cloudflare.cloudflared"
    exit 1
}

$TunnelName = "photo-receiver"
$Hostname = "receiver.kunaljangid.com"
$CloudflaredDir = Join-Path $env:USERPROFILE ".cloudflared"
$CertPath = Join-Path $CloudflaredDir "cert.pem"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Permanent Tunnel Setup ($Hostname)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Authenticate with Cloudflare if cert.pem does not exist
if (-not (Test-Path $CertPath)) {
    Write-Host "`n[1/4] Opening browser to authenticate with your Cloudflare account..." -ForegroundColor Yellow
    Write-Host "Please select 'kunaljangid.com' and click Authorize in the browser." -ForegroundColor White
    & $CloudflaredExe tunnel login
} else {
    Write-Host "`n[1/4] Already authenticated with Cloudflare ($CertPath found)." -ForegroundColor Green
}

# Step 2: Create or find tunnel 'photo-receiver'
Write-Host "`n[2/4] Checking/Creating tunnel '$TunnelName'..." -ForegroundColor Yellow
$existingTunnels = & $CloudflaredExe tunnel list --output json | ConvertFrom-Json
$tunnelObj = $existingTunnels | Where-Object { $_.name -eq $TunnelName -and $null -eq $_.deleted_at } | Select-Object -First 1

if ($null -eq $tunnelObj) {
    & $CloudflaredExe tunnel create $TunnelName
    $existingTunnels = & $CloudflaredExe tunnel list --output json | ConvertFrom-Json
    $tunnelObj = $existingTunnels | Where-Object { $_.name -eq $TunnelName -and $null -eq $_.deleted_at } | Select-Object -First 1
}

$TunnelId = $tunnelObj.id
$CredFile = Join-Path $CloudflaredDir "$TunnelId.json"
Write-Host "✅ Tunnel '$TunnelName' ready (ID: $TunnelId)" -ForegroundColor Green

# Step 3: Route DNS for receiver.kunaljangid.com
Write-Host "`n[3/4] Routing DNS '$Hostname' to tunnel '$TunnelName'..." -ForegroundColor Yellow
& $CloudflaredExe tunnel route dns --overwrite-dns $TunnelName $Hostname
Write-Host "✅ DNS CNAME routed: https://$Hostname" -ForegroundColor Green

# Step 4: Write config.yml
Write-Host "`n[4/4] Writing permanent configuration to $CloudflaredDir\config.yml..." -ForegroundColor Yellow
$ConfigPath = Join-Path $CloudflaredDir "config.yml"
$ConfigContent = @"
tunnel: $TunnelId
credentials-file: $CredFile

ingress:
  - hostname: $Hostname
    service: http://localhost:7432
  - service: http_status:404
"@
Set-Content -Path $ConfigPath -Value $ConfigContent -Encoding UTF8
Write-Host "✅ Saved $ConfigPath" -ForegroundColor Green

# Step 5: Register Auto-Start and launch services
& "D:\projects\kunaljangid-website-code\scripts\setup-task-scheduler.ps1"

Start-Process "wscript.exe" -ArgumentList "`"D:\projects\kunaljangid-website-code\scripts\start-tunnel.vbs`""
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "🎉 ALL SET! Permanent Tunnel & Auto-Start Configured!" -ForegroundColor Green
Write-Host "Tunnel URL: https://$Hostname" -ForegroundColor Cyan
Write-Host "Set RECEIVER_TUNNEL_URL = https://$Hostname in your Cloudflare Pages Settings." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

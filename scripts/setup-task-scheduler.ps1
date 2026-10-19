# Automated Windows Startup & Task Scheduler Setup for Photo Receiver & Cloudflare Tunnel
$ErrorActionPreference = "Continue"

$RepoDir = "D:\projects\kunaljangid-website-code"
$ReceiverVbs = Join-Path $RepoDir "scripts\start-receiver.vbs"
$TunnelVbs = Join-Path $RepoDir "scripts\start-tunnel.vbs"
$StartupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Setting up Permanent Auto-Start for Photo Receiver" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Register in User Startup Folder (Works without Administrator privileges)
$WshShell = New-Object -ComObject WScript.Shell

$ReceiverShortcut = $WshShell.CreateShortcut((Join-Path $StartupFolder "KunalPhotoReceiver.lnk"))
$ReceiverShortcut.TargetPath = "wscript.exe"
$ReceiverShortcut.Arguments = "`"$ReceiverVbs`""
$ReceiverShortcut.WorkingDirectory = $RepoDir
$ReceiverShortcut.Description = "Starts Kunal's Desktop Photo Receiver Daemon silently"
$ReceiverShortcut.Save()
Write-Host "✅ Installed Startup Shortcut: KunalPhotoReceiver.lnk" -ForegroundColor Green

$TunnelShortcut = $WshShell.CreateShortcut((Join-Path $StartupFolder "KunalPhotoTunnel.lnk"))
$TunnelShortcut.TargetPath = "wscript.exe"
$TunnelShortcut.Arguments = "`"$TunnelVbs`""
$TunnelShortcut.WorkingDirectory = $RepoDir
$TunnelShortcut.Description = "Starts Kunal's Cloudflare Tunnel silently"
$TunnelShortcut.Save()
Write-Host "✅ Installed Startup Shortcut: KunalPhotoTunnel.lnk" -ForegroundColor Green

# 2. Also attempt Windows Task Scheduler registration if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    $Trigger = New-ScheduledTaskTrigger -AtLogOn
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit 0 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

    $Action1 = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$ReceiverVbs`""
    Register-ScheduledTask -TaskName "KunalPhotoReceiverDaemon" -Action $Action1 -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null

    $Action2 = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$TunnelVbs`""
    Register-ScheduledTask -TaskName "KunalPhotoTunnelDaemon" -Action $Action2 -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null

    Write-Host "✅ Registered Windows Task Scheduler entries (KunalPhotoReceiverDaemon & KunalPhotoTunnelDaemon)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Note: Running without Admin elevation — using native Windows Startup Folder ($StartupFolder) for automatic logon startup." -ForegroundColor Yellow
}

# 3. Start the receiver immediately if not already listening on port 7432
$portActive = Get-NetTCPConnection -LocalPort 7432 -State Listen -ErrorAction SilentlyContinue
if (-not $portActive) {
    Start-Process "wscript.exe" -ArgumentList "`"$ReceiverVbs`""
    Start-Sleep -Seconds 2
    Write-Host "✅ Started Desktop Receiver Daemon on port 7432." -ForegroundColor Green
} else {
    Write-Host "✅ Desktop Receiver Daemon is already running on port 7432." -ForegroundColor Green
}

# 4. Start the tunnel immediately if not running
$tunnelActive = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if (-not $tunnelActive) {
    Start-Process "wscript.exe" -ArgumentList "`"$TunnelVbs`""
    Start-Sleep -Seconds 2
    Write-Host "✅ Started Cloudflare Tunnel Daemon." -ForegroundColor Green
} else {
    Write-Host "✅ Cloudflare Tunnel Daemon is already running." -ForegroundColor Green
}

@echo off
set "PATH=C:\Program Files (x86)\cloudflared;C:\Program Files\cloudflared;%PATH%"
cd /d "D:\projects\kunaljangid-website-code"
if not exist "logs" mkdir "logs"
cloudflared tunnel run photo-receiver >> logs\tunnel.log 2>&1

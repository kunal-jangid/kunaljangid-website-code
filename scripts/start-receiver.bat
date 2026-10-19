@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "D:\projects\kunaljangid-website-code"
if not exist "logs" mkdir "logs"
node --env-file=.env scripts\desktop-receiver.mjs >> logs\receiver.log 2>&1

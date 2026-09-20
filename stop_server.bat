@echo off
chcp 65001 >nul
title Stop Royal Poker Club Server
echo ====================================================
echo Остановка сервера Royal Poker Club...
echo ====================================================
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
  echo Завершение процесса на порту 3000 (PID: %%a)...
  taskkill /F /PID %%a 2>nul
)
taskkill /F /IM cloudflared.exe 2>nul
echo Сервер и туннель успешно остановлены.
pause

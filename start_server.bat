@echo off
chcp 65001 >nul
title Royal Poker Club Server
cd /d "%~dp0"
echo ====================================================
echo ♠️ Royal Poker Club Server & Bot
echo ====================================================
echo Запуск сервера и туннеля...
echo Не закрывайте это окно, чтобы сервер продолжал работать!
echo Для фонового запуска используйте start_background.vbs
echo ====================================================
node launch.mjs
pause

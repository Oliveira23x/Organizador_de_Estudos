@echo off
cd /d "%~dp0"
if not exist package.json (
  echo Nao foi encontrado o package.json. Extraia todo o ZIP novamente.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS antes de continuar.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm start
pause

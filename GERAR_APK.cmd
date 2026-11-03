@echo off
setlocal
cd /d "%~dp0"
set "EAS_NO_VCS=1"
set "EAS_PROJECT_ROOT=%CD%"
if not exist package.json (
  echo Extraia todo o ZIP. Este arquivo deve ficar ao lado de package.json.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS antes de continuar.
  pause
  exit /b 1
)
echo Etapa 1 de 4: instalar e verificar o projeto.
call npm ci
if errorlevel 1 goto falha
call npm test
if errorlevel 1 goto falha
call npm run check
if errorlevel 1 goto falha
echo Etapa 2 de 4: conectar sua conta Expo. A senha e digitada somente no EAS CLI.
call npx --yes eas-cli@27.2.0 whoami
if errorlevel 1 (
  call npx --yes eas-cli@27.2.0 login
  if errorlevel 1 goto falha
)
echo Etapa 3 de 4: vincular o projeto a sua conta Expo.
call npx --yes eas-cli@27.2.0 init
if errorlevel 1 goto falha
echo Etapa 4 de 4: gerar APK assinado pelo EAS Build.
echo Se for perguntado sobre a chave Android, escolha gerar uma nova se este for o primeiro build deste app.
call npm run apk:build
if errorlevel 1 goto falha
echo Baixando o APK concluido e registrando o ID do build e o hash do arquivo.
call node scripts\baixar-apk.cjs
if errorlevel 1 goto falha
echo APK salvo na pasta evidencias\apk. Instale o arquivo no Android.
echo Guarde tambem o ID e a pagina do build em evidencias\REGISTRO_DA_INSTALACAO.md.
pause
exit /b 0
:falha
echo A etapa falhou. Leia a mensagem acima e confira docs\GERAR_APK.md antes de tentar novamente.
pause
exit /b 1

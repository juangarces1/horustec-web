@echo off
cd /d C:\apps\horustec-web

echo Actualizando horustec-web...
git pull
if errorlevel 1 (
  echo ERROR: git pull fallo. Abortando.
  pause
  exit /b 1
)

echo Instalando dependencias...
call npm install
if errorlevel 1 (
  echo ERROR: npm install fallo. Abortando.
  pause
  exit /b 1
)

echo Limpiando build anterior...
if exist .next rd /s /q .next

echo Compilando...
call npm run build
if errorlevel 1 (
  echo ERROR: npm run build fallo. NO se reinicia PM2 ^(sigue corriendo la version anterior^).
  pause
  exit /b 1
)

echo Reiniciando PM2...
call pm2 restart horustec-web

echo Listo!
pause

@echo off
cd /d C:\apps\horustec-web

echo Deteniendo PM2 (libera locks de archivos en Windows)...
call pm2 stop horustec-web

echo Actualizando horustec-web...
git pull
if errorlevel 1 (
  echo ERROR: git pull fallo. Rearrancando la version anterior...
  call pm2 start horustec-web
  pause
  exit /b 1
)

echo Instalando dependencias...
call npm install
if errorlevel 1 (
  echo ERROR: npm install fallo. Rearrancando la version anterior...
  call pm2 start horustec-web
  pause
  exit /b 1
)

echo Limpiando build anterior...
if exist .next rd /s /q .next

echo Compilando...
call npm run build
if errorlevel 1 (
  echo ERROR: npm run build fallo. OJO: la app queda DETENIDA porque el build
  echo anterior ya fue borrado. Corregir el error y volver a correr update.bat.
  pause
  exit /b 1
)

echo Iniciando PM2...
call pm2 restart horustec-web

echo Listo!
pause

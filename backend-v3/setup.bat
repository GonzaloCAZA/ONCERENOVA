@echo off
echo 🚀 Configurando Backend de Certificados de Discapacidad BSV...

REM Copiar .env si no existe
if not exist .env (
    copy .env.example .env
    echo 📝 Archivo .env creado - IMPORTANTE: Configure su clave privada BSV
)

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm install

REM Crear directorio de datos
if not exist data (
    mkdir data
)

echo ✅ ¡Backend configurado!
echo.
echo Para iniciar el backend:
echo   npm run dev:win
echo.
echo ⚠️  IMPORTANTE:
echo   1. Configure BSV_PRIVATE_KEY en .env con su clave privada WIF
echo   2. Asegúrese de tener fondos en mainnet para las transacciones
echo   3. El servidor correrá en http://localhost:3001
pause

@echo off
setlocal enabledelayedexpansion

echo 🚀 Iniciando ambiente de Produção...

REM Carregar variáveis de ambiente
if exist "..\env.production" (
    for /f "tokens=1,* delims==" %%a in (..\env.production) do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
    echo ✅ Variáveis de ambiente carregadas
) else (
    echo ❌ Arquivo env.production não encontrado
    pause
    exit /b 1
)

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando
    pause
    exit /b 1
)

REM Verificar se é ambiente de produção
set /p confirm_production="⚠️  Você está certo de que quer iniciar o ambiente de PRODUÇÃO? (y/N): "
if /i not "!confirm_production!"=="y" (
    echo ❌ Operação cancelada
    pause
    exit /b 1
)

REM Parar containers existentes se houver
echo 🛑 Parando containers existentes...
docker-compose -f ..\docker-compose.production.yml down

REM Backup antes de iniciar (opcional)
set /p do_backup="Deseja fazer backup antes de iniciar? (y/N): "
if /i "!do_backup!"=="y" (
    echo 💾 Fazendo backup...
    call backup.bat
)

REM Construir e iniciar containers
echo 🔨 Construindo containers...
docker-compose -f ..\docker-compose.production.yml build

echo 🚀 Iniciando serviços...
docker-compose -f ..\docker-compose.production.yml up -d

REM Aguardar serviços ficarem prontos
echo ⏳ Aguardando serviços ficarem prontos...
timeout /t 60 /nobreak >nul

REM Verificar status dos serviços
echo 🔍 Verificando status dos serviços...
docker-compose -f ..\docker-compose.production.yml ps

REM Testar endpoints
echo 🧪 Testando endpoints...
echo Backend: http://localhost:8000/health
curl -f http://localhost:8000/health >nul 2>&1 || echo ❌ Backend não está respondendo

echo Frontend: http://localhost:3000
curl -f http://localhost:3000 >nul 2>&1 || echo ❌ Frontend não está respondendo

echo Grafana: http://localhost:3001
curl -f http://localhost:3001 >nul 2>&1 || echo ❌ Grafana não está respondendo

echo Prometheus: http://localhost:9090
curl -f http://localhost:9090 >nul 2>&1 || echo ❌ Prometheus não está respondendo

REM Verificar replicas
echo 🔍 Verificando replicas...
docker-compose -f ..\docker-compose.production.yml ps | findstr /i "backend-production frontend-production"

echo.
echo 🎉 Ambiente de Produção iniciado com sucesso!
echo.
echo 📋 URLs dos serviços:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    Dashboard: http://localhost:8501
echo    Grafana: http://localhost:3001
echo    Prometheus: http://localhost:9090
echo    MinIO Console: http://localhost:9001
echo.
echo 📝 Logs: docker-compose -f ..\docker-compose.production.yml logs -f
echo 🛑 Parar: docker-compose -f ..\docker-compose.production.yml down
echo.
echo ⚠️  Lembre-se: Este é o ambiente de PRODUÇÃO!

pause 
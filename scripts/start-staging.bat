@echo off
setlocal enabledelayedexpansion

echo 🚀 Iniciando ambiente de Staging/Demo...

REM Carregar variáveis de ambiente
if exist "..\env.staging" (
    for /f "tokens=1,* delims==" %%a in (..\env.staging) do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
    echo ✅ Variáveis de ambiente carregadas
) else (
    echo ❌ Arquivo env.staging não encontrado
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

REM Parar containers existentes se houver
echo 🛑 Parando containers existentes...
docker-compose -f ..\docker-compose.staging.yml down

REM Remover volumes antigos (opcional)
set /p remove_volumes="Deseja remover volumes antigos? (y/N): "
if /i "!remove_volumes!"=="y" (
    echo 🗑️ Removendo volumes antigos...
    docker-compose -f ..\docker-compose.staging.yml down -v
)

REM Construir e iniciar containers
echo 🔨 Construindo containers...
docker-compose -f ..\docker-compose.staging.yml build

echo 🚀 Iniciando serviços...
docker-compose -f ..\docker-compose.staging.yml up -d

REM Aguardar serviços ficarem prontos
echo ⏳ Aguardando serviços ficarem prontos...
timeout /t 30 /nobreak >nul

REM Verificar status dos serviços
echo 🔍 Verificando status dos serviços...
docker-compose -f ..\docker-compose.staging.yml ps

REM Testar endpoints
echo 🧪 Testando endpoints...
echo Backend: http://localhost:8001/health
curl -f http://localhost:8001/health >nul 2>&1 || echo ❌ Backend não está respondendo

echo Frontend: http://localhost:3001
curl -f http://localhost:3001 >nul 2>&1 || echo ❌ Frontend não está respondendo

echo Grafana: http://localhost:3002
curl -f http://localhost:3002 >nul 2>&1 || echo ❌ Grafana não está respondendo

echo Prometheus: http://localhost:9091
curl -f http://localhost:9091 >nul 2>&1 || echo ❌ Prometheus não está respondendo

echo.
echo 🎉 Ambiente de Staging/Demo iniciado com sucesso!
echo.
echo 📋 URLs dos serviços:
echo    Frontend: http://localhost:3001
echo    Backend API: http://localhost:8001
echo    Dashboard: http://localhost:8502
echo    Grafana: http://localhost:3002 (admin/admin-staging)
echo    Prometheus: http://localhost:9091
echo    MinIO Console: http://localhost:9003
echo.
echo 📝 Logs: docker-compose -f ..\docker-compose.staging.yml logs -f
echo 🛑 Parar: docker-compose -f ..\docker-compose.staging.yml down

pause 
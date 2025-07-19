@echo off
setlocal enabledelayedexpansion

:menu
cls
echo 🔧 Gerenciador de Ambientes MILAPP
echo ==================================

echo.
echo Escolha uma opção:
echo 1) Iniciar ambiente de Staging/Demo
echo 2) Iniciar ambiente de Produção
echo 3) Parar ambiente de Staging/Demo
echo 4) Parar ambiente de Produção
echo 5) Parar todos os ambientes
echo 6) Status dos ambientes
echo 7) Logs do ambiente de Staging
echo 8) Logs do ambiente de Produção
echo 9) Backup de dados
echo 10) Limpar volumes (CUIDADO!)
echo 0) Sair
echo.

set /p choice="Digite sua opção: "

if "%choice%"=="1" goto start_staging
if "%choice%"=="2" goto start_production
if "%choice%"=="3" goto stop_staging
if "%choice%"=="4" goto stop_production
if "%choice%"=="5" goto stop_all
if "%choice%"=="6" goto show_status
if "%choice%"=="7" goto logs_staging
if "%choice%"=="8" goto logs_production
if "%choice%"=="9" goto backup_data
if "%choice%"=="10" goto clean_volumes
if "%choice%"=="0" goto exit
echo ❌ Opção inválida
pause
goto menu

:start_staging
echo 🚀 Iniciando ambiente de Staging/Demo...
call start-staging.bat
pause
goto menu

:start_production
echo 🚀 Iniciando ambiente de Produção...
call start-production.bat
pause
goto menu

:stop_staging
echo 🛑 Parando ambiente de Staging/Demo...
docker-compose -f ..\docker-compose.staging.yml down
echo ✅ Ambiente de Staging/Demo parado
pause
goto menu

:stop_production
echo 🛑 Parando ambiente de Produção...
docker-compose -f ..\docker-compose.production.yml down
echo ✅ Ambiente de Produção parado
pause
goto menu

:stop_all
echo 🛑 Parando todos os ambientes...
docker-compose -f ..\docker-compose.staging.yml down
docker-compose -f ..\docker-compose.production.yml down
echo ✅ Todos os ambientes parados
pause
goto menu

:show_status
echo 📊 Status dos Ambientes
echo ======================
echo.
echo 🔍 Ambiente de Staging/Demo:
docker-compose -f ..\docker-compose.staging.yml ps 2>nul || echo    Não está rodando
echo.
echo 🔍 Ambiente de Produção:
docker-compose -f ..\docker-compose.production.yml ps 2>nul || echo    Não está rodando
echo.
echo 🌐 Portas em uso:
netstat -an | findstr /i "3000 3001 8000 8001 8501 8502 9090 9091 6379 6380 9000 9001 9002 9003" || echo    Nenhuma porta em uso
pause
goto menu

:logs_staging
echo 📝 Logs do ambiente de Staging
echo Pressione Ctrl+C para sair
echo.
docker-compose -f ..\docker-compose.staging.yml logs -f
pause
goto menu

:logs_production
echo 📝 Logs do ambiente de Produção
echo Pressione Ctrl+C para sair
echo.
docker-compose -f ..\docker-compose.production.yml logs -f
pause
goto menu

:backup_data
echo 💾 Iniciando backup de dados...
call backup.bat
pause
goto menu

:clean_volumes
echo ⚠️  ATENÇÃO: Esta operação irá remover TODOS os dados!
set /p confirm="Você tem certeza? Digite 'SIM' para confirmar: "
if /i "!confirm!"=="SIM" (
    echo 🗑️ Removendo volumes...
    docker-compose -f ..\docker-compose.staging.yml down -v
    docker-compose -f ..\docker-compose.production.yml down -v
    docker volume prune -f
    echo ✅ Volumes removidos
) else (
    echo ❌ Operação cancelada
)
pause
goto menu

:exit
echo 👋 Saindo...
exit /b 0 
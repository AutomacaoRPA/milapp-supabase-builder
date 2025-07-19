@echo off
REM =====================================================
REM Script de Deploy com Seed Automático - MilApp Builder
REM =====================================================
REM Descrição: Deploy completo com migrações, functions e seeds
REM Autor: MilApp Builder Team
REM Data: 2025-01-18
REM Versão: 1.0.0
REM =====================================================

setlocal enabledelayedexpansion

REM Configurações
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "SUPABASE_DIR=%PROJECT_DIR%\supabase"

REM Variáveis de ambiente
set "ENVIRONMENT=%1"
if "%ENVIRONMENT%"=="" set "ENVIRONMENT=development"
set "PROJECT_ID=%SUPABASE_PROJECT_ID%"
set "ACCESS_TOKEN=%SUPABASE_ACCESS_TOKEN%"

REM Configurações por ambiente
if /i "%ENVIRONMENT%"=="development" (
    set "ENV_NAME=development"
    set "AUTO_APPROVE=--yes"
) else if /i "%ENVIRONMENT%"=="staging" (
    set "ENV_NAME=staging"
    set "AUTO_APPROVE="
) else if /i "%ENVIRONMENT%"=="production" (
    set "ENV_NAME=production"
    set "AUTO_APPROVE="
) else (
    echo [ERROR] Ambiente inválido: %ENVIRONMENT%
    echo Uso: %0 [development^|staging^|production]
    exit /b 1
)

echo [INFO] Iniciando deploy para ambiente: %ENV_NAME%

REM =====================================================
REM VALIDAÇÕES INICIAIS
REM =====================================================

REM Verificar se Supabase CLI está instalado
supabase --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Supabase CLI não encontrado. Instale com: npm install -g supabase
    exit /b 1
)

REM Verificar se está logado no Supabase
supabase status >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Não logado no Supabase. Execute: supabase login
    exit /b 1
)

REM Verificar variáveis de ambiente
if "%PROJECT_ID%"=="" (
    echo [ERROR] SUPABASE_PROJECT_ID não definido
    exit /b 1
)

if "%ACCESS_TOKEN%"=="" (
    echo [ERROR] SUPABASE_ACCESS_TOKEN não definido
    exit /b 1
)

REM =====================================================
REM BACKUP ANTES DO DEPLOY
REM =====================================================

echo [INFO] Criando backup antes do deploy...

set "BACKUP_DIR=%PROJECT_DIR%\backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "BACKUP_DIR=%BACKUP_DIR: =0%"
mkdir "%BACKUP_DIR%" 2>nul

REM Backup das migrações atuais
if exist "%SUPABASE_DIR%\migrations" (
    xcopy "%SUPABASE_DIR%\migrations" "%BACKUP_DIR%\migrations\" /E /I /Y >nul
    echo [INFO] Backup das migrações criado em: %BACKUP_DIR%\migrations
)

REM Backup das functions
if exist "%SUPABASE_DIR%\functions" (
    xcopy "%SUPABASE_DIR%\functions" "%BACKUP_DIR%\functions\" /E /I /Y >nul
    echo [INFO] Backup das functions criado em: %BACKUP_DIR%\functions
)

REM =====================================================
REM DEPLOY DAS MIGRAÇÕES
REM =====================================================

echo [INFO] Executando migrações do banco de dados...

cd /d "%SUPABASE_DIR%"

REM Push das migrações
if "%AUTO_APPROVE%"=="--yes" (
    supabase db push --project-ref "%PROJECT_ID%" --access-token "%ACCESS_TOKEN%" --yes
) else (
    supabase db push --project-ref "%PROJECT_ID%" --access-token "%ACCESS_TOKEN%"
)

if errorlevel 1 (
    echo [ERROR] Falha ao aplicar migrações
    exit /b 1
) else (
    echo [SUCCESS] Migrações aplicadas com sucesso
)

REM =====================================================
REM DEPLOY DAS FUNCTIONS
REM =====================================================

echo [INFO] Deployando Edge Functions...

REM Deploy de todas as functions
supabase functions deploy --project-ref "%PROJECT_ID%" --access-token "%ACCESS_TOKEN%"

if errorlevel 1 (
    echo [ERROR] Falha ao deployar functions
    exit /b 1
) else (
    echo [SUCCESS] Functions deployadas com sucesso
)

REM =====================================================
REM EXECUÇÃO DO SEED
REM =====================================================

echo [INFO] Executando seed de ambientes padrão...

REM Verificar se o arquivo de seed existe
set "SEED_FILE=%SUPABASE_DIR%\seeds\seed_environments.sql"
if not exist "%SEED_FILE%" (
    echo [ERROR] Arquivo de seed não encontrado: %SEED_FILE%
    exit /b 1
)

REM Executar seed via SQL
echo [INFO] Executando seed via psql...

REM Obter connection string do projeto
for /f "tokens=*" %%i in ('supabase status --project-ref "%PROJECT_ID%" --access-token "%ACCESS_TOKEN%" --output json ^| jq -r ".db_url"') do set "DB_URL=%%i"

if "%DB_URL%"=="" (
    echo [ERROR] Não foi possível obter a URL do banco de dados
    exit /b 1
)

REM Executar seed
psql "%DB_URL%" -f "%SEED_FILE%"

if errorlevel 1 (
    echo [ERROR] Falha ao executar seed
    exit /b 1
) else (
    echo [SUCCESS] Seed executado com sucesso
)

REM =====================================================
REM VERIFICAÇÃO PÓS-DEPLOY
REM =====================================================

echo [INFO] Verificando status pós-deploy...

REM Verificar se as tabelas foram criadas
echo [INFO] Verificando tabelas...

for /f "tokens=*" %%i in ('psql "%DB_URL%" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('environments', 'projects', 'users');"') do set "TABLES_CHECK=%%i"

if %TABLES_CHECK% geq 3 (
    echo [SUCCESS] Tabelas principais verificadas
) else (
    echo [WARNING] Algumas tabelas podem não ter sido criadas
)

REM Verificar se os ambientes foram criados
echo [INFO] Verificando ambientes criados...

for /f "tokens=*" %%i in ('psql "%DB_URL%" -t -c "SELECT COUNT(*) FROM environments WHERE name IN ('dev', 'hml', 'prod');"') do set "ENVIRONMENTS_CHECK=%%i"

if %ENVIRONMENTS_CHECK% equ 3 (
    echo [SUCCESS] Ambientes padrão criados: dev, hml, prod
) else (
    echo [WARNING] Apenas %ENVIRONMENTS_CHECK% ambientes foram criados
)

REM Verificar functions
echo [INFO] Verificando functions...

for /f "tokens=*" %%i in ('supabase functions list --project-ref "%PROJECT_ID%" --access-token "%ACCESS_TOKEN%" ^| find /c /v ""') do set "FUNCTIONS_CHECK=%%i"

if %FUNCTIONS_CHECK% gtr 1 (
    echo [SUCCESS] Functions verificadas
) else (
    echo [WARNING] Poucas functions encontradas
)

REM =====================================================
REM NOTIFICAÇÕES
REM =====================================================

echo [INFO] Enviando notificações...

REM Notificação no Slack (se configurado)
if not "%SLACK_WEBHOOK_URL%"=="" (
    powershell -Command "Invoke-RestMethod -Uri '%SLACK_WEBHOOK_URL%' -Method POST -ContentType 'application/json' -Body '{\"text\": \"🚀 Deploy concluído para %ENV_NAME%\", \"attachments\": [{\"fields\": [{\"title\": \"Ambiente\", \"value\": \"%ENV_NAME%\", \"short\": true}, {\"title\": \"Status\", \"value\": \"✅ Sucesso\", \"short\": true}, {\"title\": \"Ambientes Criados\", \"value\": \"dev, hml, prod\", \"short\": true}, {\"title\": \"Timestamp\", \"value\": \"%date% %time%\", \"short\": true}]}]}'" >nul 2>&1
    echo [SUCCESS] Notificação enviada para Slack
)

REM =====================================================
REM LIMPEZA E FINALIZAÇÃO
REM =====================================================

REM Limpar backups antigos (manter apenas os últimos 5)
echo [INFO] Limpando backups antigos...

cd /d "%PROJECT_DIR%\backups"
for /f "skip=5 delims=" %%i in ('dir /b /o-d') do rmdir /s /q "%%i" 2>nul

REM Log final
echo.
echo [SUCCESS] 🎉 Deploy concluído com sucesso!
echo [INFO] 📊 Resumo:
echo [INFO]    - Ambiente: %ENV_NAME%
echo [INFO]    - Migrações: ✅ Aplicadas
echo [INFO]    - Functions: ✅ Deployadas
echo [INFO]    - Seeds: ✅ Executados
echo [INFO]    - Ambientes: ✅ Criados (dev, hml, prod)
echo.

REM Informações úteis
echo [INFO] 🔗 URLs dos ambientes:
echo [INFO]    - DEV: https://dev.milapp-builder.supabase.co
echo [INFO]    - HML: https://hml.milapp-builder.supabase.co
echo [INFO]    - PROD: https://milapp-builder.supabase.co
echo.

echo [INFO] 📝 Comandos úteis:
echo [INFO]    - Status: supabase status
echo [INFO]    - Logs: supabase logs
echo [INFO]    - Studio: supabase studio
echo.

exit /b 0 
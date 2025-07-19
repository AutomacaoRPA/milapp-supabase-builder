@echo off
REM MILAPP MedSênior - Script de Deploy para Windows
REM Bem entregar bem

setlocal enabledelayedexpansion

REM Cores para output (Windows)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

REM Função para log
:log
echo %GREEN%[MILAPP MedSênior]%NC% %~1
goto :eof

:warn
echo %YELLOW%[AVISO]%NC% %~1
goto :eof

:error
echo %RED%[ERRO]%NC% %~1
goto :eof

REM Variáveis
set "ENVIRONMENT=%1"
if "%ENVIRONMENT%"=="" set "ENVIRONMENT=staging"
set "VERSION=2.0.0"
set "PROJECT_NAME=milapp-medsenior"

call :log "🏥 Iniciando deploy do MILAPP MedSênior v%VERSION%"
call :log "🌱 Bem entregar bem - Ambiente: %ENVIRONMENT%"

REM Verificar se está no diretório correto
if not exist "package.json" (
    call :error "Execute este script no diretório raiz do projeto"
    exit /b 1
)

REM Verificar dependências
call :log "📦 Verificando dependências..."
docker --version >nul 2>&1
if errorlevel 1 (
    call :error "Docker não está instalado"
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :error "Docker Compose não está instalado"
    exit /b 1
)

REM Build da aplicação
call :log "🏗️ Fazendo build da aplicação..."
call npm run build:medsenior
if errorlevel 1 (
    call :error "Build falhou"
    exit /b 1
)

call :log "✅ Build bem sucedido"

REM Build da imagem Docker
call :log "🐳 Construindo imagem Docker..."
docker build -t %PROJECT_NAME%:%VERSION% .
if errorlevel 1 (
    call :error "Build da imagem Docker falhou"
    exit /b 1
)

call :log "✅ Imagem Docker construída"

REM Deploy baseado no ambiente
if "%ENVIRONMENT%"=="production" (
    call :log "🌟 Deploy para produção..."
    
    REM Parar containers existentes
    docker-compose -f docker-compose.production.yml down
    
    REM Iniciar novos containers
    docker-compose -f docker-compose.production.yml up -d
    
    REM Health check
    call :log "🔍 Verificando saúde da aplicação..."
    timeout /t 30 /nobreak >nul
    
    curl -f http://localhost/health >nul 2>&1
    if errorlevel 1 (
        call :error "❌ Health check falhou"
        exit /b 1
    )
    
    call :log "✅ Produção bem configurada - MedSênior ativo"
    
) else if "%ENVIRONMENT%"=="staging" (
    call :log "🚀 Deploy para staging..."
    
    REM Parar containers existentes
    docker-compose down
    
    REM Iniciar novos containers
    docker-compose up -d
    
    REM Health check
    call :log "🔍 Verificando saúde da aplicação..."
    timeout /t 30 /nobreak >nul
    
    curl -f http://localhost:3000/health >nul 2>&1
    if errorlevel 1 (
        call :error "❌ Health check falhou"
        exit /b 1
    )
    
    call :log "✅ Staging bem configurado e funcionando"
    
) else (
    call :error "Ambiente inválido. Use 'staging' ou 'production'"
    exit /b 1
)

REM Logs finais
call :log "📊 Status dos containers:"
docker-compose ps

call :log "🎉 Deploy bem sucedido!"
call :log "🏥 MILAPP MedSênior está bem ativo no ambiente %ENVIRONMENT%"
call :log "🌱 Bem envelhecer bem com automação"

REM Informações úteis
if "%ENVIRONMENT%"=="production" (
    call :log "🌐 Aplicação disponível em: http://localhost"
    call :log "📊 Grafana disponível em: http://localhost:3001"
    call :log "📈 Prometheus disponível em: http://localhost:9090"
) else (
    call :log "🌐 Aplicação disponível em: http://localhost:3000"
)

pause 
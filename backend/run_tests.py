#!/usr/bin/env python3
"""
Script para executar testes do MILAPP Backend
"""

import os
import sys
import subprocess
import time
from pathlib import Path


def run_command(command, description):
    """Executar comando e mostrar resultado"""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}")
    
    start_time = time.time()
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    end_time = time.time()
    
    print(f"Comando: {command}")
    print(f"Duração: {end_time - start_time:.2f}s")
    print(f"Status: {'✅ SUCESSO' if result.returncode == 0 else '❌ FALHOU'}")
    
    if result.stdout:
        print("\n📤 Saída:")
        print(result.stdout)
    
    if result.stderr:
        print("\n⚠️  Erros:")
        print(result.stderr)
    
    return result.returncode == 0


def check_dependencies():
    """Verificar dependências necessárias"""
    print("🔍 Verificando dependências...")
    
    # Verificar se pytest está instalado
    try:
        import pytest
        print("✅ pytest instalado")
    except ImportError:
        print("❌ pytest não encontrado. Instalando...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pytest"], check=True)
    
    # Verificar se pytest-cov está instalado
    try:
        import pytest_cov
        print("✅ pytest-cov instalado")
    except ImportError:
        print("❌ pytest-cov não encontrado. Instalando...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pytest-cov"], check=True)
    
    # Verificar se httpx está instalado
    try:
        import httpx
        print("✅ httpx instalado")
    except ImportError:
        print("❌ httpx não encontrado. Instalando...")
        subprocess.run([sys.executable, "-m", "pip", "install", "httpx"], check=True)


def run_unit_tests():
    """Executar testes unitários"""
    return run_command(
        "python -m pytest tests/unit/ -v --cov=app --cov-report=term-missing",
        "Executando Testes Unitários"
    )


def run_integration_tests():
    """Executar testes de integração"""
    return run_command(
        "python -m pytest tests/integration/ -v --cov=app --cov-report=term-missing",
        "Executando Testes de Integração"
    )


def run_security_tests():
    """Executar testes de segurança"""
    return run_command(
        "python -m pytest tests/ -m security -v",
        "Executando Testes de Segurança"
    )


def run_performance_tests():
    """Executar testes de performance"""
    return run_command(
        "python -m pytest tests/ -m performance -v",
        "Executando Testes de Performance"
    )


def run_all_tests():
    """Executar todos os testes"""
    return run_command(
        "python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing",
        "Executando Todos os Testes"
    )


def generate_coverage_report():
    """Gerar relatório de cobertura"""
    return run_command(
        "python -m pytest tests/ --cov=app --cov-report=html --cov-report=xml",
        "Gerando Relatório de Cobertura"
    )


def run_linting():
    """Executar linting"""
    return run_command(
        "python -m flake8 app/ tests/ --max-line-length=120 --ignore=E501,W503",
        "Executando Linting"
    )


def run_type_checking():
    """Executar verificação de tipos"""
    return run_command(
        "python -m mypy app/ --ignore-missing-imports",
        "Executando Verificação de Tipos"
    )


def main():
    """Função principal"""
    print("🧪 MILAPP Backend - Executor de Testes")
    print("=" * 60)
    
    # Mudar para o diretório do backend
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Verificar dependências
    check_dependencies()
    
    # Menu de opções
    while True:
        print("\n" + "="*60)
        print("📋 Menu de Testes")
        print("="*60)
        print("1. 🔍 Verificar dependências")
        print("2. 🧪 Executar testes unitários")
        print("3. 🔗 Executar testes de integração")
        print("4. 🔒 Executar testes de segurança")
        print("5. ⚡ Executar testes de performance")
        print("6. 🎯 Executar todos os testes")
        print("7. 📊 Gerar relatório de cobertura")
        print("8. 🧹 Executar linting")
        print("9. 🔍 Executar verificação de tipos")
        print("10. 🚀 Executar pipeline completo")
        print("0. ❌ Sair")
        
        choice = input("\nEscolha uma opção: ").strip()
        
        if choice == "0":
            print("👋 Saindo...")
            break
        elif choice == "1":
            check_dependencies()
        elif choice == "2":
            run_unit_tests()
        elif choice == "3":
            run_integration_tests()
        elif choice == "4":
            run_security_tests()
        elif choice == "5":
            run_performance_tests()
        elif choice == "6":
            run_all_tests()
        elif choice == "7":
            generate_coverage_report()
        elif choice == "8":
            run_linting()
        elif choice == "9":
            run_type_checking()
        elif choice == "10":
            print("🚀 Executando pipeline completo...")
            success = True
            success &= check_dependencies()
            success &= run_linting()
            success &= run_type_checking()
            success &= run_unit_tests()
            success &= run_integration_tests()
            success &= run_security_tests()
            success &= generate_coverage_report()
            
            if success:
                print("\n🎉 Pipeline completo executado com sucesso!")
            else:
                print("\n❌ Pipeline falhou em algumas etapas.")
        else:
            print("❌ Opção inválida!")


if __name__ == "__main__":
    main() 
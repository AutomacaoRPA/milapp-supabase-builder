#!/usr/bin/env python3
"""
Script para executar testes automatizados do MILAPP Backend
Com geração de relatórios detalhados e métricas de qualidade
"""

import subprocess
import sys
import os
import json
import time
from datetime import datetime
from pathlib import Path

def run_command(command, cwd=None):
    """Execute a command and return the result."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)

def run_linting():
    """Run code linting checks."""
    print("🔍 Executando linting...")
    
    checks = [
        ("flake8", "flake8 app tests --count --select=E9,F63,F7,F82 --show-source --statistics"),
        ("flake8-complexity", "flake8 app tests --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics"),
        ("black", "black --check app tests"),
        ("isort", "isort --check-only app tests")
    ]
    
    results = {}
    for name, command in checks:
        print(f"  Executando {name}...")
        returncode, stdout, stderr = run_command(command)
        results[name] = {
            "returncode": returncode,
            "stdout": stdout,
            "stderr": stderr,
            "success": returncode == 0
        }
    
    return results

def run_tests():
    """Run test suite with coverage."""
    print("🧪 Executando testes...")
    
    # Set test environment variables
    os.environ.update({
        "DATABASE_URL": "sqlite:///./test.db",
        "REDIS_URL": "redis://localhost:6379",
        "SECRET_KEY": "test-secret-key",
        "DEBUG": "true"
    })
    
    command = "pytest tests/ -v --cov=app --cov-report=xml --cov-report=html --cov-report=term-missing --cov-fail-under=90"
    returncode, stdout, stderr = run_command(command)
    
    return {
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "success": returncode == 0
    }

def run_security_checks():
    """Run security checks."""
    print("🔒 Executando verificações de segurança...")
    
    # Install security tools if not available
    run_command("pip install bandit safety")
    
    checks = [
        ("bandit", "bandit -r app/ -f json -o bandit-report.json"),
        ("safety", "safety check --json --output safety-report.json")
    ]
    
    results = {}
    for name, command in checks:
        print(f"  Executando {name}...")
        returncode, stdout, stderr = run_command(command)
        results[name] = {
            "returncode": returncode,
            "stdout": stdout,
            "stderr": stderr,
            "success": returncode == 0
        }
    
    return results

def run_performance_tests():
    """Run performance tests."""
    print("⚡ Executando testes de performance...")
    
    # Install locust if not available
    run_command("pip install locust")
    
    command = "locust -f tests/performance/locustfile.py --headless --users 5 --spawn-rate 1 --run-time 30s --html performance-report.html"
    returncode, stdout, stderr = run_command(command)
    
    return {
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "success": returncode == 0
    }

def generate_report(results):
    """Generate comprehensive test report."""
    print("📊 Gerando relatório...")
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "linting": all(r["success"] for r in results["linting"].values()),
            "tests": results["tests"]["success"],
            "security": all(r["success"] for r in results["security"].values()),
            "performance": results["performance"]["success"]
        },
        "details": results
    }
    
    # Save report
    with open("test-report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    # Generate markdown report
    markdown_report = generate_markdown_report(report)
    with open("test-report.md", "w") as f:
        f.write(markdown_report)
    
    return report

def generate_markdown_report(report):
    """Generate markdown format report."""
    md = f"""# Relatório de Testes - MILAPP Backend

**Data:** {report['timestamp']}

## Resumo Executivo

| Componente | Status |
|------------|--------|
| Linting | {'✅ PASSOU' if report['summary']['linting'] else '❌ FALHOU'} |
| Testes | {'✅ PASSOU' if report['summary']['tests'] else '❌ FALHOU'} |
| Segurança | {'✅ PASSOU' if report['summary']['security'] else '❌ FALHOU'} |
| Performance | {'✅ PASSOU' if report['summary']['performance'] else '❌ FALHOU'} |

## Detalhes

### Linting
"""
    
    for name, result in report["details"]["linting"].items():
        status = "✅ PASSOU" if result["success"] else "❌ FALHOU"
        md += f"- **{name}:** {status}\n"
    
    md += "\n### Testes\n"
    test_result = report["details"]["tests"]
    status = "✅ PASSOU" if test_result["success"] else "❌ FALHOU"
    md += f"- **Status:** {status}\n"
    
    if test_result["stdout"]:
        md += f"- **Output:** {test_result['stdout'][:500]}...\n"
    
    md += "\n### Segurança\n"
    for name, result in report["details"]["security"].items():
        status = "✅ PASSOU" if result["success"] else "❌ FALHOU"
        md += f"- **{name}:** {status}\n"
    
    md += "\n### Performance\n"
    perf_result = report["details"]["performance"]
    status = "✅ PASSOU" if perf_result["success"] else "❌ FALHOU"
    md += f"- **Status:** {status}\n"
    
    return md

def main():
    """Main execution function."""
    print("🚀 Iniciando execução de testes automatizados do MILAPP Backend")
    print("=" * 60)
    
    start_time = time.time()
    
    # Run all checks
    results = {
        "linting": run_linting(),
        "tests": run_tests(),
        "security": run_security_checks(),
        "performance": run_performance_tests()
    }
    
    # Generate report
    report = generate_report(results)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📋 RESUMO DOS TESTES")
    print("=" * 60)
    
    for component, success in report["summary"].items():
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{component.upper()}: {status}")
    
    total_time = time.time() - start_time
    print(f"\n⏱️  Tempo total de execução: {total_time:.2f} segundos")
    
    # Exit with appropriate code
    all_passed = all(report["summary"].values())
    if all_passed:
        print("\n🎉 Todos os testes passaram!")
        sys.exit(0)
    else:
        print("\n⚠️  Alguns testes falharam. Verifique o relatório para detalhes.")
        sys.exit(1)

if __name__ == "__main__":
    main()
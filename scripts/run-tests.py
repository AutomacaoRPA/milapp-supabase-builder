#!/usr/bin/env python3
"""
Script Unificado de Testes - MILAPP
Executa todos os tipos de testes e gera relatórios detalhados
"""

import os
import sys
import subprocess
import json
import time
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import requests
import psutil

class TestRunner:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        self.reports_dir = self.project_root / "test-reports"
        self.reports_dir.mkdir(exist_ok=True)
        
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "summary": {},
            "details": {},
            "performance": {},
            "coverage": {},
            "errors": []
        }
        
        self.start_time = time.time()
        
    def log(self, message: str, level: str = "INFO"):
        """Log com timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def check_dependencies(self) -> bool:
        """Verificar se todas as dependências estão instaladas"""
        self.log("Verificando dependências...")
        
        # Verificar Python
        try:
            python_version = subprocess.run(
                ["python", "--version"], 
                capture_output=True, 
                text=True
            ).stdout.strip()
            self.log(f"Python: {python_version}")
        except Exception as e:
            self.log(f"Erro ao verificar Python: {e}", "ERROR")
            return False
            
        # Verificar Node.js
        try:
            node_version = subprocess.run(
                ["node", "--version"], 
                capture_output=True, 
                text=True
            ).stdout.strip()
            self.log(f"Node.js: {node_version}")
        except Exception as e:
            self.log(f"Erro ao verificar Node.js: {e}", "ERROR")
            return False
            
        # Verificar Docker
        try:
            docker_version = subprocess.run(
                ["docker", "--version"], 
                capture_output=True, 
                text=True
            ).stdout.strip()
            self.log(f"Docker: {docker_version}")
        except Exception as e:
            self.log(f"Erro ao verificar Docker: {e}", "WARNING")
            
        # Verificar dependências Python
        required_packages = [
            "pytest", "pytest-asyncio", "httpx", "coverage",
            "pytest-cov", "pytest-html", "pytest-xdist"
        ]
        
        for package in required_packages:
            try:
                subprocess.run(
                    ["python", "-c", f"import {package}"], 
                    check=True, 
                    capture_output=True
                )
            except subprocess.CalledProcessError:
                self.log(f"Pacote Python não encontrado: {package}", "ERROR")
                return False
                
        # Verificar dependências Node.js
        if not (self.frontend_dir / "node_modules").exists():
            self.log("node_modules não encontrado. Execute 'npm install' no frontend", "ERROR")
            return False
            
        self.log("Todas as dependências verificadas com sucesso")
        return True
        
    def run_backend_tests(self) -> Dict:
        """Executar testes do backend"""
        self.log("Executando testes do backend...")
        
        results = {
            "unit_tests": {},
            "integration_tests": {},
            "coverage": {},
            "errors": []
        }
        
        try:
            os.chdir(self.backend_dir)
            
            # Testes unitários
            self.log("Executando testes unitários...")
            unit_cmd = [
                "python", "-m", "pytest", 
                "tests/unit/", 
                "-v", 
                "--cov=app", 
                "--cov-report=html:../test-reports/backend-coverage",
                "--cov-report=json:../test-reports/backend-coverage.json",
                "--html=../test-reports/backend-unit-report.html",
                "--self-contained-html"
            ]
            
            unit_result = subprocess.run(
                unit_cmd, 
                capture_output=True, 
                text=True, 
                timeout=300
            )
            
            results["unit_tests"] = {
                "return_code": unit_result.returncode,
                "stdout": unit_result.stdout,
                "stderr": unit_result.stderr,
                "success": unit_result.returncode == 0
            }
            
            # Testes de integração
            self.log("Executando testes de integração...")
            integration_cmd = [
                "python", "-m", "pytest", 
                "tests/integration/", 
                "-v", 
                "--html=../test-reports/backend-integration-report.html",
                "--self-contained-html"
            ]
            
            integration_result = subprocess.run(
                integration_cmd, 
                capture_output=True, 
                text=True, 
                timeout=600
            )
            
            results["integration_tests"] = {
                "return_code": integration_result.returncode,
                "stdout": integration_result.stdout,
                "stderr": integration_result.stderr,
                "success": integration_result.returncode == 0
            }
            
            # Ler relatório de cobertura
            coverage_file = self.reports_dir / "backend-coverage.json"
            if coverage_file.exists():
                with open(coverage_file, 'r') as f:
                    coverage_data = json.load(f)
                    results["coverage"] = coverage_data
                    
        except subprocess.TimeoutExpired:
            results["errors"].append("Timeout nos testes do backend")
            self.log("Timeout nos testes do backend", "ERROR")
        except Exception as e:
            results["errors"].append(f"Erro nos testes do backend: {e}")
            self.log(f"Erro nos testes do backend: {e}", "ERROR")
            
        return results
        
    def run_frontend_tests(self) -> Dict:
        """Executar testes do frontend"""
        self.log("Executando testes do frontend...")
        
        results = {
            "unit_tests": {},
            "integration_tests": {},
            "e2e_tests": {},
            "coverage": {},
            "errors": []
        }
        
        try:
            os.chdir(self.frontend_dir)
            
            # Testes unitários
            self.log("Executando testes unitários do frontend...")
            unit_cmd = [
                "npm", "test", 
                "--", 
                "--coverage", 
                "--watchAll=false",
                "--testResultsProcessor=jest-html-reporter",
                "--coverageReporters=html",
                "--coverageReporters=json",
                "--coverageDirectory=../test-reports/frontend-coverage"
            ]
            
            unit_result = subprocess.run(
                unit_cmd, 
                capture_output=True, 
                text=True, 
                timeout=300
            )
            
            results["unit_tests"] = {
                "return_code": unit_result.returncode,
                "stdout": unit_result.stdout,
                "stderr": unit_result.stderr,
                "success": unit_result.returncode == 0
            }
            
            # Testes E2E (se Playwright estiver configurado)
            playwright_config = self.frontend_dir / "playwright.config.ts"
            if playwright_config.exists():
                self.log("Executando testes E2E...")
                e2e_cmd = ["npx", "playwright", "test", "--reporter=html"]
                
                e2e_result = subprocess.run(
                    e2e_cmd, 
                    capture_output=True, 
                    text=True, 
                    timeout=600
                )
                
                results["e2e_tests"] = {
                    "return_code": e2e_result.returncode,
                    "stdout": e2e_result.stdout,
                    "stderr": e2e_result.stderr,
                    "success": e2e_result.returncode == 0
                }
                
        except subprocess.TimeoutExpired:
            results["errors"].append("Timeout nos testes do frontend")
            self.log("Timeout nos testes do frontend", "ERROR")
        except Exception as e:
            results["errors"].append(f"Erro nos testes do frontend: {e}")
            self.log(f"Erro nos testes do frontend: {e}", "ERROR")
            
        return results
        
    def run_performance_tests(self) -> Dict:
        """Executar testes de performance"""
        self.log("Executando testes de performance...")
        
        results = {
            "load_tests": {},
            "stress_tests": {},
            "benchmarks": {},
            "errors": []
        }
        
        try:
            # Verificar se o backend está rodando
            try:
                response = requests.get("http://localhost:8000/health", timeout=5)
                if response.status_code != 200:
                    self.log("Backend não está rodando. Iniciando...", "WARNING")
                    self.start_backend()
                    time.sleep(10)
            except:
                self.log("Backend não está rodando. Iniciando...", "WARNING")
                self.start_backend()
                time.sleep(10)
            
            # Teste de carga básico
            self.log("Executando teste de carga...")
            load_cmd = [
                "python", "performance_test.py", 
                "--users", "20", 
                "--requests", "100",
                "--output", str(self.reports_dir / "load-test-results.json")
            ]
            
            load_result = subprocess.run(
                load_cmd, 
                capture_output=True, 
                text=True, 
                timeout=300
            )
            
            results["load_tests"] = {
                "return_code": load_result.returncode,
                "stdout": load_result.stdout,
                "stderr": load_result.stderr,
                "success": load_result.returncode == 0
            }
            
            # Benchmark de endpoints
            self.log("Executando benchmarks...")
            benchmark_cmd = [
                "python", "-m", "pytest", 
                "tests/performance/", 
                "-v",
                "--html=" + str(self.reports_dir / "performance-report.html"),
                "--self-contained-html"
            ]
            
            benchmark_result = subprocess.run(
                benchmark_cmd, 
                capture_output=True, 
                text=True, 
                timeout=300
            )
            
            results["benchmarks"] = {
                "return_code": benchmark_result.returncode,
                "stdout": benchmark_result.stdout,
                "stderr": benchmark_result.stderr,
                "success": benchmark_result.returncode == 0
            }
            
        except Exception as e:
            results["errors"].append(f"Erro nos testes de performance: {e}")
            self.log(f"Erro nos testes de performance: {e}", "ERROR")
            
        return results
        
    def run_security_tests(self) -> Dict:
        """Executar testes de segurança"""
        self.log("Executando testes de segurança...")
        
        results = {
            "vulnerability_scan": {},
            "dependency_check": {},
            "security_tests": {},
            "errors": []
        }
        
        try:
            # Verificar dependências vulneráveis (Python)
            self.log("Verificando vulnerabilidades em dependências Python...")
            safety_cmd = ["safety", "check", "--json", "--output", str(self.reports_dir / "safety-report.json")]
            
            try:
                safety_result = subprocess.run(
                    safety_cmd, 
                    capture_output=True, 
                    text=True, 
                    timeout=120
                )
                
                results["dependency_check"]["python"] = {
                    "return_code": safety_result.returncode,
                    "stdout": safety_result.stdout,
                    "stderr": safety_result.stderr
                }
            except FileNotFoundError:
                self.log("Safety não instalado. Instale com: pip install safety", "WARNING")
                
            # Verificar dependências vulneráveis (Node.js)
            self.log("Verificando vulnerabilidades em dependências Node.js...")
            os.chdir(self.frontend_dir)
            
            audit_cmd = ["npm", "audit", "--json"]
            audit_result = subprocess.run(
                audit_cmd, 
                capture_output=True, 
                text=True, 
                timeout=120
            )
            
            results["dependency_check"]["nodejs"] = {
                "return_code": audit_result.returncode,
                "stdout": audit_result.stdout,
                "stderr": audit_result.stderr
            }
            
            # Testes de segurança customizados
            self.log("Executando testes de segurança customizados...")
            security_cmd = [
                "python", "-m", "pytest", 
                "tests/security/", 
                "-v",
                "--html=" + str(self.reports_dir / "security-report.html"),
                "--self-contained-html"
            ]
            
            security_result = subprocess.run(
                security_cmd, 
                capture_output=True, 
                text=True, 
                timeout=300
            )
            
            results["security_tests"] = {
                "return_code": security_result.returncode,
                "stdout": security_result.stdout,
                "stderr": security_result.stderr,
                "success": security_result.returncode == 0
            }
            
        except Exception as e:
            results["errors"].append(f"Erro nos testes de segurança: {e}")
            self.log(f"Erro nos testes de segurança: {e}", "ERROR")
            
        return results
        
    def start_backend(self):
        """Iniciar backend para testes"""
        try:
            os.chdir(self.backend_dir)
            subprocess.Popen(
                ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception as e:
            self.log(f"Erro ao iniciar backend: {e}", "ERROR")
            
    def generate_summary_report(self):
        """Gerar relatório resumido"""
        self.log("Gerando relatório resumido...")
        
        # Calcular estatísticas
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        total_errors = 0
        
        # Backend
        if "backend" in self.test_results["details"]:
            backend = self.test_results["details"]["backend"]
            if backend["unit_tests"]["success"]:
                passed_tests += 1
            else:
                failed_tests += 1
                total_errors += 1
                
            if backend["integration_tests"]["success"]:
                passed_tests += 1
            else:
                failed_tests += 1
                total_errors += 1
                
        # Frontend
        if "frontend" in self.test_results["details"]:
            frontend = self.test_results["details"]["frontend"]
            if frontend["unit_tests"]["success"]:
                passed_tests += 1
            else:
                failed_tests += 1
                total_errors += 1
                
        # Performance
        if "performance" in self.test_results["details"]:
            perf = self.test_results["details"]["performance"]
            if perf["load_tests"]["success"]:
                passed_tests += 1
            else:
                failed_tests += 1
                total_errors += 1
                
        # Security
        if "security" in self.test_results["details"]:
            sec = self.test_results["details"]["security"]
            if sec["security_tests"]["success"]:
                passed_tests += 1
            else:
                failed_tests += 1
                total_errors += 1
                
        total_tests = passed_tests + failed_tests
        
        # Gerar relatório
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0,
                "total_errors": total_errors,
                "execution_time": time.time() - self.start_time
            },
            "details": self.test_results["details"],
            "recommendations": self.generate_recommendations()
        }
        
        # Salvar relatório
        report_file = self.reports_dir / f"test-summary-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        # Gerar relatório HTML
        self.generate_html_report(report)
        
        self.log(f"Relatório salvo em: {report_file}")
        return report
        
    def generate_recommendations(self) -> List[str]:
        """Gerar recomendações baseadas nos resultados"""
        recommendations = []
        
        # Verificar cobertura
        if "backend" in self.test_results["details"]:
            backend = self.test_results["details"]["backend"]
            if "coverage" in backend and "totals" in backend["coverage"]:
                coverage = backend["coverage"]["totals"]["percent_covered"]
                if coverage < 80:
                    recommendations.append(f"Aumentar cobertura de testes do backend (atual: {coverage:.1f}%)")
                    
        # Verificar performance
        if "performance" in self.test_results["details"]:
            perf = self.test_results["details"]["performance"]
            if not perf["load_tests"]["success"]:
                recommendations.append("Otimizar performance - testes de carga falharam")
                
        # Verificar segurança
        if "security" in self.test_results["details"]:
            sec = self.test_results["details"]["security"]
            if not sec["security_tests"]["success"]:
                recommendations.append("Corrigir vulnerabilidades de segurança identificadas")
                
        # Verificar erros
        total_errors = len(self.test_results["errors"])
        if total_errors > 0:
            recommendations.append(f"Investigar {total_errors} erro(s) nos testes")
            
        if not recommendations:
            recommendations.append("Todos os testes passaram com sucesso!")
            
        return recommendations
        
    def generate_html_report(self, report: Dict):
        """Gerar relatório HTML"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório de Testes - MILAPP</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .summary {{ margin: 20px 0; }}
                .metric {{ display: inline-block; margin: 10px; padding: 10px; border-radius: 5px; }}
                .success {{ background: #d4edda; color: #155724; }}
                .error {{ background: #f8d7da; color: #721c24; }}
                .warning {{ background: #fff3cd; color: #856404; }}
                .details {{ margin: 20px 0; }}
                .section {{ margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }}
                .recommendations {{ background: #e7f3ff; padding: 15px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Testes - MILAPP</h1>
                <p>Executado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="summary">
                <h2>Resumo</h2>
                <div class="metric {'success' if report['summary']['success_rate'] >= 80 else 'error'}">
                    Taxa de Sucesso: {report['summary']['success_rate']:.1f}%
                </div>
                <div class="metric {'success' if report['summary']['passed'] > 0 else 'error'}">
                    Testes Passados: {report['summary']['passed']}
                </div>
                <div class="metric {'error' if report['summary']['failed'] > 0 else 'success'}">
                    Testes Falharam: {report['summary']['failed']}
                </div>
                <div class="metric">
                    Tempo de Execução: {report['summary']['execution_time']:.1f}s
                </div>
            </div>
            
            <div class="details">
                <h2>Detalhes</h2>
                {self._generate_details_html(report['details'])}
            </div>
            
            <div class="recommendations">
                <h2>Recomendações</h2>
                <ul>
                    {''.join(f'<li>{rec}</li>' for rec in report['recommendations'])}
                </ul>
            </div>
        </body>
        </html>
        """
        
        html_file = self.reports_dir / f"test-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.html"
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        self.log(f"Relatório HTML salvo em: {html_file}")
        
    def _generate_details_html(self, details: Dict) -> str:
        """Gerar HTML para detalhes dos testes"""
        html = ""
        
        for category, data in details.items():
            html += f'<div class="section"><h3>{category.title()}</h3>'
            
            if isinstance(data, dict):
                for test_type, result in data.items():
                    if isinstance(result, dict) and "success" in result:
                        status_class = "success" if result["success"] else "error"
                        html += f'<div class="metric {status_class}">{test_type}: {"✅" if result["success"] else "❌"}</div>'
                        
            html += '</div>'
            
        return html
        
    def run_all_tests(self, args: argparse.Namespace):
        """Executar todos os testes"""
        self.log("Iniciando execução de todos os testes...")
        
        # Verificar dependências
        if not self.check_dependencies():
            self.log("Falha na verificação de dependências", "ERROR")
            return False
            
        # Executar testes baseado nos argumentos
        if args.backend or args.all:
            self.test_results["details"]["backend"] = self.run_backend_tests()
            
        if args.frontend or args.all:
            self.test_results["details"]["frontend"] = self.run_frontend_tests()
            
        if args.performance or args.all:
            self.test_results["details"]["performance"] = self.run_performance_tests()
            
        if args.security or args.all:
            self.test_results["details"]["security"] = self.run_security_tests()
            
        # Gerar relatório
        summary = self.generate_summary_report()
        
        # Exibir resumo
        self.log("=" * 50)
        self.log("RESUMO DOS TESTES")
        self.log("=" * 50)
        self.log(f"Total de testes: {summary['summary']['total_tests']}")
        self.log(f"Passados: {summary['summary']['passed']}")
        self.log(f"Falharam: {summary['summary']['failed']}")
        self.log(f"Taxa de sucesso: {summary['summary']['success_rate']:.1f}%")
        self.log(f"Tempo de execução: {summary['summary']['execution_time']:.1f}s")
        
        if summary['recommendations']:
            self.log("\nRecomendações:")
            for rec in summary['recommendations']:
                self.log(f"  - {rec}")
                
        return summary['summary']['success_rate'] >= 80

def main():
    parser = argparse.ArgumentParser(description="Script unificado de testes do MILAPP")
    parser.add_argument("--all", action="store_true", help="Executar todos os testes")
    parser.add_argument("--backend", action="store_true", help="Executar apenas testes do backend")
    parser.add_argument("--frontend", action="store_true", help="Executar apenas testes do frontend")
    parser.add_argument("--performance", action="store_true", help="Executar apenas testes de performance")
    parser.add_argument("--security", action="store_true", help="Executar apenas testes de segurança")
    parser.add_argument("--check-deps", action="store_true", help="Apenas verificar dependências")
    
    args = parser.parse_args()
    
    # Se nenhum argumento foi fornecido, executar todos os testes
    if not any([args.all, args.backend, args.frontend, args.performance, args.security, args.check_deps]):
        args.all = True
        
    runner = TestRunner()
    
    if args.check_deps:
        success = runner.check_dependencies()
        sys.exit(0 if success else 1)
        
    success = runner.run_all_tests(args)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 
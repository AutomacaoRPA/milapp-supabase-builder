#!/usr/bin/env python3
"""
Script para validar os ambientes MILAPP
"""

import requests
import subprocess
import sys
import time
import json
from typing import Dict, List, Tuple

class EnvironmentValidator:
    def __init__(self):
        self.staging_urls = {
            'frontend': 'http://localhost:3001',
            'backend': 'http://localhost:8001',
            'dashboard': 'http://localhost:8502',
            'grafana': 'http://localhost:3002',
            'prometheus': 'http://localhost:9091',
            'minio': 'http://localhost:9003'
        }
        
        self.production_urls = {
            'frontend': 'http://localhost:3000',
            'backend': 'http://localhost:8000',
            'dashboard': 'http://localhost:8501',
            'grafana': 'http://localhost:3001',
            'prometheus': 'http://localhost:9090',
            'minio': 'http://localhost:9001'
        }
        
        self.results = {
            'staging': {},
            'production': {}
        }

    def check_port(self, port: int) -> bool:
        """Verificar se uma porta está em uso"""
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            return result == 0
        except:
            return False

    def check_docker_containers(self, environment: str) -> Dict[str, bool]:
        """Verificar status dos containers Docker"""
        containers = {}
        
        try:
            if environment == 'staging':
                cmd = ['docker-compose', '-f', '../docker-compose.staging.yml', 'ps', '--format', 'json']
            else:
                cmd = ['docker-compose', '-f', '../docker-compose.production.yml', 'ps', '--format', 'json']
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='scripts')
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if line:
                        try:
                            container_info = json.loads(line)
                            service_name = container_info.get('Service', '')
                            state = container_info.get('State', '')
                            containers[service_name] = state == 'running'
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            print(f"Erro ao verificar containers {environment}: {e}")
        
        return containers

    def check_http_endpoint(self, url: str, timeout: int = 5) -> Tuple[bool, str]:
        """Verificar se um endpoint HTTP está respondendo"""
        try:
            response = requests.get(url, timeout=timeout)
            if response.status_code == 200:
                return True, f"OK ({response.status_code})"
            else:
                return False, f"Erro HTTP {response.status_code}"
        except requests.exceptions.ConnectionError:
            return False, "Conexão recusada"
        except requests.exceptions.Timeout:
            return False, "Timeout"
        except Exception as e:
            return False, f"Erro: {str(e)}"

    def validate_staging(self) -> Dict[str, bool]:
        """Validar ambiente de staging"""
        print("🔍 Validando ambiente de Staging/Demo...")
        
        results = {}
        
        # Verificar containers
        containers = self.check_docker_containers('staging')
        print(f"  📦 Containers: {len(containers)} encontrados")
        
        for service, is_running in containers.items():
            print(f"    {'✅' if is_running else '❌'} {service}: {'Rodando' if is_running else 'Parado'}")
        
        # Verificar endpoints
        print("  🌐 Verificando endpoints...")
        for service, url in self.staging_urls.items():
            is_ok, message = self.check_http_endpoint(url)
            results[service] = is_ok
            print(f"    {'✅' if is_ok else '❌'} {service}: {message}")
        
        # Verificar portas
        staging_ports = [3001, 8001, 8502, 9091, 6380, 9002, 9003]
        print("  🔌 Verificando portas...")
        for port in staging_ports:
            is_open = self.check_port(port)
            results[f'port_{port}'] = is_open
            print(f"    {'✅' if is_open else '❌'} Porta {port}: {'Aberta' if is_open else 'Fechada'}")
        
        self.results['staging'] = results
        return results

    def validate_production(self) -> Dict[str, bool]:
        """Validar ambiente de produção"""
        print("🔍 Validando ambiente de Produção...")
        
        results = {}
        
        # Verificar containers
        containers = self.check_docker_containers('production')
        print(f"  📦 Containers: {len(containers)} encontrados")
        
        for service, is_running in containers.items():
            print(f"    {'✅' if is_running else '❌'} {service}: {'Rodando' if is_running else 'Parado'}")
        
        # Verificar endpoints
        print("  🌐 Verificando endpoints...")
        for service, url in self.production_urls.items():
            is_ok, message = self.check_http_endpoint(url)
            results[service] = is_ok
            print(f"    {'✅' if is_ok else '❌'} {service}: {message}")
        
        # Verificar portas
        production_ports = [3000, 8000, 8501, 9090, 6379, 9000, 9001]
        print("  🔌 Verificando portas...")
        for port in production_ports:
            is_open = self.check_port(port)
            results[f'port_{port}'] = is_open
            print(f"    {'✅' if is_open else '❌'} Porta {port}: {'Aberta' if is_open else 'Fechada'}")
        
        self.results['production'] = results
        return results

    def generate_report(self) -> str:
        """Gerar relatório de validação"""
        report = []
        report.append("# 📊 Relatório de Validação dos Ambientes MILAPP")
        report.append("")
        report.append(f"**Data/Hora**: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Staging
        report.append("## 🧪 Ambiente de Staging/Demo")
        staging_results = self.results.get('staging', {})
        if staging_results:
            success_count = sum(1 for v in staging_results.values() if v)
            total_count = len(staging_results)
            report.append(f"**Status**: {success_count}/{total_count} verificações passaram")
            report.append("")
            
            for service, is_ok in staging_results.items():
                status = "✅ OK" if is_ok else "❌ FALHOU"
                report.append(f"- {service}: {status}")
        else:
            report.append("**Status**: Não verificado")
        report.append("")
        
        # Production
        report.append("## 🚀 Ambiente de Produção")
        production_results = self.results.get('production', {})
        if production_results:
            success_count = sum(1 for v in production_results.values() if v)
            total_count = len(production_results)
            report.append(f"**Status**: {success_count}/{total_count} verificações passaram")
            report.append("")
            
            for service, is_ok in production_results.items():
                status = "✅ OK" if is_ok else "❌ FALHOU"
                report.append(f"- {service}: {status}")
        else:
            report.append("**Status**: Não verificado")
        report.append("")
        
        # Recomendações
        report.append("## 💡 Recomendações")
        
        staging_ok = all(self.results.get('staging', {}).values())
        production_ok = all(self.results.get('production', {}).values())
        
        if staging_ok and production_ok:
            report.append("🎉 **Todos os ambientes estão funcionando corretamente!**")
        elif staging_ok:
            report.append("⚠️ **Staging OK, mas Produção tem problemas**")
            report.append("- Verifique os logs de produção")
            report.append("- Confirme se todos os containers estão rodando")
        elif production_ok:
            report.append("⚠️ **Produção OK, mas Staging tem problemas**")
            report.append("- Verifique os logs de staging")
            report.append("- Confirme se todos os containers estão rodando")
        else:
            report.append("❌ **Ambos os ambientes têm problemas**")
            report.append("- Verifique se o Docker está rodando")
            report.append("- Confirme se os arquivos de configuração estão corretos")
            report.append("- Verifique se as portas não estão em conflito")
        
        return "\n".join(report)

    def run_validation(self) -> bool:
        """Executar validação completa"""
        print("🚀 Iniciando validação dos ambientes MILAPP...")
        print("=" * 50)
        
        # Validar staging
        staging_ok = self.validate_staging()
        print()
        
        # Validar production
        production_ok = self.validate_production()
        print()
        
        # Gerar relatório
        report = self.generate_report()
        print(report)
        
        # Salvar relatório
        with open('../validation-report.md', 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 Relatório salvo em: validation-report.md")
        
        # Retornar sucesso se pelo menos um ambiente estiver OK
        staging_success = any(staging_ok.values()) if staging_ok else False
        production_success = any(production_ok.values()) if production_ok else False
        
        return staging_success or production_success

def main():
    """Função principal"""
    validator = EnvironmentValidator()
    
    try:
        success = validator.run_validation()
        if success:
            print("\n✅ Validação concluída com sucesso!")
            sys.exit(0)
        else:
            print("\n❌ Validação falhou!")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️ Validação interrompida pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro durante a validação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
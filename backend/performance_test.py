#!/usr/bin/env python3
"""
Script de teste de performance para o MILAPP
"""

import asyncio
import aiohttp
import time
import statistics
import json
from typing import List, Dict, Any
from datetime import datetime
import argparse

class PerformanceTester:
    """Classe para executar testes de performance"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = []
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def make_request(self, endpoint: str, method: str = "GET", data: Dict = None) -> Dict[str, Any]:
        """Faz uma requisição e mede o tempo"""
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                async with self.session.get(f"{self.base_url}{endpoint}") as response:
                    response_text = await response.text()
                    status_code = response.status_code
            elif method.upper() == "POST":
                async with self.session.post(f"{self.base_url}{endpoint}", json=data) as response:
                    response_text = await response.text()
                    status_code = response.status_code
            else:
                raise ValueError(f"Método {method} não suportado")
            
            duration = time.time() - start_time
            
            return {
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "duration": duration,
                "success": 200 <= status_code < 300,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            duration = time.time() - start_time
            return {
                "endpoint": endpoint,
                "method": method,
                "status_code": 0,
                "duration": duration,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def run_load_test(self, endpoint: str, concurrent_users: int, requests_per_user: int) -> Dict[str, Any]:
        """Executa teste de carga"""
        print(f"Executando teste de carga: {concurrent_users} usuários, {requests_per_user} requisições por usuário")
        print(f"Endpoint: {endpoint}")
        
        start_time = time.time()
        
        # Cria tarefas para usuários concorrentes
        tasks = []
        for user_id in range(concurrent_users):
            for req_id in range(requests_per_user):
                task = self.make_request(endpoint)
                tasks.append(task)
        
        # Executa todas as requisições
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filtra resultados válidos
        valid_results = [r for r in results if isinstance(r, dict)]
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Calcula estatísticas
        durations = [r["duration"] for r in valid_results]
        successful_requests = [r for r in valid_results if r["success"]]
        failed_requests = [r for r in valid_results if not r["success"]]
        
        stats = {
            "total_requests": len(valid_results),
            "successful_requests": len(successful_requests),
            "failed_requests": len(failed_requests),
            "success_rate": len(successful_requests) / len(valid_results) * 100 if valid_results else 0,
            "total_duration": total_duration,
            "requests_per_second": len(valid_results) / total_duration if total_duration > 0 else 0,
            "avg_response_time": statistics.mean(durations) if durations else 0,
            "min_response_time": min(durations) if durations else 0,
            "max_response_time": max(durations) if durations else 0,
            "median_response_time": statistics.median(durations) if durations else 0,
            "p95_response_time": self._percentile(durations, 95) if durations else 0,
            "p99_response_time": self._percentile(durations, 99) if durations else 0,
            "concurrent_users": concurrent_users,
            "requests_per_user": requests_per_user,
            "endpoint": endpoint
        }
        
        self.results.append(stats)
        return stats
    
    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calcula percentil"""
        if not data:
            return 0
        sorted_data = sorted(data)
        index = (percentile / 100) * (len(sorted_data) - 1)
        if index.is_integer():
            return sorted_data[int(index)]
        else:
            lower = sorted_data[int(index)]
            upper = sorted_data[int(index) + 1]
            return lower + (upper - lower) * (index - int(index))
    
    async def run_stress_test(self, endpoint: str, max_users: int, step_size: int = 10) -> List[Dict[str, Any]]:
        """Executa teste de estresse aumentando usuários gradualmente"""
        print(f"Executando teste de estresse: até {max_users} usuários")
        print(f"Endpoint: {endpoint}")
        
        stress_results = []
        
        for users in range(step_size, max_users + 1, step_size):
            print(f"Testando com {users} usuários concorrentes...")
            
            result = await self.run_load_test(endpoint, users, 5)  # 5 requisições por usuário
            stress_results.append(result)
            
            # Aguarda um pouco entre os testes
            await asyncio.sleep(2)
        
        return stress_results
    
    async def run_endurance_test(self, endpoint: str, duration_minutes: int, requests_per_second: int) -> Dict[str, Any]:
        """Executa teste de resistência por um período longo"""
        print(f"Executando teste de resistência: {duration_minutes} minutos, {requests_per_second} req/s")
        print(f"Endpoint: {endpoint}")
        
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        
        results = []
        request_interval = 1.0 / requests_per_second
        
        while time.time() < end_time:
            result = await self.make_request(endpoint)
            results.append(result)
            
            # Aguarda o intervalo necessário
            await asyncio.sleep(request_interval)
        
        # Calcula estatísticas
        durations = [r["duration"] for r in results]
        successful_requests = [r for r in results if r["success"]]
        
        return {
            "test_type": "endurance",
            "duration_minutes": duration_minutes,
            "target_requests_per_second": requests_per_second,
            "total_requests": len(results),
            "successful_requests": len(successful_requests),
            "success_rate": len(successful_requests) / len(results) * 100 if results else 0,
            "avg_response_time": statistics.mean(durations) if durations else 0,
            "max_response_time": max(durations) if durations else 0,
            "min_response_time": min(durations) if durations else 0,
            "actual_requests_per_second": len(results) / (time.time() - start_time) if time.time() > start_time else 0
        }
    
    def generate_report(self, output_file: str = None) -> str:
        """Gera relatório dos testes"""
        if not self.results:
            return "Nenhum resultado para gerar relatório"
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "summary": {
                "total_tests": len(self.results),
                "avg_success_rate": statistics.mean([r["success_rate"] for r in self.results]),
                "avg_response_time": statistics.mean([r["avg_response_time"] for r in self.results]),
                "max_response_time": max([r["max_response_time"] for r in self.results]),
                "total_requests": sum([r["total_requests"] for r in self.results])
            },
            "detailed_results": self.results
        }
        
        report_json = json.dumps(report, indent=2, ensure_ascii=False)
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report_json)
            print(f"Relatório salvo em: {output_file}")
        
        return report_json

async def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Teste de performance do MILAPP")
    parser.add_argument("--url", default="http://localhost:8000", help="URL base da API")
    parser.add_argument("--endpoint", default="/api/v1/monitoring/health", help="Endpoint para testar")
    parser.add_argument("--users", type=int, default=10, help="Número de usuários concorrentes")
    parser.add_argument("--requests", type=int, default=5, help="Requisições por usuário")
    parser.add_argument("--stress", action="store_true", help="Executar teste de estresse")
    parser.add_argument("--max-users", type=int, default=50, help="Máximo de usuários para teste de estresse")
    parser.add_argument("--endurance", action="store_true", help="Executar teste de resistência")
    parser.add_argument("--duration", type=int, default=5, help="Duração do teste de resistência (minutos)")
    parser.add_argument("--rps", type=int, default=10, help="Requisições por segundo para teste de resistência")
    parser.add_argument("--output", help="Arquivo de saída para o relatório")
    
    args = parser.parse_args()
    
    async with PerformanceTester(args.url) as tester:
        if args.stress:
            print("=== TESTE DE ESTRESSE ===")
            await tester.run_stress_test(args.endpoint, args.max_users)
        elif args.endurance:
            print("=== TESTE DE RESISTÊNCIA ===")
            result = await tester.run_endurance_test(args.endpoint, args.duration, args.rps)
            tester.results.append(result)
        else:
            print("=== TESTE DE CARGA ===")
            await tester.run_load_test(args.endpoint, args.users, args.requests)
        
        # Gera relatório
        report = tester.generate_report(args.output)
        print("\n=== RELATÓRIO ===")
        print(report)

if __name__ == "__main__":
    asyncio.run(main()) 
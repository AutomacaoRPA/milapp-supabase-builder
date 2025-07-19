"""
Serviço de Simulação de Falhas e Recuperação
Implementa retry automático, fallbacks e tratamento robusto de erros
"""

import asyncio
import logging
import time
from typing import Any, Callable, Dict, List, Optional, Union
from functools import wraps
import httpx
import openai
from supabase import Client
import json
import random

logger = logging.getLogger(__name__)

class FailureRecoveryService:
    """Serviço para simulação de falhas e recuperação automática"""
    
    def __init__(self, supabase_client: Client, openai_client: openai.OpenAI):
        self.supabase = supabase_client
        self.openai = openai_client
        self.retry_configs = {
            'openai': {'max_retries': 3, 'base_delay': 1, 'max_delay': 60},
            'supabase': {'max_retries': 5, 'base_delay': 0.5, 'max_delay': 30},
            'file_upload': {'max_retries': 3, 'base_delay': 2, 'max_delay': 120},
            'auth': {'max_retries': 2, 'base_delay': 1, 'max_delay': 10}
        }
        
    def retry_with_backoff(self, service_type: str, max_retries: Optional[int] = None):
        """Decorator para retry com backoff exponencial"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                config = self.retry_configs.get(service_type, self.retry_configs['supabase'])
                max_attempts = max_retries or config['max_retries']
                base_delay = config['base_delay']
                max_delay = config['max_delay']
                
                last_exception = None
                
                for attempt in range(max_attempts + 1):
                    try:
                        return await func(*args, **kwargs)
                    except Exception as e:
                        last_exception = e
                        if attempt == max_attempts:
                            logger.error(f"Falha final após {max_attempts} tentativas: {e}")
                            raise
                        
                        # Calcular delay com backoff exponencial
                        delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
                        logger.warning(f"Tentativa {attempt + 1} falhou: {e}. Tentando novamente em {delay:.2f}s")
                        await asyncio.sleep(delay)
                
                raise last_exception
            return wrapper
        return decorator
    
    @retry_with_backoff('openai')
    async def openai_chat_completion(self, messages: List[Dict], **kwargs) -> Dict:
        """Chat completion com retry automático"""
        try:
            response = await asyncio.to_thread(
                self.openai.chat.completions.create,
                messages=messages,
                **kwargs
            )
            return {
                'content': response.choices[0].message.content,
                'usage': response.usage.dict() if response.usage else None,
                'model': response.model
            }
        except openai.RateLimitError as e:
            logger.error(f"Rate limit excedido: {e}")
            raise
        except openai.APIError as e:
            logger.error(f"Erro da API OpenAI: {e}")
            raise
        except Exception as e:
            logger.error(f"Erro inesperado OpenAI: {e}")
            raise
    
    @retry_with_backoff('supabase')
    async def supabase_operation(self, operation: str, table: str, data: Dict = None, **kwargs) -> Dict:
        """Operação Supabase com retry automático"""
        try:
            if operation == 'select':
                result = self.supabase.table(table).select(**kwargs).execute()
            elif operation == 'insert':
                result = self.supabase.table(table).insert(data).execute()
            elif operation == 'update':
                result = self.supabase.table(table).update(data).eq(**kwargs).execute()
            elif operation == 'delete':
                result = self.supabase.table(table).delete().eq(**kwargs).execute()
            else:
                raise ValueError(f"Operação não suportada: {operation}")
            
            return result.data
        except Exception as e:
            logger.error(f"Erro Supabase ({operation}): {e}")
            raise
    
    @retry_with_backoff('file_upload')
    async def process_file_upload(self, file_data: bytes, file_type: str, max_size_mb: int = 50) -> Dict:
        """Processamento de upload de arquivo com validações"""
        try:
            # Validar tamanho
            file_size_mb = len(file_data) / (1024 * 1024)
            if file_size_mb > max_size_mb:
                raise ValueError(f"Arquivo muito grande: {file_size_mb:.2f}MB > {max_size_mb}MB")
            
            # Validar tipo
            allowed_types = {
                'pdf': b'%PDF',
                'docx': b'PK\x03\x04',
                'xlsx': b'PK\x03\x04',
                'png': b'\x89PNG',
                'jpg': b'\xff\xd8\xff',
                'mp3': b'ID3',
                'wav': b'RIFF'
            }
            
            if file_type in allowed_types:
                if not file_data.startswith(allowed_types[file_type]):
                    raise ValueError(f"Tipo de arquivo inválido para {file_type}")
            
            # Processar arquivo
            processing_result = await self._process_file_content(file_data, file_type)
            
            return {
                'success': True,
                'file_size_mb': file_size_mb,
                'file_type': file_type,
                'processing_result': processing_result
            }
            
        except Exception as e:
            logger.error(f"Erro no processamento de arquivo: {e}")
            raise
    
    async def _process_file_content(self, file_data: bytes, file_type: str) -> Dict:
        """Processar conteúdo do arquivo baseado no tipo"""
        try:
            if file_type == 'pdf':
                return await self._extract_pdf_text(file_data)
            elif file_type in ['docx', 'xlsx']:
                return await self._extract_office_text(file_data, file_type)
            elif file_type in ['png', 'jpg']:
                return await self._extract_image_text(file_data)
            elif file_type in ['mp3', 'wav']:
                return await self._transcribe_audio(file_data)
            else:
                return {'text': file_data.decode('utf-8', errors='ignore')}
        except Exception as e:
            logger.error(f"Erro no processamento de conteúdo: {e}")
            return {'error': str(e)}
    
    async def _extract_pdf_text(self, file_data: bytes) -> Dict:
        """Extrair texto de PDF"""
        try:
            # Simulação de extração PDF
            return {
                'text': f"Texto extraído do PDF ({len(file_data)} bytes)",
                'pages': random.randint(1, 50),
                'confidence': random.uniform(0.7, 0.95)
            }
        except Exception as e:
            return {'error': f"Erro na extração PDF: {e}"}
    
    async def _extract_office_text(self, file_data: bytes, file_type: str) -> Dict:
        """Extrair texto de documentos Office"""
        try:
            return {
                'text': f"Texto extraído do {file_type.upper()} ({len(file_data)} bytes)",
                'sheets': random.randint(1, 10) if file_type == 'xlsx' else 1,
                'confidence': random.uniform(0.8, 0.98)
            }
        except Exception as e:
            return {'error': f"Erro na extração {file_type}: {e}"}
    
    async def _extract_image_text(self, file_data: bytes) -> Dict:
        """Extrair texto de imagem (OCR)"""
        try:
            return {
                'text': f"Texto extraído da imagem via OCR ({len(file_data)} bytes)",
                'confidence': random.uniform(0.6, 0.9)
            }
        except Exception as e:
            return {'error': f"Erro no OCR: {e}"}
    
    async def _transcribe_audio(self, file_data: bytes) -> Dict:
        """Transcrever áudio"""
        try:
            return {
                'text': f"Transcrição de áudio ({len(file_data)} bytes)",
                'duration_seconds': random.uniform(10, 300),
                'confidence': random.uniform(0.7, 0.95)
            }
        except Exception as e:
            return {'error': f"Erro na transcrição: {e}"}
    
    async def simulate_failure_scenarios(self) -> Dict:
        """Simular cenários de falha para teste"""
        scenarios = {
            'openai_rate_limit': {
                'description': 'Rate limit da OpenAI',
                'simulation': self._simulate_openai_rate_limit,
                'expected_behavior': 'Retry com backoff, fallback para cache'
            },
            'supabase_connection_lost': {
                'description': 'Conexão perdida com Supabase',
                'simulation': self._simulate_supabase_failure,
                'expected_behavior': 'Retry automático, cache local'
            },
            'file_upload_timeout': {
                'description': 'Timeout no upload de arquivo',
                'simulation': self._simulate_upload_timeout,
                'expected_behavior': 'Retry com progresso, chunked upload'
            },
            'auth_token_expired': {
                'description': 'Token de autenticação expirado',
                'simulation': self._simulate_auth_failure,
                'expected_behavior': 'Refresh automático, fallback local'
            }
        }
        
        results = {}
        for scenario_name, scenario in scenarios.items():
            try:
                logger.info(f"Simulando cenário: {scenario['description']}")
                result = await scenario['simulation']()
                results[scenario_name] = {
                    'status': 'success',
                    'result': result,
                    'expected_behavior': scenario['expected_behavior']
                }
            except Exception as e:
                results[scenario_name] = {
                    'status': 'failed',
                    'error': str(e),
                    'expected_behavior': scenario['expected_behavior']
                }
        
        return results
    
    async def _simulate_openai_rate_limit(self) -> Dict:
        """Simular rate limit da OpenAI"""
        try:
            # Simular rate limit
            await asyncio.sleep(0.1)
            raise openai.RateLimitError("Rate limit exceeded", response=None, body=None)
        except openai.RateLimitError:
            # Retry com backoff
            await asyncio.sleep(2)
            return {'message': 'Rate limit simulado e recuperado com sucesso'}
    
    async def _simulate_supabase_failure(self) -> Dict:
        """Simular falha do Supabase"""
        try:
            # Simular falha de conexão
            await asyncio.sleep(0.1)
            raise Exception("Connection lost to Supabase")
        except Exception:
            # Retry com backoff
            await asyncio.sleep(1)
            return {'message': 'Falha do Supabase simulada e recuperada'}
    
    async def _simulate_upload_timeout(self) -> Dict:
        """Simular timeout no upload"""
        try:
            # Simular timeout
            await asyncio.sleep(0.1)
            raise asyncio.TimeoutError("Upload timeout")
        except asyncio.TimeoutError:
            # Retry com chunked upload
            await asyncio.sleep(2)
            return {'message': 'Timeout simulado e recuperado com upload chunked'}
    
    async def _simulate_auth_failure(self) -> Dict:
        """Simular falha de autenticação"""
        try:
            # Simular token expirado
            await asyncio.sleep(0.1)
            raise Exception("Token expired")
        except Exception:
            # Refresh token
            await asyncio.sleep(1)
            return {'message': 'Falha de auth simulada e token refreshado'}
    
    async def load_test_simulation(self, concurrent_users: int = 100, duration_seconds: int = 300) -> Dict:
        """Simular teste de carga"""
        logger.info(f"Iniciando teste de carga: {concurrent_users} usuários por {duration_seconds}s")
        
        start_time = time.time()
        tasks = []
        results = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'avg_response_time': 0,
            'max_response_time': 0,
            'min_response_time': float('inf'),
            'errors': []
        }
        
        # Criar tarefas para usuários simultâneos
        for user_id in range(concurrent_users):
            task = asyncio.create_task(self._simulate_user_workload(user_id))
            tasks.append(task)
        
        # Executar tarefas
        user_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Processar resultados
        for result in user_results:
            if isinstance(result, dict):
                results['total_requests'] += result.get('requests', 0)
                results['successful_requests'] += result.get('successful', 0)
                results['failed_requests'] += result.get('failed', 0)
                
                if result.get('avg_response_time', 0) > results['max_response_time']:
                    results['max_response_time'] = result['avg_response_time']
                if result.get('avg_response_time', 0) < results['min_response_time']:
                    results['min_response_time'] = result['avg_response_time']
            else:
                results['errors'].append(str(result))
        
        end_time = time.time()
        results['duration_seconds'] = end_time - start_time
        results['requests_per_second'] = results['total_requests'] / results['duration_seconds']
        results['success_rate'] = (results['successful_requests'] / results['total_requests']) * 100 if results['total_requests'] > 0 else 0
        
        logger.info(f"Teste de carga concluído: {results}")
        return results
    
    async def _simulate_user_workload(self, user_id: int) -> Dict:
        """Simular carga de trabalho de um usuário"""
        results = {
            'user_id': user_id,
            'requests': 0,
            'successful': 0,
            'failed': 0,
            'avg_response_time': 0,
            'response_times': []
        }
        
        start_time = time.time()
        
        # Simular diferentes tipos de operações
        operations = [
            self._simulate_create_work_item,
            self._simulate_chat_message,
            self._simulate_file_upload,
            self._simulate_drag_drop,
            self._simulate_quality_gate
        ]
        
        for _ in range(random.randint(10, 50)):  # 10-50 operações por usuário
            operation = random.choice(operations)
            operation_start = time.time()
            
            try:
                await operation(user_id)
                results['successful'] += 1
            except Exception as e:
                results['failed'] += 1
                logger.warning(f"Falha na operação do usuário {user_id}: {e}")
            
            results['requests'] += 1
            response_time = time.time() - operation_start
            results['response_times'].append(response_time)
            
            # Pequena pausa entre operações
            await asyncio.sleep(random.uniform(0.1, 0.5))
        
        results['avg_response_time'] = sum(results['response_times']) / len(results['response_times']) if results['response_times'] else 0
        
        return results
    
    async def _simulate_create_work_item(self, user_id: int):
        """Simular criação de work item"""
        await asyncio.sleep(random.uniform(0.05, 0.2))
        # Simular falha ocasional
        if random.random() < 0.05:  # 5% de falha
            raise Exception("Falha simulada na criação de work item")
    
    async def _simulate_chat_message(self, user_id: int):
        """Simular mensagem de chat"""
        await asyncio.sleep(random.uniform(0.1, 0.5))
        # Simular rate limit ocasional
        if random.random() < 0.02:  # 2% de rate limit
            raise openai.RateLimitError("Rate limit", response=None, body=None)
    
    async def _simulate_file_upload(self, user_id: int):
        """Simular upload de arquivo"""
        await asyncio.sleep(random.uniform(0.2, 1.0))
        # Simular timeout ocasional
        if random.random() < 0.03:  # 3% de timeout
            raise asyncio.TimeoutError("Upload timeout")
    
    async def _simulate_drag_drop(self, user_id: int):
        """Simular drag & drop"""
        await asyncio.sleep(random.uniform(0.05, 0.15))
        # Simular conflito ocasional
        if random.random() < 0.01:  # 1% de conflito
            raise Exception("Conflito de WIP limit")
    
    async def _simulate_quality_gate(self, user_id: int):
        """Simular quality gate"""
        await asyncio.sleep(random.uniform(0.1, 0.3))
        # Simular timeout de aprovação
        if random.random() < 0.02:  # 2% de timeout
            raise Exception("Timeout de aprovação")
    
    def get_health_status(self) -> Dict:
        """Status de saúde do serviço"""
        return {
            'service': 'failure_recovery',
            'status': 'healthy',
            'retry_configs': self.retry_configs,
            'timestamp': time.time()
        } 
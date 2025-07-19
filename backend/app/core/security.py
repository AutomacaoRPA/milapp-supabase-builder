"""
Módulo de Segurança e Validação
Implementa validações rigorosas, sanitização e proteção contra ataques
"""

import re
import hashlib
import secrets
import string
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel, validator, Field
import html
import urllib.parse
from email_validator import validate_email, EmailNotValidError
import logging
import json

logger = logging.getLogger(__name__)

class SecurityConfig:
    """Configurações de segurança"""
    
    # JWT Settings
    JWT_SECRET_KEY = "your-secret-key-change-in-production"
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    # Password Settings
    MIN_PASSWORD_LENGTH = 12
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGITS = True
    REQUIRE_SPECIAL_CHARS = True
    PASSWORD_HISTORY_SIZE = 5
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = 100
    RATE_LIMIT_WINDOW_SECONDS = 60
    
    # File Upload Security
    MAX_FILE_SIZE_MB = 50
    ALLOWED_FILE_TYPES = {
        'pdf': ['application/pdf'],
        'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'png': ['image/png'],
        'jpg': ['image/jpeg', 'image/jpg'],
        'mp3': ['audio/mpeg'],
        'wav': ['audio/wav']
    }
    
    # Input Validation
    MAX_TITLE_LENGTH = 255
    MAX_DESCRIPTION_LENGTH = 1000
    MAX_COMMENT_LENGTH = 500
    
    # SQL Injection Patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
        r"(\b(UNION|OR|AND)\b\s+\d+\s*=\s*\d+)",
        r"(\b(OR|AND)\b\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)",
        r"(--|\b(COMMENT|REMARK)\b)",
        r"(\b(WAITFOR|DELAY)\b)",
        r"(\b(SLEEP|BENCHMARK)\b)",
        r"(\b(LOAD_FILE|INTO\s+OUTFILE)\b)",
        r"(\b(INFORMATION_SCHEMA|SYS\.)\b)",
        r"(\b(CHAR|CONCAT|SUBSTRING)\b\s*\()",
        r"(\b(ASCII|ORD|HEX|UNHEX)\b\s*\()",
    ]
    
    # XSS Patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"vbscript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>",
        r"<object[^>]*>",
        r"<embed[^>]*>",
        r"<form[^>]*>",
        r"<input[^>]*>",
        r"<textarea[^>]*>",
        r"<select[^>]*>",
        r"<button[^>]*>",
        r"<link[^>]*>",
        r"<meta[^>]*>",
        r"<style[^>]*>",
        r"<base[^>]*>",
        r"<bgsound[^>]*>",
        r"<link[^>]*>",
        r"<xml[^>]*>",
        r"<xmp[^>]*>",
        r"<plaintext[^>]*>",
        r"<listing[^>]*>",
    ]

class InputValidator:
    """Validador de inputs com sanitização"""
    
    @staticmethod
    def sanitize_text(text: str, max_length: Optional[int] = None) -> str:
        """Sanitizar texto removendo caracteres perigosos"""
        if not text:
            return ""
        
        # Converter para string se necessário
        text = str(text)
        
        # Remover caracteres de controle
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
        
        # Escapar HTML
        text = html.escape(text)
        
        # Remover padrões XSS
        for pattern in SecurityConfig.XSS_PATTERNS:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Remover padrões SQL Injection
        for pattern in SecurityConfig.SQL_INJECTION_PATTERNS:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Limitar tamanho
        if max_length and len(text) > max_length:
            text = text[:max_length]
        
        return text.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validar formato de email"""
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    @staticmethod
    def validate_password(password: str) -> Dict[str, Any]:
        """Validar força da senha"""
        errors = []
        warnings = []
        
        if len(password) < SecurityConfig.MIN_PASSWORD_LENGTH:
            errors.append(f"Senha deve ter pelo menos {SecurityConfig.MIN_PASSWORD_LENGTH} caracteres")
        
        if SecurityConfig.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            errors.append("Senha deve conter pelo menos uma letra maiúscula")
        
        if SecurityConfig.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            errors.append("Senha deve conter pelo menos uma letra minúscula")
        
        if SecurityConfig.REQUIRE_DIGITS and not re.search(r'\d', password):
            errors.append("Senha deve conter pelo menos um número")
        
        if SecurityConfig.REQUIRE_SPECIAL_CHARS and not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            errors.append("Senha deve conter pelo menos um caractere especial")
        
        # Verificar senhas comuns
        common_passwords = [
            'password', '123456', 'qwerty', 'admin', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'football'
        ]
        if password.lower() in common_passwords:
            warnings.append("Senha muito comum, considere usar uma mais forte")
        
        # Verificar sequências
        if re.search(r'(.)\1{2,}', password):
            warnings.append("Evite caracteres repetidos")
        
        # Verificar sequências numéricas
        if re.search(r'(012|123|234|345|456|567|678|789)', password):
            warnings.append("Evite sequências numéricas")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'strength': InputValidator._calculate_password_strength(password)
        }
    
    @staticmethod
    def _calculate_password_strength(password: str) -> str:
        """Calcular força da senha"""
        score = 0
        
        # Comprimento
        if len(password) >= 12:
            score += 2
        elif len(password) >= 8:
            score += 1
        
        # Complexidade
        if re.search(r'[A-Z]', password):
            score += 1
        if re.search(r'[a-z]', password):
            score += 1
        if re.search(r'\d', password):
            score += 1
        if re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            score += 1
        
        # Variedade de caracteres
        unique_chars = len(set(password))
        if unique_chars >= 8:
            score += 1
        
        if score >= 6:
            return "forte"
        elif score >= 4:
            return "média"
        else:
            return "fraca"
    
    @staticmethod
    def validate_file_upload(filename: str, content_type: str, file_size: int) -> Dict[str, Any]:
        """Validar upload de arquivo"""
        errors = []
        
        # Validar tamanho
        max_size_bytes = SecurityConfig.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            errors.append(f"Arquivo muito grande. Máximo: {SecurityConfig.MAX_FILE_SIZE_MB}MB")
        
        # Validar extensão
        file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
        if file_extension not in SecurityConfig.ALLOWED_FILE_TYPES:
            errors.append(f"Tipo de arquivo não permitido: {file_extension}")
        
        # Validar content-type
        allowed_types = SecurityConfig.ALLOWED_FILE_TYPES.get(file_extension, [])
        if content_type not in allowed_types:
            errors.append(f"Content-type não corresponde ao tipo de arquivo: {content_type}")
        
        # Validar nome do arquivo
        if len(filename) > 255:
            errors.append("Nome do arquivo muito longo")
        
        # Verificar caracteres perigosos no nome
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
        if any(char in filename for char in dangerous_chars):
            errors.append("Nome do arquivo contém caracteres perigosos")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'file_extension': file_extension,
            'file_size_mb': file_size / (1024 * 1024)
        }

class JWTManager:
    """Gerenciador de tokens JWT"""
    
    @staticmethod
    def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """Criar token de acesso"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=SecurityConfig.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SecurityConfig.JWT_SECRET_KEY, algorithm=SecurityConfig.JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict) -> str:
        """Criar token de refresh"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=SecurityConfig.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SecurityConfig.JWT_SECRET_KEY, algorithm=SecurityConfig.JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Dict:
        """Verificar token"""
        try:
            payload = jwt.decode(token, SecurityConfig.JWT_SECRET_KEY, algorithms=[SecurityConfig.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expirado")
        except jwt.JWTError:
            raise ValueError("Token inválido")

class RateLimiter:
    """Limitador de taxa de requisições"""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """Verificar se requisição é permitida"""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=SecurityConfig.RATE_LIMIT_WINDOW_SECONDS)
        
        # Limpar requisições antigas
        if identifier in self.requests:
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if req_time > window_start
            ]
        else:
            self.requests[identifier] = []
        
        # Verificar limite
        if len(self.requests[identifier]) >= SecurityConfig.RATE_LIMIT_REQUESTS:
            return False
        
        # Adicionar requisição atual
        self.requests[identifier].append(now)
        return True
    
    def get_remaining_requests(self, identifier: str) -> int:
        """Obter número de requisições restantes"""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=SecurityConfig.RATE_LIMIT_WINDOW_SECONDS)
        
        if identifier in self.requests:
            recent_requests = [
                req_time for req_time in self.requests[identifier]
                if req_time > window_start
            ]
            return max(0, SecurityConfig.RATE_LIMIT_REQUESTS - len(recent_requests))
        
        return SecurityConfig.RATE_LIMIT_REQUESTS

class SecurityMiddleware:
    """Middleware de segurança"""
    
    def __init__(self):
        self.rate_limiter = RateLimiter()
    
    async def validate_request(self, request_data: Dict, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Validar requisição completa"""
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'sanitized_data': {}
        }
        
        # Rate limiting
        identifier = user_id or request_data.get('ip_address', 'unknown')
        if not self.rate_limiter.is_allowed(identifier):
            validation_result['valid'] = False
            validation_result['errors'].append("Limite de requisições excedido")
            return validation_result
        
        # Sanitizar dados
        for key, value in request_data.items():
            if isinstance(value, str):
                sanitized_value = InputValidator.sanitize_text(value)
                validation_result['sanitized_data'][key] = sanitized_value
                
                # Verificar se houve alteração na sanitização
                if sanitized_value != value:
                    validation_result['warnings'].append(f"Campo '{key}' foi sanitizado")
            else:
                validation_result['sanitized_data'][key] = value
        
        return validation_result
    
    def validate_work_item(self, work_item_data: Dict) -> Dict[str, Any]:
        """Validar dados de work item"""
        validation_result = {
            'valid': True,
            'errors': [],
            'sanitized_data': {}
        }
        
        # Validar título
        title = work_item_data.get('title', '')
        if not title or len(title.strip()) == 0:
            validation_result['valid'] = False
            validation_result['errors'].append("Título é obrigatório")
        elif len(title) > SecurityConfig.MAX_TITLE_LENGTH:
            validation_result['valid'] = False
            validation_result['errors'].append(f"Título não pode ter mais de {SecurityConfig.MAX_TITLE_LENGTH} caracteres")
        else:
            validation_result['sanitized_data']['title'] = InputValidator.sanitize_text(title, SecurityConfig.MAX_TITLE_LENGTH)
        
        # Validar descrição
        description = work_item_data.get('description', '')
        if description and len(description) > SecurityConfig.MAX_DESCRIPTION_LENGTH:
            validation_result['valid'] = False
            validation_result['errors'].append(f"Descrição não pode ter mais de {SecurityConfig.MAX_DESCRIPTION_LENGTH} caracteres")
        else:
            validation_result['sanitized_data']['description'] = InputValidator.sanitize_text(description, SecurityConfig.MAX_DESCRIPTION_LENGTH)
        
        # Validar tipo
        valid_types = ['user_story', 'bug', 'task', 'epic', 'spike']
        work_item_type = work_item_data.get('type', '')
        if work_item_type not in valid_types:
            validation_result['valid'] = False
            validation_result['errors'].append(f"Tipo inválido. Válidos: {', '.join(valid_types)}")
        else:
            validation_result['sanitized_data']['type'] = work_item_type
        
        # Validar prioridade
        valid_priorities = ['critical', 'high', 'medium', 'low']
        priority = work_item_data.get('priority', '')
        if priority not in valid_priorities:
            validation_result['valid'] = False
            validation_result['errors'].append(f"Prioridade inválida. Válidas: {', '.join(valid_priorities)}")
        else:
            validation_result['sanitized_data']['priority'] = priority
        
        # Validar story points
        story_points = work_item_data.get('story_points')
        if story_points is not None:
            try:
                story_points = int(story_points)
                if story_points < 0 or story_points > 100:
                    validation_result['valid'] = False
                    validation_result['errors'].append("Story points devem estar entre 0 e 100")
                else:
                    validation_result['sanitized_data']['story_points'] = story_points
            except (ValueError, TypeError):
                validation_result['valid'] = False
                validation_result['errors'].append("Story points deve ser um número inteiro")
        
        return validation_result

class SecurityHeaders:
    """Headers de segurança para respostas HTTP"""
    
    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """Obter headers de segurança"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }

# Instância global do middleware de segurança
security_middleware = SecurityMiddleware()

# Função de utilidade para logging de segurança
def log_security_event(event_type: str, details: Dict, user_id: Optional[str] = None):
    """Log de eventos de segurança"""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'user_id': user_id,
        'details': details,
        'ip_address': details.get('ip_address'),
        'user_agent': details.get('user_agent')
    }
    
    logger.warning(f"SECURITY_EVENT: {json.dumps(log_entry)}")
    
    # Em produção, enviar para sistema de monitoramento
    # send_to_security_monitoring(log_entry) 
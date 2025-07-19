"""
Validadores robustos para inputs do MILAPP
"""

import re
import uuid
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
from pydantic import BaseModel, validator, ValidationError, Field
from pydantic.types import EmailStr
import structlog

logger = structlog.get_logger()

# Regex patterns
EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
PASSWORD_PATTERN = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
PHONE_PATTERN = r'^\+?1?\d{9,15}$'
URL_PATTERN = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
ALPHANUMERIC_PATTERN = r'^[a-zA-Z0-9\s\-_\.]+$'

# Constantes de validação
MAX_STRING_LENGTH = 255
MAX_DESCRIPTION_LENGTH = 1000
MAX_NAME_LENGTH = 100
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv'
]

# Roles válidos
VALID_ROLES = ['user', 'admin', 'manager', 'viewer', 'developer']
VALID_PROJECT_STATUSES = ['active', 'inactive', 'completed', 'cancelled', 'on_hold']
VALID_PRIORITIES = ['low', 'medium', 'high', 'critical']
VALID_DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Legal']


class BaseValidator(BaseModel):
    """Classe base para validadores"""
    
    class Config:
        extra = "forbid"  # Rejeitar campos extras
        validate_assignment = True  # Validar atribuições
        use_enum_values = True


class EmailValidator(BaseValidator):
    """Validador para emails"""
    
    email: EmailStr = Field(..., description="Email válido")
    
    @validator('email')
    def validate_email_format(cls, v):
        if not re.match(EMAIL_PATTERN, v):
            raise ValueError('Formato de email inválido')
        
        # Verificar domínio
        domain = v.split('@')[1]
        if len(domain) > 253:
            raise ValueError('Domínio muito longo')
        
        # Verificar caracteres especiais
        if re.search(r'[<>()[\]\\,;:\s"]', v):
            raise ValueError('Email contém caracteres inválidos')
        
        return v.lower()


class PasswordValidator(BaseValidator):
    """Validador para senhas"""
    
    password: str = Field(..., min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)
    
    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(f'Senha deve ter pelo menos {MIN_PASSWORD_LENGTH} caracteres')
        
        if len(v) > MAX_PASSWORD_LENGTH:
            raise ValueError(f'Senha deve ter no máximo {MAX_PASSWORD_LENGTH} caracteres')
        
        # Verificar complexidade
        if not re.search(r'[a-z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra minúscula')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra maiúscula')
        
        if not re.search(r'\d', v):
            raise ValueError('Senha deve conter pelo menos um número')
        
        if not re.search(r'[@$!%*?&]', v):
            raise ValueError('Senha deve conter pelo menos um caractere especial (@$!%*?&)')
        
        # Verificar sequências comuns
        common_sequences = ['123', 'abc', 'qwe', 'asd', 'password', 'admin']
        for seq in common_sequences:
            if seq.lower() in v.lower():
                raise ValueError('Senha contém sequência muito comum')
        
        return v


class NameValidator(BaseValidator):
    """Validador para nomes"""
    
    name: str = Field(..., min_length=1, max_length=MAX_NAME_LENGTH)
    
    @validator('name')
    def validate_name_format(cls, v):
        # Remover espaços extras
        v = ' '.join(v.split())
        
        if not v:
            raise ValueError('Nome não pode estar vazio')
        
        # Verificar caracteres válidos
        if not re.match(ALPHANUMERIC_PATTERN, v):
            raise ValueError('Nome contém caracteres inválidos')
        
        # Verificar se não é apenas números
        if v.isdigit():
            raise ValueError('Nome não pode conter apenas números')
        
        # Capitalizar primeira letra
        return v.title()


class PhoneValidator(BaseValidator):
    """Validador para telefones"""
    
    phone: str = Field(..., description="Número de telefone válido")
    
    @validator('phone')
    def validate_phone_format(cls, v):
        # Remover espaços e caracteres especiais
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        
        if not re.match(PHONE_PATTERN, cleaned):
            raise ValueError('Formato de telefone inválido')
        
        return cleaned


class URLValidator(BaseValidator):
    """Validador para URLs"""
    
    url: str = Field(..., description="URL válida")
    
    @validator('url')
    def validate_url_format(cls, v):
        if not re.match(URL_PATTERN, v):
            raise ValueError('Formato de URL inválido')
        
        # Verificar protocolo
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL deve começar com http:// ou https://')
        
        return v


class UUIDValidator(BaseValidator):
    """Validador para UUIDs"""
    
    uuid: str = Field(..., description="UUID válido")
    
    @validator('uuid')
    def validate_uuid_format(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('UUID inválido')


class DateRangeValidator(BaseValidator):
    """Validador para intervalos de data"""
    
    start_date: datetime
    end_date: datetime
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('Data final deve ser posterior à data inicial')
        
        # Verificar se não está muito no futuro
        max_future_date = datetime.utcnow() + timedelta(days=365*10)  # 10 anos
        if v > max_future_date:
            raise ValueError('Data não pode estar muito no futuro')
        
        return v


class FileValidator(BaseValidator):
    """Validador para uploads de arquivo"""
    
    filename: str = Field(..., description="Nome do arquivo")
    content_type: str = Field(..., description="Tipo de conteúdo")
    size: int = Field(..., description="Tamanho do arquivo em bytes")
    
    @validator('filename')
    def validate_filename(cls, v):
        # Verificar extensão
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.csv']
        if not any(v.lower().endswith(ext) for ext in allowed_extensions):
            raise ValueError('Tipo de arquivo não permitido')
        
        # Verificar caracteres perigosos
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
        if any(char in v for char in dangerous_chars):
            raise ValueError('Nome do arquivo contém caracteres inválidos')
        
        return v
    
    @validator('content_type')
    def validate_content_type(cls, v):
        if v not in ALLOWED_FILE_TYPES:
            raise ValueError('Tipo de conteúdo não permitido')
        return v
    
    @validator('size')
    def validate_file_size(cls, v):
        if v > MAX_FILE_SIZE:
            raise ValueError(f'Arquivo muito grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB')
        return v


class UserCreateValidator(BaseValidator):
    """Validador para criação de usuário"""
    
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=MAX_NAME_LENGTH)
    password: str = Field(..., min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)
    role: str = Field(default='user')
    department: Optional[str] = None
    phone: Optional[str] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v not in VALID_ROLES:
            raise ValueError(f'Role inválido. Válidos: {", ".join(VALID_ROLES)}')
        return v
    
    @validator('department')
    def validate_department(cls, v):
        if v and v not in VALID_DEPARTMENTS:
            raise ValueError(f'Departamento inválido. Válidos: {", ".join(VALID_DEPARTMENTS)}')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return PhoneValidator(phone=v).phone
        return v


class UserUpdateValidator(BaseValidator):
    """Validador para atualização de usuário"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=MAX_NAME_LENGTH)
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v and v not in VALID_ROLES:
            raise ValueError(f'Role inválido. Válidos: {", ".join(VALID_ROLES)}')
        return v
    
    @validator('department')
    def validate_department(cls, v):
        if v and v not in VALID_DEPARTMENTS:
            raise ValueError(f'Departamento inválido. Válidos: {", ".join(VALID_DEPARTMENTS)}')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return PhoneValidator(phone=v).phone
        return v


class ProjectCreateValidator(BaseValidator):
    """Validador para criação de projeto"""
    
    name: str = Field(..., min_length=1, max_length=MAX_NAME_LENGTH)
    description: Optional[str] = Field(None, max_length=MAX_DESCRIPTION_LENGTH)
    status: str = Field(default='active')
    priority: str = Field(default='medium')
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    stakeholder_ids: Optional[List[str]] = []
    
    @validator('name')
    def validate_name(cls, v):
        return NameValidator(name=v).name
    
    @validator('status')
    def validate_status(cls, v):
        if v not in VALID_PROJECT_STATUSES:
            raise ValueError(f'Status inválido. Válidos: {", ".join(VALID_PROJECT_STATUSES)}')
        return v
    
    @validator('priority')
    def validate_priority(cls, v):
        if v not in VALID_PRIORITIES:
            raise ValueError(f'Prioridade inválida. Válidos: {", ".join(VALID_PRIORITIES)}')
        return v
    
    @validator('budget')
    def validate_budget(cls, v):
        if v is not None and v < 0:
            raise ValueError('Orçamento não pode ser negativo')
        return v
    
    @validator('stakeholder_ids')
    def validate_stakeholder_ids(cls, v):
        if v:
            for stakeholder_id in v:
                try:
                    UUIDValidator(uuid=stakeholder_id)
                except ValueError:
                    raise ValueError(f'Stakeholder ID inválido: {stakeholder_id}')
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values and values['start_date']:
            if v <= values['start_date']:
                raise ValueError('Data final deve ser posterior à data inicial')
        return v


class ProjectUpdateValidator(BaseValidator):
    """Validador para atualização de projeto"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=MAX_NAME_LENGTH)
    description: Optional[str] = Field(None, max_length=MAX_DESCRIPTION_LENGTH)
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    stakeholder_ids: Optional[List[str]] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v:
            return NameValidator(name=v).name
        return v
    
    @validator('status')
    def validate_status(cls, v):
        if v and v not in VALID_PROJECT_STATUSES:
            raise ValueError(f'Status inválido. Válidos: {", ".join(VALID_PROJECT_STATUSES)}')
        return v
    
    @validator('priority')
    def validate_priority(cls, v):
        if v and v not in VALID_PRIORITIES:
            raise ValueError(f'Prioridade inválida. Válidos: {", ".join(VALID_PRIORITIES)}')
        return v
    
    @validator('budget')
    def validate_budget(cls, v):
        if v is not None and v < 0:
            raise ValueError('Orçamento não pode ser negativo')
        return v
    
    @validator('stakeholder_ids')
    def validate_stakeholder_ids(cls, v):
        if v:
            for stakeholder_id in v:
                try:
                    UUIDValidator(uuid=stakeholder_id)
                except ValueError:
                    raise ValueError(f'Stakeholder ID inválido: {stakeholder_id}')
        return v


class SearchValidator(BaseValidator):
    """Validador para buscas"""
    
    query: str = Field(..., min_length=1, max_length=100)
    filters: Optional[Dict[str, Any]] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: Optional[str] = Field(None, regex='^(asc|desc)$')
    
    @validator('query')
    def validate_query(cls, v):
        # Remover caracteres perigosos
        dangerous_chars = ['<', '>', '"', "'", '&', '|', ';']
        for char in dangerous_chars:
            v = v.replace(char, '')
        
        return v.strip()
    
    @validator('sort_by')
    def validate_sort_by(cls, v):
        valid_sort_fields = ['name', 'created_at', 'updated_at', 'status', 'priority']
        if v and v not in valid_sort_fields:
            raise ValueError(f'Campo de ordenação inválido. Válidos: {", ".join(valid_sort_fields)}')
        return v


class PaginationValidator(BaseValidator):
    """Validador para paginação"""
    
    page: int = Field(default=1, ge=1, description="Número da página")
    limit: int = Field(default=10, ge=1, le=100, description="Itens por página")
    
    @validator('limit')
    def validate_limit(cls, v):
        if v > 100:
            raise ValueError('Máximo de 100 itens por página')
        return v


# Funções utilitárias de validação
def validate_email(email: str) -> bool:
    """Validar email"""
    try:
        EmailValidator(email=email)
        return True
    except ValidationError:
        return False


def validate_password(password: str) -> bool:
    """Validar senha"""
    try:
        PasswordValidator(password=password)
        return True
    except ValidationError:
        return False


def validate_uuid(uuid_str: str) -> bool:
    """Validar UUID"""
    try:
        UUIDValidator(uuid=uuid_str)
        return True
    except ValidationError:
        return False


def sanitize_input(input_str: str) -> str:
    """Sanitizar input de string"""
    if not input_str:
        return ""
    
    # Remover caracteres perigosos
    dangerous_chars = ['<', '>', '"', "'", '&', '|', ';', '(', ')']
    for char in dangerous_chars:
        input_str = input_str.replace(char, '')
    
    # Remover espaços extras
    input_str = ' '.join(input_str.split())
    
    return input_str.strip()


def validate_file_upload(filename: str, content_type: str, size: int) -> Dict[str, Any]:
    """Validar upload de arquivo"""
    try:
        validator = FileValidator(
            filename=filename,
            content_type=content_type,
            size=size
        )
        return {"valid": True, "data": validator.dict()}
    except ValidationError as e:
        return {"valid": False, "errors": e.errors()}


def validate_user_data(data: Dict[str, Any], is_update: bool = False) -> Dict[str, Any]:
    """Validar dados de usuário"""
    try:
        if is_update:
            validator = UserUpdateValidator(**data)
        else:
            validator = UserCreateValidator(**data)
        return {"valid": True, "data": validator.dict()}
    except ValidationError as e:
        return {"valid": False, "errors": e.errors()}


def validate_project_data(data: Dict[str, Any], is_update: bool = False) -> Dict[str, Any]:
    """Validar dados de projeto"""
    try:
        if is_update:
            validator = ProjectUpdateValidator(**data)
        else:
            validator = ProjectCreateValidator(**data)
        return {"valid": True, "data": validator.dict()}
    except ValidationError as e:
        return {"valid": False, "errors": e.errors()}


# Middleware de validação
class ValidationMiddleware:
    """Middleware para validação automática"""
    
    @staticmethod
    def validate_request_data(data: Dict[str, Any], validator_class: type) -> Dict[str, Any]:
        """Validar dados da requisição"""
        try:
            validator = validator_class(**data)
            return {"valid": True, "data": validator.dict()}
        except ValidationError as e:
            logger.warning(f"Validation failed: {e.errors()}")
            return {"valid": False, "errors": e.errors()}
    
    @staticmethod
    def sanitize_request_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitizar dados da requisição"""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = sanitize_input(value)
            elif isinstance(value, dict):
                sanitized[key] = ValidationMiddleware.sanitize_request_data(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    sanitize_input(item) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        return sanitized 
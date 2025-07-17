from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum

router = APIRouter()

class ProjectStatus(str, Enum):
    ideacao = "ideacao"
    qualidade_processos = "qualidade_processos"
    planejamento = "planejamento"
    hipotese_formulada = "hipotese_formulada"
    analise_viabilidade = "analise_viabilidade"
    prototipo_rapido = "prototipo_rapido"
    validacao_prototipo = "validacao_prototipo"
    mvp = "mvp"
    teste_operacional = "teste_operacional"
    escala_entrega = "escala_entrega"
    acompanhamento_pos_entrega = "acompanhamento_pos_entrega"
    sustentacao_evolucao = "sustentacao_evolucao"
    concluido = "concluido"

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    methodology: Optional[str] = "scrum"
    priority: Optional[int] = 3
    estimated_roi: Optional[float] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    assigned_architect: Optional[str] = None
    product_owner: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    methodology: Optional[str] = None
    priority: Optional[int] = None
    estimated_roi: Optional[float] = None
    actual_roi: Optional[float] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    completed_date: Optional[date] = None
    assigned_architect: Optional[str] = None
    product_owner: Optional[str] = None
    complexity_score: Optional[int] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: ProjectStatus
    methodology: Optional[str]
    priority: Optional[int]
    estimated_roi: Optional[float]
    actual_roi: Optional[float]
    start_date: Optional[date]
    target_date: Optional[date]
    completed_date: Optional[date]
    created_by: str
    assigned_architect: Optional[str]
    product_owner: Optional[str]
    complexity_score: Optional[int]
    created_at: str
    updated_at: str

@router.get("/", response_model=List[ProjectResponse])
async def get_projects():
    """Listar todos os projetos"""
    # Esta rota retorna os dados do Supabase via frontend
    # O backend serve como documentação da API
    return []

@router.post("/", response_model=dict)
async def create_project(project: ProjectCreate):
    """Criar novo projeto"""
    # Validação básica
    if not project.name or len(project.name.strip()) < 3:
        raise HTTPException(status_code=400, detail="Nome do projeto deve ter pelo menos 3 caracteres")
    
    if project.priority and (project.priority < 1 or project.priority > 5):
        raise HTTPException(status_code=400, detail="Prioridade deve estar entre 1 e 5")
    
    return {"message": "Projeto será criado via Supabase", "data": project.dict()}

@router.put("/{project_id}", response_model=dict)
async def update_project(project_id: str, project: ProjectUpdate):
    """Atualizar projeto existente"""
    if not project_id:
        raise HTTPException(status_code=400, detail="ID do projeto é obrigatório")
    
    return {"message": f"Projeto {project_id} será atualizado via Supabase", "data": project.dict()}

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Obter projeto específico"""
    if not project_id:
        raise HTTPException(status_code=400, detail="ID do projeto é obrigatório")
    
    # Retorna via Supabase no frontend
    raise HTTPException(status_code=404, detail="Projeto não encontrado")
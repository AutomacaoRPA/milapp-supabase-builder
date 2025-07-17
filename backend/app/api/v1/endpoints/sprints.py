"""
Endpoints de Gestão de Sprints
"""

from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.sprint import Sprint
from app.services.sprint_service import SprintService

router = APIRouter(prefix="/projects/{project_id}/sprints", tags=["Sprints"])

class SprintBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    goal: Optional[str] = None
    start_date: date
    end_date: date
    capacity: int = Field(..., ge=1, le=1000)
    status: str = Field(default="planning", regex="^(planning|active|completed|cancelled)$")

class SprintCreate(SprintBase):
    pass

class SprintUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    capacity: Optional[int] = Field(None, ge=1, le=1000)
    status: Optional[str] = Field(None, regex="^(planning|active|completed|cancelled)$")
    velocity: Optional[float] = None
    retrospective_notes: Optional[str] = None
    satisfaction_score: Optional[float] = Field(None, ge=0, le=10)

class SprintResponse(SprintBase):
    id: str
    project_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    velocity: Optional[float] = None
    retrospective_notes: Optional[str] = None
    satisfaction_score: Optional[float] = None
    task_count: int = 0
    completed_task_count: int = 0
    total_story_points: int = 0
    completed_story_points: int = 0
    completion_percentage: float = 0.0

class SprintListResponse(BaseModel):
    sprints: List[SprintResponse]
    total: int
    page: int
    size: int
    pages: int

@router.post("/", response_model=SprintResponse)
async def create_sprint(
    project_id: str,
    sprint_data: SprintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Criar novo sprint"""
    try:
        sprint = await SprintService.create_sprint(
            db=db,
            project_id=project_id,
            sprint_data=sprint_data,
            created_by=current_user.id
        )
        
        return SprintResponse(
            id=str(sprint.id),
            name=sprint.name,
            goal=sprint.goal,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            capacity=sprint.capacity,
            status=sprint.status,
            project_id=str(sprint.project_id),
            created_by=str(sprint.created_by),
            created_at=sprint.created_at,
            updated_at=sprint.updated_at,
            velocity=sprint.velocity,
            retrospective_notes=sprint.retrospective_notes,
            satisfaction_score=sprint.satisfaction_score
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar sprint: {str(e)}"
        )

@router.get("/", response_model=SprintListResponse)
async def get_sprints(
    project_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar sprints do projeto com filtros e paginação"""
    try:
        sprints, total = await SprintService.get_sprints(
            db=db,
            project_id=project_id,
            user_id=current_user.id,
            page=page,
            size=size,
            status=status,
            search=search
        )
        
        sprint_responses = []
        for sprint in sprints:
            sprint_responses.append(SprintResponse(
                id=str(sprint.id),
                name=sprint.name,
                goal=sprint.goal,
                start_date=sprint.start_date,
                end_date=sprint.end_date,
                capacity=sprint.capacity,
                status=sprint.status,
                project_id=str(sprint.project_id),
                created_by=str(sprint.created_by),
                created_at=sprint.created_at,
                updated_at=sprint.updated_at,
                velocity=sprint.velocity,
                retrospective_notes=sprint.retrospective_notes,
                satisfaction_score=sprint.satisfaction_score
            ))
        
        pages = (total + size - 1) // size
        
        return SprintListResponse(
            sprints=sprint_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar sprints: {str(e)}"
        )

@router.get("/{sprint_id}", response_model=SprintResponse)
async def get_sprint(
    project_id: str,
    sprint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obter detalhes de um sprint específico"""
    try:
        sprint = await SprintService.get_sprint(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            user_id=current_user.id
        )
        
        if not sprint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint não encontrado"
            )
        
        return SprintResponse(
            id=str(sprint.id),
            name=sprint.name,
            goal=sprint.goal,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            capacity=sprint.capacity,
            status=sprint.status,
            project_id=str(sprint.project_id),
            created_by=str(sprint.created_by),
            created_at=sprint.created_at,
            updated_at=sprint.updated_at,
            velocity=sprint.velocity,
            retrospective_notes=sprint.retrospective_notes,
            satisfaction_score=sprint.satisfaction_score
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter sprint: {str(e)}"
        )

@router.put("/{sprint_id}", response_model=SprintResponse)
async def update_sprint(
    project_id: str,
    sprint_id: str,
    sprint_data: SprintUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Atualizar sprint"""
    try:
        sprint = await SprintService.update_sprint(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            sprint_data=sprint_data,
            user_id=current_user.id
        )
        
        if not sprint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint não encontrado"
            )
        
        return SprintResponse(
            id=str(sprint.id),
            name=sprint.name,
            goal=sprint.goal,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            capacity=sprint.capacity,
            status=sprint.status,
            project_id=str(sprint.project_id),
            created_by=str(sprint.created_by),
            created_at=sprint.created_at,
            updated_at=sprint.updated_at,
            velocity=sprint.velocity,
            retrospective_notes=sprint.retrospective_notes,
            satisfaction_score=sprint.satisfaction_score
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar sprint: {str(e)}"
        )

@router.delete("/{sprint_id}")
async def delete_sprint(
    project_id: str,
    sprint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Excluir sprint"""
    try:
        success = await SprintService.delete_sprint(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint não encontrado"
            )
        
        return {"message": "Sprint excluído com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir sprint: {str(e)}"
        )

@router.post("/{sprint_id}/start")
async def start_sprint(
    project_id: str,
    sprint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Iniciar sprint"""
    try:
        sprint = await SprintService.start_sprint(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            user_id=current_user.id
        )
        
        if not sprint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint não encontrado"
            )
        
        return {"message": "Sprint iniciado com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao iniciar sprint: {str(e)}"
        )

@router.post("/{sprint_id}/complete")
async def complete_sprint(
    project_id: str,
    sprint_id: str,
    retrospective_notes: Optional[str] = None,
    satisfaction_score: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Finalizar sprint"""
    try:
        sprint = await SprintService.complete_sprint(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            retrospective_notes=retrospective_notes,
            satisfaction_score=satisfaction_score,
            user_id=current_user.id
        )
        
        if not sprint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint não encontrado"
            )
        
        return {"message": "Sprint finalizado com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao finalizar sprint: {str(e)}"
        )

@router.get("/{sprint_id}/metrics")
async def get_sprint_metrics(
    project_id: str,
    sprint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obter métricas de um sprint"""
    try:
        metrics = await SprintService.get_sprint_metrics(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            user_id=current_user.id
        )
        
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint não encontrado"
            )
        
        return metrics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter métricas: {str(e)}"
        )

@router.get("/{sprint_id}/tasks")
async def get_sprint_tasks(
    project_id: str,
    sprint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obter tasks de um sprint"""
    try:
        tasks = await SprintService.get_sprint_tasks(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            user_id=current_user.id
        )
        
        return {"tasks": tasks}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter tasks do sprint: {str(e)}"
        )

@router.post("/{sprint_id}/add-task")
async def add_task_to_sprint(
    project_id: str,
    sprint_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Adicionar task ao sprint"""
    try:
        success = await SprintService.add_task_to_sprint(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint ou task não encontrado"
            )
        
        return {"message": "Task adicionada ao sprint com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao adicionar task ao sprint: {str(e)}"
        )

@router.post("/{sprint_id}/remove-task")
async def remove_task_from_sprint(
    project_id: str,
    sprint_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remover task do sprint"""
    try:
        success = await SprintService.remove_task_from_sprint(
            db=db,
            project_id=project_id,
            sprint_id=sprint_id,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprint ou task não encontrado"
            )
        
        return {"message": "Task removida do sprint com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover task do sprint: {str(e)}"
        )

@router.get("/current/active")
async def get_active_sprint(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obter sprint ativo do projeto"""
    try:
        sprint = await SprintService.get_active_sprint(
            db=db,
            project_id=project_id,
            user_id=current_user.id
        )
        
        if not sprint:
            return {"active_sprint": None}
        
        return {
            "active_sprint": SprintResponse(
                id=str(sprint.id),
                name=sprint.name,
                goal=sprint.goal,
                start_date=sprint.start_date,
                end_date=sprint.end_date,
                capacity=sprint.capacity,
                status=sprint.status,
                project_id=str(sprint.project_id),
                created_by=str(sprint.created_by),
                created_at=sprint.created_at,
                updated_at=sprint.updated_at,
                velocity=sprint.velocity,
                retrospective_notes=sprint.retrospective_notes,
                satisfaction_score=sprint.satisfaction_score
            )
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter sprint ativo: {str(e)}"
        ) 
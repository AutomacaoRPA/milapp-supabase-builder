"""
Endpoints de Gestão de Tasks/User Stories
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task
from app.services.task_service import TaskService

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["Tasks"])

class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="backlog", regex="^(backlog|todo|in_progress|review|testing|done)$")
    priority: str = Field(default="medium", regex="^(low|medium|high|critical)$")
    type: str = Field(default="task", regex="^(user_story|bug|task|epic)$")
    assignee_id: Optional[str] = None
    story_points: Optional[int] = Field(None, ge=0, le=100)
    due_date: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    sprint_id: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, regex="^(backlog|todo|in_progress|review|testing|done)$")
    priority: Optional[str] = Field(None, regex="^(low|medium|high|critical)$")
    type: Optional[str] = Field(None, regex="^(user_story|bug|task|epic)$")
    assignee_id: Optional[str] = None
    story_points: Optional[int] = Field(None, ge=0, le=100)
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    sprint_id: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    project_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    assignee: Optional[dict] = None
    comments_count: int = 0
    attachments_count: int = 0

class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]
    total: int
    page: int
    size: int
    pages: int

@router.post("/", response_model=TaskResponse)
async def create_task(
    project_id: str,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Criar nova task"""
    try:
        task = await TaskService.create_task(
            db=db,
            project_id=project_id,
            task_data=task_data,
            created_by=current_user.id
        )
        
        return TaskResponse(
            id=str(task.id),
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            type=task.type,
            assignee_id=task.assignee_id,
            story_points=task.story_points,
            due_date=task.due_date,
            tags=task.tags,
            sprint_id=task.sprint_id,
            project_id=str(task.project_id),
            created_by=str(task.created_by),
            created_at=task.created_at,
            updated_at=task.updated_at,
            assignee=task.assignee,
            comments_count=task.comments_count,
            attachments_count=task.attachments_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar task: {str(e)}"
        )

@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    project_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[str] = Query(None),
    sprint_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar tasks do projeto com filtros e paginação"""
    try:
        tasks, total = await TaskService.get_tasks(
            db=db,
            project_id=project_id,
            user_id=current_user.id,
            page=page,
            size=size,
            status=status,
            type=type,
            priority=priority,
            assignee_id=assignee_id,
            sprint_id=sprint_id,
            search=search
        )
        
        task_responses = []
        for task in tasks:
            task_responses.append(TaskResponse(
                id=str(task.id),
                title=task.title,
                description=task.description,
                status=task.status,
                priority=task.priority,
                type=task.type,
                assignee_id=task.assignee_id,
                story_points=task.story_points,
                due_date=task.due_date,
                tags=task.tags,
                sprint_id=task.sprint_id,
                project_id=str(task.project_id),
                created_by=str(task.created_by),
                created_at=task.created_at,
                updated_at=task.updated_at,
                assignee=task.assignee,
                comments_count=task.comments_count,
                attachments_count=task.attachments_count
            ))
        
        pages = (total + size - 1) // size
        
        return TaskListResponse(
            tasks=task_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar tasks: {str(e)}"
        )

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    project_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obter detalhes de uma task específica"""
    try:
        task = await TaskService.get_task(
            db=db,
            project_id=project_id,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task não encontrada"
            )
        
        return TaskResponse(
            id=str(task.id),
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            type=task.type,
            assignee_id=task.assignee_id,
            story_points=task.story_points,
            due_date=task.due_date,
            tags=task.tags,
            sprint_id=task.sprint_id,
            project_id=str(task.project_id),
            created_by=str(task.created_by),
            created_at=task.created_at,
            updated_at=task.updated_at,
            assignee=task.assignee,
            comments_count=task.comments_count,
            attachments_count=task.attachments_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter task: {str(e)}"
        )

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: str,
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Atualizar task"""
    try:
        task = await TaskService.update_task(
            db=db,
            project_id=project_id,
            task_id=task_id,
            task_data=task_data,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task não encontrada"
            )
        
        return TaskResponse(
            id=str(task.id),
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            type=task.type,
            assignee_id=task.assignee_id,
            story_points=task.story_points,
            due_date=task.due_date,
            tags=task.tags,
            sprint_id=task.sprint_id,
            project_id=str(task.project_id),
            created_by=str(task.created_by),
            created_at=task.created_at,
            updated_at=task.updated_at,
            assignee=task.assignee,
            comments_count=task.comments_count,
            attachments_count=task.attachments_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar task: {str(e)}"
        )

@router.delete("/{task_id}")
async def delete_task(
    project_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Excluir task"""
    try:
        success = await TaskService.delete_task(
            db=db,
            project_id=project_id,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task não encontrada"
            )
        
        return {"message": "Task excluída com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir task: {str(e)}"
        )

@router.post("/{task_id}/assign")
async def assign_task(
    project_id: str,
    task_id: str,
    assignee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Atribuir task a um usuário"""
    try:
        task = await TaskService.assign_task(
            db=db,
            project_id=project_id,
            task_id=task_id,
            assignee_id=assignee_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task não encontrada"
            )
        
        return {"message": "Task atribuída com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atribuir task: {str(e)}"
        )

@router.post("/{task_id}/move-to-sprint")
async def move_task_to_sprint(
    project_id: str,
    task_id: str,
    sprint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mover task para um sprint"""
    try:
        task = await TaskService.move_to_sprint(
            db=db,
            project_id=project_id,
            task_id=task_id,
            sprint_id=sprint_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task não encontrada"
            )
        
        return {"message": "Task movida para o sprint com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao mover task: {str(e)}"
        )

@router.get("/{task_id}/metrics")
async def get_task_metrics(
    project_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obter métricas de uma task"""
    try:
        metrics = await TaskService.get_task_metrics(
            db=db,
            project_id=project_id,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task não encontrada"
            )
        
        return metrics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter métricas: {str(e)}"
        )

@router.post("/bulk-update")
async def bulk_update_tasks(
    project_id: str,
    task_ids: List[str],
    updates: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Atualizar múltiplas tasks de uma vez"""
    try:
        updated_count = await TaskService.bulk_update_tasks(
            db=db,
            project_id=project_id,
            task_ids=task_ids,
            updates=updates,
            user_id=current_user.id
        )
        
        return {
            "message": f"{updated_count} tasks atualizadas com sucesso",
            "updated_count": updated_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar tasks: {str(e)}"
        ) 
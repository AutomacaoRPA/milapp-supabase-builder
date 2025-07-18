"""
Serviço de Gestão de Projetos - Otimizado com Cache e Queries Eficientes
"""

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.sql import text
import logging

from app.models.project import Project
from app.models.user import User
from app.services.cache_service import cache_service, cache_result, invalidate_cache_on_change

logger = logging.getLogger(__name__)

class ProjectService:
    """Serviço de gestão de projetos com cache e otimizações"""
    
    # Configurações de cache
    CACHE_TTL = 3600  # 1 hora
    CACHE_TTL_SHORT = 300  # 5 minutos
    CACHE_TTL_LONG = 7200  # 2 horas
    
    @staticmethod
    @cache_result(ttl=300, key_prefix="project")
    async def create_project(
        db: AsyncSession,
        project_data: dict,
        created_by: str
    ) -> Project:
        """Criar novo projeto com cache invalidation"""
        try:
            project = Project(
                name=project_data["name"],
                description=project_data.get("description"),
                type=project_data.get("type", "automation"),
                priority=project_data.get("priority", "medium"),
                methodology=project_data.get("methodology", "scrum"),
                status="planning",
                created_by=created_by,
                roi_target=project_data.get("roi_target"),
                estimated_effort=project_data.get("estimated_effort"),
                start_date=project_data.get("start_date"),
                end_date=project_data.get("end_date")
            )
            
            db.add(project)
            await db.commit()
            await db.refresh(project)
            
            # Invalidar cache relacionado
            cache_service.invalidate_user_cache(created_by)
            cache_service.delete_pattern("projects:list:*")
            cache_service.delete_pattern("dashboard:projects:*")
            
            logger.info(f"Projeto criado: {project.id} por usuário {created_by}")
            return project
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Erro ao criar projeto: {e}")
            raise e
    
    @staticmethod
    @cache_result(ttl=300, key_prefix="projects_list")
    async def get_projects(
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        size: int = 20,
        status: Optional[str] = None,
        type: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Project], int]:
        """Listar projetos com filtros, paginação e cache otimizado"""
        try:
            # Validar parâmetros de paginação
            if page < 1:
                page = 1
            if size < 1 or size > 100:
                size = 20
            
            # Construir query base com eager loading
            query = select(Project).options(
                selectinload(Project.tasks),
                selectinload(Project.milestones)
            ).where(Project.created_by == user_id)
            
            # Aplicar filtros com índices otimizados
            if status:
                query = query.where(Project.status == status)
            
            if type:
                query = query.where(Project.type == type)
            
            if priority:
                query = query.where(Project.priority == priority)
            
            if search:
                # Otimizar busca com índices de texto
                search_filter = or_(
                    Project.name.ilike(f"%{search}%"),
                    Project.description.ilike(f"%{search}%")
                )
                query = query.where(search_filter)
            
            # Contar total com query otimizada
            count_query = select(func.count(Project.id)).where(Project.created_by == user_id)
            
            # Aplicar mesmos filtros para contagem
            if status:
                count_query = count_query.where(Project.status == status)
            if type:
                count_query = count_query.where(Project.type == type)
            if priority:
                count_query = count_query.where(Project.priority == priority)
            if search:
                count_query = count_query.where(search_filter)
            
            total_result = await db.execute(count_query)
            total = total_result.scalar()
            
            # Aplicar ordenação otimizada
            if sort_by == "name":
                order_clause = Project.name.asc() if sort_order == "asc" else Project.name.desc()
            elif sort_by == "status":
                order_clause = Project.status.asc() if sort_order == "asc" else Project.status.desc()
            elif sort_by == "priority":
                order_clause = Project.priority.asc() if sort_order == "asc" else Project.priority.desc()
            elif sort_by == "start_date":
                order_clause = Project.start_date.asc() if sort_order == "asc" else Project.start_date.desc()
            else:
                order_clause = Project.created_at.desc() if sort_order == "desc" else Project.created_at.asc()
            
            query = query.order_by(order_clause)
            
            # Aplicar paginação eficiente
            offset = (page - 1) * size
            query = query.offset(offset).limit(size)
            
            # Executar query
            result = await db.execute(query)
            projects = result.scalars().all()
            
            logger.debug(f"Projetos recuperados: {len(projects)} de {total} para usuário {user_id}")
            return projects, total
            
        except Exception as e:
            logger.error(f"Erro ao listar projetos: {e}")
            raise e
    
    @staticmethod
    @cache_result(ttl=600, key_prefix="project_detail")
    async def get_project(
        db: AsyncSession,
        project_id: str,
        user_id: str
    ) -> Optional[Project]:
        """Obter projeto específico com eager loading otimizado"""
        try:
            query = select(Project).options(
                selectinload(Project.tasks),
                selectinload(Project.milestones),
                selectinload(Project.stakeholders),
                selectinload(Project.documents)
            ).where(
                and_(
                    Project.id == project_id,
                    Project.created_by == user_id
                )
            )
            
            result = await db.execute(query)
            project = result.scalar_one_or_none()
            
            if project:
                logger.debug(f"Projeto recuperado: {project_id} para usuário {user_id}")
            
            return project
            
        except Exception as e:
            logger.error(f"Erro ao obter projeto {project_id}: {e}")
            raise e
    
    @staticmethod
    @invalidate_cache_on_change(["project:*", "projects:list:*", "dashboard:projects:*"])
    async def update_project(
        db: AsyncSession,
        project_id: str,
        project_data: dict,
        user_id: str
    ) -> Optional[Project]:
        """Atualizar projeto com cache invalidation"""
        try:
            project = await ProjectService.get_project(db, project_id, user_id)
            if not project:
                return None
            
            # Atualizar campos com validação
            updateable_fields = {
                'name', 'description', 'type', 'priority', 'methodology',
                'status', 'roi_target', 'estimated_effort', 'start_date', 'end_date'
            }
            
            for field, value in project_data.items():
                if field in updateable_fields and value is not None:
                    setattr(project, field, value)
            
            project.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(project)
            
            # Invalidar cache específico
            cache_service.delete(f"project_detail:get_project:{hash(f'{project_id}_{user_id}')}")
            cache_service.invalidate_project_cache(project_id)
            
            logger.info(f"Projeto atualizado: {project_id} por usuário {user_id}")
            return project
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Erro ao atualizar projeto {project_id}: {e}")
            raise e
    
    @staticmethod
    @invalidate_cache_on_change(["project:*", "projects:list:*", "dashboard:projects:*"])
    async def delete_project(
        db: AsyncSession,
        project_id: str,
        user_id: str
    ) -> bool:
        """Deletar projeto com cache invalidation"""
        try:
            project = await ProjectService.get_project(db, project_id, user_id)
            if not project:
                return False
            
            await db.delete(project)
            await db.commit()
            
            # Invalidar cache relacionado
            cache_service.invalidate_project_cache(project_id)
            cache_service.invalidate_user_cache(user_id)
            
            logger.info(f"Projeto deletado: {project_id} por usuário {user_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Erro ao deletar projeto {project_id}: {e}")
            raise e
    
    @staticmethod
    @cache_result(ttl=300, key_prefix="project_metrics")
    async def get_project_metrics(
        db: AsyncSession,
        project_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Obter métricas do projeto com cache"""
        try:
            project = await ProjectService.get_project(db, project_id, user_id)
            if not project:
                return None
            
            # Calcular métricas básicas
            metrics = {
                "project_id": str(project.id),
                "name": project.name,
                "status": project.status,
                "completion_percentage": ProjectService._calculate_completion_percentage(project),
                "roi_current": project.roi_actual or 0,
                "roi_target": project.roi_target or 0,
                "effort_current": project.actual_effort or 0,
                "effort_estimated": project.estimated_effort or 0,
                "days_remaining": ProjectService._calculate_days_remaining(project),
                "risk_level": ProjectService._calculate_risk_level(project),
                "tasks_count": len(project.tasks) if project.tasks else 0,
                "milestones_count": len(project.milestones) if project.milestones else 0,
                "last_updated": project.updated_at.isoformat() if project.updated_at else None
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas do projeto {project_id}: {e}")
            raise e
    
    @staticmethod
    @cache_result(ttl=600, key_prefix="project_summary")
    async def get_projects_summary(
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, Any]:
        """Obter resumo de projetos com cache otimizado"""
        try:
            # Query otimizada para contagens por status
            status_counts_query = text("""
                SELECT status, COUNT(*) as count
                FROM projects
                WHERE created_by = :user_id
                GROUP BY status
            """)
            
            result = await db.execute(status_counts_query, {"user_id": user_id})
            status_counts = {row.status: row.count for row in result}
            
            # Query otimizada para ROI médio
            avg_roi_query = text("""
                SELECT AVG(roi_actual) as avg_roi
                FROM projects
                WHERE created_by = :user_id AND roi_actual IS NOT NULL
            """)
            
            result = await db.execute(avg_roi_query, {"user_id": user_id})
            avg_roi = result.scalar() or 0
            
            # Query otimizada para projetos recentes
            recent_projects_query = text("""
                SELECT id, name, status, created_at
                FROM projects
                WHERE created_by = :user_id
                ORDER BY created_at DESC
                LIMIT 5
            """)
            
            result = await db.execute(recent_projects_query, {"user_id": user_id})
            recent_projects = [
                {
                    "id": str(row.id),
                    "name": row.name,
                    "status": row.status,
                    "created_at": row.created_at.isoformat()
                }
                for row in result
            ]
            
            summary = {
                "total_projects": sum(status_counts.values()),
                "status_counts": status_counts,
                "average_roi": round(avg_roi, 2),
                "recent_projects": recent_projects,
                "last_updated": datetime.utcnow().isoformat()
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Erro ao obter resumo de projetos para usuário {user_id}: {e}")
            raise e
    
    @staticmethod
    @cache_result(ttl=1800, key_prefix="project_analytics")
    async def get_project_analytics(
        db: AsyncSession,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Obter analytics de projetos com cache de longo prazo"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Query otimizada para analytics
            analytics_query = text("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as projects_created,
                    AVG(estimated_effort) as avg_effort,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM projects
                WHERE created_by = :user_id AND created_at >= :start_date
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """)
            
            result = await db.execute(analytics_query, {
                "user_id": user_id,
                "start_date": start_date
            })
            
            analytics_data = [
                {
                    "date": row.date.isoformat(),
                    "projects_created": row.projects_created,
                    "avg_effort": float(row.avg_effort) if row.avg_effort else 0,
                    "completed": row.completed
                }
                for row in result
            ]
            
            return {
                "period_days": days,
                "analytics": analytics_data,
                "total_projects": sum(item["projects_created"] for item in analytics_data),
                "total_completed": sum(item["completed"] for item in analytics_data)
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter analytics para usuário {user_id}: {e}")
            raise e
    
    @staticmethod
    def _calculate_completion_percentage(project: Project) -> float:
        """Calcular porcentagem de conclusão do projeto"""
        # Implementar lógica baseada em status e progresso
        status_percentages = {
            "planning": 10,
            "development": 50,
            "testing": 80,
            "deployed": 100,
            "maintenance": 100,
            "cancelled": 0
        }
        
        return status_percentages.get(project.status, 0)
    
    @staticmethod
    def _calculate_days_remaining(project: Project) -> Optional[int]:
        """Calcular dias restantes do projeto"""
        if not project.end_date:
            return None
        
        remaining = project.end_date - datetime.now().date()
        return max(0, remaining.days)
    
    @staticmethod
    def _calculate_risk_level(project: Project) -> str:
        """Calcular nível de risco do projeto"""
        # Implementar lógica de cálculo de risco
        if project.status == "cancelled":
            return "high"
        elif project.priority == "critical":
            return "high"
        elif project.priority == "high":
            return "medium"
        else:
            return "low"
    
    @staticmethod
    async def _get_project_counts_by_status(
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, int]:
        """Obter contagem de projetos por status"""
        try:
            query = select(
                Project.status,
                func.count(Project.id)
            ).where(
                Project.created_by == user_id
            ).group_by(Project.status)
            
            result = await db.execute(query)
            counts = dict(result.all())
            
            return counts
            
        except Exception as e:
            raise e
    
    @staticmethod
    async def _calculate_average_roi(
        db: AsyncSession,
        user_id: str
    ) -> float:
        """Calcular ROI médio dos projetos"""
        try:
            query = select(func.avg(Project.roi_actual)).where(
                and_(
                    Project.created_by == user_id,
                    Project.roi_actual.isnot(None)
                )
            )
            
            result = await db.execute(query)
            avg_roi = result.scalar()
            
            return float(avg_roi) if avg_roi else 0.0
            
        except Exception as e:
            raise e
    
    @staticmethod
    async def _get_recent_projects(
        db: AsyncSession,
        user_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Obter projetos recentes"""
        try:
            query = select(Project).where(
                Project.created_by == user_id
            ).order_by(
                Project.created_at.desc()
            ).limit(limit)
            
            result = await db.execute(query)
            projects = result.scalars().all()
            
            return [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "status": p.status,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in projects
            ]
            
        except Exception as e:
            raise e 
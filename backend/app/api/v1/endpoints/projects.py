from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_projects():
    """Listar projetos"""
    return {"projects": []}

@router.post("/")
async def create_project():
    """Criar projeto"""
    return {"id": "project_id", "status": "created"} 
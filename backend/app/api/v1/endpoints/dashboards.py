from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_dashboard_data():
    """Obter dados do dashboard"""
    return {"metrics": [], "projects": []} 
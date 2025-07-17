from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def deploy_automation():
    """Fazer deploy de automação"""
    return {"deployment_id": "deploy_id", "status": "deploying"} 
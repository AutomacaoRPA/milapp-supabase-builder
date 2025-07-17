from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_quality_gates():
    """Listar quality gates"""
    return {"gates": []}

@router.post("/{project_id}")
async def create_quality_gate(project_id: str):
    """Criar quality gate"""
    return {"gate_id": "gate_id", "type": "G1"} 
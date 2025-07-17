from fastapi import APIRouter

router = APIRouter()

@router.post("/generate")
async def generate_document():
    """Gerar documento"""
    return {"document_id": "doc_id", "type": "pdd"} 
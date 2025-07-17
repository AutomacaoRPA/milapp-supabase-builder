from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def create_conversation():
    """Criar nova conversa"""
    return {"id": "conversation_id", "status": "created"}

@router.post("/{conversation_id}/messages")
async def send_message(conversation_id: str):
    """Enviar mensagem para IA"""
    return {"response": "AI response placeholder"} 
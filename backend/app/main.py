from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import uuid
from datetime import datetime
import openai
from supabase import create_client, Client
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuração do FastAPI
app = FastAPI(
    title="MILAPP Backend API",
    description="Backend para o sistema MILAPP com integração IA",
    version="1.0.0"
)

# CORS para frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração das APIs
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Inicialização dos clientes
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Security
security = HTTPBearer()

# Modelos Pydantic
class WorkItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "task"
    priority: str = "medium"
    status: str = "todo"
    story_points: Optional[int] = None
    project_id: str

class WorkItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    story_points: Optional[int] = None

class SubtaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    estimated_hours: Optional[float] = None
    story_points: Optional[int] = None

class ChatMessage(BaseModel):
    content: str
    role: str = "user"
    project_id: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    work_items: Optional[List[Dict[str, Any]]] = None
    suggestions: Optional[List[str]] = None

# Função para validar token JWT
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Validar token com Supabase
        user = supabase.auth.get_user(credentials.credentials)
        return user.user
    except Exception as e:
        logger.error(f"Erro na validação do token: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")

# Rotas de autenticação
@app.post("/auth/verify")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verificar se o token JWT é válido"""
    try:
        user = await get_current_user(credentials)
        return {"valid": True, "user": user}
    except HTTPException:
        return {"valid": False}

# Rotas de projetos
@app.get("/api/v1/projects")
async def get_projects(user = Depends(get_current_user)):
    """Buscar todos os projetos do usuário"""
    try:
        response = supabase.table("projects").select("*").execute()
        return {"projects": response.data}
    except Exception as e:
        logger.error(f"Erro ao buscar projetos: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: str, user = Depends(get_current_user)):
    """Buscar projeto específico com work items"""
    try:
        response = supabase.table("projects").select("*").eq("id", project_id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Erro ao buscar projeto: {e}")
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

@app.post("/api/v1/projects")
async def create_project(project_data: Dict[str, Any], user = Depends(get_current_user)):
    """Criar novo projeto"""
    try:
        project_data["created_by"] = user.id
        project_data["created_at"] = datetime.utcnow().isoformat()
        project_data["updated_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("projects").insert(project_data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Erro ao criar projeto: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Rotas de work items
@app.get("/api/v1/projects/{project_id}/work-items")
async def get_work_items(project_id: str, user = Depends(get_current_user)):
    """Buscar work items de um projeto"""
    try:
        response = supabase.table("projects").select("work_items").eq("id", project_id).single().execute()
        return {"work_items": response.data.get("work_items", [])}
    except Exception as e:
        logger.error(f"Erro ao buscar work items: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.post("/api/v1/projects/{project_id}/work-items")
async def create_work_item(
    project_id: str, 
    work_item: WorkItemCreate, 
    user = Depends(get_current_user)
):
    """Criar novo work item"""
    try:
        result = supabase.rpc(
            'add_work_item_to_project',
            {
                'p_project_id': project_id,
                'p_work_item_data': work_item.dict()
            }
        ).execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Erro ao criar work item: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.put("/api/v1/projects/{project_id}/work-items/{work_item_id}")
async def update_work_item(
    project_id: str,
    work_item_id: str,
    work_item: WorkItemUpdate,
    user = Depends(get_current_user)
):
    """Atualizar work item"""
    try:
        result = supabase.rpc(
            'update_work_item_in_project',
            {
                'p_project_id': project_id,
                'p_work_item_id': work_item_id,
                'p_work_item_data': work_item.dict(exclude_unset=True)
            }
        ).execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Erro ao atualizar work item: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.delete("/api/v1/projects/{project_id}/work-items/{work_item_id}")
async def delete_work_item(
    project_id: str,
    work_item_id: str,
    user = Depends(get_current_user)
):
    """Deletar work item"""
    try:
        result = supabase.rpc(
            'remove_work_item_from_project',
            {
                'p_project_id': project_id,
                'p_work_item_id': work_item_id
            }
        ).execute()
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Erro ao deletar work item: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Rotas de subtarefas
@app.post("/api/v1/projects/{project_id}/work-items/{work_item_id}/subtasks")
async def create_subtask(
    project_id: str,
    work_item_id: str,
    subtask: SubtaskCreate,
    user = Depends(get_current_user)
):
    """Criar nova subtarefa"""
    try:
        result = supabase.rpc(
            'add_subtask_to_work_item',
            {
                'p_project_id': project_id,
                'p_work_item_id': work_item_id,
                'p_subtask_data': subtask.dict()
            }
        ).execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Erro ao criar subtarefa: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.put("/api/v1/projects/{project_id}/work-items/{work_item_id}/subtasks/{subtask_id}")
async def update_subtask(
    project_id: str,
    work_item_id: str,
    subtask_id: str,
    subtask: SubtaskCreate,
    user = Depends(get_current_user)
):
    """Atualizar subtarefa"""
    try:
        result = supabase.rpc(
            'update_subtask_in_work_item',
            {
                'p_project_id': project_id,
                'p_work_item_id': work_item_id,
                'p_subtask_id': subtask_id,
                'p_subtask_data': subtask.dict(exclude_unset=True)
            }
        ).execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Erro ao atualizar subtarefa: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.delete("/api/v1/projects/{project_id}/work-items/{work_item_id}/subtasks/{subtask_id}")
async def delete_subtask(
    project_id: str,
    work_item_id: str,
    subtask_id: str,
    user = Depends(get_current_user)
):
    """Deletar subtarefa"""
    try:
        result = supabase.rpc(
            'remove_subtask_from_work_item',
            {
                'p_project_id': project_id,
                'p_work_item_id': work_item_id,
                'p_subtask_id': subtask_id
            }
        ).execute()
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Erro ao deletar subtarefa: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Rotas de IA e Chat
@app.post("/api/v1/ai/chat", response_model=ChatResponse)
async def chat_with_ai(
    message: ChatMessage,
    user = Depends(get_current_user)
):
    """Chat com IA para descoberta de requisitos"""
    try:
        # Contexto do projeto se fornecido
        project_context = ""
        if message.project_id:
            try:
                project_response = supabase.table("projects").select("name, description").eq("id", message.project_id).single().execute()
                project_context = f"Projeto: {project_response.data.get('name', '')}\nDescrição: {project_response.data.get('description', '')}\n\n"
            except:
                pass

        # Prompt para o OpenAI
        system_prompt = f"""
        Você é um assistente especializado em análise de requisitos e gerenciamento de projetos.
        {project_context}
        
        Analise a mensagem do usuário e:
        1. Identifique requisitos funcionais e não funcionais
        2. Sugira work items (tarefas) baseados na conversa
        3. Forneça recomendações de priorização
        4. Identifique possíveis riscos ou dependências
        
        Responda de forma clara e estruturada.
        """

        # Chamada para OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message.content}
            ],
            max_tokens=1000,
            temperature=0.7
        )

        ai_response = response.choices[0].message.content

        # Extrair work items sugeridos da resposta da IA
        work_items = []
        suggestions = []
        
        # Análise simples da resposta para extrair tarefas
        lines = ai_response.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['tarefa', 'task', 'requisito', 'funcionalidade']):
                suggestions.append(line.strip())

        return ChatResponse(
            message=ai_response,
            work_items=work_items,
            suggestions=suggestions
        )

    except Exception as e:
        logger.error(f"Erro no chat com IA: {e}")
        raise HTTPException(status_code=500, detail="Erro na comunicação com IA")

@app.post("/api/v1/ai/analyze-file")
async def analyze_file(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    user = Depends(get_current_user)
):
    """Analisar arquivo com IA (PDF, Word, Excel, etc.)"""
    try:
        # Salvar arquivo temporariamente
        file_path = f"/tmp/{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Extrair texto do arquivo (implementação básica)
        file_content = ""
        if file.filename.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()
        elif file.filename.endswith('.pdf'):
            # Implementar extração de PDF
            file_content = "Conteúdo extraído do PDF"
        elif file.filename.endswith(('.doc', '.docx')):
            # Implementar extração de Word
            file_content = "Conteúdo extraído do Word"
        else:
            file_content = "Arquivo não suportado para extração de texto"

        # Analisar com OpenAI
        system_prompt = """
        Analise o conteúdo do arquivo fornecido e extraia:
        1. Requisitos funcionais
        2. Requisitos não funcionais
        3. Processos de negócio
        4. Entidades e relacionamentos
        5. Work items sugeridos
        
        Forneça uma análise estruturada e detalhada.
        """

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analise este arquivo: {file_content}"}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        analysis = response.choices[0].message.content

        # Limpar arquivo temporário
        os.remove(file_path)

        return {
            "filename": file.filename,
            "analysis": analysis,
            "work_items_suggested": []  # Extrair work items da análise
        }

    except Exception as e:
        logger.error(f"Erro na análise de arquivo: {e}")
        raise HTTPException(status_code=500, detail="Erro na análise do arquivo")

# Rotas de métricas e analytics
@app.get("/api/v1/projects/{project_id}/metrics")
async def get_project_metrics(project_id: str, user = Depends(get_current_user)):
    """Buscar métricas do projeto"""
    try:
        result = supabase.rpc(
            'calculate_project_metrics',
            {'p_project_id': project_id}
        ).execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Erro ao buscar métricas: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Health check
@app.get("/health")
async def health_check():
    """Verificar saúde da API"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
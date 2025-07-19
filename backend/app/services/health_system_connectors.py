"""
Conectores para Sistemas de Saúde - MILAPP
"""

import asyncio
import json
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime
import structlog
from pydantic import BaseModel

logger = structlog.get_logger()


class HealthSystemData(BaseModel):
    """Modelo base para dados de sistemas de saúde"""
    system_name: str
    data_type: str
    content: Dict[str, Any]
    timestamp: datetime
    source_id: str


class TopSaudeConnector:
    """Conector para sistema TopSaúde (TopDown)"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"}
        )
    
    async def get_patient_data(self, patient_id: str) -> HealthSystemData:
        """Obtém dados de paciente do TopSaúde"""
        try:
            response = await self.client.get(f"/api/patients/{patient_id}")
            response.raise_for_status()
            
            return HealthSystemData(
                system_name="TopSaúde",
                data_type="patient",
                content=response.json(),
                timestamp=datetime.utcnow(),
                source_id=patient_id
            )
        except Exception as e:
            logger.error("Failed to get patient data from TopSaúde", 
                        error=str(e), patient_id=patient_id)
            raise
    
    async def get_medical_records(self, patient_id: str) -> List[HealthSystemData]:
        """Obtém prontuário médico do TopSaúde"""
        try:
            response = await self.client.get(f"/api/patients/{patient_id}/records")
            response.raise_for_status()
            
            records = []
            for record in response.json():
                records.append(HealthSystemData(
                    system_name="TopSaúde",
                    data_type="medical_record",
                    content=record,
                    timestamp=datetime.utcnow(),
                    source_id=patient_id
                ))
            
            return records
        except Exception as e:
            logger.error("Failed to get medical records from TopSaúde", 
                        error=str(e), patient_id=patient_id)
            raise
    
    async def get_appointments(self, date_from: str, date_to: str) -> List[HealthSystemData]:
        """Obtém agendamentos do TopSaúde"""
        try:
            response = await self.client.get(
                "/api/appointments",
                params={"date_from": date_from, "date_to": date_to}
            )
            response.raise_for_status()
            
            appointments = []
            for appointment in response.json():
                appointments.append(HealthSystemData(
                    system_name="TopSaúde",
                    data_type="appointment",
                    content=appointment,
                    timestamp=datetime.utcnow(),
                    source_id=appointment.get("id")
                ))
            
            return appointments
        except Exception as e:
            logger.error("Failed to get appointments from TopSaúde", 
                        error=str(e))
            raise
    
    async def get_process_data(self) -> List[HealthSystemData]:
        """Obtém dados de processos do TopSaúde para automação"""
        try:
            response = await self.client.get("/api/processes")
            response.raise_for_status()
            
            processes = []
            for process in response.json():
                processes.append(HealthSystemData(
                    system_name="TopSaúde",
                    data_type="process",
                    content=process,
                    timestamp=datetime.utcnow(),
                    source_id=process.get("id")
                ))
            
            return processes
        except Exception as e:
            logger.error("Failed to get process data from TopSaúde", 
                        error=str(e))
            raise


class MXMConnector:
    """Conector para sistema MXM"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"}
        )
    
    async def get_medical_data(self, medical_id: str) -> HealthSystemData:
        """Obtém dados médicos do MXM"""
        try:
            response = await self.client.get(f"/api/medical/{medical_id}")
            response.raise_for_status()
            
            return HealthSystemData(
                system_name="MXM",
                data_type="medical",
                content=response.json(),
                timestamp=datetime.utcnow(),
                source_id=medical_id
            )
        except Exception as e:
            logger.error("Failed to get medical data from MXM", 
                        error=str(e), medical_id=medical_id)
            raise
    
    async def get_workflow_data(self) -> List[HealthSystemData]:
        """Obtém dados de workflows do MXM para automação"""
        try:
            response = await self.client.get("/api/workflows")
            response.raise_for_status()
            
            workflows = []
            for workflow in response.json():
                workflows.append(HealthSystemData(
                    system_name="MXM",
                    data_type="workflow",
                    content=workflow,
                    timestamp=datetime.utcnow(),
                    source_id=workflow.get("id")
                ))
            
            return workflows
        except Exception as e:
            logger.error("Failed to get workflow data from MXM", 
                        error=str(e))
            raise


class TasyConnector:
    """Conector para sistema Tasy"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"}
        )
    
    async def get_hospital_data(self, hospital_id: str) -> HealthSystemData:
        """Obtém dados hospitalares do Tasy"""
        try:
            response = await self.client.get(f"/api/hospital/{hospital_id}")
            response.raise_for_status()
            
            return HealthSystemData(
                system_name="Tasy",
                data_type="hospital",
                content=response.json(),
                timestamp=datetime.utcnow(),
                source_id=hospital_id
            )
        except Exception as e:
            logger.error("Failed to get hospital data from Tasy", 
                        error=str(e), hospital_id=hospital_id)
            raise
    
    async def get_clinical_processes(self) -> List[HealthSystemData]:
        """Obtém processos clínicos do Tasy para automação"""
        try:
            response = await self.client.get("/api/clinical-processes")
            response.raise_for_status()
            
            processes = []
            for process in response.json():
                processes.append(HealthSystemData(
                    system_name="Tasy",
                    data_type="clinical_process",
                    content=process,
                    timestamp=datetime.utcnow(),
                    source_id=process.get("id")
                ))
            
            return processes
        except Exception as e:
            logger.error("Failed to get clinical processes from Tasy", 
                        error=str(e))
            raise


class TechSallusConnector:
    """Conector para sistema TechSallus"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"}
        )
    
    async def get_health_data(self, health_id: str) -> HealthSystemData:
        """Obtém dados de saúde do TechSallus"""
        try:
            response = await self.client.get(f"/api/health/{health_id}")
            response.raise_for_status()
            
            return HealthSystemData(
                system_name="TechSallus",
                data_type="health",
                content=response.json(),
                timestamp=datetime.utcnow(),
                source_id=health_id
            )
        except Exception as e:
            logger.error("Failed to get health data from TechSallus", 
                        error=str(e), health_id=health_id)
            raise
    
    async def get_automation_opportunities(self) -> List[HealthSystemData]:
        """Obtém oportunidades de automação do TechSallus"""
        try:
            response = await self.client.get("/api/automation-opportunities")
            response.raise_for_status()
            
            opportunities = []
            for opportunity in response.json():
                opportunities.append(HealthSystemData(
                    system_name="TechSallus",
                    data_type="automation_opportunity",
                    content=opportunity,
                    timestamp=datetime.utcnow(),
                    source_id=opportunity.get("id")
                ))
            
            return opportunities
        except Exception as e:
            logger.error("Failed to get automation opportunities from TechSallus", 
                        error=str(e))
            raise


class BizagiConnector:
    """Conector para sistema Bizagi (BPM)"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"}
        )
    
    async def get_bpmn_process(self, process_id: str) -> HealthSystemData:
        """Obtém processo BPMN do Bizagi"""
        try:
            response = await self.client.get(f"/api/processes/{process_id}/bpmn")
            response.raise_for_status()
            
            return HealthSystemData(
                system_name="Bizagi",
                data_type="bpmn_process",
                content=response.json(),
                timestamp=datetime.utcnow(),
                source_id=process_id
            )
        except Exception as e:
            logger.error("Failed to get BPMN process from Bizagi", 
                        error=str(e), process_id=process_id)
            raise
    
    async def get_process_models(self) -> List[HealthSystemData]:
        """Obtém modelos de processo do Bizagi"""
        try:
            response = await self.client.get("/api/process-models")
            response.raise_for_status()
            
            models = []
            for model in response.json():
                models.append(HealthSystemData(
                    system_name="Bizagi",
                    data_type="process_model",
                    content=model,
                    timestamp=datetime.utcnow(),
                    source_id=model.get("id")
                ))
            
            return models
        except Exception as e:
            logger.error("Failed to get process models from Bizagi", 
                        error=str(e))
            raise
    
    async def export_bpmn(self, process_id: str) -> str:
        """Exporta processo BPMN do Bizagi"""
        try:
            response = await self.client.get(f"/api/processes/{process_id}/export")
            response.raise_for_status()
            
            return response.text
        except Exception as e:
            logger.error("Failed to export BPMN from Bizagi", 
                        error=str(e), process_id=process_id)
            raise
    
    async def import_bpmn(self, bpmn_content: str) -> Dict[str, Any]:
        """Importa processo BPMN para o Bizagi"""
        try:
            response = await self.client.post(
                "/api/processes/import",
                json={"bpmn_content": bpmn_content}
            )
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            logger.error("Failed to import BPMN to Bizagi", 
                        error=str(e))
            raise


class HealthSystemIntegrationService:
    """Serviço de integração unificado para sistemas de saúde"""
    
    def __init__(self, config: Dict[str, Dict[str, str]]):
        self.connectors = {
            'top_saude': TopSaudeConnector(
                config['top_saude']['base_url'],
                config['top_saude']['api_key']
            ),
            'mxm': MXMConnector(
                config['mxm']['base_url'],
                config['mxm']['api_key']
            ),
            'tasy': TasyConnector(
                config['tasy']['base_url'],
                config['tasy']['api_key']
            ),
            'tech_sallus': TechSallusConnector(
                config['tech_sallus']['base_url'],
                config['tech_sallus']['api_key']
            ),
            'bizagi': BizagiConnector(
                config['bizagi']['base_url'],
                config['bizagi']['api_key']
            )
        }
    
    async def get_all_system_data(self, data_type: str) -> Dict[str, List[HealthSystemData]]:
        """Obtém dados de todos os sistemas de saúde"""
        results = {}
        
        for system_name, connector in self.connectors.items():
            try:
                if data_type == "processes":
                    if system_name == "top_saude":
                        results[system_name] = await connector.get_process_data()
                    elif system_name == "mxm":
                        results[system_name] = await connector.get_workflow_data()
                    elif system_name == "tasy":
                        results[system_name] = await connector.get_clinical_processes()
                    elif system_name == "tech_sallus":
                        results[system_name] = await connector.get_automation_opportunities()
                    elif system_name == "bizagi":
                        results[system_name] = await connector.get_process_models()
                
                logger.info(f"Successfully retrieved {data_type} from {system_name}")
                
            except Exception as e:
                logger.error(f"Failed to get {data_type} from {system_name}", 
                            error=str(e))
                results[system_name] = []
        
        return results
    
    async def identify_automation_opportunities(self) -> List[Dict[str, Any]]:
        """Identifica oportunidades de automação em todos os sistemas"""
        opportunities = []
        
        # Obtém dados de todos os sistemas
        all_data = await self.get_all_system_data("processes")
        
        for system_name, data_list in all_data.items():
            for data in data_list:
                # Analisa cada processo para identificar oportunidades
                opportunity = self.analyze_for_automation(data)
                if opportunity:
                    opportunities.append(opportunity)
        
        return opportunities
    
    def analyze_for_automation(self, data: HealthSystemData) -> Optional[Dict[str, Any]]:
        """Analisa dados para identificar oportunidades de automação"""
        try:
            content = data.content
            
            # Critérios para identificar oportunidades de automação
            automation_criteria = {
                'repetitive_tasks': self.check_repetitive_tasks(content),
                'manual_data_entry': self.check_manual_data_entry(content),
                'high_volume': self.check_high_volume(content),
                'error_prone': self.check_error_prone(content),
                'time_consuming': self.check_time_consuming(content)
            }
            
            # Calcula score de automação
            automation_score = sum(automation_criteria.values()) / len(automation_criteria)
            
            if automation_score > 0.6:  # Threshold para considerar automação
                return {
                    'system_name': data.system_name,
                    'process_id': data.source_id,
                    'process_name': content.get('name', 'Unknown'),
                    'automation_score': automation_score,
                    'criteria': automation_criteria,
                    'estimated_roi': self.calculate_roi(content, automation_score),
                    'complexity': self.assess_complexity(content),
                    'recommended_tools': self.recommend_tools(content, automation_score)
                }
            
            return None
            
        except Exception as e:
            logger.error("Failed to analyze data for automation", 
                        error=str(e), data_id=data.source_id)
            return None
    
    def check_repetitive_tasks(self, content: Dict[str, Any]) -> float:
        """Verifica se o processo tem tarefas repetitivas"""
        # Implementar lógica específica
        return 0.8  # Placeholder
    
    def check_manual_data_entry(self, content: Dict[str, Any]) -> float:
        """Verifica se o processo tem entrada manual de dados"""
        # Implementar lógica específica
        return 0.7  # Placeholder
    
    def check_high_volume(self, content: Dict[str, Any]) -> float:
        """Verifica se o processo tem alto volume"""
        # Implementar lógica específica
        return 0.6  # Placeholder
    
    def check_error_prone(self, content: Dict[str, Any]) -> float:
        """Verifica se o processo é propenso a erros"""
        # Implementar lógica específica
        return 0.5  # Placeholder
    
    def check_time_consuming(self, content: Dict[str, Any]) -> float:
        """Verifica se o processo é demorado"""
        # Implementar lógica específica
        return 0.9  # Placeholder
    
    def calculate_roi(self, content: Dict[str, Any], automation_score: float) -> float:
        """Calcula ROI estimado da automação"""
        # Implementar cálculo de ROI
        base_roi = 150  # ROI base de 150%
        return base_roi * automation_score
    
    def assess_complexity(self, content: Dict[str, Any]) -> str:
        """Avalia complexidade do processo"""
        # Implementar avaliação de complexidade
        return "medium"  # Placeholder
    
    def recommend_tools(self, content: Dict[str, Any], automation_score: float) -> List[str]:
        """Recomenda ferramentas de automação"""
        if automation_score > 0.8:
            return ["n8n", "Python", "Playwright"]
        elif automation_score > 0.6:
            return ["n8n", "Python"]
        else:
            return ["n8n"]
    
    async def test_all_connections(self) -> Dict[str, bool]:
        """Testa conexões com todos os sistemas"""
        results = {}
        
        for system_name, connector in self.connectors.items():
            try:
                # Testa conexão básica
                if hasattr(connector, 'client'):
                    response = await connector.client.get("/health")
                    results[system_name] = response.status_code == 200
                else:
                    results[system_name] = False
                    
            except Exception as e:
                logger.error(f"Connection test failed for {system_name}", 
                            error=str(e))
                results[system_name] = False
        
        return results 
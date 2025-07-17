#!/usr/bin/env python3
"""
MILAPP - Dashboard de Aprovação IA-IA
Interface para aprovar mudanças geradas automaticamente
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List
import streamlit as st
import pandas as pd
from pathlib import Path

class ApprovalDashboard:
    def __init__(self):
        self.orchestrator = None  # Será inicializado com o orquestrador
        self.setup_streamlit()
    
    def setup_streamlit(self):
        """Configura a interface Streamlit"""
        st.set_page_config(
            page_title="MILAPP - IA-IA Approval Dashboard",
            page_icon="🤖",
            layout="wide",
            initial_sidebar_state="expanded"
        )
        
        st.title("🤖 MILAPP - Pipeline de Aprovação IA-IA")
        st.markdown("### Dashboard para aprovar mudanças geradas automaticamente")
    
    def run_dashboard(self):
        """Executa o dashboard principal"""
        # Sidebar para configurações
        self.render_sidebar()
        
        # Tabs principais
        tab1, tab2, tab3, tab4 = st.tabs([
            "📋 Fila de Aprovação", 
            "🚀 Iniciar Nova Task", 
            "📊 Histórico", 
            "⚙️ Configurações"
        ])
        
        with tab1:
            self.render_approval_queue()
        
        with tab2:
            self.render_new_task_form()
        
        with tab3:
            self.render_history()
        
        with tab4:
            self.render_settings()
    
    def render_sidebar(self):
        """Renderiza sidebar com estatísticas"""
        with st.sidebar:
            st.header("📊 Estatísticas")
            
            # Métricas rápidas
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Pendentes", "3")
                st.metric("Aprovadas Hoje", "12")
            
            with col2:
                st.metric("Rejeitadas", "1")
                st.metric("Taxa Aprovação", "92%")
            
            st.divider()
            
            # Filtros
            st.subheader("🔍 Filtros")
            status_filter = st.selectbox(
                "Status",
                ["Todos", "Pendente", "Aprovado", "Rejeitado"]
            )
            
            complexity_filter = st.selectbox(
                "Complexidade",
                ["Todas", "Baixa", "Média", "Alta"]
            )
            
            st.divider()
            
            # Ações rápidas
            st.subheader("⚡ Ações Rápidas")
            if st.button("🔄 Atualizar", use_container_width=True):
                st.rerun()
            
            if st.button("📧 Notificar Time", use_container_width=True):
                st.success("Notificação enviada!")
    
    def render_approval_queue(self):
        """Renderiza fila de aprovação"""
        st.header("📋 Fila de Aprovação")
        
        # Simular dados da fila
        approval_queue = self.get_mock_approval_queue()
        
        if not approval_queue:
            st.info("🎉 Nenhuma task pendente de aprovação!")
            return
        
        for task in approval_queue:
            with st.expander(f"Task {task['id']} - {task['task_description']}", expanded=True):
                self.render_task_details(task)
    
    def render_task_details(self, task: Dict):
        """Renderiza detalhes de uma task"""
        col1, col2 = st.columns([2, 1])
        
        with col1:
            # Informações da task
            st.subheader("📝 Detalhes da Task")
            st.write(f"**Descrição:** {task['task_description']}")
            st.write(f"**Criada em:** {task['created_at']}")
            st.write(f"**Complexidade:** {task['quality_report']['complexity']}")
            
            # Resumo das mudanças
            st.subheader("📋 Resumo das Mudanças")
            st.markdown(task['summary'])
            
            # Arquivos modificados
            st.subheader("📁 Arquivos Modificados")
            files = task['code_changes']['files']
            for file_path in files.keys():
                st.code(file_path, language=None)
            
            # Testes
            st.subheader("🧪 Resultados dos Testes")
            test_results = task['test_results']
            
            col_test1, col_test2, col_test3, col_test4 = st.columns(4)
            with col_test1:
                st.metric("Unit Tests", f"{test_results['unit_tests']['passed']}/{test_results['unit_tests']['total']}")
            with col_test2:
                st.metric("Integration", f"{test_results['integration_tests']['passed']}/{test_results['integration_tests']['total']}")
            with col_test3:
                st.metric("Security", f"{test_results['security_scan']['score']}/100")
            with col_test4:
                st.metric("Performance", f"{test_results['performance_tests']['score']}/100")
        
        with col2:
            # Qualidade
            st.subheader("🎯 Qualidade")
            quality = task['quality_report']
            
            st.metric("Score Geral", f"{quality['overall_score']}/100")
            st.metric("Manutenibilidade", quality['maintainability'])
            st.metric("Cobertura", f"{quality['test_coverage']}%")
            
            # Riscos
            st.subheader("⚠️ Avaliação de Riscos")
            risks = task['risk_assessment']
            
            risk_color = {
                'Baixo': 'green',
                'Médio': 'orange', 
                'Alto': 'red'
            }
            
            st.markdown(f"**Nível:** :{risk_color[risks['risk_level']]}[{risks['risk_level']}]")
            
            if risks['risks']:
                st.write("**Riscos identificados:**")
                for risk in risks['risks']:
                    st.write(f"• {risk}")
            
            if risks['recommendations']:
                st.write("**Recomendações:**")
                for rec in risks['recommendations']:
                    st.write(f"• {rec}")
            
            # Ações de aprovação
            st.subheader("✅ Aprovação")
            
            comments = st.text_area(
                "Comentários (opcional)",
                placeholder="Adicione comentários sobre a aprovação..."
            )
            
            col_approve, col_reject = st.columns(2)
            
            with col_approve:
                if st.button("✅ Aprovar", type="primary", use_container_width=True):
                    self.approve_task(task['id'], True, comments)
                    st.success("Task aprovada!")
                    st.rerun()
            
            with col_reject:
                if st.button("❌ Rejeitar", type="secondary", use_container_width=True):
                    self.approve_task(task['id'], False, comments)
                    st.error("Task rejeitada!")
                    st.rerun()
    
    def render_new_task_form(self):
        """Renderiza formulário para nova task"""
        st.header("🚀 Iniciar Nova Task")
        
        with st.form("new_task_form"):
            task_description = st.text_area(
                "Descrição da Task",
                placeholder="Descreva o que você quer que as IAs implementem...",
                height=100
            )
            
            task_type = st.selectbox(
                "Tipo de Task",
                ["Frontend Component", "Backend API", "Database Migration", "Integration", "Bug Fix", "Feature"]
            )
            
            priority = st.selectbox(
                "Prioridade",
                ["Baixa", "Média", "Alta", "Crítica"]
            )
            
            auto_deploy = st.checkbox("Deploy automático após aprovação")
            
            submitted = st.form_submit_button("🚀 Iniciar Pipeline IA-IA", type="primary")
            
            if submitted and task_description:
                with st.spinner("🤖 Iniciando pipeline IA-IA..."):
                    # Simular início do pipeline
                    task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    st.success(f"Pipeline iniciado! Task ID: {task_id}")
                    
                    # Mostrar progresso
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    steps = [
                        "Analisando requisitos com Cursor IA...",
                        "Gerando código com Lovable IA...",
                        "Revisando e refinando com Cursor IA...",
                        "Executando testes automatizados...",
                        "Analisando qualidade...",
                        "Preparando para aprovação..."
                    ]
                    
                    for i, step in enumerate(steps):
                        status_text.text(step)
                        progress_bar.progress((i + 1) / len(steps))
                        await asyncio.sleep(1)
                    
                    st.success("✅ Pipeline concluído! Verifique a fila de aprovação.")
    
    def render_history(self):
        """Renderiza histórico de tasks"""
        st.header("📊 Histórico de Tasks")
        
        # Filtros de data
        col1, col2 = st.columns(2)
        with col1:
            start_date = st.date_input("Data Início")
        with col2:
            end_date = st.date_input("Data Fim")
        
        # Simular dados históricos
        history_data = self.get_mock_history_data()
        
        if history_data:
            df = pd.DataFrame(history_data)
            
            # Métricas
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Tasks", len(df))
            with col2:
                approved = len(df[df['status'] == 'approved'])
                st.metric("Aprovadas", approved)
            with col3:
                rejected = len(df[df['status'] == 'rejected'])
                st.metric("Rejeitadas", rejected)
            with col4:
                approval_rate = (approved / len(df)) * 100 if len(df) > 0 else 0
                st.metric("Taxa Aprovação", f"{approval_rate:.1f}%")
            
            # Gráfico de timeline
            st.subheader("📈 Timeline de Tasks")
            st.line_chart(df.set_index('created_at')['quality_score'])
            
            # Tabela de histórico
            st.subheader("📋 Lista de Tasks")
            st.dataframe(df, use_container_width=True)
        else:
            st.info("Nenhum histórico disponível.")
    
    def render_settings(self):
        """Renderiza configurações"""
        st.header("⚙️ Configurações do Pipeline")
        
        # Configurações das IAs
        st.subheader("🤖 Configurações das IAs")
        
        with st.expander("Lovable IA", expanded=True):
            lovable_api_key = st.text_input("API Key", type="password", key="lovable_key")
            lovable_url = st.text_input("Base URL", value="https://api.lovable.com")
            lovable_model = st.selectbox("Modelo", ["gpt-4", "gpt-3.5-turbo", "claude-3"])
        
        with st.expander("Cursor IA", expanded=True):
            cursor_api_key = st.text_input("API Key", type="password", key="cursor_key")
            cursor_url = st.text_input("Base URL", value="https://api.cursor.com")
            cursor_model = st.selectbox("Modelo", ["gpt-4", "gpt-3.5-turbo", "claude-3"])
        
        # Configurações de deploy
        st.subheader("🚀 Configurações de Deploy")
        auto_deploy = st.checkbox("Deploy automático após aprovação")
        deploy_url = st.text_input("URL de Deploy", value="https://deploy.milapp.com")
        deploy_api_key = st.text_input("API Key de Deploy", type="password")
        
        # Configurações de qualidade
        st.subheader("🎯 Configurações de Qualidade")
        min_quality_score = st.slider("Score mínimo de qualidade", 0, 100, 70)
        require_tests = st.checkbox("Exigir testes passando", value=True)
        require_security_scan = st.checkbox("Exigir scan de segurança", value=True)
        
        # Salvar configurações
        if st.button("💾 Salvar Configurações", type="primary"):
            st.success("Configurações salvas!")
    
    def get_mock_approval_queue(self) -> List[Dict]:
        """Retorna dados mock da fila de aprovação"""
        return [
            {
                'id': 'task_20250115_143022',
                'task_description': 'Criar dashboard de métricas de automação',
                'created_at': '2025-01-15 14:30:22',
                'code_changes': {
                    'files': {
                        'src/components/MetricsDashboard.tsx': '// Componente gerado',
                        'src/hooks/useMetrics.ts': '// Hook gerado',
                        'tests/MetricsDashboard.test.tsx': '// Testes gerados'
                    }
                },
                'test_results': {
                    'unit_tests': {'passed': 8, 'total': 8},
                    'integration_tests': {'passed': 3, 'total': 3},
                    'security_scan': {'score': 95, 'vulnerabilities': 0},
                    'performance_tests': {'score': 88, 'response_time': '120ms'}
                },
                'quality_report': {
                    'overall_score': 85,
                    'complexity': 'Média',
                    'maintainability': 'Alta',
                    'test_coverage': 90,
                    'security_score': 95,
                    'performance_score': 88
                },
                'summary': 'Dashboard de métricas com 3 arquivos modificados, 100% testes passando, qualidade 85/100',
                'risk_assessment': {
                    'risk_level': 'Baixo',
                    'risks': [],
                    'recommendations': ['Aprovar sem restrições']
                },
                'status': 'pending_approval'
            },
            {
                'id': 'task_20250115_152045',
                'task_description': 'Implementar autenticação OAuth2',
                'created_at': '2025-01-15 15:20:45',
                'code_changes': {
                    'files': {
                        'backend/app/auth/oauth2.py': '// Implementação OAuth2',
                        'backend/app/models/user.py': '// Modelo atualizado',
                        'tests/test_oauth2.py': '// Testes de autenticação'
                    }
                },
                'test_results': {
                    'unit_tests': {'passed': 12, 'total': 12},
                    'integration_tests': {'passed': 5, 'total': 5},
                    'security_scan': {'score': 98, 'vulnerabilities': 0},
                    'performance_tests': {'score': 92, 'response_time': '85ms'}
                },
                'quality_report': {
                    'overall_score': 92,
                    'complexity': 'Alta',
                    'maintainability': 'Média',
                    'test_coverage': 95,
                    'security_score': 98,
                    'performance_score': 92
                },
                'summary': 'Autenticação OAuth2 com 3 arquivos modificados, 100% testes passando, qualidade 92/100',
                'risk_assessment': {
                    'risk_level': 'Médio',
                    'risks': ['Alta complexidade'],
                    'recommendations': ['Revisar documentação de segurança']
                },
                'status': 'pending_approval'
            }
        ]
    
    def get_mock_history_data(self) -> List[Dict]:
        """Retorna dados mock do histórico"""
        return [
            {
                'id': 'task_20250114_100000',
                'task_description': 'Correção de bug no login',
                'status': 'approved',
                'created_at': '2025-01-14 10:00:00',
                'quality_score': 88
            },
            {
                'id': 'task_20250114_143000',
                'task_description': 'Nova funcionalidade de export',
                'status': 'approved',
                'created_at': '2025-01-14 14:30:00',
                'quality_score': 92
            },
            {
                'id': 'task_20250114_160000',
                'task_description': 'Otimização de performance',
                'status': 'rejected',
                'created_at': '2025-01-14 16:00:00',
                'quality_score': 65
            }
        ]
    
    def approve_task(self, task_id: str, approved: bool, comments: str):
        """Aprova ou rejeita uma task"""
        # Aqui seria a chamada real para o orquestrador
        print(f"Task {task_id} {'aprovada' if approved else 'rejeitada'} com comentários: {comments}")

def main():
    """Função principal"""
    dashboard = ApprovalDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main() 
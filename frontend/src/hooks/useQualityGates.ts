import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface QualityGate {
  id: string;
  name: string;
  project_id: string;
  project_name: string;
  type: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'approved' | 'rejected';
  score: number;
  threshold: number;
  criteria: Array<{
    name: string;
    description: string;
    weight: number;
    passed: boolean;
    value: any;
  }>;
  logs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
  }>;
  executed_by?: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionConfig {
  environment: string;
  timeout: number;
  parallel: boolean;
}

export interface ApprovalData {
  decision: 'approved' | 'rejected' | 'conditional';
  comments: string;
  recommendations: string;
}

export const useQualityGates = () => {
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar quality gates
  const fetchQualityGates = useCallback(async (filters?: {
    project_id?: string;
    status?: string;
    type?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/v1/quality-gates/', { params: filters });
      setQualityGates(response.data);
    } catch (err) {
      setError('Erro ao carregar quality gates');
      console.error('Erro ao buscar quality gates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Executar quality gate
  const executeGate = useCallback(async (gateId: string, config: ExecutionConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/api/v1/quality-gates/${gateId}/execute`, config);
      
      // Atualizar o gate na lista
      setQualityGates(prev => 
        prev.map(gate => 
          gate.id === gateId 
            ? { ...gate, status: 'in_progress', executed_at: new Date().toISOString() }
            : gate
        )
      );
      
      return response.data;
    } catch (err) {
      setError('Erro ao executar quality gate');
      console.error('Erro ao executar quality gate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Aprovar quality gate
  const approveGate = useCallback(async (gateId: string, approvalData: ApprovalData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/api/v1/quality-gates/${gateId}/approve`, approvalData);
      
      // Atualizar o gate na lista
      setQualityGates(prev => 
        prev.map(gate => 
          gate.id === gateId 
            ? { ...gate, status: approvalData.decision === 'approved' ? 'approved' : 'rejected' }
            : gate
        )
      );
      
      return response.data;
    } catch (err) {
      setError('Erro ao aprovar quality gate');
      console.error('Erro ao aprovar quality gate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar detalhes de um quality gate
  const getGateDetails = useCallback(async (gateId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/quality-gates/${gateId}`);
      return response.data;
    } catch (err) {
      setError('Erro ao buscar detalhes do quality gate');
      console.error('Erro ao buscar detalhes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar novo quality gate
  const createGate = useCallback(async (gateData: {
    name: string;
    project_id: string;
    type: string;
    criteria: Array<{
      name: string;
      description: string;
      weight: number;
      threshold: any;
    }>;
    threshold: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/v1/quality-gates/', gateData);
      
      const newGate = response.data;
      setQualityGates(prev => [newGate, ...prev]);
      
      return newGate;
    } catch (err) {
      setError('Erro ao criar quality gate');
      console.error('Erro ao criar quality gate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar quality gate
  const updateGate = useCallback(async (gateId: string, updates: Partial<QualityGate>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.patch(`/api/v1/quality-gates/${gateId}`, updates);
      
      // Atualizar o gate na lista
      setQualityGates(prev => 
        prev.map(gate => 
          gate.id === gateId 
            ? { ...gate, ...updates, updated_at: new Date().toISOString() }
            : gate
        )
      );
      
      return response.data;
    } catch (err) {
      setError('Erro ao atualizar quality gate');
      console.error('Erro ao atualizar quality gate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Deletar quality gate
  const deleteGate = useCallback(async (gateId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/api/v1/quality-gates/${gateId}`);
      
      setQualityGates(prev => prev.filter(gate => gate.id !== gateId));
    } catch (err) {
      setError('Erro ao deletar quality gate');
      console.error('Erro ao deletar quality gate:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar logs de execução
  const getExecutionLogs = useCallback(async (gateId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/quality-gates/${gateId}/logs`);
      return response.data;
    } catch (err) {
      setError('Erro ao buscar logs de execução');
      console.error('Erro ao buscar logs:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar quality gate
  const exportGate = useCallback(async (gateId: string, format: 'pdf' | 'json' | 'csv' = 'pdf') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/quality-gates/${gateId}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quality-gate-${gateId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erro ao exportar quality gate');
      console.error('Erro ao exportar quality gate:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar métricas de quality gates
  const getGateMetrics = useCallback(async (period: string = '30d') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/v1/quality-gates/metrics', {
        params: { period }
      });
      return response.data;
    } catch (err) {
      setError('Erro ao buscar métricas');
      console.error('Erro ao buscar métricas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar histórico de aprovações
  const getApprovalHistory = useCallback(async (gateId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/quality-gates/${gateId}/approvals`);
      return response.data;
    } catch (err) {
      setError('Erro ao buscar histórico de aprovações');
      console.error('Erro ao buscar histórico:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar critérios automáticos
  const configureAutoCriteria = useCallback(async (gateId: string, criteria: Array<{
    name: string;
    type: 'performance' | 'security' | 'quality' | 'compliance';
    threshold: any;
    weight: number;
  }>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/api/v1/quality-gates/${gateId}/criteria`, criteria);
      
      // Atualizar o gate na lista
      setQualityGates(prev => 
        prev.map(gate => 
          gate.id === gateId 
            ? { ...gate, criteria: response.data.criteria }
            : gate
        )
      );
      
      return response.data;
    } catch (err) {
      setError('Erro ao configurar critérios');
      console.error('Erro ao configurar critérios:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Agendar execução
  const scheduleExecution = useCallback(async (gateId: string, schedule: {
    cron_expression: string;
    timezone: string;
    enabled: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/api/v1/quality-gates/${gateId}/schedule`, schedule);
      return response.data;
    } catch (err) {
      setError('Erro ao agendar execução');
      console.error('Erro ao agendar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancelar execução agendada
  const cancelScheduledExecution = useCallback(async (gateId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/api/v1/quality-gates/${gateId}/schedule`);
    } catch (err) {
      setError('Erro ao cancelar execução agendada');
      console.error('Erro ao cancelar execução:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar status em tempo real
  const getRealTimeStatus = useCallback(async (gateId: string) => {
    try {
      const response = await api.get(`/api/v1/quality-gates/${gateId}/status`);
      return response.data;
    } catch (err) {
      console.error('Erro ao buscar status em tempo real:', err);
      throw err;
    }
  }, []);

  // Atualizar gate localmente (para otimização)
  const updateGateLocally = useCallback((gateId: string, updates: Partial<QualityGate>) => {
    setQualityGates(prev => 
      prev.map(gate => 
        gate.id === gateId 
          ? { ...gate, ...updates }
          : gate
      )
    );
  }, []);

  return {
    // Estado
    qualityGates,
    loading,
    error,
    
    // Ações principais
    fetchQualityGates,
    executeGate,
    approveGate,
    getGateDetails,
    
    // CRUD
    createGate,
    updateGate,
    deleteGate,
    
    // Funcionalidades avançadas
    getExecutionLogs,
    exportGate,
    getGateMetrics,
    getApprovalHistory,
    configureAutoCriteria,
    scheduleExecution,
    cancelScheduledExecution,
    getRealTimeStatus,
    
    // Otimizações
    updateGateLocally,
  };
}; 
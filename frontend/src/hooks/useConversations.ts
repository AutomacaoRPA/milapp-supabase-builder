import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface Conversation {
  id: string;
  title: string;
  project_id?: string;
  status: 'active' | 'archived' | 'completed';
  ai_summary?: string;
  extracted_requirements: Array<{
    type: string;
    name: string;
    description: string;
    complexity: string;
    priority: string;
  }>;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  attachments?: Array<{
    type: 'image' | 'document' | 'audio' | 'video';
    name: string;
    url: string;
  }>;
  metadata?: {
    project_id?: string;
    requirements_extracted?: boolean;
    confidence_score?: number;
  };
}

export interface ConversationAnalysis {
  summary: string;
  requirements: Array<{
    type: string;
    name: string;
    description: string;
    complexity: string;
    priority: string;
  }>;
  recommended_tools: string[];
  estimated_roi: string;
  next_steps: string[];
  confidence_score: number;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar conversas do usuário
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/v1/conversations/');
      setConversations(response.data);
    } catch (err) {
      setError('Erro ao carregar conversas');
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova conversa
  const createConversation = useCallback(async (title: string, project_id?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/v1/conversations/', {
        title,
        project_id,
      });
      
      const newConversation = response.data;
      setConversations(prev => [newConversation, ...prev]);
      
      return newConversation;
    } catch (err) {
      setError('Erro ao criar conversa');
      console.error('Erro ao criar conversa:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar mensagens de uma conversa
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}/messages`);
      setMessages(response.data);
    } catch (err) {
      setError('Erro ao carregar mensagens');
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    attachments?: File[],
    project_id?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Preparar dados da mensagem
      const messageData = {
        content,
        project_id,
      };

      // Se há anexos, fazer upload primeiro
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(file => {
          formData.append('files', file);
        });
        
        const uploadResponse = await api.post('/api/v1/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        messageData.attachments = uploadResponse.data.files;
      }

      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, messageData);
      
      const newMessage = response.data;
      setMessages(prev => [...prev, newMessage]);
      
      return newMessage;
    } catch (err) {
      setError('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analisar conversa completa
  const analyzeConversation = useCallback(async (conversationId: string): Promise<ConversationAnalysis> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/api/v1/conversations/${conversationId}/analyze`);
      
      // Atualizar conversa com análise
      const analysis = response.data;
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, ai_summary: analysis.summary, extracted_requirements: analysis.requirements }
            : conv
        )
      );
      
      return analysis;
    } catch (err) {
      setError('Erro ao analisar conversa');
      console.error('Erro ao analisar conversa:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Arquivar conversa
  const archiveConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.patch(`/api/v1/conversations/${conversationId}`, {
        status: 'archived'
      });
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status: 'archived' }
            : conv
        )
      );
    } catch (err) {
      setError('Erro ao arquivar conversa');
      console.error('Erro ao arquivar conversa:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Deletar conversa
  const deleteConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/api/v1/conversations/${conversationId}`);
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setMessages(prev => prev.filter(msg => msg.conversation_id !== conversationId));
    } catch (err) {
      setError('Erro ao deletar conversa');
      console.error('Erro ao deletar conversa:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar conversa
  const exportConversation = useCallback(async (conversationId: string, format: 'pdf' | 'docx' | 'json' = 'pdf') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `conversa-${conversationId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erro ao exportar conversa');
      console.error('Erro ao exportar conversa:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compartilhar conversa
  const shareConversation = useCallback(async (conversationId: string, recipients: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post(`/api/v1/conversations/${conversationId}/share`, {
        recipients,
      });
    } catch (err) {
      setError('Erro ao compartilhar conversa');
      console.error('Erro ao compartilhar conversa:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar conversas por projeto
  const fetchConversationsByProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/conversations/`, {
        params: { project_id: projectId }
      });
      setConversations(response.data);
    } catch (err) {
      setError('Erro ao carregar conversas do projeto');
      console.error('Erro ao buscar conversas do projeto:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar conversas por status
  const fetchConversationsByStatus = useCallback(async (status: 'active' | 'archived' | 'completed') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/conversations/`, {
        params: { status }
      });
      setConversations(response.data);
    } catch (err) {
      setError('Erro ao carregar conversas');
      console.error('Erro ao buscar conversas por status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpar mensagens de uma conversa
  const clearMessages = useCallback((conversationId: string) => {
    setMessages(prev => prev.filter(msg => msg.conversation_id !== conversationId));
  }, []);

  // Adicionar mensagem localmente (para otimização)
  const addMessageLocally = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Atualizar mensagem localmente
  const updateMessageLocally = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
    );
  }, []);

  // Remover mensagem localmente
  const removeMessageLocally = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  return {
    // Estado
    conversations,
    messages,
    loading,
    error,
    
    // Ações principais
    fetchConversations,
    createConversation,
    fetchMessages,
    sendMessage,
    analyzeConversation,
    
    // Gerenciamento de conversas
    archiveConversation,
    deleteConversation,
    exportConversation,
    shareConversation,
    
    // Buscas específicas
    fetchConversationsByProject,
    fetchConversationsByStatus,
    
    // Gerenciamento local de mensagens
    clearMessages,
    addMessageLocally,
    updateMessageLocally,
    removeMessageLocally,
  };
}; 
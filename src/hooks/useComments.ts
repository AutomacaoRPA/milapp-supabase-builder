import { useState, useCallback } from 'react';
import { Comment } from '@/components/CommentSystem';

export const useComments = (projectId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const addComment = useCallback(async (commentData: {
    content: string;
    type: 'comment' | 'update' | 'blocker' | 'solution';
    parent_id?: string;
  }) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      content: commentData.content,
      author: 'Usuário Atual', // TODO: Integrar com sistema de autenticação
      created_at: new Date().toISOString(),
      type: commentData.type,
      parent_id: commentData.parent_id,
      replies: [],
    };

    if (commentData.parent_id) {
      // Adicionar como resposta
      setComments(prev => prev.map(comment => {
        if (comment.id === commentData.parent_id) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment]
          };
        }
        return comment;
      }));
    } else {
      // Adicionar como comentário principal
      setComments(prev => [...prev, newComment]);
    }

    // TODO: Salvar no backend
    console.log('Comentário adicionado:', newComment);
  }, []);

  const editComment = useCallback(async (commentId: string, content: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, content };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, content } : reply
          )
        };
      }
      return comment;
    }));

    // TODO: Atualizar no backend
    console.log('Comentário editado:', commentId, content);
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));

    // TODO: Remover do backend
    console.log('Comentário removido:', commentId);
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Carregar comentários do backend
      // Mock data para demonstração
      const mockComments: Comment[] = [
        {
          id: '1',
          content: 'Projeto iniciado com sucesso!',
          author: 'João Silva',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          type: 'update',
          replies: []
        },
        {
          id: '2',
          content: 'Precisamos definir melhor os requisitos técnicos',
          author: 'Maria Santos',
          created_at: new Date(Date.now() - 43200000).toISOString(),
          type: 'comment',
          replies: [
            {
              id: '2.1',
              content: 'Concordo, vamos agendar uma reunião',
              author: 'Pedro Costa',
              created_at: new Date(Date.now() - 21600000).toISOString(),
              type: 'comment',
            }
          ]
        }
      ];
      
      setComments(mockComments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    comments,
    loading,
    addComment,
    editComment,
    deleteComment,
    loadComments,
  };
}; 
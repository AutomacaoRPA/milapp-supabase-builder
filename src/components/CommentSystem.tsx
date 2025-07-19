import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Trash2,
  Reply,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Comment {
  id: string;
  content: string;
  author: string;
  author_avatar?: string;
  created_at: string;
  type: 'comment' | 'update' | 'blocker' | 'solution';
  parent_id?: string;
  replies?: Comment[];
}

export interface CommentSystemProps {
  comments: Comment[];
  onAddComment: (comment: {
    content: string;
    type: 'comment' | 'update' | 'blocker' | 'solution';
    parent_id?: string;
  }) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUser: string;
}

const CommentSystem: React.FC<CommentSystemProps> = ({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  currentUser,
}) => {
  const [newComment, setNewComment] = useState<string>("");
  const [commentType, setCommentType] = useState<'comment' | 'update' | 'blocker' | 'solution'>('comment');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");

  const handleSubmitComment = (): void => {
    if (newComment.trim()) {
      onAddComment({
        content: newComment,
        type: commentType,
      });
      setNewComment("");
      setCommentType('comment');
    }
  };

  const handleEditComment = (commentId: string): void => {
    const comment = comments.find((c: Comment) => c.id === commentId);
    if (comment) {
      setEditContent(comment.content);
      setEditingComment(commentId);
    }
  };

  const handleSaveEdit = (): void => {
    if (editingComment && editContent.trim()) {
      onEditComment(editingComment, editContent);
      setEditingComment(null);
      setEditContent("");
    }
  };

  const handleReply = (commentId: string): void => {
    setReplyingTo(commentId);
  };

  const handleSubmitReply = (): void => {
    if (replyingTo && replyContent.trim()) {
      onAddComment({
        content: replyContent,
        type: 'comment',
        parent_id: replyingTo,
      });
      setReplyingTo(null);
      setReplyContent("");
    }
  };

  const getTypeIcon = (type: string): React.ReactElement => {
    switch (type) {
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'blocker':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'solution':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'blocker':
        return 'bg-red-100 text-red-800';
      case 'solution':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderComment = (comment: Comment, isReply = false): React.ReactElement => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author_avatar} alt={comment.author} />
          <AvatarFallback>
            {comment.author.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author}</span>
            <Badge className={getTypeColor(comment.type)}>
              {getTypeIcon(comment.type)}
              <span className="ml-1">
                {comment.type === 'update' ? 'Atualização' :
                 comment.type === 'blocker' ? 'Bloqueio' :
                 comment.type === 'solution' ? 'Solução' : 'Comentário'}
              </span>
            </Badge>
            <span className="text-xs text-gray-500">
              {formatDate(comment.created_at)}
            </span>
          </div>
          
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Salvar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditingComment(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReply(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Responder
            </Button>
            
            {comment.author === currentUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditComment(comment.id)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-3 p-3 bg-gray-50 rounded-lg">
          <Textarea
            value={replyContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
            placeholder="Escreva sua resposta..."
            rows={2}
            className="resize-none mb-2"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmitReply}>
              Responder
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setReplyingTo(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply: Comment) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comentários e Atualizações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={commentType === 'comment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('comment')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comentário
            </Button>
            <Button
              variant={commentType === 'update' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('update')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Atualização
            </Button>
            <Button
              variant={commentType === 'blocker' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('blocker')}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Bloqueio
            </Button>
            <Button
              variant={commentType === 'solution' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('solution')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Solução
            </Button>
          </div>
          
          <Textarea
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
            placeholder={`Adicione um ${commentType}...`}
            rows={3}
            className="resize-none"
          />
          
          <div className="flex justify-end">
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              Enviar {commentType === 'comment' ? 'Comentário' :
                      commentType === 'update' ? 'Atualização' :
                      commentType === 'blocker' ? 'Bloqueio' : 'Solução'}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-2">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map((comment: Comment) => renderComment(comment))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentSystem; 
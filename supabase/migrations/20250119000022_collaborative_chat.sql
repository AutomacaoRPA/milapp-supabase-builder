-- =====================================================
-- MILAPP MedSênior - Sistema de Chat Interno Colaborativo
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE CANAIS DE CHAT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    channel_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Tipo de canal
    channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN (
        'general', 'project', 'workflow', 'department', 'team', 'private', 'support'
    )),
    
    -- Relacionamentos
    project_id UUID REFERENCES public.projects(id),
    workflow_id UUID REFERENCES public.workflows(id),
    department VARCHAR(100),
    
    -- Configuração
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    
    -- Configurações de acesso
    allowed_roles TEXT[],
    allowed_users UUID[],
    
    -- Configurações de moderação
    moderation_enabled BOOLEAN DEFAULT false,
    slow_mode_seconds INTEGER DEFAULT 0, -- Tempo mínimo entre mensagens
    max_message_length INTEGER DEFAULT 1000,
    
    -- Estatísticas
    member_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON public.chat_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_project ON public.chat_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_workflow ON public.chat_channels(workflow_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_active ON public.chat_channels(is_active);

-- =====================================================
-- 2. TABELA DE MEMBROS DOS CANAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    
    -- Status
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN (
        'owner', 'admin', 'moderator', 'member', 'readonly'
    )),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active', 'muted', 'banned', 'left'
    )),
    
    -- Configurações pessoais
    notifications_enabled BOOLEAN DEFAULT true,
    mention_notifications BOOLEAN DEFAULT true,
    last_read_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Controle
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(channel_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_members_channel ON public.chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_role ON public.chat_channel_members(role);

-- =====================================================
-- 3. TABELA DE MENSAGENS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id),
    reply_to_id UUID REFERENCES public.chat_messages(id),
    
    -- Conteúdo
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN (
        'text', 'image', 'file', 'system', 'workflow_update', 'mention', 'reaction'
    )),
    content TEXT NOT NULL,
    content_structured JSONB DEFAULT '{}', -- Para mensagens estruturadas
    
    -- Metadados
    mentions UUID[], -- Usuários mencionados
    tags TEXT[], -- Tags da mensagem
    attachments JSONB DEFAULT '[]', -- Anexos (URLs, metadados)
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    
    -- Moderação
    moderation_status VARCHAR(50) DEFAULT 'approved' CHECK (moderation_status IN (
        'pending', 'approved', 'rejected', 'flagged'
    )),
    moderated_by UUID REFERENCES public.users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_reason TEXT,
    
    -- Estatísticas
    reaction_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON public.chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON public.chat_messages USING GIN(mentions);

-- =====================================================
-- 4. TABELA DE REAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    
    -- Reação
    reaction_type VARCHAR(50) NOT NULL, -- '👍', '❤️', '😄', etc.
    reaction_name VARCHAR(100), -- Nome descritivo da reação
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, reaction_type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON public.chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user ON public.chat_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_type ON public.chat_reactions(reaction_type);

-- =====================================================
-- 5. TABELA DE THREADS DE CONVERSA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    parent_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    
    -- Configuração
    thread_name VARCHAR(255),
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Estatísticas
    message_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_threads_parent ON public.chat_threads(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_channel ON public.chat_threads(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_resolved ON public.chat_threads(is_resolved);

-- =====================================================
-- 6. TABELA DE NOTIFICAÇÕES DE CHAT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id),
    channel_id UUID REFERENCES public.chat_channels(id),
    message_id UUID REFERENCES public.chat_messages(id),
    
    -- Tipo de notificação
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'mention', 'reply', 'reaction', 'channel_activity', 'direct_message'
    )),
    
    -- Conteúdo
    title VARCHAR(255),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_notifications_user ON public.chat_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_read ON public.chat_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_created_at ON public.chat_notifications(created_at);

-- =====================================================
-- 7. FUNÇÕES DE CHAT
-- =====================================================

-- Função para criar canal de chat
CREATE OR REPLACE FUNCTION public.create_chat_channel(
    p_channel_name VARCHAR(100),
    p_display_name VARCHAR(255),
    p_channel_type VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    channel_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    INSERT INTO public.chat_channels (
        channel_name,
        display_name,
        description,
        channel_type,
        project_id,
        workflow_id,
        department,
        is_public,
        moderation_enabled,
        slow_mode_seconds,
        max_message_length,
        allowed_roles,
        allowed_users,
        created_by
    ) VALUES (
        p_channel_name,
        p_display_name,
        p_description,
        p_channel_type,
        (p_config->>'project_id')::UUID,
        (p_config->>'workflow_id')::UUID,
        p_config->>'department',
        COALESCE((p_config->>'is_public')::BOOLEAN, true),
        COALESCE((p_config->>'moderation_enabled')::BOOLEAN, false),
        (p_config->>'slow_mode_seconds')::INTEGER,
        (p_config->>'max_message_length')::INTEGER,
        ARRAY(SELECT jsonb_array_elements_text(p_config->'allowed_roles')),
        ARRAY(SELECT jsonb_array_elements_text(p_config->'allowed_users')::UUID),
        current_user_id
    ) RETURNING id INTO channel_id;
    
    -- Adicionar criador como owner
    INSERT INTO public.chat_channel_members (
        channel_id,
        user_id,
        role
    ) VALUES (
        channel_id,
        current_user_id,
        'owner'
    );
    
    -- Atualizar contador de membros
    UPDATE public.chat_channels
    SET member_count = 1
    WHERE id = channel_id;
    
    RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- Função para enviar mensagem
CREATE OR REPLACE FUNCTION public.send_chat_message(
    p_channel_id UUID,
    p_content TEXT,
    p_message_type VARCHAR(50) DEFAULT 'text',
    p_reply_to_id UUID DEFAULT NULL,
    p_mentions UUID[] DEFAULT NULL,
    p_attachments JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    current_user_id UUID;
    channel_record RECORD;
    member_record RECORD;
    last_message_time TIMESTAMP WITH TIME ZONE;
BEGIN
    current_user_id := auth.uid();
    
    -- Verificar se usuário é membro do canal
    SELECT * INTO member_record
    FROM public.chat_channel_members
    WHERE channel_id = p_channel_id
    AND user_id = current_user_id
    AND status = 'active';
    
    IF member_record IS NULL THEN
        RAISE EXCEPTION 'Usuário não é membro do canal';
    END IF;
    
    -- Obter dados do canal
    SELECT * INTO channel_record
    FROM public.chat_channels
    WHERE id = p_channel_id
    AND is_active = true;
    
    IF channel_record IS NULL THEN
        RAISE EXCEPTION 'Canal não encontrado ou inativo';
    END IF;
    
    -- Verificar slow mode
    IF channel_record.slow_mode_seconds > 0 THEN
        SELECT MAX(created_at) INTO last_message_time
        FROM public.chat_messages
        WHERE sender_id = current_user_id
        AND channel_id = p_channel_id
        AND created_at > NOW() - INTERVAL '1 hour';
        
        IF last_message_time IS NOT NULL AND 
           last_message_time > NOW() - (channel_record.slow_mode_seconds * INTERVAL '1 second') THEN
            RAISE EXCEPTION 'Slow mode ativo. Aguarde antes de enviar outra mensagem.';
        END IF;
    END IF;
    
    -- Verificar limite de caracteres
    IF LENGTH(p_content) > channel_record.max_message_length THEN
        RAISE EXCEPTION 'Mensagem muito longa. Máximo: % caracteres', channel_record.max_message_length;
    END IF;
    
    -- Inserir mensagem
    INSERT INTO public.chat_messages (
        channel_id,
        sender_id,
        reply_to_id,
        message_type,
        content,
        mentions,
        attachments,
        moderation_status
    ) VALUES (
        p_channel_id,
        current_user_id,
        p_reply_to_id,
        p_message_type,
        p_content,
        p_mentions,
        p_attachments,
        CASE 
            WHEN channel_record.moderation_enabled THEN 'pending'
            ELSE 'approved'
        END
    ) RETURNING id INTO message_id;
    
    -- Atualizar estatísticas do canal
    UPDATE public.chat_channels
    SET message_count = message_count + 1,
        last_activity_at = NOW()
    WHERE id = p_channel_id;
    
    -- Criar notificações para menções
    IF p_mentions IS NOT NULL THEN
        PERFORM public.create_mention_notifications(message_id, p_mentions);
    END IF;
    
    -- Criar notificações para outros membros
    PERFORM public.create_channel_notifications(p_channel_id, message_id, current_user_id);
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificações de menção
CREATE OR REPLACE FUNCTION public.create_mention_notifications(
    p_message_id UUID,
    p_mentions UUID[]
)
RETURNS VOID AS $$
DECLARE
    mentioned_user UUID;
    message_record RECORD;
BEGIN
    -- Obter dados da mensagem
    SELECT * INTO message_record
    FROM public.chat_messages
    WHERE id = p_message_id;
    
    -- Criar notificação para cada usuário mencionado
    FOREACH mentioned_user IN ARRAY p_mentions
    LOOP
        INSERT INTO public.chat_notifications (
            user_id,
            channel_id,
            message_id,
            notification_type,
            title,
            message
        ) VALUES (
            mentioned_user,
            message_record.channel_id,
            p_message_id,
            'mention',
            'Você foi mencionado',
            'Você foi mencionado em uma mensagem do canal'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificações de canal
CREATE OR REPLACE FUNCTION public.create_channel_notifications(
    p_channel_id UUID,
    p_message_id UUID,
    p_sender_id UUID
)
RETURNS VOID AS $$
DECLARE
    member_record RECORD;
    message_record RECORD;
BEGIN
    -- Obter dados da mensagem
    SELECT * INTO message_record
    FROM public.chat_messages
    WHERE id = p_message_id;
    
    -- Criar notificação para membros do canal (exceto o remetente)
    FOR member_record IN
        SELECT user_id
        FROM public.chat_channel_members
        WHERE channel_id = p_channel_id
        AND user_id != p_sender_id
        AND notifications_enabled = true
        AND status = 'active'
    LOOP
        INSERT INTO public.chat_notifications (
            user_id,
            channel_id,
            message_id,
            notification_type,
            title,
            message
        ) VALUES (
            member_record.user_id,
            p_channel_id,
            p_message_id,
            'channel_activity',
            'Nova mensagem no canal',
            'Há uma nova mensagem no canal'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar reação
CREATE OR REPLACE FUNCTION public.add_chat_reaction(
    p_message_id UUID,
    p_reaction_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    reaction_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Verificar se já existe a reação
    IF EXISTS (
        SELECT 1 FROM public.chat_reactions
        WHERE message_id = p_message_id
        AND user_id = current_user_id
        AND reaction_type = p_reaction_type
    ) THEN
        -- Remover reação existente
        DELETE FROM public.chat_reactions
        WHERE message_id = p_message_id
        AND user_id = current_user_id
        AND reaction_type = p_reaction_type;
        
        -- Atualizar contador
        UPDATE public.chat_messages
        SET reaction_count = reaction_count - 1
        WHERE id = p_message_id;
        
        RETURN false;
    ELSE
        -- Adicionar nova reação
        INSERT INTO public.chat_reactions (
            message_id,
            user_id,
            reaction_type
        ) VALUES (
            p_message_id,
            current_user_id,
            p_reaction_type
        ) RETURNING id INTO reaction_id;
        
        -- Atualizar contador
        UPDATE public.chat_messages
        SET reaction_count = reaction_count + 1
        WHERE id = p_message_id;
        
        -- Criar notificação para o autor da mensagem
        INSERT INTO public.chat_notifications (
            user_id,
            channel_id,
            message_id,
            notification_type,
            title,
            message
        ) VALUES (
            (SELECT sender_id FROM public.chat_messages WHERE id = p_message_id),
            (SELECT channel_id FROM public.chat_messages WHERE id = p_message_id),
            p_message_id,
            'reaction',
            'Nova reação',
            'Sua mensagem recebeu uma nova reação'
        );
        
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION public.mark_chat_messages_read(
    p_channel_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    current_user_id UUID;
    updated_count INTEGER;
BEGIN
    current_user_id := auth.uid();
    
    -- Marcar notificações como lidas
    UPDATE public.chat_notifications
    SET is_read = true,
        read_at = NOW()
    WHERE user_id = current_user_id
    AND channel_id = p_channel_id
    AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Atualizar último acesso do membro
    UPDATE public.chat_channel_members
    SET last_read_at = NOW(),
        last_activity_at = NOW()
    WHERE channel_id = p_channel_id
    AND user_id = current_user_id;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. DADOS INICIAIS
-- =====================================================

-- Inserir canais padrão
INSERT INTO public.chat_channels (
    channel_name,
    display_name,
    description,
    channel_type,
    is_public,
    created_by
) VALUES 
(
    'general',
    'Geral',
    'Canal geral para discussões da empresa',
    'general',
    true,
    (SELECT id FROM public.users LIMIT 1)
),
(
    'suporte',
    'Suporte',
    'Canal para solicitações de suporte e ajuda',
    'support',
    true,
    (SELECT id FROM public.users LIMIT 1)
),
(
    'desenvolvimento',
    'Desenvolvimento',
    'Canal para discussões técnicas e desenvolvimento',
    'department',
    true,
    (SELECT id FROM public.users LIMIT 1)
);

-- =====================================================
-- 9. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para canais mais ativos
CREATE OR REPLACE VIEW public.active_chat_channels AS
SELECT 
    cc.channel_name,
    cc.display_name,
    cc.channel_type,
    cc.member_count,
    cc.message_count,
    cc.last_activity_at,
    COUNT(cm.id) FILTER (WHERE cm.created_at >= NOW() - INTERVAL '24 hours') as messages_24h
FROM public.chat_channels cc
LEFT JOIN public.chat_messages cm ON cc.id = cm.channel_id
WHERE cc.is_active = true
GROUP BY cc.id, cc.channel_name, cc.display_name, cc.channel_type, cc.member_count, cc.message_count, cc.last_activity_at
ORDER BY messages_24h DESC, cc.last_activity_at DESC;

-- View para usuários mais ativos no chat
CREATE OR REPLACE VIEW public.active_chat_users AS
SELECT 
    u.email,
    u.full_name,
    COUNT(cm.id) as total_messages,
    COUNT(cm.id) FILTER (WHERE cm.created_at >= NOW() - INTERVAL '7 days') as messages_7d,
    COUNT(cr.id) as total_reactions,
    MAX(cm.created_at) as last_message
FROM public.users u
LEFT JOIN public.chat_messages cm ON u.id = cm.sender_id
LEFT JOIN public.chat_reactions cr ON u.id = cr.user_id
GROUP BY u.id, u.email, u.full_name
ORDER BY messages_7d DESC, total_messages DESC;

-- View para notificações não lidas
CREATE OR REPLACE VIEW public.unread_chat_notifications AS
SELECT 
    cn.id,
    cn.notification_type,
    cn.title,
    cn.message,
    cn.created_at,
    cc.display_name as channel_name,
    u.email as sender_email
FROM public.chat_notifications cn
JOIN public.chat_channels cc ON cn.channel_id = cc.id
LEFT JOIN public.chat_messages cm ON cn.message_id = cm.id
LEFT JOIN public.users u ON cm.sender_id = u.id
WHERE cn.is_read = false
ORDER BY cn.created_at DESC;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION public.trigger_update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_channel_timestamp
    BEFORE UPDATE ON public.chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_chat_timestamp();

CREATE TRIGGER trigger_update_message_timestamp
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_chat_timestamp();

-- Trigger para atualizar contadores
CREATE OR REPLACE FUNCTION public.trigger_update_chat_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Atualizar contador de mensagens do canal
        UPDATE public.chat_channels
        SET message_count = message_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.channel_id;
        
        -- Atualizar contador de replies
        IF NEW.reply_to_id IS NOT NULL THEN
            UPDATE public.chat_messages
            SET reply_count = reply_count + 1
            WHERE id = NEW.reply_to_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Atualizar contador de mensagens do canal
        UPDATE public.chat_channels
        SET message_count = message_count - 1
        WHERE id = OLD.channel_id;
        
        -- Atualizar contador de replies
        IF OLD.reply_to_id IS NOT NULL THEN
            UPDATE public.chat_messages
            SET reply_count = reply_count - 1
            WHERE id = OLD.reply_to_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_counters
    AFTER INSERT OR DELETE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_chat_counters();

-- =====================================================
-- 11. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_channels
CREATE POLICY "chat_channels_access" ON public.chat_channels
    FOR SELECT USING (
        is_public = true OR
        id IN (
            SELECT channel_id FROM public.chat_channel_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Políticas para chat_channel_members
CREATE POLICY "chat_members_access" ON public.chat_channel_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        channel_id IN (
            SELECT id FROM public.chat_channels
            WHERE is_public = true
        )
    );

-- Políticas para chat_messages
CREATE POLICY "chat_messages_access" ON public.chat_messages
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM public.chat_channel_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Políticas para chat_reactions
CREATE POLICY "chat_reactions_access" ON public.chat_reactions
    FOR ALL USING (
        message_id IN (
            SELECT id FROM public.chat_messages
            WHERE channel_id IN (
                SELECT channel_id FROM public.chat_channel_members
                WHERE user_id = auth.uid()
                AND status = 'active'
            )
        )
    );

-- Políticas para chat_notifications
CREATE POLICY "chat_notifications_own_access" ON public.chat_notifications
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- FIM DO SISTEMA DE CHAT COLABORATIVO
-- ===================================================== 
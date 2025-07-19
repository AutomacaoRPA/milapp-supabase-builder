-- =====================================================
-- MILAPP MedSênior - Sistema de Versionamento Corporativo
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. EXTENSÃO PARA VERSIONAMENTO
-- =====================================================

-- Função para gerar versão semântica
CREATE OR REPLACE FUNCTION public.generate_semantic_version(
    p_major INTEGER DEFAULT 1,
    p_minor INTEGER DEFAULT 0,
    p_patch INTEGER DEFAULT 0
)
RETURNS VARCHAR(20) AS $$
DECLARE
    version_str VARCHAR(20);
BEGIN
    version_str := p_major || '.' || p_minor || '.' || p_patch;
    RETURN version_str;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar versão
CREATE OR REPLACE FUNCTION public.increment_version(
    p_current_version VARCHAR(20),
    p_version_type VARCHAR(10) DEFAULT 'patch'
)
RETURNS VARCHAR(20) AS $$
DECLARE
    major_part INTEGER;
    minor_part INTEGER;
    patch_part INTEGER;
    new_version VARCHAR(20);
BEGIN
    -- Extrair partes da versão
    major_part := SPLIT_PART(p_current_version, '.', 1)::INTEGER;
    minor_part := SPLIT_PART(p_current_version, '.', 2)::INTEGER;
    patch_part := SPLIT_PART(p_current_version, '.', 3)::INTEGER;
    
    -- Incrementar baseado no tipo
    CASE p_version_type
        WHEN 'major' THEN
            major_part := major_part + 1;
            minor_part := 0;
            patch_part := 0;
        WHEN 'minor' THEN
            minor_part := minor_part + 1;
            patch_part := 0;
        WHEN 'patch' THEN
            patch_part := patch_part + 1;
        ELSE
            patch_part := patch_part + 1;
    END CASE;
    
    new_version := major_part || '.' || minor_part || '.' || patch_part;
    RETURN new_version;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TABELA DE VERSÕES GLOBAL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entity_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação da entidade
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'workflow', 'document', 'pop', 'action_plan', 'nonconformity', 'kpi', 'template'
    )),
    entity_id UUID NOT NULL,
    
    -- Controle de versão
    version VARCHAR(20) NOT NULL,
    version_type VARCHAR(10) DEFAULT 'patch' CHECK (version_type IN (
        'major', 'minor', 'patch'
    )),
    is_latest BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Dados da versão
    version_data JSONB NOT NULL, -- Dados completos da entidade
    version_metadata JSONB DEFAULT '{}', -- Metadados da versão
    
    -- Histórico
    change_summary TEXT,
    change_reason VARCHAR(255),
    previous_version_id UUID REFERENCES public.entity_versions(id),
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices
    UNIQUE(entity_type, entity_id, version)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_entity_versions_entity ON public.entity_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_versions_latest ON public.entity_versions(entity_type, entity_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_entity_versions_active ON public.entity_versions(entity_type, entity_id, is_active);

-- =====================================================
-- 3. ATUALIZAR TABELAS EXISTENTES COM VERSIONAMENTO
-- =====================================================

-- Adicionar campos de versionamento às tabelas existentes
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS version_type VARCHAR(10) DEFAULT 'patch',
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS change_summary TEXT,
ADD COLUMN IF NOT EXISTS change_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES public.workflows(id);

ALTER TABLE public.quality_documents 
ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS version_type VARCHAR(10) DEFAULT 'patch',
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS change_summary TEXT,
ADD COLUMN IF NOT EXISTS change_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES public.quality_documents(id);

ALTER TABLE public.quality_pops 
ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS version_type VARCHAR(10) DEFAULT 'patch',
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS change_summary TEXT,
ADD COLUMN IF NOT EXISTS change_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES public.quality_pops(id);

ALTER TABLE public.quality_action_plans 
ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS version_type VARCHAR(10) DEFAULT 'patch',
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS change_summary TEXT,
ADD COLUMN IF NOT EXISTS change_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES public.quality_action_plans(id);

-- =====================================================
-- 4. FUNÇÕES DE VERSIONAMENTO
-- =====================================================

-- Função para criar nova versão
CREATE OR REPLACE FUNCTION public.create_new_version(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_version_type VARCHAR(10) DEFAULT 'patch',
    p_change_summary TEXT DEFAULT NULL,
    p_change_reason VARCHAR(255) DEFAULT NULL,
    p_version_data JSONB DEFAULT NULL
)
RETURNS VARCHAR(20) AS $$
DECLARE
    current_version VARCHAR(20);
    new_version VARCHAR(20);
    current_version_id UUID;
BEGIN
    -- Obter versão atual
    SELECT version, id INTO current_version, current_version_id
    FROM public.entity_versions
    WHERE entity_type = p_entity_type 
    AND entity_id = p_entity_id 
    AND is_latest = true
    LIMIT 1;
    
    -- Se não existe versão, criar primeira
    IF current_version IS NULL THEN
        new_version := '1.0.0';
    ELSE
        new_version := public.increment_version(current_version, p_version_type);
    END IF;
    
    -- Desativar versão anterior
    UPDATE public.entity_versions
    SET is_latest = false
    WHERE entity_type = p_entity_type 
    AND entity_id = p_entity_id 
    AND is_latest = true;
    
    -- Criar nova versão
    INSERT INTO public.entity_versions (
        entity_type,
        entity_id,
        version,
        version_type,
        is_latest,
        version_data,
        change_summary,
        change_reason,
        previous_version_id,
        created_by
    ) VALUES (
        p_entity_type,
        p_entity_id,
        new_version,
        p_version_type,
        true,
        COALESCE(p_version_data, '{}'),
        p_change_summary,
        p_change_reason,
        current_version_id,
        auth.uid()
    );
    
    -- Atualizar tabela principal
    CASE p_entity_type
        WHEN 'workflow' THEN
            UPDATE public.workflows 
            SET version = new_version,
                version_type = p_version_type,
                change_summary = p_change_summary,
                change_reason = p_change_reason,
                previous_version_id = current_version_id
            WHERE id = p_entity_id;
        WHEN 'document' THEN
            UPDATE public.quality_documents 
            SET version = new_version,
                version_type = p_version_type,
                change_summary = p_change_summary,
                change_reason = p_change_reason,
                previous_version_id = current_version_id
            WHERE id = p_entity_id;
        WHEN 'pop' THEN
            UPDATE public.quality_pops 
            SET version = new_version,
                version_type = p_version_type,
                change_summary = p_change_summary,
                change_reason = p_change_reason,
                previous_version_id = current_version_id
            WHERE id = p_entity_id;
        WHEN 'action_plan' THEN
            UPDATE public.quality_action_plans 
            SET version = new_version,
                version_type = p_version_type,
                change_summary = p_change_summary,
                change_reason = p_change_reason,
                previous_version_id = current_version_id
            WHERE id = p_entity_id;
    END CASE;
    
    RETURN new_version;
END;
$$ LANGUAGE plpgsql;

-- Função para restaurar versão anterior
CREATE OR REPLACE FUNCTION public.restore_version(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_target_version VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    version_data JSONB;
    restored_version VARCHAR(20);
BEGIN
    -- Obter dados da versão alvo
    SELECT ev.version_data INTO version_data
    FROM public.entity_versions ev
    WHERE ev.entity_type = p_entity_type 
    AND ev.entity_id = p_entity_id 
    AND ev.version = p_target_version
    LIMIT 1;
    
    IF version_data IS NULL THEN
        RETURN false;
    END IF;
    
    -- Criar nova versão com dados restaurados
    restored_version := public.create_new_version(
        p_entity_type,
        p_entity_id,
        'patch',
        'Restaurado para versão ' || p_target_version,
        'Restore from version ' || p_target_version,
        version_data
    );
    
    RETURN restored_version IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Função para obter histórico de versões
CREATE OR REPLACE FUNCTION public.get_version_history(
    p_entity_type VARCHAR(50),
    p_entity_id UUID
)
RETURNS TABLE (
    version VARCHAR(20),
    version_type VARCHAR(10),
    is_latest BOOLEAN,
    is_active BOOLEAN,
    change_summary TEXT,
    change_reason VARCHAR(255),
    created_by_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ev.version,
        ev.version_type,
        ev.is_latest,
        ev.is_active,
        ev.change_summary,
        ev.change_reason,
        u.email as created_by_email,
        ev.created_at
    FROM public.entity_versions ev
    LEFT JOIN public.users u ON ev.created_by = u.id
    WHERE ev.entity_type = p_entity_type 
    AND ev.entity_id = p_entity_id
    ORDER BY ev.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS PARA VERSIONAMENTO AUTOMÁTICO
-- =====================================================

-- Trigger para workflows
CREATE OR REPLACE FUNCTION public.trigger_workflow_versioning()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é uma atualização, criar nova versão
    IF TG_OP = 'UPDATE' THEN
        PERFORM public.create_new_version(
            'workflow',
            NEW.id,
            'patch',
            NEW.change_summary,
            NEW.change_reason
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workflow_versioning
    AFTER UPDATE ON public.workflows
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION public.trigger_workflow_versioning();

-- Trigger para documentos
CREATE OR REPLACE FUNCTION public.trigger_document_versioning()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM public.create_new_version(
            'document',
            NEW.id,
            'patch',
            NEW.change_summary,
            NEW.change_reason
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_versioning
    AFTER UPDATE ON public.quality_documents
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION public.trigger_document_versioning();

-- =====================================================
-- 6. VIEWS PARA HISTÓRICO DE VERSÕES
-- =====================================================

-- View para histórico de workflows
CREATE OR REPLACE VIEW public.workflow_version_history AS
SELECT 
    w.id,
    w.name,
    w.version,
    w.version_type,
    w.is_latest,
    w.change_summary,
    w.change_reason,
    u.email as created_by_email,
    w.created_at,
    w.updated_at
FROM public.workflows w
LEFT JOIN public.users u ON w.created_by = u.id
ORDER BY w.created_at DESC;

-- View para histórico de documentos
CREATE OR REPLACE VIEW public.document_version_history AS
SELECT 
    qd.id,
    qd.title,
    qd.version,
    qd.version_type,
    qd.is_latest,
    qd.change_summary,
    qd.change_reason,
    u.email as created_by_email,
    qd.created_at,
    qd.updated_at
FROM public.quality_documents qd
LEFT JOIN public.users u ON qd.created_by = u.id
ORDER BY qd.created_at DESC;

-- =====================================================
-- 7. POLÍTICAS RLS PARA VERSIONAMENTO
-- =====================================================

-- Política para entity_versions
CREATE POLICY "entity_versions_project_access" ON public.entity_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id IN (
                SELECT project_id FROM public.workflows WHERE id = entity_versions.entity_id
                UNION
                SELECT project_id FROM public.quality_documents WHERE id = entity_versions.entity_id
                UNION
                SELECT project_id FROM public.quality_pops WHERE id = entity_versions.entity_id
                UNION
                SELECT project_id FROM public.quality_action_plans WHERE id = entity_versions.entity_id
            )
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE VERSIONAMENTO
-- ===================================================== 
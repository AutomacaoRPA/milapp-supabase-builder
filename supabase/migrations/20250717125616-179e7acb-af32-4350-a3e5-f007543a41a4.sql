
-- Criar tabela para tarefas dos projetos
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL DEFAULT 'development', -- development, documentation, testing, review
  status VARCHAR NOT NULL DEFAULT 'todo', -- todo, in_progress, review, done
  priority INTEGER DEFAULT 3, -- 1-5
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id) NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para registro de horas
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  hours NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para arquivos/documentos do projeto
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL, -- pdd, sdd, bpmn, code, test, other
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.users(id) NOT NULL,
  version VARCHAR DEFAULT '1.0',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para project_tasks
CREATE POLICY "Users can view tasks of projects they participate in"
  ON public.project_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_tasks.project_id 
      AND (p.created_by = auth.uid() OR p.assigned_architect = auth.uid() OR p.product_owner = auth.uid())
    )
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create tasks in projects they participate in"
  ON public.project_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_tasks.project_id 
      AND (p.created_by = auth.uid() OR p.assigned_architect = auth.uid() OR p.product_owner = auth.uid())
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update tasks they created or are assigned to"
  ON public.project_tasks FOR UPDATE
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- Políticas RLS para time_entries
CREATE POLICY "Users can view time entries of their tasks"
  ON public.time_entries FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.project_tasks pt
      JOIN public.projects p ON p.id = pt.project_id
      WHERE pt.id = time_entries.task_id
      AND (p.created_by = auth.uid() OR p.assigned_architect = auth.uid() OR p.product_owner = auth.uid())
    )
  );

CREATE POLICY "Users can create their own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time entries"
  ON public.time_entries FOR UPDATE
  USING (user_id = auth.uid());

-- Políticas RLS para project_files
CREATE POLICY "Users can view files of projects they participate in"
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_files.project_id 
      AND (p.created_by = auth.uid() OR p.assigned_architect = auth.uid() OR p.product_owner = auth.uid())
    )
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Users can upload files to projects they participate in"
  ON public.project_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_files.project_id 
      AND (p.created_by = auth.uid() OR p.assigned_architect = auth.uid() OR p.product_owner = auth.uid())
    )
    AND uploaded_by = auth.uid()
  );

-- Triggers para updated_at
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX idx_time_entries_task_id ON public.time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);

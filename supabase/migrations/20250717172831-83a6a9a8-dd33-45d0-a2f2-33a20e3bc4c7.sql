-- Temporariamente permitir que usuários autenticados vejam todos os projetos para demonstração
DROP POLICY IF EXISTS "Users can view projects they participate in" ON public.projects;

CREATE POLICY "Users can view all projects for demo" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (true);

-- Também permitir ver todas as tarefas para demonstração
DROP POLICY IF EXISTS "Users can view tasks of projects they participate in" ON public.project_tasks;

CREATE POLICY "Users can view all tasks for demo" 
ON public.project_tasks 
FOR SELECT 
TO authenticated
USING (true);

-- Permitir ver todos os arquivos para demonstração
DROP POLICY IF EXISTS "Users can view files of projects they participate in" ON public.project_files;

CREATE POLICY "Users can view all files for demo" 
ON public.project_files 
FOR SELECT 
TO authenticated
USING (true);

-- Permitir que usuários autenticados atualizem tarefas para demonstração
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON public.project_tasks;

CREATE POLICY "Users can update all tasks for demo" 
ON public.project_tasks 
FOR UPDATE 
TO authenticated
USING (true);

-- Permitir criação de tarefas para demonstração
DROP POLICY IF EXISTS "Users can create tasks in projects they participate in" ON public.project_tasks;

CREATE POLICY "Users can create tasks for demo" 
ON public.project_tasks 
FOR INSERT 
TO authenticated
WITH CHECK (true);
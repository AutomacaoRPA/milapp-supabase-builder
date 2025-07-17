-- Adicionar políticas RLS para permitir criação e atualização de projetos
CREATE POLICY "Users can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update projects they participate in" 
ON public.projects 
FOR UPDATE 
USING (
  (auth.uid())::text = (created_by)::text OR 
  (auth.uid())::text = (assigned_architect)::text OR 
  (auth.uid())::text = (product_owner)::text
);

-- Inserir um usuário de exemplo se não existir
INSERT INTO public.users (id, name, email, role, department) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin Sistema',
  'admin@milapp.com',
  'admin',
  'TI'
) ON CONFLICT (id) DO NOTHING;

-- Criar projeto de demonstração
INSERT INTO public.projects (
  id,
  name,
  description,
  status,
  priority,
  methodology,
  complexity_score,
  estimated_roi,
  start_date,
  target_date,
  created_by,
  assigned_architect,
  product_owner
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Sistema de Gestão de Agendas Médicas',
  'Desenvolvimento de um sistema automatizado para gestão de agendas de consultas médicas, incluindo integração com sistemas de prontuário eletrônico e notificações automáticas.',
  'desenvolvimento',
  4,
  'scrum',
  3,
  250000,
  '2024-01-15',
  '2024-06-30',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);

-- Criar tarefas de exemplo para o projeto
INSERT INTO public.project_tasks (
  id,
  project_id,
  title,
  description,
  status,
  priority,
  type,
  estimated_hours,
  assigned_to,
  created_by,
  due_date
) VALUES 
(
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'Análise de Requisitos do Sistema',
  'Levantamento detalhado dos requisitos funcionais e não-funcionais do sistema de agendamento médico.',
  'concluido',
  5,
  'analysis',
  40,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-02-15'
),
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Design da Interface do Usuário',
  'Criação dos mockups e protótipos das telas principais do sistema.',
  'em_progresso',
  4,
  'design',
  32,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-03-01'
),
(
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'Desenvolvimento do Backend',
  'Implementação das APIs REST para gerenciamento de agendas e integração com banco de dados.',
  'todo',
  5,
  'development',
  80,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-04-15'
),
(
  '22222222-2222-2222-2222-222222222224',
  '11111111-1111-1111-1111-111111111111',
  'Integração com Sistema de Prontuário',
  'Desenvolvimento da integração com sistemas de prontuário eletrônico existentes.',
  'todo',
  3,
  'integration',
  24,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-05-01'
),
(
  '22222222-2222-2222-2222-222222222225',
  '11111111-1111-1111-1111-111111111111',
  'Testes Automatizados',
  'Implementação de testes unitários e de integração para garantir qualidade do sistema.',
  'todo',
  4,
  'testing',
  48,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-05-30'
);

-- Criar sprints de exemplo
INSERT INTO public.sprints (
  id,
  project_id,
  name,
  goal,
  start_date,
  end_date,
  status,
  capacity,
  velocity
) VALUES 
(
  '33333333-3333-3333-3333-333333333331',
  '11111111-1111-1111-1111-111111111111',
  'Sprint 1 - Análise e Design',
  'Completar levantamento de requisitos e criar protótipos das principais funcionalidades',
  '2024-01-15',
  '2024-02-15',
  'concluido',
  80,
  75
),
(
  '33333333-3333-3333-3333-333333333332',
  '11111111-1111-1111-1111-111111111111',
  'Sprint 2 - Desenvolvimento Core',
  'Implementar funcionalidades básicas de agendamento e autenticação',
  '2024-02-16',
  '2024-03-16',
  'ativo',
  80,
  null
);

-- Criar user stories de exemplo
INSERT INTO public.user_stories (
  id,
  project_id,
  sprint_id,
  title,
  description,
  acceptance_criteria,
  story_points,
  priority,
  business_value,
  status,
  assigned_to
) VALUES 
(
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333331',
  'Como médico, quero visualizar minha agenda diária',
  'O médico deve conseguir ver todos os agendamentos do dia atual em uma visualização clara e organizada.',
  '["O médico pode acessar a agenda do dia", "A agenda mostra horários, pacientes e tipos de consulta", "É possível navegar entre diferentes dias"]',
  5,
  5,
  5,
  'concluido',
  '00000000-0000-0000-0000-000000000001'
),
(
  '44444444-4444-4444-4444-444444444442',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333332',
  'Como paciente, quero agendar uma consulta online',
  'O paciente deve conseguir escolher médico, especialidade, data e horário disponível para agendar uma consulta.',
  '["Paciente pode buscar médicos por especialidade", "Sistema mostra horários disponíveis", "Confirmação de agendamento é enviada por email"]',
  8,
  4,
  5,
  'em_progresso',
  '00000000-0000-0000-0000-000000000001'
);

-- Criar alguns arquivos de projeto de exemplo
INSERT INTO public.project_files (
  id,
  project_id,
  name,
  file_path,
  file_type,
  description,
  uploaded_by,
  version
) VALUES 
(
  '55555555-5555-5555-5555-555555555551',
  '11111111-1111-1111-1111-111111111111',
  'Documentação de Requisitos',
  '/docs/requisitos-v1.pdf',
  'application/pdf',
  'Documento completo com todos os requisitos funcionais e não-funcionais do sistema.',
  '00000000-0000-0000-0000-000000000001',
  '1.0'
),
(
  '55555555-5555-5555-5555-555555555552',
  '11111111-1111-1111-1111-111111111111',
  'Protótipo das Telas',
  '/design/prototipo-v2.fig',
  'application/figma',
  'Protótipo navegável das principais telas do sistema desenvolvido no Figma.',
  '00000000-0000-0000-0000-000000000001',
  '2.0'
);
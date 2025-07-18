-- Criar dados de demonstração para o ambiente demo
-- Inserir usuário demo
INSERT INTO public.users (id, email, name, role, department, is_active) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@medsenior.com',
  'Usuário Demo',
  'admin',
  'RPA',
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir projetos de demonstração
INSERT INTO public.projects (
  id, name, description, status, priority, methodology, complexity_score, 
  estimated_roi, actual_roi, start_date, target_date, completed_date,
  created_by, assigned_architect, product_owner
) VALUES 
(
  '10000000-0000-0000-0000-000000000001',
  'Automação de Notas Fiscais',
  'Automatização do processo de validação e aprovação de notas fiscais com OCR e validações inteligentes',
  'mvp',
  5,
  'scrum',
  7,
  45000,
  NULL,
  '2024-01-15',
  '2024-03-15',
  NULL,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000002',
  'Conciliação Bancária Automatizada',
  'Sistema inteligente para conciliação automática de extratos bancários com sistema ERP',
  'teste_operacional',
  4,
  'kanban',
  6,
  32000,
  28500,
  '2024-01-05',
  '2024-02-28',
  NULL,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000003',
  'Portal de Atendimento ao Paciente',
  'Interface automatizada para agendamentos e consultas de pacientes 50+ com foco em acessibilidade',
  'planejamento',
  3,
  'agile',
  8,
  55000,
  NULL,
  NULL,
  '2024-04-30',
  NULL,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000004',
  'Relatórios Gerenciais Automatizados',
  'Geração automática de dashboards e relatórios executivos com dados em tempo real',
  'ideacao',
  2,
  'waterfall',
  4,
  18000,
  NULL,
  NULL,
  '2024-05-15',
  NULL,
  '00000000-0000-0000-0000-000000000001',
  NULL,
  NULL
),
(
  '10000000-0000-0000-0000-000000000005',
  'Sistema de Compliance LGPD',
  'Automação para garantir conformidade com LGPD no tratamento de dados de pacientes',
  'concluido',
  5,
  'scrum',
  9,
  25000,
  31000,
  '2023-11-01',
  '2024-01-15',
  '2024-01-12',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Inserir tarefas de exemplo
INSERT INTO public.project_tasks (
  id, project_id, title, description, type, status, priority,
  estimated_hours, actual_hours, assigned_to, created_by, due_date
) VALUES 
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Análise de Requisitos',
  'Levantar requisitos funcionais e não funcionais para automação de NF',
  'analysis',
  'done',
  4,
  16,
  14,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-01-20'
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Desenvolvimento OCR',
  'Implementar módulo de OCR para extração de dados das notas fiscais',
  'development',
  'in_progress',
  5,
  40,
  25,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-02-15'
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'Testes de Integração',
  'Executar testes de integração com sistema bancário',
  'testing',
  'todo',
  3,
  24,
  0,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-02-25'
) ON CONFLICT (id) DO NOTHING;

-- Inserir arquivos de projeto de exemplo
INSERT INTO public.project_files (
  id, project_id, name, file_path, file_type, file_size, 
  uploaded_by, version, description
) VALUES 
(
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'PDD_AutomacaoNF_v1.0.pdf',
  '/demo/files/pdd_automacao_nf.pdf',
  'pdd',
  2048576,
  '00000000-0000-0000-0000-000000000001',
  '1.0',
  'Documento de Definição do Produto para automação de notas fiscais'
),
(
  '30000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Arquitetura_Sistema.bpmn',
  '/demo/files/arquitetura_sistema.bpmn',
  'bpmn',
  512000,
  '00000000-0000-0000-0000-000000000001',
  '1.0',
  'Diagrama BPMN da arquitetura do sistema'
),
(
  '30000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'TestPlan_Conciliacao.xlsx',
  '/demo/files/testplan_conciliacao.xlsx',
  'test',
  1024000,
  '00000000-0000-0000-0000-000000000001',
  '1.0',
  'Plano de testes para conciliação bancária'
) ON CONFLICT (id) DO NOTHING;
-- Criar segundo projeto de demonstração - Extração de Dados NF
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
  '11111111-1111-1111-1111-111111111112',
  'Extração de Dados NF - OPME',
  'Sistema de extração automatizada de dados de notas fiscais OPME, aumentando a eficiência no processamento e reduzindo erros manuais em 90%.',
  'homologacao',
  5,
  'kanban',
  4,
  180000,
  '2023-10-01',
  '2024-03-15',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);

-- Criar tarefas para o projeto de NF
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
  '22222222-2222-2222-2222-222222222231',
  '11111111-1111-1111-1111-111111111112',
  'Análise de Layout das NFs OPME',
  'Mapeamento dos diferentes layouts de notas fiscais OPME para identificar padrões de extração.',
  'concluido',
  5,
  'analysis',
  24,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2023-11-15'
),
(
  '22222222-2222-2222-2222-222222222232',
  '11111111-1111-1111-1111-111111111112',
  'Desenvolvimento OCR Customizado',
  'Implementação de sistema OCR específico para leitura de dados de notas fiscais OPME.',
  'concluido',
  5,
  'development',
  56,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2023-12-30'
),
(
  '22222222-2222-2222-2222-222222222233',
  '11111111-1111-1111-1111-111111111112',
  'Validação e Correção Automática',
  'Sistema de validação automática dos dados extraídos com correção inteligente.',
  'concluido',
  4,
  'development',
  40,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-01-31'
),
(
  '22222222-2222-2222-2222-222222222234',
  '11111111-1111-1111-1111-111111111112',
  'Integração com ERP',
  'Desenvolvimento da integração com sistemas ERP existentes para envio automático dos dados.',
  'em_progresso',
  3,
  'integration',
  32,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-02-28'
),
(
  '22222222-2222-2222-2222-222222222235',
  '11111111-1111-1111-1111-111111111112',
  'Testes de Homologação',
  'Bateria completa de testes com notas fiscais reais para validação do sistema.',
  'em_progresso',
  4,
  'testing',
  48,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-03-10'
);

-- Criar terceiro projeto - Chat GPT Setorial
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
  '11111111-1111-1111-1111-111111111113',
  'Chat GPT Setorial',
  'Chatbot com capacidade de termos do nosso processo prompts, inteligência setorial para consultas. Algo parecido com o ChatGPT mas voltado para nosso setor.',
  'ideacao',
  3,
  'scrum',
  5,
  320000,
  '2024-04-01',
  '2024-09-30',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);

-- Criar tarefas para Chat GPT Setorial
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
  '22222222-2222-2222-2222-222222222241',
  '11111111-1111-1111-1111-111111111113',
  'Pesquisa de Mercado IA Setorial',
  'Análise de soluções existentes e identificação de oportunidades no mercado.',
  'todo',
  4,
  'research',
  16,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-04-15'
),
(
  '22222222-2222-2222-2222-222222222242',
  '11111111-1111-1111-1111-111111111113',
  'Definição da Base de Conhecimento',
  'Catalogação e estruturação do conhecimento setorial para treinamento do modelo.',
  'todo',
  5,
  'analysis',
  40,
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2024-05-30'
);

-- Criar user stories para o projeto NF
INSERT INTO public.user_stories (
  id,
  project_id,
  title,
  description,
  acceptance_criteria,
  story_points,
  priority,
  business_value,
  status
) VALUES 
(
  '44444444-4444-4444-4444-444444444451',
  '11111111-1111-1111-1111-111111111112',
  'Como usuário, quero fazer upload de NFs em lote',
  'O sistema deve permitir o upload de múltiplas notas fiscais simultaneamente para processamento em lote.',
  '["Usuário pode selecionar múltiplos arquivos", "Sistema processa arquivos em paralelo", "Status de processamento é exibido em tempo real"]',
  8,
  5,
  5,
  'concluido'
),
(
  '44444444-4444-4444-4444-444444444452',
  '11111111-1111-1111-1111-111111111112',
  'Como gestor, quero relatório de eficiência de extração',
  'Relatório mostrando taxa de sucesso, erros e tempo de processamento das extrações.',
  '["Relatório mostra métricas de precisão", "Gráficos de performance temporal", "Exportação em Excel/PDF"]',
  5,
  3,
  4,
  'em_progresso'
);

-- Criar sprints para projeto NF
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
  '33333333-3333-3333-3333-333333333341',
  '11111111-1111-1111-1111-111111111112',
  'Sprint 1 - MVP OCR',
  'Desenvolver versão mínima viável do sistema de OCR para NFs OPME',
  '2023-10-01',
  '2023-11-01',
  'concluido',
  120,
  115
),
(
  '33333333-3333-3333-3333-333333333342',
  '11111111-1111-1111-1111-111111111112',
  'Sprint 2 - Integração e Validação',
  'Implementar integração com ERP e sistema de validação automática',
  '2024-01-15',
  '2024-02-15',
  'concluido',
  120,
  98
);

-- Criar arquivos para projeto NF
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
  '55555555-5555-5555-5555-555555555561',
  '11111111-1111-1111-1111-111111111112',
  'Especificação Técnica OCR',
  '/docs/especificacao-ocr-v3.pdf',
  'application/pdf',
  'Documento técnico detalhando algoritmos e parâmetros do sistema OCR.',
  '00000000-0000-0000-0000-000000000001',
  '3.0'
),
(
  '55555555-5555-5555-5555-555555555562',
  '11111111-1111-1111-1111-111111111112',
  'Base de Dados de Treinamento',
  '/data/nf-training-dataset.zip',
  'application/zip',
  'Dataset com 5000+ notas fiscais OPME para treinamento do modelo de ML.',
  '00000000-0000-0000-0000-000000000001',
  '2.1'
);
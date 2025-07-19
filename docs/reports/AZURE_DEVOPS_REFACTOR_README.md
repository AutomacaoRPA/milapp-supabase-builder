# Refatoração Azure DevOps - Unificação de Tarefas em Cartões

## 📋 Visão Geral

Esta refatoração implementa o padrão Azure DevOps no builder visual do projeto `milapp-supabase-builder`, unificando o controle de tarefas diretamente nos cartões com subtarefas inline.

## 🎯 Objetivos

- ✅ Unificar controle de tarefas em cartões (Azure DevOps style)
- ✅ Implementar subtarefas inline editáveis
- ✅ Eliminar entidade separada para controle de tarefas
- ✅ Atualizar schema de dados e componentes visuais
- ✅ Migrar dados existentes para o novo formato

## 🚀 Como Aplicar a Refatoração

### Pré-requisitos

1. **Supabase CLI** instalado
2. **Node.js** e **npm** instalados
3. Projeto configurado e linkado ao Supabase

### Passo a Passo

1. **Execute o script de migração:**
   ```bash
   cd milapp-supabase-builder
   ./scripts/apply-azure-devops-refactor.sh
   ```

2. **Ou execute manualmente:**
   ```bash
   # Aplicar migrações
   supabase db reset --linked
   
   # Verificar migrações
   supabase migration list
   ```

3. **Teste a funcionalidade:**
   ```bash
   npm run dev
   ```

## 📁 Arquivos Modificados

### Migrações SQL
- `supabase/migrations/20250118000001_unify_tasks_into_cards_azure_devops.sql`
- `supabase/migrations/20250118000002_add_work_item_functions.sql`

### Tipos TypeScript
- `src/types/project-lifecycle.ts` - Novos tipos para work items

### Hooks
- `src/hooks/useAzureDevOpsTasks.ts` - Refatorado para work items

### Componentes
- `src/components/AzureDevOpsKanbanBoard.tsx` - Subtarefas inline

### Scripts
- `scripts/apply-azure-devops-refactor.sh` - Script de migração

## 🏗️ Nova Estrutura de Dados

### Work Item (Cartão Principal)
```typescript
interface WorkItem {
  id: string;
  title: string;
  description?: string;
  type: WorkItemType; // 'user_story' | 'bug' | 'task' | 'epic' | 'spike'
  priority: WorkItemPriority; // 'low' | 'medium' | 'high' | 'critical'
  status: WorkItemStatus; // 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done' | 'cancelled'
  story_points?: number;
  assignee?: { id: string; name?: string; avatar?: string };
  acceptance_criteria?: string[];
  dependencies?: string[];
  tags?: string[];
  comments: number;
  attachments: number;
  due_date?: string;
  subtasks: WorkItemSubtask[]; // ← NOVO: Array de subtarefas inline
  created_at: string;
  updated_at: string;
}
```

### Subtarefa (Inline)
```typescript
interface WorkItemSubtask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: WorkItemPriority;
  assignee?: { id: string; name?: string; avatar?: string };
  estimated_hours?: number;
  actual_hours?: number;
  story_points?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
```

## 🎨 Funcionalidades Implementadas

### ✅ Work Items com Subtarefas Inline
- Cartões principais contêm array de subtarefas
- Subtarefas editáveis inline sem navegação
- Progresso visual das subtarefas
- Contador de subtarefas completadas

### ✅ Interface Azure DevOps
- Tipos de work item: User Story, Bug, Task, Epic, Spike
- Prioridades: Low, Medium, High, Critical
- Status: Backlog, To Do, In Progress, Review, Testing, Done
- WIP limits por coluna
- Drag & drop entre colunas

### ✅ Edição Inline
- Edição direta do título das subtarefas
- Checkbox para marcar como concluída
- Adição/remoção de subtarefas
- Atualização em tempo real

### ✅ Progresso Visual
- Barra de progresso das subtarefas
- Contador de subtarefas completadas
- Indicadores visuais de status
- Story points e estimativas

## 🔧 Funções SQL Criadas

### Work Items
- `add_work_item_to_project()` - Adicionar work item
- `update_work_item_in_project()` - Atualizar work item
- `remove_work_item_from_project()` - Remover work item
- `move_work_item_column()` - Mover entre colunas

### Subtarefas
- `add_subtask_to_work_item()` - Adicionar subtarefa
- `update_subtask_in_work_item()` - Atualizar subtarefa
- `remove_subtask_from_work_item()` - Remover subtarefa

### Consultas
- `get_work_items_by_filter()` - Filtrar work items
- `calculate_project_metrics()` - Calcular métricas

## 🎯 Componentes Atualizados

### AzureDevOpsKanbanBoard
- **Subtarefas inline** nos cartões
- **Progresso visual** das subtarefas
- **Edição inline** de títulos
- **Checkbox** para marcar como concluída
- **Botão** para adicionar subtarefas
- **Contador** de subtarefas

### useAzureDevOpsTasks Hook
- Funções para gerenciar work items
- Funções para gerenciar subtarefas
- Compatibilidade com código existente
- Atualização automática do estado

## 📊 Migração de Dados

### Processo Automático
1. **Backup** dos dados existentes
2. **Migração** de tasks para work_items
3. **Inicialização** de array de subtarefas vazio
4. **Preservação** de todos os dados existentes

### Estrutura Migrada
```sql
-- Antes (tasks separadas)
projects.tasks = [{task1}, {task2}, ...]

-- Depois (work items com subtarefas)
projects.work_items = [
  {
    ...task1,
    subtasks: []
  },
  {
    ...task2,
    subtasks: []
  }
]
```

## 🧪 Testes

### Testes Unitários
```bash
npm run test
```

### Testes de Integração
```bash
npm run test:integration
```

### Testes Manuais
1. Criar work item
2. Adicionar subtarefas
3. Editar subtarefas inline
4. Marcar subtarefas como concluídas
5. Mover work items entre colunas
6. Verificar progresso visual

## 🔄 Rollback

### Se necessário reverter:
```bash
# Restaurar backup
supabase db reset --linked

# Reverter código
git checkout HEAD~1
```

## 📈 Próximas Implementações

### 🔄 Planejadas
- [ ] Time tracking integrado
- [ ] Burndown charts
- [ ] Sprint planning
- [ ] Velocity tracking
- [ ] Automated testing integration
- [ ] CI/CD pipeline integration

### 🎯 Melhorias Futuras
- [ ] Subtarefas aninhadas (sub-subtarefas)
- [ ] Templates de work items
- [ ] Integração com Azure DevOps real
- [ ] Webhooks para sincronização
- [ ] Relatórios avançados

## 🐛 Troubleshooting

### Problemas Comuns

1. **Migração falhou**
   ```bash
   # Verificar logs
   supabase logs
   
   # Resetar banco
   supabase db reset --linked
   ```

2. **Componentes não carregam**
   ```bash
   # Limpar cache
   npm run clean
   npm install
   ```

3. **Tipos TypeScript não encontrados**
   ```bash
   # Recompilar tipos
   npm run build:types
   ```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Supabase
2. Execute os testes automatizados
3. Consulte a documentação do Azure DevOps
4. Abra uma issue no repositório

## 🎉 Conclusão

A refatoração implementa com sucesso o padrão Azure DevOps, unificando o controle de tarefas em cartões com subtarefas inline. A migração é segura e preserva todos os dados existentes.

**Commit:** `refactor(ui): unify task control into card component as inline task list (Azure DevOps style)`

---

*Documentação gerada automaticamente em: $(date +'%Y-%m-%d %H:%M:%S')* 
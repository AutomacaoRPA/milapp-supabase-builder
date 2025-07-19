# Estrutura de IA - MilApp Builder

Este diretório contém prompts e fluxos estruturados para uso com ferramentas de IA como **Cursor** e **Lovable**, otimizados para o projeto MilApp Builder.

## 📁 Estrutura do Projeto

```
.ai/
├── cursor-prompts/           # Prompts para Cursor AI
│   ├── gerar-pipeline.md     # Geração de pipelines CI/CD
│   ├── gerar-policy.md       # Geração de políticas de segurança
│   └── corrigir-erro.md      # Correção de erros de código
├── lovable-flows/            # Fluxos para Lovable
│   ├── novoProjeto.json      # Fluxo de criação de projetos
│   └── rbacFlow.json         # Fluxo de controle de acesso
└── README.md                 # Esta documentação
```

## 🚀 Como Usar

### Com Cursor AI

O **Cursor** é um editor de código com IA integrada que pode ajudar na geração e correção de código.

#### 1. **Prompts Disponíveis**

##### `gerar-pipeline.md`
- **Uso**: Geração de pipelines de CI/CD com GitHub Actions
- **Comando**: Copie o conteúdo do arquivo e cole no chat do Cursor
- **Exemplo**:
  ```bash
  # No Cursor, digite:
  "Crie um pipeline de CI/CD para o projeto MilApp Builder seguindo as especificações do prompt gerar-pipeline.md"
  ```

##### `gerar-policy.md`
- **Uso**: Criação de políticas de segurança Supabase
- **Comando**: Use para gerar RLS policies e funções de segurança
- **Exemplo**:
  ```bash
  # No Cursor, digite:
  "Implemente políticas de segurança para as tabelas projects, pipelines e environments seguindo o prompt gerar-policy.md"
  ```

##### `corrigir-erro.md`
- **Uso**: Correção sistemática de erros de código
- **Comando**: Use quando encontrar bugs ou problemas
- **Exemplo**:
  ```bash
  # No Cursor, digite:
  "Analise e corrija o erro seguindo a metodologia do prompt corrigir-erro.md"
  ```

#### 2. **Dicas de Uso com Cursor**

```bash
# 1. Abra o arquivo de prompt desejado
# 2. Copie todo o conteúdo
# 3. Cole no chat do Cursor
# 4. Adicione contexto específico do seu problema
# 5. Execute o comando

# Exemplo prático:
"Usando o prompt gerar-pipeline.md, crie um workflow para deploy automático 
na branch 'develop' com testes, linting e deploy no Supabase"
```

### Com Lovable

O **Lovable** é uma plataforma de automação que executa fluxos estruturados.

#### 1. **Fluxos Disponíveis**

##### `novoProjeto.json`
- **Uso**: Criação automatizada de projetos
- **Trigger**: Manual ou via API
- **Funcionalidades**:
  - ✅ Validação de entrada
  - ✅ Verificação de permissões
  - ✅ Criação de projeto
  - ✅ Geração de pipeline
  - ✅ Configuração de ambientes
  - ✅ Notificações
  - ✅ Logs de auditoria

##### `rbacFlow.json`
- **Uso**: Controle de acesso baseado em roles
- **Trigger**: API, eventos ou agendado
- **Funcionalidades**:
  - ✅ Autenticação de usuário
  - ✅ Carregamento de perfil
  - ✅ Validação de permissões
  - ✅ Aplicação de políticas
  - ✅ Geração de tokens
  - ✅ Logs de auditoria

#### 2. **Como Executar Fluxos**

```bash
# 1. Importe o fluxo no Lovable
# 2. Configure as variáveis de ambiente
# 3. Execute via API ou interface

# Exemplo de execução via API:
curl -X POST https://api.lovable.com/flows/novo-projeto/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Automação de Processos",
    "description": "Sistema de automação",
    "type": "automation",
    "priority": "high"
  }'
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Lovable
LOVABLE_API_KEY=your_lovable_api_key
LOVABLE_WORKSPACE_ID=your_workspace_id

# Notificações
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
EMAIL_SERVICE_API_KEY=your_email_api_key
```

### Configuração do Cursor

1. **Instale o Cursor**: https://cursor.sh/
2. **Configure o projeto**: Abra a pasta do projeto no Cursor
3. **Use os prompts**: Copie e cole os prompts conforme necessário

### Configuração do Lovable

1. **Crie uma conta**: https://lovable.com/
2. **Importe os fluxos**: Use os arquivos JSON da pasta `lovable-flows/`
3. **Configure as variáveis**: Defina as variáveis de ambiente necessárias

## 📋 Exemplos de Uso

### Exemplo 1: Criar Pipeline de CI/CD

```bash
# 1. Abra o Cursor
# 2. Copie o conteúdo de gerar-pipeline.md
# 3. Cole no chat e adicione:
"Projeto: MilApp Builder
Stack: React + TypeScript + Supabase
Ambientes: development, staging, production
Requisitos: Testes, linting, deploy automático"
```

### Exemplo 2: Implementar Políticas de Segurança

```bash
# 1. Use o prompt gerar-policy.md
# 2. Especifique as tabelas:
"Tabelas: projects, project_pipelines, environments, users, teams
Roles: admin, gestor, dev, analista, ia
Requisitos: RLS, auditoria, cache de permissões"
```

### Exemplo 3: Executar Fluxo de Projeto

```json
{
  "flowId": "novo-projeto",
  "input": {
    "name": "Sistema de Automação",
    "description": "Automação de processos internos",
    "type": "automation",
    "priority": "high",
    "methodology": "scrum",
    "pipeline_config": {
      "stages": [
        {"name": "dev", "order": 1, "auto_approve": true},
        {"name": "test", "order": 2, "auto_approve": false}
      ]
    }
  }
}
```

## 🛠️ Desenvolvimento

### Criando Novos Prompts

1. **Estrutura do Prompt**:
   ```markdown
   # Prompt: Nome do Prompt
   
   ## Contexto
   Descrição do contexto e objetivo
   
   ## Requisitos Técnicos
   - Stack tecnológica
   - Funcionalidades obrigatórias
   - Padrões de código
   
   ## Instruções Específicas
   - Passos detalhados
   - Exemplos de implementação
   - Critérios de aceitação
   ```

2. **Salve no diretório correto**:
   - `cursor-prompts/` para prompts do Cursor
   - `lovable-flows/` para fluxos do Lovable

### Criando Novos Fluxos

1. **Estrutura do Fluxo**:
   ```json
   {
     "flowId": "nome-do-fluxo",
     "name": "Nome do Fluxo",
     "description": "Descrição detalhada",
     "version": "1.0.0",
     "triggers": [...],
     "steps": [...],
     "variables": {...},
     "errorHandling": {...}
   }
   ```

2. **Teste o fluxo**:
   ```bash
   # Valide o JSON
   npm run validate-flow .ai/lovable-flows/novoFluxo.json
   
   # Teste localmente
   npm run test-flow novoFluxo
   ```

## 📊 Monitoramento

### Métricas dos Prompts

- **Taxa de sucesso**: % de prompts que geram código válido
- **Tempo de resposta**: Tempo médio para gerar solução
- **Qualidade**: Avaliação da qualidade do código gerado

### Métricas dos Fluxos

- **Execução**: Taxa de sucesso das execuções
- **Performance**: Tempo de execução por fluxo
- **Erros**: Análise de erros e falhas

## 🔒 Segurança

### Prompts Seguros

- ✅ Não incluem dados sensíveis
- ✅ Usam placeholders para configurações
- ✅ Seguem padrões de segurança

### Fluxos Seguros

- ✅ Validação de entrada
- ✅ Controle de acesso
- ✅ Logs de auditoria
- ✅ Tratamento de erros

## 🚨 Troubleshooting

### Problemas Comuns

#### Cursor não gera código correto
```bash
# Solução:
1. Verifique se copiou o prompt completo
2. Adicione contexto específico do projeto
3. Use exemplos concretos
4. Especifique a stack tecnológica
```

#### Fluxo falha no Lovable
```bash
# Solução:
1. Verifique as variáveis de ambiente
2. Valide o JSON do fluxo
3. Teste em ambiente de desenvolvimento
4. Verifique os logs de execução
```

#### Permissões negadas
```bash
# Solução:
1. Verifique o token de acesso
2. Confirme as permissões do usuário
3. Valide as políticas de segurança
4. Teste com usuário admin
```

## 📚 Recursos Adicionais

### Documentação
- [Cursor AI Documentation](https://cursor.sh/docs)
- [Lovable Documentation](https://lovable.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Exemplos
- [Exemplos de Prompts](https://github.com/cursor-ai/examples)
- [Fluxos de Automação](https://lovable.com/examples)

### Comunidade
- [Cursor Discord](https://discord.gg/cursor)
- [Lovable Community](https://community.lovable.com)

## 🤝 Contribuição

### Como Contribuir

1. **Fork o repositório**
2. **Crie uma branch**: `feature/nova-funcionalidade`
3. **Adicione seus prompts/fluxos**
4. **Teste localmente**
5. **Faça commit**: `feat(ai): adiciona novo prompt para X`
6. **Abra um Pull Request**

### Padrões de Contribuição

- ✅ Documente novos prompts/fluxos
- ✅ Inclua exemplos de uso
- ✅ Teste antes de submeter
- ✅ Siga os padrões existentes

---

**Commit**: `feat(ai): estrutura padronizada para prompts Cursor e fluxos Lovable`

**Status**: ✅ **IMPLEMENTADO E DOCUMENTADO** 
# 📣 MILAPP - Sistema de Comunicação Multicanal

## 🎯 Visão Geral

O MILAPP MedSênior agora possui um **sistema completo de comunicação multicanal** que garante que as informações cheguem aos usuários onde eles estão, aumentando significativamente o engajamento e a eficiência operacional.

## 🚀 Funcionalidades Implementadas

### ✅ **1. Sistema de Preferências de Notificação**
- **Canais**: E-mail, Teams, WhatsApp, Push
- **Configuração por evento**: Nova solicitação, mudança de status, IA, aprovação, conclusão
- **Horário silencioso**: Configuração de horários para não perturbar
- **Resumo diário**: Opção de receber resumos consolidados

### ✅ **2. Dispatcher Central de Comunicação**
- **Orquestração automática**: Decide qual canal usar baseado nas preferências
- **Fallback inteligente**: Se um canal falha, tenta outro
- **Auditoria completa**: Log de todas as comunicações enviadas

### ✅ **3. Integração com Canais Externos**
- **Microsoft Teams**: Via webhooks e cards adaptativos
- **E-mail**: Templates transacionais personalizados
- **WhatsApp**: Via Twilio/Z-API para mensagens críticas

### ✅ **4. Workflow n8n Pronto**
- **Automação no-code**: Workflow completo para disparar comunicações
- **Integração Supabase**: Webhook que recebe eventos do sistema
- **Multi-canal**: Envia para e-mail, Teams e WhatsApp simultaneamente

## 📋 Configuração Rápida

### **1. Variáveis de Ambiente**

```env
# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# E-mail (Resend/SendGrid)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=sua_chave_api
EMAIL_FROM=noreply@milapp.com

# Microsoft Teams
TEAMS_WEBHOOK_URL=sua_webhook_teams
TEAMS_CHANNEL_ID=seu_canal_id
TEAMS_BOT_TOKEN=seu_bot_token

# WhatsApp (Twilio)
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=sua_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_FROM_NUMBER=seu_numero_whatsapp
```

### **2. Executar Migrações**

```bash
# Executar migração de comunicação
npm run db:migrate

# Verificar status
npm run db:status
```

### **3. Configurar n8n (Opcional)**

1. **Importar workflow**:
   ```bash
   # Copiar arquivo para n8n
   cp n8n-workflows/communication-automation.json /path/to/n8n/workflows/
   ```

2. **Configurar credenciais**:
   - SMTP (para e-mail)
   - Microsoft Teams OAuth2
   - Twilio API
   - Supabase API

3. **Ativar workflow**:
   - O webhook estará disponível em: `https://seu-n8n.com/webhook/milapp-communication`

## 🔧 Uso do Sistema

### **1. Configurar Preferências do Usuário**

```typescript
import { communicationDispatcher } from './services/communication/CommunicationDispatcher'

// Atualizar preferências
await supabase.rpc('update_notification_preferences', {
  p_user_id: 'user-id',
  p_project_id: 'project-id',
  p_preferences: {
    email_enabled: true,
    teams_enabled: true,
    whatsapp_enabled: false,
    push_enabled: true,
    new_request_notifications: {
      email: true,
      teams: true,
      whatsapp: false,
      push: true
    }
  }
})
```

### **2. Disparar Notificações**

```typescript
// Nova solicitação
await communicationDispatcher.notifyNewRequest({
  id: 'request-id',
  title: 'Implementar nova funcionalidade',
  solicitante_id: 'user-id',
  project_id: 'project-id',
  priority: 'high'
})

// Mudança de status
await communicationDispatcher.notifyStatusChange({
  request_id: 'request-id',
  user_id: 'user-id',
  project_id: 'project-id',
  from_status: 'Em Análise',
  to_status: 'Em Desenvolvimento',
  request_title: 'Implementar nova funcionalidade'
})

// Resposta da IA
await communicationDispatcher.notifyAIResponse({
  request_id: 'request-id',
  user_id: 'user-id',
  project_id: 'project-id',
  request_title: 'Implementar nova funcionalidade',
  ai_message: 'Vou ajudar você com essa implementação...',
  thread_id: 'thread-id'
})
```

### **3. Configurar Projeto**

```typescript
// Configurar canais do projeto
await supabase
  .from('project_communication_config')
  .upsert({
    project_id: 'project-id',
    email_provider: 'resend',
    email_from_address: 'noreply@milapp.com',
    teams_webhook_url: 'https://webhook.teams.com/...',
    whatsapp_provider: 'twilio',
    whatsapp_account_sid: 'AC...',
    whatsapp_auth_token: '...',
    whatsapp_from_number: '+5511999999999'
  })
```

## 📊 Monitoramento e Analytics

### **1. Estatísticas de Comunicação**

```typescript
// Obter estatísticas
const stats = await communicationDispatcher.getCommunicationStats(
  'project-id',
  '2024-01-01',
  '2024-01-31'
)

console.log('Estatísticas:', {
  total_sent: stats.sent_count,
  failed: stats.failed_count,
  delivered: stats.delivered_count,
  avg_send_time: stats.avg_send_time_seconds
})
```

### **2. Logs de Auditoria**

```sql
-- Ver logs de e-mail
SELECT * FROM email_logs 
WHERE project_id = 'project-id' 
ORDER BY created_at DESC;

-- Ver logs do Teams
SELECT * FROM teams_logs 
WHERE project_id = 'project-id' 
ORDER BY created_at DESC;

-- Ver logs do WhatsApp
SELECT * FROM whatsapp_logs 
WHERE project_id = 'project-id' 
ORDER BY created_at DESC;
```

## 🎨 Templates de E-mail

### **1. Nova Solicitação**

```html
<h2>Sua solicitação foi criada com sucesso!</h2>
<p><strong>Título:</strong> {{request_title}}</p>
<p><strong>Prioridade:</strong> {{priority}}</p>
<p><strong>Data:</strong> {{created_at}}</p>
<p>Acompanhe o progresso em: <a href="{{link}}">{{link}}</a></p>
```

### **2. Mudança de Status**

```html
<h2>Status da sua solicitação foi atualizado</h2>
<p><strong>Solicitação:</strong> {{request_title}}</p>
<p><strong>Status Anterior:</strong> {{from_status}}</p>
<p><strong>Novo Status:</strong> {{to_status}}</p>
<p><strong>Data:</strong> {{updated_at}}</p>
<p>Veja os detalhes em: <a href="{{link}}">{{link}}</a></p>
```

### **3. Conclusão**

```html
<h2>🎉 Sua solicitação foi concluída!</h2>
<p><strong>Solicitação:</strong> {{request_title}}</p>
<p><strong>Concluída em:</strong> {{completed_at}}</p>
<p><strong>Executado por:</strong> {{executor_name}}</p>
<p>Acesse o resultado em: <a href="{{link}}">{{link}}</a></p>
```

## 🔗 Cards do Microsoft Teams

### **1. Nova Solicitação**

```json
{
  "type": "AdaptiveCard",
  "version": "1.3",
  "body": [
    {
      "type": "TextBlock",
      "text": "🆕 Nova Solicitação Criada",
      "size": "Large",
      "weight": "Bolder",
      "color": "Accent"
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Título",
          "value": "{{request_title}}"
        },
        {
          "title": "Prioridade",
          "value": "{{priority}}"
        },
        {
          "title": "Solicitante",
          "value": "{{solicitante_name}}"
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "Ver Detalhes",
      "url": "{{link}}"
    }
  ]
}
```

## 📱 Mensagens WhatsApp

### **1. Nova Solicitação**

```
🆕 Nova solicitação criada: {{request_title}}

Prioridade: {{priority}}
Solicitante: {{solicitante_name}}

Acompanhe em: {{link}}
```

### **2. Aprovação Necessária**

```
⚠️ Aprovação necessária: {{request_title}}

Solicitante: {{solicitante_name}}

Aprove em: {{link}}
```

## 🚀 Integração com n8n

### **1. Webhook de Entrada**

```json
{
  "event_type": "new_request",
  "user_id": "user-id",
  "project_id": "project-id",
  "request_id": "request-id",
  "request_title": "Implementar nova funcionalidade",
  "priority": "high",
  "solicitante_name": "João Silva",
  "link": "https://milapp.com/requests/request-id"
}
```

### **2. Configuração do Webhook**

1. **URL**: `https://seu-n8n.com/webhook/milapp-communication`
2. **Método**: POST
3. **Content-Type**: application/json

### **3. Triggers Automáticos**

O sistema dispara automaticamente webhooks para:

- ✅ Nova solicitação criada
- ✅ Mudança de status
- ✅ Resposta da IA
- ✅ Aprovação necessária
- ✅ Conclusão/entrega

## 🔒 Segurança e Compliance

### **1. Políticas RLS**

```sql
-- Usuários só veem suas próprias preferências
CREATE POLICY "notification_preferences_own_access" 
ON public.notification_preferences
FOR ALL USING (user_id = auth.uid());

-- Gestores veem logs de comunicação
CREATE POLICY "communication_logs_gestor_access" 
ON public.email_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.project_id = email_logs.project_id
    AND ur.role = 'gestor'
    AND ur.is_active = true
  )
);
```

### **2. Auditoria Completa**

```sql
-- Log de todas as comunicações
SELECT 
  al.user_email,
  al.resource_type,
  al.action,
  al.created_at,
  al.details
FROM audit_log al
WHERE al.resource_type IN ('notification_dispatch', 'email_sent', 'teams_sent', 'whatsapp_sent')
ORDER BY al.created_at DESC;
```

## 📈 Métricas e KPIs

### **1. Taxa de Entrega**

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status;
```

### **2. Engajamento por Canal**

```sql
SELECT 
  'email' as channel,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered
FROM email_logs
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'teams' as channel,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered
FROM teams_logs
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'whatsapp' as channel,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered
FROM whatsapp_logs
WHERE created_at >= NOW() - INTERVAL '30 days';
```

## 🎯 Benefícios Implementados

| Recurso | Benefício |
|---------|-----------|
| 🔔 **Notificações Multicanal** | Informações chegam onde o usuário está |
| 📡 **Canal Ativo por Contexto** | IA entrega valor direto com feedback imediato |
| 🧠 **Copilot IA Comunicativo** | IA não só responde, mas alerta e resume |
| 📈 **Rastreabilidade via Logs** | Auditoria de todas as comunicações |
| 🎯 **Engajamento Contínuo** | Sistema não morre em "tarefas criadas" |

## 🚀 Próximos Passos

1. **Configurar credenciais** dos provedores (Resend, Teams, Twilio)
2. **Executar migrações** do banco de dados
3. **Testar conectividade** dos canais
4. **Configurar n8n** (opcional)
5. **Personalizar templates** conforme necessidade
6. **Monitorar métricas** de entrega e engajamento

---

**🎉 O MILAPP MedSênior agora possui comunicação proativa e multicanal, garantindo que nenhuma informação importante seja perdida!** 
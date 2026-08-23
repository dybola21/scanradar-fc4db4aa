# Expansão do Sistema de Logs Técnicos

O objetivo é ampliar o sistema de logs para cobrir todas as ações críticas do sistema, fornecendo uma trilha de auditoria completa para o usuário e suporte técnico.

## Alterações Técnicas

### 1. Banco de Dados
- Atualizar o enum `scan_event_type` para incluir novos tipos de eventos:
    - `SEARCH_DELETED`: Exclusão de uma busca.
    - `LEADS_DELETED`: Exclusão de leads (individual ou por busca).
    - `LOGS_CLEARED`: Limpeza total dos logs.
    - `SETTINGS_UPDATED`: Alteração nas configurações de n8n ou segurança.
    - `INTEGRATION_TESTED`: Execução de teste de conectividade.
    - `AUTH_ACTION`: Ações relacionadas a autenticação (login/logout).

### 2. Backend (Server Functions)
- **`src/lib/logs.functions.ts`**:
    - Atualizar o esquema Zod `eventTypeSchema` para incluir os novos tipos.
    - Adicionar log no final da função `clearAllLogs`.
- **`src/lib/scraper.functions.ts`**:
    - Instrumentar `deleteSearch` para registrar a exclusão.
    - Instrumentar `updateIntegrationSettings` para registrar mudanças de configuração (sanitizando valores sensíveis).
    - Instrumentar `testIntegration` para registrar o sucesso ou falha do teste.

### 3. Frontend (UI)
- **`src/routes/_authenticated.admin.logs.tsx`**:
    - Atualizar o mapeamento de labels no componente `getEventBadge` para exibir nomes amigáveis para os novos tipos de eventos.
    - Adicionar os novos tipos ao filtro de busca se necessário.

## Segurança e Privacidade
- Todos os logs continuarão passando pela sanitização existente para remover `webhook_secret`, `callback_secret` e outras chaves sensíveis.
- Os logs permanecem vinculados ao `userId` através da política de RLS existente (ou através da relação com a busca).

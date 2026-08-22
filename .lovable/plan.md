# Plano de Correção: Integração n8n e Erro AbortError

Investigação inicial indica que o erro `AbortError` é causado por um timeout fixo de 10 segundos no servidor (`src/lib/server/webhook-security.ts`), que entra em conflito com o tempo de resposta do n8n. Além disso, o fluxo atual é síncrono, fazendo com que o frontend aguarde a extração completa, o que é instável.

## Alterações Técnicas

### 1. Segurança e Infraestrutura de Rede (`src/lib/server/webhook-security.ts`)
- Aumentar o timeout do `safeWebhookFetch` para 30 segundos (limite seguro para Cloudflare Workers/Edge).
- Garantir que o `AbortController` seja descartado corretamente.
- Adicionar suporte a `requestType` e logs de auditoria (sem expor dados sensíveis).

### 2. Fluxo de Busca Assíncrona (`src/lib/scraper.functions.ts`)
- **Mudança de Paradigma**: A Server Function `startSearch` passará a ser assíncrona. Ela criará o registro, enviará o comando ao n8n e retornará uma confirmação de "processando" imediatamente após o n8n aceitar a carga (HTTP 200/202).
- **Idempotência**: Implementar verificação rigorosa por `searchId` para evitar duplicidade.
- **Status Progressivos**: Adicionar `delivery_unknown` para tratar casos onde o timeout ocorre mas o n8n pode ter recebido a ordem.

### 3. Melhoria no Teste de Conexão (`src/lib/scraper.functions.ts`)
- Isolar o `AbortController` do teste.
- Aceitar respostas vazias e status 202 (Accepted).
- Implementar mensagens de erro amigáveis substituindo o termo técnico "AbortError".

### 4. Interface e Feedback (`src/components/SearchPage.tsx` e `SettingsPage.tsx`)
- Ajustar toasts para refletir o sucesso da *inicialização* da busca, não da conclusão imediata.
- Bloquear envios duplicados no cliente.

### 5. Novo Endpoint de Callback (Opcional, mas recomendado)
- Criar `src/routes/api/public/callback.ts` para que o n8n possa notificar o ScanRadar quando a extração terminar, garantindo que o status mude para `completed` mesmo que o usuário feche o navegador.

## Detalhes Técnicos
- **Timeout**: 30s no servidor para evitar interrupções prematuras.
- **Protocolo**: Envio de `requestType: "search"` ou `"connection_test"`.
- **URL**: Forçar o uso de URLs de produção (`/webhook/`).

## Auditoria e Logs
- Adição de logs server-side contendo apenas meta-dados da requisição (searchId, duração, status HTTP).
- Remoção de qualquer log que possa vazar o `X-Webhook-Secret`.

# Plano de Correção: Integração n8n e Erro AbortError (v2)

Após auditoria técnica, identifiquei:
- **Response Mode Atual**: Síncrono (aguarda extração completa no corpo da resposta).
- **Localização do Timeout**: `src/lib/server/webhook-security.ts:126` (10 segundos).
- **Retorno de Resultados**: Diretamente no corpo da resposta HTTP da Server Function.

## 1. Infraestrutura de Rede e Segurança
- **Timeout**: Aumentar para 30s no servidor para garantir a entrega do comando, mas orientar o n8n a responder imediatamente.
- **Auditoria**: Adicionar logs server-side contendo `searchId`, `requestType`, duração e status HTTP, sem vazar segredos.
- **SSRF**: Manter proteção com `safeWebhookFetch`.

## 2. Fluxo de Busca Assíncrona e Idempotência
- **Banco de Dados**: Atualizar a restrição da tabela `searches` para incluir os status `queued` e `delivery_unknown`.
- **Idempotência**: Garantir que o `searchId` (UUID) seja usado como chave de idempotência no envio ao n8n via header `X-Idempotency-Key`.
- **Refatoração `startSearch`**:
    1. Criar registro como `queued`.
    2. Enviar para o n8n e aguardar apenas o aceite (HTTP 2xx).
    3. Se aceito, mudar para `processing` e retornar ao frontend.
    4. Se houver timeout/erro de rede após o envio, mudar para `delivery_unknown`.

## 3. Entrega de Resultados (Callback)
- **Novo Endpoint**: Criar `src/routes/api.public.results.ts` (Webhook de Callback).
- **Segurança**: Protegido por um segredo de callback exclusivo (recuperado no servidor) e validação de schema Zod.
- **Processamento**: O endpoint receberá os leads do n8n, salvará na tabela `leads` e marcará a busca como `completed`.

## 4. Teste de Conexão e Refinamento de UI
- **Teste**: Usar ramificação curta no n8n (sem extração) e aceitar qualquer resposta 2xx.
- **UI**: 
    - Substituir `AbortError` por mensagens amigáveis ("Não foi possível confirmar o recebimento...").
    - Bloquear duplo clique durante o envio.
    - Notificar "Busca iniciada e sendo processada" após o aceite do webhook.

## 5. Ajustes no n8n (Manual pelo Usuário)
- Configurar o nó Webhook para `Response Mode: Respond Immediately`.
- Implementar ramificação para `requestType: "connection_test"`.
- Enviar os resultados para o novo endpoint de callback ao finalizar.


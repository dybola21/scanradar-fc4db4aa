# Plano de Correção: Integração n8n e Erro AbortError (v4)

## 1. Infraestrutura e Fluxo Assíncrono Idempotente
- **Timeout**: Reduzir para 15s no servidor (aceite inicial), com o n8n em `Respond Immediately`.
- **Idempotência**:
    - `searchId` (UUID) único no banco.
    - Header `X-Idempotency-Key` no envio.
    - **Ajuste n8n**: O workflow deve consultar um armazenamento persistente (Data Table ou banco) para garantir que um `searchId` nunca seja reprocessado.

## 2. Refatoração `startSearch` e Tratamento HTTP
- Criar registro como `queued`.
- Classificação de retorno:
    - `2xx` → `processing`.
    - `401/403` → `failed` (Erro de autenticação).
    - `4xx` (outros) → `failed` (Requisição rejeitada).
    - `5xx` / Timeout / Conexão → `delivery_unknown`.

## 3. Callback Robusto e Transacional (External Server Route)
- **Endpoint**: `src/routes/api.public.results.ts` (Handler POST).
- **Segurança**:
    - **X-Callback-Secret**: Gerado por usuário/integração, armazenado criptografado no banco, enviado via header. Nunca exposto no frontend.
    - Validação Zod e limite de tamanho (1MB).
- **Transacionalidade (Supabase RPC)**:
    - `upsert` de leads (chave: `search_id` + `place_id` ou `url`).
    - Atualização de status para `completed` ou `failed` APÓS confirmação de gravação de todos os leads.
- **Tratamento de Erros no n8n**: O workflow deve possuir ramificação de erro (ou Error Trigger) que notifique o callback com `status: "failed"` em caso de quebra interna.

## 4. Acompanhamento em Tempo Real
- **Supabase Realtime**: Habilitar replicação para `searches` e `leads`.
- **Frontend**: Componente de resultados assina o canal filtrado por `searchId` com fallback de polling em caso de falha na conexão Realtime.

## 5. UI e Feedback
- Toasts: "Busca iniciada e sendo processada."
- Bloqueio de duplo clique no botão de busca.
- Erros amigáveis: Substituir `AbortError` por "Não foi possível confirmar o recebimento. Verifique o histórico...".

## 6. Validação e Testes
- **Teste de Ponta a Ponta (Obrigatório)**: Validar aceite imediato, gravação na planilha, callback de sucesso/erro e atualização da UI via Realtime.
- Logs: `searchId`, `requestType`, status HTTP, duração (sem segredos ou PII).

- Implementar um "Teste de Ponta a Ponta" opcional para validar todo o ciclo (envio + callback).



# Plano de Correção: Integração n8n e Erro AbortError (v5)

## 1. Arquitetura de Comunicação e Idempotência
- **Timeout**: Reduzir para 15s (aceite inicial), com n8n em `Respond Immediately`.
- **Idempotência**: `searchId` (UUID) único no banco. O n8n deve persistir `searchId` no início e consultar se já foi processado (rejeitando duplicatas).
- **Deduplicação de Leads**:
    - `lead_key = place_id` (quando disponível).
    - `lead_key = hash` dos dados normalizados (nome, endereço, telefone) como fallback.
    - Restrição: `UNIQUE(search_id, lead_key)`. Nunca usar URL como identidade principal.

## 2. Refatoração `startSearch` e Estados
- Criar registro como `queued`.
- Classificação HTTP:
    - `2xx` -> `processing`.
    - `401/403` -> `failed`.
    - Outros `4xx` -> `failed`.
    - Timeout/Erro de conexão -> `delivery_unknown`.
    - `5xx` -> `delivery_unknown` (recebimento inconclusivo).
- **Reconciliação `delivery_unknown`**: Ação "Verificar processamento" na UI para consulta por `searchId` e reenvio controlado.

## 3. Callback Seguro e Transacional
- **Endpoint**: Server Route `src/routes/api/public/results.ts` (POST).
- **X-Callback-Secret**:
    - Gerado pelo servidor por usuário/integração.
    - Exibido **uma única vez** para o usuário configurá-lo no n8n.
    - Armazenado criptografado e nunca retornado novamente pela API.
    - Opção de rotação disponível.
    - Enviado pelo n8n no **header**, nunca na URL ou corpo.
- **Transação (Supabase RPC)**: `upsert` de leads e atualização de status (`completed`/`failed`) em operação atômica.
- **Tratamento de Erro no n8n**: O workflow deve capturar falhas e notificar o callback:
    ```json
    {
      "searchId": "...",
      "status": "failed",
      "errorCode": "WORKFLOW_FAILED",
      "message": "Mensagem segura"
    }
    ```
    Garantir que o `searchId` seja mantido/recuperado via persistência inicial no n8n.

## 4. Atualização em Tempo Real (Supabase Realtime)
- Habilitar replicação para `searches` e `leads`.
- RLS rígido por usuário.
- Frontend:
    - Assinatura filtrada por `searchId`.
    - Remoção do canal no `unmount`.
    - Fallback de polling inteligente (apenas se Realtime falhar).
    - Encerrar polling em estados terminais (`completed`/`failed`).

## 5. UI e Validação
- Toasts informativos sobre o processamento assíncrono.
- Bloqueio de duplo clique.
- Substituir `AbortError` por mensagem amigável de verificação.

## 6. Testes e Auditoria
- **Teste de Ponta a Ponta (OBRIGATÓRIO)**: Ciclo completo (envio -> n8n -> callback -> realtime UI) antes da publicação.
- Logs: `searchId`, `requestType`, status HTTP e duração (sem PII ou segredos).

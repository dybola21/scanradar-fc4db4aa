# Plano de Correção: Integração n8n e Erro AbortError (v3)

## 1. Infraestrutura e Fluxo Assíncrono
- **Timeout**: Reduzir para um valor curto e configurável (ex: 15s) para o aceite inicial, já que o n8n será configurado para `Respond Immediately`.
- **Idempotência Real**: 
    - `searchId` (UUID) como chave única no banco de dados.
    - Envio do header `X-Idempotency-Key` ao n8n.
    - O n8n deve validar o `searchId` no início do workflow.

## 2. Refatoração da Server Function `startSearch`
- A função criará o registro como `queued`, enviará a requisição ao n8n e retornará imediatamente após o aceite (HTTP 2xx).
- Se o aceite falhar (timeout/rede), o status mudará para `delivery_unknown`.
- Se o aceite for bem-sucedido, o status mudará para `processing`.

## 3. Callback HTTP Robusto e Transacional
- **Endpoint**: Criar uma Server Route (`src/routes/api.public.results.ts`) usando `createFileRoute` com handlers `POST`.
- **Segurança**: Protegido por segredo exclusivo de callback, limite de tamanho e validação Zod.
- **Transacionalidade**: Implementar uma função RPC no banco (Supabase) que realize em uma única transação:
    1. Validar a existência e o status da busca.
    2. Realizar `upsert` dos leads (usando restrição única de `search_id` + `place_id`/`url`).
    3. Atualizar metadados (planilha, total).
    4. Mudar status para `completed` ou `failed`.
- **Estados**: O callback aceitará `completed`, `failed` (com erro seguro) e `partial`.

## 4. Acompanhamento no Frontend
- Utilizar **Supabase Realtime** no componente de resultados para ouvir mudanças no registro da busca e na tabela de leads, garantindo atualização instantânea sem polling.

## 5. UI e Feedback
- Toasts: "Busca iniciada e sendo processada."
- Bloqueio de cliques duplos durante o `mutate`.
- Substituir `AbortError` por: "Não foi possível confirmar o recebimento. Verifique o histórico antes de tentar novamente."

## 6. Ajustes no n8n (Manual pelo Usuário)
- Webhook: `Response Mode: Respond Immediately`.
- Nó final: `HTTP Request POST` para o novo callback com `Retry On Fail` (3 tentativas).
- Ramificação curta para `requestType: "connection_test"`.

## 7. Testes e Auditoria
- Logs server-side: `searchId`, `requestType`, status HTTP, duração e resultado da entrega (sem dados sensíveis).
- Implementar um "Teste de Ponta a Ponta" opcional para validar todo o ciclo (envio + callback).



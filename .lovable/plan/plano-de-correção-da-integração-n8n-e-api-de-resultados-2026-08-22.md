# Plano de Correção da Integração n8n e API de Resultados

Este plano visa corrigir o erro HTTP 500 no endpoint de callback do n8n e garantir que os dados sejam processados e armazenados corretamente no banco de dados.

## Alterações Técnicas

### 1. Refatoração da Rota de API (`src/routes/api.public.results.ts`)
- **Robustez no Parsing**: Adicionar tratamento de erro para `request.json()`.
- **Mapeamento de Campos**: Converter os nomes dos campos dos leads enviados pelo n8n (em inglês) para os nomes esperados pelo banco de dados e pela função RPC (em português).
    - `name` -> `nome`
    - `phone` -> `telefone`
    - `address` -> `endereco`
    - Preservar demais campos se presentes (`email`, `website`, `lead_key`, etc.).
- **Resposta JSON Padronizada**: Garantir que todos os retornos (sucesso e erro) sejam objetos JSON com o cabeçalho `Content-Type: application/json`.
- **Validação de Segurança**: Retornar `401 Unauthorized` com JSON descritivo quando o `x-callback-secret` for inválido ou ausente.
- **Logging**: Melhorar os logs do servidor para facilitar diagnósticos futuros.

### 2. Validação da Estrutura de Dados
- Confirmar que o mapeamento entre o payload do n8n e o RPC `complete_search_with_leads` está completo.
- Garantir que valores nulos ou ausentes no payload do n8n não quebrem a inserção no banco.

## Etapas de Verificação
- Simular uma requisição POST para `/api/public/results` com um payload de teste idêntico ao do n8n.
- Validar se a resposta é `200 OK` e se os dados aparecem corretamente nas tabelas `searches` e `leads`.
- Testar o cenário de erro enviando um segredo incorreto para validar o retorno `401`.

## Informações para o Usuário (após a correção)
- URL de Callback: `https://scanradar.lovable.app/api/public/results`
- Método: `POST`
- Header: `x-callback-secret: [SEU_SEGREDO]`
- Body: Formato JSON conforme especificado na solicitação.

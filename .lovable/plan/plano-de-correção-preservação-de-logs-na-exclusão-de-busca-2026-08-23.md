# Plano de Correção: Preservação de Logs na Exclusão de Busca

O objetivo é garantir que, ao excluir uma busca do histórico, os leads e a busca sejam removidos, mas os logs técnicos (`scan_logs`) sejam preservados para fins de auditoria e depuração, desvinculando-os da busca excluída.

## Alterações Técnicas

### 1. Banco de Dados (SQL)
- Remover a restrição de chave estrangeira `scan_logs_search_id_fkey` que vincula `scan_logs` a `searches`.
- Criar uma nova restrição com `ON DELETE SET NULL`. Isso garante que se uma busca for deletada, o campo `search_id` no log vire `NULL`, mas o registro do log permaneça.
- Garantir que as políticas de RLS permitam que o usuário veja logs mesmo que o `search_id` seja nulo (através do `payload` ou outra lógica se necessário, mas como logs são globais para o admin, o acesso admin já deve cobrir).

### 2. Backend (`src/lib/scraper.functions.ts`)
- Modificar a função `deleteSearch`.
- Remover a linha que deleta explicitamente os logs: `await supabase.from("scan_logs").delete().eq("search_id", data.searchId);`.
- Adicionar uma etapa para atualizar os logs existentes daquela busca, registrando no payload que a busca original foi removida (opcional, mas bom para histórico).
- Registrar um novo evento de log `SEARCH_DELETED` *após* a exclusão da busca, para que fique documentado quem apagou o quê.

### 3. Interface de Logs (`src/routes/_authenticated.admin.logs.tsx`)
- Garantir que a UI de logs lide bem com logs que têm `search_id` nulo (já parece lidar com `.slice(0, 8)` mas pode precisar de um fallback visual tipo "N/A" ou "Excluída").

## Detalhes de Implementação

### SQL
```sql
ALTER TABLE public.scan_logs 
DROP CONSTRAINT IF EXISTS scan_logs_search_id_fkey;

ALTER TABLE public.scan_logs 
ADD CONSTRAINT scan_logs_search_id_fkey 
FOREIGN KEY (search_id) REFERENCES public.searches(id) 
ON DELETE SET NULL;
```

### Refatoração `deleteSearch`
```typescript
// Em src/lib/scraper.functions.ts
export const deleteSearch = createServerFn({ method: "POST" })
  // ...
  .handler(async ({ data, context }) => {
    // 1. Validar posse
    // 2. Opcional: Anotar nos logs que a busca será deletada
    // 3. Deletar leads (leads devem ser deletados pois são dados de resultado)
    // 4. Deletar a busca (o DB agora fará SET NULL nos scan_logs automaticamente)
    // 5. Logar o evento SEARCH_DELETED
  });
```

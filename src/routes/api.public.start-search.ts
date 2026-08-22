import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { serverLogScanEvent } from '@/lib/logs.server';

const startSearchSchema = z.object({
  searchId: z.string().uuid(),
  termo: z.string().min(1),
  cidade: z.string().min(1),
  uf: z.string().length(2),
});

export const Route = createFileRoute('/api/public/start-search')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const jsonResponse = (data: any, status = 200) => {
          return new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' },
          });
        };

        let body: any;
        try {
          body = await request.json();
        } catch (e) {
          return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
        }

        // Validate input
        const result = startSearchSchema.safeParse(body);
        if (!result.success) {
          return jsonResponse({ success: false, error: 'Invalid input', details: result.error.format() }, 400);
        }

        const { searchId, termo, cidade, uf } = result.data;

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

          // Step 1: Database Check - Verify the searchId exists
          const { data: searchRecord, error: searchError } = await supabaseAdmin
            .from('searches')
            .select('id, user_id')
            .eq('id', searchId)
            .single();

          if (searchError || !searchRecord) {
            console.error(`[StartSearch] Search record not found: ${searchId}`);
            return jsonResponse({ success: false, error: 'Search record not found' }, 404);
          }

          // Step 2: Log SEARCH_CREATED (after DB confirmation)
          await serverLogScanEvent({
            searchId,
            eventType: 'SEARCH_CREATED',
            eventStatus: 'success',
            message: `Busca confirmada no banco: ${termo} em ${cidade}/${uf}`,
            payload: { termo, cidade, uf }
          });

          // Step 3: Configuration - env first, fallback to the user's saved integration
          let n8nWebhookUrl = process.env['N8N_WEBHOOK_URL'] || '';
          let n8nWebhookSecret = process.env['N8N_WEBHOOK_SECRET'] || '';

          if (!n8nWebhookUrl) {
            const { data: settings } = await supabaseAdmin
              .from('n8n_settings')
              .select('webhook_url, webhook_secret')
              .eq('user_id', searchRecord.user_id)
              .maybeSingle();

            if (settings?.webhook_url) {
              const { decrypt } = await import('@/lib/server/encryption');
              n8nWebhookUrl = settings.webhook_url;
              if (settings.webhook_secret) {
                try {
                  n8nWebhookSecret = decrypt(settings.webhook_secret);
                } catch {
                  n8nWebhookSecret = '';
                }
              }
            }
          }

          if (!n8nWebhookUrl) {
            const errorMsg = 'Configuração do n8n ausente (URL do webhook não encontrada)';
            console.error(`[StartSearch] ${errorMsg}`);

            await serverLogScanEvent({
              searchId,
              eventType: 'SYSTEM_ERROR',
              eventStatus: 'failed',
              errorMessage: errorMsg,
              message: 'Falha na configuração do ambiente n8n'
            });

            return jsonResponse({ success: false, error: errorMsg }, 400);
          }


          // Step 4: Log N8N_REQUEST_SENT
          // Scrub URL for logs
          const scrubbedUrl = n8nWebhookUrl.replace(/(https?:\/\/)([^@]+@)?([^\/]+)/, '$1$3');
          
          await serverLogScanEvent({
            searchId,
            eventType: 'N8N_REQUEST_SENT',
            eventStatus: 'started',
            message: 'Iniciando chamada para o webhook do n8n',
            payload: { 
              url: scrubbedUrl,
              searchId,
              timestamp: new Date().toISOString()
            }
          });

          // Step 5: Dispatch to n8n
          const startTime = Date.now();
          const n8nPayload = {
            requestType: "search",
            searchId,
            termo,
            cidade,
            uf
          };

          try {
            const response = await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(n8nWebhookSecret ? { 'X-Webhook-Secret': n8nWebhookSecret } : {}),
                'X-Idempotency-Key': searchId,
              },

              body: JSON.stringify(n8nPayload),
              redirect: 'manual',
            });

            const durationMs = Date.now() - startTime;
            const responseText = await response.clone().text().catch(() => 'N/A');

            // Step 6: Handle Response - Success
            await serverLogScanEvent({
              searchId,
              eventType: 'N8N_RESPONSE_RECEIVED',
              eventStatus: response.ok ? 'success' : 'failed',
              httpStatus: response.status,
              durationMs,
              message: `n8n respondeu com status ${response.status}`,
              payload: { 
                responsePreview: responseText.slice(0, 500),
                durationMs 
              }
            });

            if (response.ok) {
              // Update status to processing since n8n accepted it
              await supabaseAdmin
                .from('searches')
                .update({ status: 'processing' })
                .eq('id', searchId);

              // Step 7: Immediate Response
              return jsonResponse({
                success: true,
                status: 'queued',
                searchId
              });
            } else {
              return jsonResponse({ 
                success: false, 
                error: `n8n returned status ${response.status}`,
                status: 'failed'
              }, response.status);
            }

          } catch (fetchErr: any) {
            // Step 6: Handle Response - Failure/Timeout
            const durationMs = Date.now() - startTime;
            const isTimeout = fetchErr.name === 'AbortError' || fetchErr.message?.includes('timeout');
            
            await serverLogScanEvent({
              searchId,
              eventType: 'N8N_ERROR',
              eventStatus: 'failed',
              errorMessage: fetchErr.message || String(fetchErr),
              message: isTimeout ? 'Tempo limite esgotado ao chamar n8n' : 'Erro técnico ao chamar n8n',
              durationMs,
              payload: { 
                errorName: fetchErr.name,
                isTimeout
              }
            });

            return jsonResponse({ 
              success: false, 
              error: fetchErr.message || 'Error calling n8n',
              status: isTimeout ? 'delivery_unknown' : 'failed'
            }, 500);
          }

        } catch (globalErr: any) {
          console.error('[StartSearch] Global error:', globalErr);
          return jsonResponse({ success: false, error: 'Internal server error' }, 500);
        }
      }
    }
  }
});

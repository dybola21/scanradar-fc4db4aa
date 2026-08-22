import { createFileRoute } from '@tanstack/react-router'

import { verifySecret } from '@/lib/server/encryption'
import { serverLogScanEvent } from '@/lib/logs.server'

export const Route = createFileRoute('/api/public/results')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const jsonResponse = (data: any, status = 200) => {
          return new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' }
          });
        };

        try {
          const secret = request.headers.get('x-callback-secret')
          let body;
          try {
            body = await request.json();
          } catch (e) {
            console.error('[Callback] Failed to parse JSON body');
            return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
          }

          const { searchId, status, totalLeads, leads, sheetName, sheetUrl, message } = body

          if (searchId) {
            await serverLogScanEvent({
              searchId,
              eventType: 'CALLBACK_RECEIVED',
              eventStatus: 'started',
              message: `Callback do n8n recebido via POST /api/public/results`,
              payload: { 
                headers: Object.fromEntries(request.headers.entries()),
                body: { ...body, leads: `[${leads?.length || 0} leads]` }
              }
            });
          }

          console.log(`[Callback] Received results for searchId: ${searchId}, status: ${status}, leads: ${leads?.length || 0}`);

          if (!secret || !searchId) {
            const errorMsg = 'Missing x-callback-secret header or searchId';
            console.warn(`[Callback] ${errorMsg}. Secret present: ${!!secret}, searchId: ${searchId}`);
            
            if (searchId) {
              await serverLogScanEvent({
                searchId,
                eventType: 'SYSTEM_ERROR',
                eventStatus: 'failed',
                errorMessage: errorMsg,
                message: 'Falha na validação inicial do callback'
              });
            }
            return jsonResponse({ success: false, error: errorMsg }, 400);
          }

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          // Get the search record to verify the callback secret
          const { data: search, error: searchError } = await supabaseAdmin
            .from('searches')
            .select('user_id')
            .eq('id', searchId)
            .single()

          if (searchError || !search) {
            const errorMsg = 'Search not found';
            console.error(`[Callback] ${errorMsg} for searchId: ${searchId}`);
            
            await serverLogScanEvent({
              searchId,
              eventType: 'SYSTEM_ERROR',
              eventStatus: 'failed',
              errorMessage: errorMsg,
              message: 'Tentativa de callback para uma busca inexistente'
            });
            return jsonResponse({ success: false, error: errorMsg }, 404);
          }

          // Get settings to verify callback secret
          const { data: settings } = await supabaseAdmin
            .from('n8n_settings')
            .select('callback_secret_hash')
            .eq('user_id', search.user_id)
            .single()

          if (!settings?.callback_secret_hash || !verifySecret(secret, settings.callback_secret_hash)) {
            const errorMsg = 'Invalid callback secret';
            console.error(`[Callback] ${errorMsg} for searchId: ${searchId}`);
            
            await serverLogScanEvent({
              searchId,
              eventType: 'SYSTEM_ERROR',
              eventStatus: 'failed',
              errorMessage: errorMsg,
              message: 'Falha na autenticação do callback (segredo inválido)'
            });
            return jsonResponse({ success: false, error: errorMsg }, 401);
          }

          await serverLogScanEvent({
            searchId,
            eventType: 'CALLBACK_VALIDATED',
            eventStatus: 'success',
            message: 'Callback autenticado com sucesso'
          });

          // Map leads from English to Portuguese names as expected by the RPC
          const mappedLeads = (leads || []).map((lead: any) => ({
            lead_key: lead.lead_key,
            place_id: lead.place_id,
            nome: lead.name || lead.nome,
            telefone: lead.phone || lead.telefone,
            endereco: lead.address || lead.endereco,
            website: lead.website,
            bairro: lead.bairro,
            cidade: lead.cidade,
            uf: lead.uf,
            email: lead.email,
            email2: lead.email2
          }));

          // Transactional update via RPC
          const { error: rpcError } = await supabaseAdmin.rpc('complete_search_with_leads', {
            p_search_id: searchId,
            p_status: status || 'completed',
            p_total_leads: Number(totalLeads) || 0,
            p_leads: mappedLeads,
            p_sheet_name: sheetName || null,
            p_sheet_url: sheetUrl || null,
            p_error_message: message || null
          })

          if (rpcError) {
            console.error(`[Callback] RPC Error for searchId: ${searchId}:`, rpcError);
            
            await serverLogScanEvent({
              searchId,
              eventType: 'SYSTEM_ERROR',
              eventStatus: 'failed',
              errorMessage: rpcError.message,
              message: 'Erro ao persistir resultados no banco de dados (RPC complete_search_with_leads)'
            });
            return jsonResponse({ success: false, error: rpcError.message }, 500);
          }

          await serverLogScanEvent({
            searchId,
            eventType: 'RESULTS_SAVED',
            eventStatus: 'success',
            message: `Resultados salvos com sucesso: ${mappedLeads.length} leads processados`,
            payload: { totalLeads, sheetName, sheetUrl }
          });

          console.log(`[Callback] Successfully processed results for searchId: ${searchId}`);
          return jsonResponse({ success: true, message: 'Results received', scanId: searchId });
        } catch (error: any) {
          console.error('[Callback] Critical error:', error);
          
          const searchId = (body as any)?.searchId;
          if (searchId) {
            await serverLogScanEvent({
              searchId,
              eventType: 'SYSTEM_ERROR',
              eventStatus: 'failed',
              errorMessage: error.message || 'Internal server error',
              message: 'Erro crítico inesperado no endpoint de callback'
            });
          }
          return jsonResponse({ success: false, error: error.message || 'Internal server error' }, 500);
        }
      }
    }
  }
})


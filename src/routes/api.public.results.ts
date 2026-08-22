import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { verifySecret } from '@/lib/server/encryption'

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

          console.log(`[Callback] Received results for searchId: ${searchId}, status: ${status}, leads: ${leads?.length || 0}`);

          if (!secret || !searchId) {
            console.warn(`[Callback] Missing headers or searchId. Secret present: ${!!secret}, searchId: ${searchId}`);
            return jsonResponse({ success: false, error: 'Missing x-callback-secret header or searchId' }, 400);
          }

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          // Get the search record to verify the callback secret
          const { data: search, error: searchError } = await supabaseAdmin
            .from('searches')
            .select('user_id')
            .eq('id', searchId)
            .single()

          if (searchError || !search) {
            console.error(`[Callback] Search record not found for searchId: ${searchId}`);
            return jsonResponse({ success: false, error: 'Search not found' }, 404);
          }

          // Get settings to verify callback secret
          const { data: settings } = await supabaseAdmin
            .from('n8n_settings')
            .select('callback_secret_hash')
            .eq('user_id', search.user_id)
            .single()

          if (!settings?.callback_secret_hash || !verifySecret(secret, settings.callback_secret_hash)) {
            console.error(`[Callback] Unauthorized secret for searchId: ${searchId}`);
            return jsonResponse({ success: false, error: 'Invalid callback secret' }, 401);
          }



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
            return jsonResponse({ success: false, error: rpcError.message }, 500);
          }

          console.log(`[Callback] Successfully processed results for searchId: ${searchId}`);
          return jsonResponse({ success: true, message: 'Results received', scanId: searchId });
        } catch (error: any) {
          console.error('[Callback] Critical error:', error);
          return jsonResponse({ success: false, error: error.message || 'Internal server error' }, 500);
        }
      }
    }
  }
})


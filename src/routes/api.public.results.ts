import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { verifySecret } from '@/lib/server/encryption'

export const Route = createFileRoute('/api/public/results')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get('x-callback-secret')
        const body = await request.json()
        const { searchId, status, totalLeads, leads, sheetName, sheetUrl, message } = body

        console.log(`[Callback] Received results for searchId: ${searchId}, status: ${status}, leads: ${leads?.length || 0}`);

        if (!secret || !searchId) {
          console.warn(`[Callback] Missing headers or searchId. Secret present: ${!!secret}, searchId: ${searchId}`);
          return new Response(JSON.stringify({ error: 'Missing headers or searchId' }), { status: 400 })
        }

        const supabaseUrl = process.env['VITE_SUPABASE_URL']!
        const supabaseAdmin = createClient(supabaseUrl, process.env['SUPABASE_SERVICE_ROLE_KEY']!, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        // Get the search record to verify the callback secret
        const { data: search, error: searchError } = await supabaseAdmin
          .from('searches')
          .select('user_id')
          .eq('id', searchId)
          .single()

        if (searchError || !search) {
          return new Response(JSON.stringify({ error: 'Search not found' }), { status: 404 })
        }

        // Get settings to verify callback secret
        const { data: settings } = await supabaseAdmin
          .from('n8n_settings')
          .select('callback_secret_hash')
          .eq('user_id', search.user_id)
          .single()

        if (!settings?.callback_secret_hash || !verifySecret(secret, settings.callback_secret_hash)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        // Transactional update via RPC
        const { error: rpcError } = await supabaseAdmin.rpc('complete_search_with_leads', {
          p_search_id: searchId,
          p_status: status,
          p_total_leads: totalLeads || 0,
          p_leads: leads || [],
          p_sheet_name: sheetName,
          p_sheet_url: sheetUrl,
          p_error_message: message
        })

        if (rpcError) {
          return new Response(JSON.stringify({ error: rpcError.message }), { status: 500 })
        }

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
      }
    }
  }
})

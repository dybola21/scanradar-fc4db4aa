import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { searchSchema, scraperResponseSchema } from "./schemas";
import { buildPresenceDistribution, opportunityScore } from "./lead-insights";
import { classifyWebsiteUrl } from "./website-utils";
import { encrypt, decrypt, generateCallbackSecret, hashSecret } from "./server/encryption";
import { safeWebhookFetch } from "./server/webhook-security";
import { serverLogScanEvent } from "./logs.server";

export const getIntegrationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("n8n_settings")
      .select("webhook_url, webhook_secret, integration_name, is_connected, updated_at, callback_secret_hash")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return {
      webhook_url: data?.webhook_url || "",
      webhook_secret: data?.webhook_secret ? "••••••••••••••••" : "",
      has_secret: Boolean(data?.webhook_secret),
      has_callback_secret: Boolean(data?.callback_secret_hash),
      integration_name: data?.integration_name || "n8n integration",
      is_connected: data?.is_connected || false,
      updated_at: data?.updated_at ?? null,
    };
  });


export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("n8n_settings")
      .select("webhook_url, is_connected, integration_name")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return {
      configured: Boolean(data?.webhook_url),
      is_connected: Boolean(data?.is_connected),
      integration_name: data?.integration_name || "n8n integration",
    };
  });



export const updateIntegrationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      webhook_url: z.string().url("URL inválida"),
      webhook_secret: z.string().nullable().optional(),
      integration_name: z.string().min(1),
      rotate_callback_secret: z.boolean().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { webhook_url, webhook_secret, integration_name, rotate_callback_secret } = data;

    const updateData: any = {
      webhook_url,
      integration_name,
      updated_at: new Date().toISOString(),
    };

    let newCallbackSecret: string | null = null;

    if (rotate_callback_secret) {
      newCallbackSecret = generateCallbackSecret();
      updateData.callback_secret_hash = hashSecret(newCallbackSecret);
    }

    if (webhook_secret) {
      updateData.webhook_secret = encrypt(webhook_secret);
    }

    const { error } = await supabase
      .from("n8n_settings")
      .upsert(
        {
          user_id: userId,
          ...updateData,
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    return { success: true, callbackSecret: newCallbackSecret };
  });


export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: settings, error: settingsError } = await supabase
      .from("n8n_settings")
      .select("webhook_url, webhook_secret")
      .eq("user_id", userId)
      .single();

    if (settingsError || !settings?.webhook_url) {
      return { success: false, error: "Integração não configurada" };
    }

    const webhookUrl = settings.webhook_url!;

    try {
      const secret = settings.webhook_secret ? decrypt(settings.webhook_secret) : "";
      
      const response = await safeWebhookFetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Webhook-Secret": secret,
        },
        body: JSON.stringify({ 
          requestType: "connection_test", 
          test: true 
        }),
      });

      if (response.status === 200 || response.status === 204) {
        await supabase
          .from("n8n_settings")
          .update({ is_connected: true })
          .eq("user_id", userId);
        return { success: true };
      } else if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "A chave de segurança foi recusada.",
        };
      } else {
        return {
          success: false,
          error: `O n8n retornou erro: ${response.status}`,
        };
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        return { success: false, error: "O n8n não respondeu dentro do tempo esperado." };
      }
      return { success: false, error: "Erro ao conectar com o n8n" };
    }
  });

export const startSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(searchSchema)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      
      await serverLogScanEvent({
        eventType: 'START_SEARCH_ENTERED',
        eventStatus: 'started',
        message: 'Função startSearch iniciada no servidor',
        payload: { ...data, userId }
      });

      await serverLogScanEvent({
        eventType: 'AUTH_SUCCESS',
        eventStatus: 'success',
        message: 'Autenticação validada com sucesso',
        payload: { userId }
      });

      console.log(`[Scraper] startSearch BEGIN - User: ${userId}`, data);

    const termo = data.termo.trim();
    const cidade = data.cidade.trim();
    const uf = data.uf.toUpperCase();

    if (!termo || !cidade || !uf) {
      throw new Error("Preencha nicho, cidade e estado.");
    }

    // Check for ongoing identical searches
    const { data: ongoing } = await supabase
      .from("searches")
      .select("id, status")
      .eq("user_id", userId)
      .eq("termo", termo)
      .eq("cidade", cidade)
      .eq("uf", uf)
      .in("status", ["pending", "queued", "processing"])
      .limit(1)
      .maybeSingle();

    if (ongoing) {
      return { success: true, searchId: ongoing.id, status: ongoing.status, repeated: true };
    }

    let settings;
    try {
      const { data, error: settingsError } = await supabase
        .from("n8n_settings")
        .select("webhook_url, webhook_secret")
        .eq("user_id", userId)
        .single();

      if (settingsError || !data?.webhook_url) {
        throw new Error(settingsError?.message || "Integração n8n não configurada no banco de dados.");
      }
      settings = data;
    } catch (configError: any) {
      await serverLogScanEvent({
        eventType: 'SYSTEM_ERROR',
        eventStatus: 'failed',
        errorMessage: String(configError.message || configError),
        message: 'Falha ao recuperar configurações do n8n',
        payload: { userId }
      });
      console.error("[Scraper] n8n configuration error:", configError);
      throw configError;
    }


    const requestId = crypto.randomUUID();

    const { data: searchRecord, error: searchError } = await supabase
      .from("searches")
      .insert({
        user_id: userId,
        request_id: requestId,
        termo,
        cidade,
        uf,
        status: "queued",
      })
      .select()
      .single();

    if (searchError) {
      await serverLogScanEvent({
        eventType: 'SEARCH_INSERT_ERROR',
        eventStatus: 'failed',
        errorMessage: String(searchError.message || searchError),
        message: 'Erro ao inserir busca no banco de dados',
        payload: { error: searchError }
      });
      console.error("[Scraper] Database insert error:", searchError);
      throw searchError;
    }

    await serverLogScanEvent({
      searchId: searchRecord.id,
      eventType: 'SEARCH_INSERT_SUCCESS',
      eventStatus: 'success',
      message: 'Busca inserida no banco de dados',
      payload: { searchId: searchRecord.id }
    });

    await serverLogScanEvent({
      searchId: searchRecord.id,
      eventType: 'SEARCH_CREATED',
      eventStatus: 'success',
      message: `Busca criada no banco de dados: ${termo} em ${cidade}/${uf}`,
      payload: { termo, cidade, uf, userId }
    });

    try {
      console.log(`[Scraper] Preparing webhook request for search ${searchRecord.id}`);

      const secret = settings.webhook_secret ? decrypt(settings.webhook_secret) : "";
      
      const payload = { 
        requestType: "search",
        searchId: searchRecord.id,
        termo, 
        cidade, 
        uf 
      };

      const webhookHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Webhook-Secret": secret ? "[PRESENT]" : "[MISSING]",
        "X-Idempotency-Key": searchRecord.id,
      };

      await serverLogScanEvent({
        searchId: searchRecord.id,
        eventType: 'N8N_REQUEST_SENT',
        eventStatus: 'started',
        message: `Iniciando fetch para n8n: ${termo} em ${cidade}/${uf}`,
        payload: { 
          url: settings.webhook_url, 
          payload,
          headers: webhookHeaders,
          timeout: "15s"
        }
      });

      const startTime = Date.now();
      const webhookUrl = settings.webhook_url!;
      console.log(`[Scraper] Calling safeWebhookFetch to: ${webhookUrl}`);

      await serverLogScanEvent({
        searchId: searchRecord.id,
        eventType: 'N8N_REQUEST_ATTEMPT',
        eventStatus: 'started',
        message: 'Tentando realizar fetch para o webhook do n8n',
        payload: { url: webhookUrl }
      });
      
      const response = await safeWebhookFetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Webhook-Secret": secret,
          "X-Idempotency-Key": searchRecord.id,
        },
        body: JSON.stringify(payload),
      });

      const durationMs = Date.now() - startTime;
      console.log(`[Scraper] Webhook returned status: ${response.status} in ${durationMs}ms`);

      
      let nextStatus = "delivery_unknown";
      let eventStatus: 'success' | 'failed' | 'warning' = 'success';

      if (response.status >= 200 && response.status < 300) {
        nextStatus = "processing";
        eventStatus = 'success';
      } else if (response.status === 401 || response.status === 403 || (response.status >= 400 && response.status < 500)) {
        nextStatus = "failed";
        eventStatus = 'failed';
      } else {
        eventStatus = 'warning';
      }

      const responseText = await response.clone().text().catch(() => "N/A");

      await serverLogScanEvent({
        searchId: searchRecord.id,
        eventType: 'N8N_RESPONSE_RECEIVED',
        eventStatus: eventStatus,
        httpStatus: response.status,
        durationMs,
        message: `n8n respondeu com status ${response.status}`,
        payload: { 
          responsePreview: responseText.slice(0, 500),
          status: response.status 
        }
      });

      await supabase
        .from("searches")
        .update({ status: nextStatus })
        .eq("id", searchRecord.id);

      return { 
        success: true, 
        searchId: searchRecord.id, 
        status: nextStatus,
        repeated: false 
      };
    } catch (err: any) {
      console.error("[Scraper] Webhook execution error:", err);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
      const finalStatus = isTimeout ? "delivery_unknown" : "failed";
      
      await serverLogScanEvent({
        searchId: searchRecord.id,
        eventType: isTimeout ? 'N8N_TIMEOUT' : 'N8N_ERROR',
        eventStatus: 'failed',
        errorMessage: String(err),
        message: isTimeout ? 'Tempo limite esgotado (15s) ao chamar n8n. Verifique se o n8n está configurado para "Respond Immediately".' : 'Erro técnico ao disparar webhook n8n',
        payload: { errorName: err.name, errorMessage: err.message }
      });

      await supabase
        .from("searches")
        .update({ 
          status: finalStatus, 
          error_message: isTimeout ? "O n8n não respondeu ao aceite inicial dentro de 15s (timeout)." : String(err) 
        })
        .eq("id", searchRecord.id);

      return { 
        success: finalStatus !== "failed", 
        searchId: searchRecord.id, 
        status: finalStatus,
        error: finalStatus === "failed" ? String(err) : undefined
      };
    }
  } catch (globalError: any) {
    console.error("[Scraper] startSearch GLOBAL ERROR:", globalError);
    
    // Log unexpected top-level failure
    await serverLogScanEvent({
      eventType: 'SYSTEM_ERROR',
      eventStatus: 'failed',
      errorMessage: String(globalError.message || globalError),
      message: 'Erro inesperado na função startSearch',
      payload: { errorName: globalError.name, stack: globalError.stack }
    });
    
    throw globalError;
  }
});

export const checkSearchStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ searchId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: search } = await supabase
      .from("searches")
      .select("status")
      .eq("id", data.searchId)
      .eq("user_id", userId)
      .single();
    
    return search;
  });


export const getSearchHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const getSearchDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ searchId: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { searchId } = data;

    const { data: search, error: searchError } = await supabase
      .from("searches")
      .select("*")
      .eq("id", searchId)
      .eq("user_id", userId)
      .single();

    if (searchError) throw searchError;

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("search_id", searchId);

    if (leadsError) throw leadsError;

    return { search, leads };
  });

export const deleteSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ searchId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: owned, error: ownedError } = await supabase
      .from("searches")
      .select("id")
      .eq("id", data.searchId)
      .eq("user_id", userId)
      .single();

    if (ownedError || !owned) throw new Error("Busca não encontrada");

    await supabase.from("leads").delete().eq("search_id", data.searchId);
    const { error } = await supabase
      .from("searches")
      .delete()
      .eq("id", data.searchId)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  });

export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(0)]).default(30) }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { days } = data;

    const since =
      days === 0
        ? null
        : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let searchQuery = supabase
      .from("searches")
      .select("id, total_leads, status, created_at, termo, cidade, uf")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (since) searchQuery = searchQuery.gte("created_at", since);

    const { data: searches, error: searchesError } = await searchQuery;
    if (searchesError) throw searchesError;

    const rows = searches ?? [];
    const searchIds = rows.map((s) => s.id);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const searchesToday = rows.filter((s) => s.created_at >= startOfToday).length;

    const base = {
      totalSearches: rows.length,
      completedSearches: rows.filter((s) => s.status === "completed").length,
      runningSearches: rows.filter((s) => s.status === "processing" || s.status === "pending").length,
      failedSearches: rows.filter((s) => s.status === "failed").length,
      searchesToday,
      recentSearches: rows.slice(0, 6),
    };

    if (searchIds.length === 0) {
      return {
        ...base,
        totalLeads: 0,
        leadsToday: 0,
        leadsWithEmail: 0,
        leadsWithPhone: 0,
        leadsWithoutWebsite: 0,
        leadsWithWebsite: 0,
        opportunityRate: 0,
        distribution: [],
        priorityOpportunities: [],
      };
    }

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, nome, telefone, email, email2, website, cidade, uf, search_id, created_at")
      .in("search_id", searchIds)
      .limit(5000);

    if (leadsError) throw leadsError;

    const leadRows = leads ?? [];
    const totalLeads = leadRows.length;
    const leadsWithEmail = leadRows.filter((l) => Boolean(l.email || l.email2)).length;
    const leadsWithPhone = leadRows.filter((l) => Boolean(l.telefone)).length;

    const classified = leadRows.map((l) => ({ lead: l, c: classifyWebsiteUrl(l.website) }));
    const leadsWithoutWebsite = classified.filter((x) => x.c.hasOwnWebsite === false).length;
    const leadsWithWebsite = classified.filter((x) => x.c.hasOwnWebsite === true).length;

    const todaySearchIds = new Set(rows.filter((s) => s.created_at >= startOfToday).map((s) => s.id));
    const leadsToday = leadRows.filter((l) => todaySearchIds.has(l.search_id)).length;

    const priorityOpportunities = classified
      .filter((x) => x.c.hasOwnWebsite === false)
      .sort((a, b) => {
        const byScore = opportunityScore(a.c.type) - opportunityScore(b.c.type);
        if (byScore !== 0) return byScore;
        const contactA = (a.lead.telefone ? 1 : 0) + (a.lead.email || a.lead.email2 ? 1 : 0);
        const contactB = (b.lead.telefone ? 1 : 0) + (b.lead.email || b.lead.email2 ? 1 : 0);
        return contactB - contactA;
      })
      .slice(0, 6)
      .map((x) => ({
        id: x.lead.id,
        nome: x.lead.nome,
        telefone: x.lead.telefone,
        email: x.lead.email || x.lead.email2,
        cidade: x.lead.cidade,
        uf: x.lead.uf,
        searchId: x.lead.search_id,
        presenceType: x.c.type,
        presenceLabel: x.c.label,
      }));

    return {
      ...base,
      totalLeads,
      leadsToday,
      leadsWithEmail,
      leadsWithPhone,
      leadsWithoutWebsite,
      leadsWithWebsite,
      opportunityRate: totalLeads ? Math.round((leadsWithoutWebsite / totalLeads) * 100) : 0,
      distribution: buildPresenceDistribution(leadRows.map((l) => l.website)),
      priorityOpportunities,
    };
  });


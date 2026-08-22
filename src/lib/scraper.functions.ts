import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { searchSchema, scraperResponseSchema } from "./schemas";
import { buildPresenceDistribution, opportunityScore } from "./lead-insights";
import { classifyWebsiteUrl } from "./website-utils";
import { encrypt, decrypt } from "./server/encryption";
import { safeWebhookFetch } from "./server/webhook-security";

export const getIntegrationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("n8n_settings")
      .select("webhook_url, webhook_secret, integration_name, is_connected, updated_at")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return {
      webhook_url: data?.webhook_url || "",
      webhook_secret: data?.webhook_secret ? "••••••••••••••••" : "",
      has_secret: Boolean(data?.webhook_secret),
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
  .inputValidator(
    z.object({
      webhook_url: z.string().url("URL inválida"),
      webhook_secret: z.string().nullable().optional(),
      integration_name: z.string().min(1),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { webhook_url, webhook_secret, integration_name } = data;

    const updateData: any = {
      webhook_url,
      integration_name,
      updated_at: new Date().toISOString(),
    };

    if (webhook_secret) {
      updateData.webhook_secret = encrypt(webhook_secret);
    }

    const { error } = await supabase
      .from("n8n_settings")
      .upsert({
        user_id: userId,
        ...updateData,
      });

    if (error) throw error;
    return { success: true };
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

    try {
      const secret = settings.webhook_secret ? decrypt(settings.webhook_secret) : "";
      const response = await safeWebhookFetch(settings.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": secret,
        },
        body: JSON.stringify({ test: true }),
      });

      if (response.ok) {
        await supabase
          .from("n8n_settings")
          .update({ is_connected: true })
          .eq("user_id", userId);
        return { success: true };
      } else {
        return {
          success: false,
          error: `Falha na conexão: ${response.status}`,
        };
      }
    } catch (err) {
      return { success: false, error: "Erro ao conectar com o n8n" };
    }
  });

export const startSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(searchSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { termo, cidade, uf } = data;

    // Check for ongoing identical searches
    const { data: ongoing } = await supabase
      .from("searches")
      .select("id")
      .eq("user_id", userId)
      .eq("termo", termo)
      .eq("cidade", cidade)
      .eq("uf", uf)
      .in("status", ["pending", "processing"])
      .limit(1);

    if (ongoing && ongoing.length > 0) {
      throw new Error("Uma pesquisa idêntica já está em andamento");
    }

    // Get n8n settings
    const { data: settings, error: settingsError } = await supabase
      .from("n8n_settings")
      .select("webhook_url, webhook_secret")
      .eq("user_id", userId)
      .single();

    if (settingsError || !settings?.webhook_url) {
      throw new Error("Integração n8n não configurada");
    }

    const requestId = crypto.randomUUID();

    // Create search record
    const { data: searchRecord, error: searchError } = await supabase
      .from("searches")
      .insert({
        user_id: userId,
        request_id: requestId,
        termo,
        cidade,
        uf,
        status: "processing",
      })
      .select()
      .single();

    if (searchError) throw searchError;

    try {
      // Call n8n
      const secret = settings.webhook_secret ? decrypt(settings.webhook_secret) : "";
      const response = await safeWebhookFetch(settings.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": secret,
        },
        body: JSON.stringify({ termo, cidade, uf }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        await supabase
          .from("searches")
          .update({ status: "failed", error_message: errorText })
          .eq("id", searchRecord.id);
        return { success: false, error: "n8n retornou erro", searchId: searchRecord.id };
      }

      const result = await response.json();
      const validated = scraperResponseSchema.parse(result);

      // Save leads
      if (validated.resultado.leads.length > 0) {
        const leadsToInsert = validated.resultado.leads.map((l) => ({
          search_id: searchRecord.id,
          nome: l['Nome'] ?? null,
          telefone: l['Telefone'] ?? null,
          bairro: l['Bairro'] ?? null,
          cidade: l['Cidade'] ?? null,
          uf: l['UF'] ?? null,
          website: l['Website'] ?? null,
          email: l["E-mail"] ?? null,
          email2: l["E-mail2"] ?? null,
        }));

        await supabase.from("leads").insert(leadsToInsert);
      }

      // Update search record
      await supabase
        .from("searches")
        .update({
          status: "completed",
          total_leads: validated.resultado.totalLeads,
          sheet_name: validated.googleSheet?.name ?? null,
          sheet_url: validated.googleSheet?.url ?? null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", searchRecord.id);

      return {
        success: true,
        searchId: searchRecord.id,
        leads: validated.resultado.leads,
        totalLeads: validated.resultado.totalLeads,
      };
    } catch (err) {
      console.error("Scraper error:", err);
      await supabase
        .from("searches")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", searchRecord.id);
      return { success: false, error: String(err), searchId: searchRecord.id };
    }
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
  .inputValidator(z.object({ searchId: z.string() }))
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
  .inputValidator(z.object({ searchId: z.string().uuid() }))
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
  .inputValidator(
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


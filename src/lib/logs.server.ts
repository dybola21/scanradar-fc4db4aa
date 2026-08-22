import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function serverLogScanEvent(data: {
  searchId: string;
  eventType: string;
  eventStatus: 'started' | 'success' | 'failed' | 'warning';
  message?: string;
  payload?: any;
  errorMessage?: string;
  httpStatus?: number;
  durationMs?: number;
}) {
  // Sanitization: Remove secrets and tokens
  let sanitizedPayload = null;
  if (data.payload) {
    try {
      sanitizedPayload = JSON.parse(JSON.stringify(data.payload));
      const sensitiveKeys = ['x-callback-secret', 'X-Webhook-Secret', 'Authorization', 'token', 'secret', 'password', 'key'];
      
      const sanitize = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key in obj) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            sanitize(obj[key]);
          }
        }
      };
      sanitize(sanitizedPayload);
    } catch (e) {
      console.warn("[Logs] Failed to sanitize payload:", e);
      sanitizedPayload = { error: "Failed to sanitize payload" };
    }
  }

  const { error } = await supabaseAdmin
    .from("scan_logs" as any)
    .insert({
      search_id: data.searchId,
      event_type: data.eventType,
      event_status: data.eventStatus,
      message: data.message,
      payload: sanitizedPayload,
      error_message: data.errorMessage,
      http_status: data.httpStatus,
      duration_ms: data.durationMs,
    } as any);

  if (error) {
    console.error("[Logs Server] Failed to persist log:", error);
  }
}

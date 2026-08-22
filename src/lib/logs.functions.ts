import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const eventTypeSchema = z.enum([
  'FLOW_STARTED',
  'START_SEARCH_ENTERED',
  'AUTH_SUCCESS',
  'AUTH_ERROR',
  'SEARCH_INSERT_SUCCESS',
  'SEARCH_INSERT_ERROR',
  'N8N_REQUEST_ATTEMPT',
  'SEARCH_CREATED', 
  'N8N_REQUEST_SENT', 
  'N8N_RESPONSE_RECEIVED', 
  'N8N_TIMEOUT',
  'N8N_ERROR', 
  'CALLBACK_RECEIVED', 
  'CALLBACK_VALIDATED', 
  'RESULTS_SAVED', 
  'RESULTS_FETCHED', 
  'FRONTEND_ERROR', 
  'SYSTEM_ERROR'
]);

const eventStatusSchema = z.enum(['started', 'success', 'failed', 'warning']);

export const logScanEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({
    searchId: z.string().uuid().optional(),
    eventType: eventTypeSchema,
    eventStatus: eventStatusSchema,
    message: z.string().optional(),
    payload: z.any().optional(),
    errorMessage: z.string().optional(),
    httpStatus: z.number().optional(),
    durationMs: z.number().optional(),
  }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { 
      searchId, 
      eventType, 
      eventStatus, 
      message, 
      payload, 
      errorMessage, 
      httpStatus, 
      durationMs 
    } = data;

    // Sanitization: Remove secrets and tokens
    let sanitizedPayload = null;
    if (payload) {
      try {
        sanitizedPayload = JSON.parse(JSON.stringify(payload));
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

    const { error } = await supabase
      .from("scan_logs" as any)
      .insert({
        search_id: searchId,
        event_type: eventType,
        event_status: eventStatus,
        message,
        payload: sanitizedPayload,
        error_message: errorMessage,
        http_status: httpStatus,
        duration_ms: durationMs,
      } as any);

    if (error) {
      console.error("[Logs] Failed to persist log:", error);
      return { success: false };
    }

    return { success: true };
  });

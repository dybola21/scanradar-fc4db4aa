import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const eventTypeSchema = z.enum([
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
    searchId: z.string().uuid(),
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
    }

    const { error } = await supabase
      .from("scan_logs")
      .insert({
        search_id: searchId,
        event_type: eventType,
        event_status: eventStatus,
        message,
        payload: sanitizedPayload,
        error_message: errorMessage,
        http_status: httpStatus,
        duration_ms: durationMs,
      });

    if (error) {
      console.error("[Logs] Failed to persist log:", error);
      return { success: false };
    }

    return { success: true };
  });

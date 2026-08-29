export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      leads: {
        Row: {
          bairro: string | null
          cidade: string | null
          created_at: string
          email: string | null
          email2: string | null
          endereco: string | null
          id: string
          lead_key: string | null
          nome: string | null
          place_id: string | null
          search_id: string
          telefone: string | null
          uf: string | null
          website: string | null
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          email2?: string | null
          endereco?: string | null
          id?: string
          lead_key?: string | null
          nome?: string | null
          place_id?: string | null
          search_id: string
          telefone?: string | null
          uf?: string | null
          website?: string | null
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          email2?: string | null
          endereco?: string | null
          id?: string
          lead_key?: string | null
          nome?: string | null
          place_id?: string | null
          search_id?: string
          telefone?: string | null
          uf?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_settings: {
        Row: {
          callback_secret_hash: string | null
          created_at: string
          id: string
          integration_name: string | null
          is_connected: boolean | null
          last_test_error: string | null
          last_tested_at: string | null
          updated_at: string
          user_id: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          callback_secret_hash?: string | null
          created_at?: string
          id?: string
          integration_name?: string | null
          is_connected?: boolean | null
          last_test_error?: string | null
          last_tested_at?: string | null
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          callback_secret_hash?: string | null
          created_at?: string
          id?: string
          integration_name?: string | null
          is_connected?: boolean | null
          last_test_error?: string | null
          last_tested_at?: string | null
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      scan_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_status: Database["public"]["Enums"]["scan_event_status"]
          event_type: Database["public"]["Enums"]["scan_event_type"]
          http_status: number | null
          id: string
          message: string | null
          payload: Json | null
          search_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_status: Database["public"]["Enums"]["scan_event_status"]
          event_type: Database["public"]["Enums"]["scan_event_type"]
          http_status?: number | null
          id?: string
          message?: string | null
          payload?: Json | null
          search_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_status?: Database["public"]["Enums"]["scan_event_status"]
          event_type?: Database["public"]["Enums"]["scan_event_type"]
          http_status?: number | null
          id?: string
          message?: string | null
          payload?: Json | null
          search_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          cidade: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          request_id: string
          sheet_name: string | null
          sheet_url: string | null
          status: string | null
          termo: string
          total_leads: number | null
          uf: string
          user_id: string
        }
        Insert: {
          cidade: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          request_id: string
          sheet_name?: string | null
          sheet_url?: string | null
          status?: string | null
          termo: string
          total_leads?: number | null
          uf: string
          user_id: string
        }
        Update: {
          cidade?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          request_id?: string
          sheet_name?: string | null
          sheet_url?: string | null
          status?: string | null
          termo?: string
          total_leads?: number | null
          uf?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_search_with_leads: {
        Args: {
          p_error_message?: string
          p_leads: Json
          p_search_id: string
          p_sheet_name?: string
          p_sheet_url?: string
          p_status: string
          p_total_leads: number
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      scan_event_status: "started" | "success" | "failed" | "warning"
      scan_event_type:
        | "SEARCH_CREATED"
        | "N8N_REQUEST_SENT"
        | "N8N_RESPONSE_RECEIVED"
        | "N8N_TIMEOUT"
        | "N8N_ERROR"
        | "CALLBACK_RECEIVED"
        | "CALLBACK_VALIDATED"
        | "RESULTS_SAVED"
        | "RESULTS_FETCHED"
        | "FRONTEND_ERROR"
        | "SYSTEM_ERROR"
        | "FLOW_STARTED"
        | "START_SEARCH_ENTERED"
        | "AUTH_SUCCESS"
        | "AUTH_ERROR"
        | "SEARCH_INSERT_SUCCESS"
        | "SEARCH_INSERT_ERROR"
        | "N8N_REQUEST_ATTEMPT"
        | "SEARCH_DELETED"
        | "LEADS_DELETED"
        | "LOGS_CLEARED"
        | "SETTINGS_UPDATED"
        | "INTEGRATION_TESTED"
        | "AUTH_ACTION"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      scan_event_status: ["started", "success", "failed", "warning"],
      scan_event_type: [
        "SEARCH_CREATED",
        "N8N_REQUEST_SENT",
        "N8N_RESPONSE_RECEIVED",
        "N8N_TIMEOUT",
        "N8N_ERROR",
        "CALLBACK_RECEIVED",
        "CALLBACK_VALIDATED",
        "RESULTS_SAVED",
        "RESULTS_FETCHED",
        "FRONTEND_ERROR",
        "SYSTEM_ERROR",
        "FLOW_STARTED",
        "START_SEARCH_ENTERED",
        "AUTH_SUCCESS",
        "AUTH_ERROR",
        "SEARCH_INSERT_SUCCESS",
        "SEARCH_INSERT_ERROR",
        "N8N_REQUEST_ATTEMPT",
        "SEARCH_DELETED",
        "LEADS_DELETED",
        "LOGS_CLEARED",
        "SETTINGS_UPDATED",
        "INTEGRATION_TESTED",
        "AUTH_ACTION",
      ],
    },
  },
} as const

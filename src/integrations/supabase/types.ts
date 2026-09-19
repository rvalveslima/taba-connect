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
      accounts: {
        Row: {
          company: string | null
          created_at: string
          id: string
          industry: string | null
          is_admin: boolean
          languages: string[] | null
          linkedin_handle: string | null
          location: string | null
          name: string
          role: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          id: string
          industry?: string | null
          is_admin?: boolean
          languages?: string[] | null
          linkedin_handle?: string | null
          location?: string | null
          name: string
          role?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          is_admin?: boolean
          languages?: string[] | null
          linkedin_handle?: string | null
          location?: string | null
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      event_memberships: {
        Row: {
          account_id: string
          event_id: string
          give_back: string | null
          goal_tags: string[] | null
          id: string
          joined_at: string
          looking_for: string | null
          open_to_connect: boolean
        }
        Insert: {
          account_id: string
          event_id: string
          give_back?: string | null
          goal_tags?: string[] | null
          id?: string
          joined_at?: string
          looking_for?: string | null
          open_to_connect?: boolean
        }
        Update: {
          account_id?: string
          event_id?: string
          give_back?: string | null
          goal_tags?: string[] | null
          id?: string
          joined_at?: string
          looking_for?: string | null
          open_to_connect?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_memberships_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date_end: string | null
          date_start: string | null
          event_code: string
          id: string
          image_url: string | null
          name: string
          organizer_account_id: string | null
        }
        Insert: {
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          event_code: string
          id?: string
          image_url?: string | null
          name: string
          organizer_account_id?: string | null
        }
        Update: {
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          event_code?: string
          id?: string
          image_url?: string | null
          name?: string
          organizer_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_account_id_fkey"
            columns: ["organizer_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_messages: {
        Row: {
          account_id: string
          created_at: string
          id: string
          message: string
          subject: string | null
          user_agent: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          message: string
          subject?: string | null
          user_agent?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          message?: string
          subject?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          event_id: string
          id: string
          recipient_membership_id: string
          sender_membership_id: string
          sent_at: string
        }
        Insert: {
          body: string
          event_id: string
          id?: string
          recipient_membership_id: string
          sender_membership_id: string
          sent_at?: string
        }
        Update: {
          body?: string
          event_id?: string
          id?: string
          recipient_membership_id?: string
          sender_membership_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_membership_id_fkey"
            columns: ["recipient_membership_id"]
            isOneToOne: false
            referencedRelation: "event_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_membership_id_fkey"
            columns: ["sender_membership_id"]
            isOneToOne: false
            referencedRelation: "event_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          open_to_chat: boolean
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          open_to_chat?: boolean
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          open_to_chat?: boolean
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_event_by_code: { Args: { _code: string }; Returns: string }
      get_event_code: { Args: { _event_id: string }; Returns: string }
      get_event_connection_count: {
        Args: { _event_id: string }
        Returns: number
      }
      get_event_public_info: {
        Args: { _event_id: string }
        Returns: {
          date_end: string
          date_start: string
          id: string
          image_url: string
          name: string
          organizer_account_id: string
        }[]
      }
      get_my_event_connections: {
        Args: { _event_id: string }
        Returns: {
          counterpart_membership_id: string
        }[]
      }
      is_event_member: { Args: { _event_id: string }; Returns: boolean }
      is_my_membership: { Args: { _membership_id: string }; Returns: boolean }
      shares_event_with: { Args: { _other: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

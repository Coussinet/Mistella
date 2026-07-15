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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string | null
          created_by: string
          id: string
          sent_at: string | null
          target_type: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by: string
          id?: string
          sent_at?: string | null
          target_type: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string
          id?: string
          sent_at?: string | null
          target_type?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_profiles: {
        Row: {
          activities: string | null
          age: number | null
          blood_type: string | null
          body_style: string | null
          charm_point: string | null
          customer_message: string | null
          drink_strength: string | null
          favorite_drink: string | null
          favorite_song: string | null
          favorite_topics: string | null
          height: number | null
          hobbies: string | null
          hometown: string | null
          is_sponsored: boolean | null
          is_working: boolean | null
          location_enabled: boolean | null
          location_lat: number | null
          location_lng: number | null
          motto: string | null
          personality: string | null
          price_info: string | null
          service_style: string | null
          shop_address: string | null
          shop_name: string | null
          updated_at: string | null
          user_id: string
          work_status: string | null
        }
        Insert: {
          activities?: string | null
          age?: number | null
          blood_type?: string | null
          body_style?: string | null
          charm_point?: string | null
          customer_message?: string | null
          drink_strength?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          favorite_topics?: string | null
          height?: number | null
          hobbies?: string | null
          hometown?: string | null
          is_sponsored?: boolean | null
          is_working?: boolean | null
          location_enabled?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          motto?: string | null
          personality?: string | null
          price_info?: string | null
          service_style?: string | null
          shop_address?: string | null
          shop_name?: string | null
          updated_at?: string | null
          user_id: string
          work_status?: string | null
        }
        Update: {
          activities?: string | null
          age?: number | null
          blood_type?: string | null
          body_style?: string | null
          charm_point?: string | null
          customer_message?: string | null
          drink_strength?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          favorite_topics?: string | null
          height?: number | null
          hobbies?: string | null
          hometown?: string | null
          is_sponsored?: boolean | null
          is_working?: boolean | null
          location_enabled?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          motto?: string | null
          personality?: string | null
          price_info?: string | null
          service_style?: string | null
          shop_address?: string | null
          shop_name?: string | null
          updated_at?: string | null
          user_id?: string
          work_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cast_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          age: number | null
          annual_income: string | null
          appeal_message: string | null
          created_at: string | null
          hobbies: string | null
          occupation: string | null
          preferred_area: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          annual_income?: string | null
          appeal_message?: string | null
          created_at?: string | null
          hobbies?: string | null
          occupation?: string | null
          preferred_area?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          annual_income?: string | null
          appeal_message?: string | null
          created_at?: string | null
          hobbies?: string | null
          occupation?: string | null
          preferred_area?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      footprints: {
        Row: {
          created_at: string | null
          id: string
          visited_user_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          visited_user_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          visited_user_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "footprints_visited_user_id_fkey"
            columns: ["visited_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "footprints_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          cast_id: string
          created_at: string | null
          customer_id: string
          id: string
          status: string | null
        }
        Insert: {
          cast_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          status?: string | null
        }
        Update: {
          cast_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_records: {
        Row: {
          activities: string | null
          amount_spent: number | null
          author_id: string
          created_at: string | null
          id: string
          memo: string | null
          met_at: string
          next_promise_at: string | null
          next_promise_note: string | null
          partner_id: string
          place: string | null
          updated_at: string | null
        }
        Insert: {
          activities?: string | null
          amount_spent?: number | null
          author_id: string
          created_at?: string | null
          id?: string
          memo?: string | null
          met_at: string
          next_promise_at?: string | null
          next_promise_note?: string | null
          partner_id: string
          place?: string | null
          updated_at?: string | null
        }
        Update: {
          activities?: string | null
          amount_spent?: number | null
          author_id?: string
          created_at?: string | null
          id?: string
          memo?: string | null
          met_at?: string
          next_promise_at?: string | null
          next_promise_note?: string | null
          partner_id?: string
          place?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_records_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_records_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          match_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_notes: {
        Row: {
          author_id: string
          birthday: string | null
          bottle_history: string | null
          created_at: string | null
          id: string
          next_visit_date: string | null
          nickname_called: string | null
          note_text: string | null
          partner_id: string
          preferences: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          birthday?: string | null
          bottle_history?: string | null
          created_at?: string | null
          id?: string
          next_visit_date?: string | null
          nickname_called?: string | null
          note_text?: string | null
          partner_id: string
          preferences?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          birthday?: string | null
          bottle_history?: string | null
          created_at?: string | null
          id?: string
          next_visit_date?: string | null
          nickname_called?: string | null
          note_text?: string | null
          partner_id?: string
          preferences?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string | null
          id: string
          photo_url: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_url: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_url?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          notification_likes: boolean | null
          notification_matches: boolean | null
          notification_meeting_reminders: boolean | null
          notification_messages: boolean | null
          notification_tonight_requests: boolean | null
          notification_tonight_responses: boolean | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_likes?: boolean | null
          notification_matches?: boolean | null
          notification_meeting_reminders?: boolean | null
          notification_messages?: boolean | null
          notification_tonight_requests?: boolean | null
          notification_tonight_responses?: boolean | null
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_likes?: boolean | null
          notification_matches?: boolean | null
          notification_meeting_reminders?: boolean | null
          notification_messages?: boolean | null
          notification_tonight_requests?: boolean | null
          notification_tonight_responses?: boolean | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          detail: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          detail?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          detail?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      timelines: {
        Row: {
          content: string | null
          created_at: string | null
          expires_at: string
          id: string
          media_type: string | null
          media_url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timelines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tonight_broadcast_reactions: {
        Row: {
          cast_id: string
          created_at: string | null
          id: string
          message: string | null
          request_id: string
          type: string
        }
        Insert: {
          cast_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          request_id: string
          type: string
        }
        Update: {
          cast_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          request_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tonight_broadcast_reactions_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tonight_broadcast_reactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tonight_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tonight_requests: {
        Row: {
          created_at: string | null
          customer_id: string
          expires_at: string
          id: string
          message: string | null
          status: string | null
          target_cast_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          expires_at: string
          id?: string
          message?: string | null
          status?: string | null
          target_cast_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          expires_at?: string
          id?: string
          message?: string | null
          status?: string | null
          target_cast_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tonight_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tonight_requests_target_cast_id_fkey"
            columns: ["target_cast_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_blocked: boolean | null
          is_premium: boolean | null
          nickname: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          is_blocked?: boolean | null
          is_premium?: boolean | null
          nickname: string
          role: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_blocked?: boolean | null
          is_premium?: boolean | null
          nickname?: string
          role?: string
        }
        Relationships: []
      }
      users_admin: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

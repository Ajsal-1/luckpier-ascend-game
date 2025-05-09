export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bets: {
        Row: {
          amount: number
          cashout_multiplier: number | null
          created_at: string | null
          game_id: string
          id: string
          profit: number | null
          updated_at: string | null
          user_id: string
          won: boolean | null
        }
        Insert: {
          amount: number
          cashout_multiplier?: number | null
          created_at?: string | null
          game_id: string
          id?: string
          profit?: number | null
          updated_at?: string | null
          user_id: string
          won?: boolean | null
        }
        Update: {
          amount?: number
          cashout_multiplier?: number | null
          created_at?: string | null
          game_id?: string
          id?: string
          profit?: number | null
          updated_at?: string | null
          user_id?: string
          won?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      crash_rounds: {
        Row: {
          crash_multiplier: number
          created_at: string | null
          id: string
          start_time: string
          status: string
        }
        Insert: {
          crash_multiplier: number
          created_at?: string | null
          id?: string
          start_time: string
          status?: string
        }
        Update: {
          crash_multiplier?: number
          created_at?: string | null
          id?: string
          start_time?: string
          status?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          crash_point: number
          created_at: string | null
          id: string
          status: string | null
        }
        Insert: {
          crash_point: number
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          crash_point?: number
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      player_bets: {
        Row: {
          bet_amount: number
          cashed_out_multiplier: number | null
          created_at: string | null
          id: string
          round_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          bet_amount: number
          cashed_out_multiplier?: number | null
          created_at?: string | null
          id?: string
          round_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          bet_amount?: number
          cashed_out_multiplier?: number | null
          created_at?: string | null
          id?: string
          round_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number | null
          crash_control: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          balance?: number | null
          crash_control?: number | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          balance?: number | null
          crash_control?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          crash_multiplier: number
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          crash_multiplier: number
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          crash_multiplier?: number
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bets: {
        Row: {
          bet_amount: number
          cashout_multiplier: number | null
          created_at: string | null
          id: string
          round_id: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          cashout_multiplier?: number | null
          created_at?: string | null
          id?: string
          round_id: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          cashout_multiplier?: number | null
          created_at?: string | null
          id?: string
          round_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "crash_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cash_out_bet: {
        Args: { p_round_id: string; p_user_id: string; p_multiplier: number }
        Returns: boolean
      }
      create_new_crash_round: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_crash_point: {
        Args: { recent_crashes: number[] }
        Returns: number
      }
      get_recent_crash_points: {
        Args: { count?: number }
        Returns: {
          crash_values: number[]
        }[]
      }
      place_bet: {
        Args: { p_round_id: string; p_amount: number }
        Returns: boolean
      }
      update_round_status: {
        Args: { round_id: string; new_status: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

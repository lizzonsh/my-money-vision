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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          created_at: string
          currency: string | null
          current_balance: number
          id: string
          last_updated: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          current_balance?: number
          id?: string
          last_updated?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          current_balance?: number
          id?: string
          last_updated?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_balance_history: {
        Row: {
          balance: number
          bank_account_id: string
          created_at: string
          id: string
          month: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          bank_account_id: string
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          bank_account_id?: string
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_balance_history_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      big_purchase_goals: {
        Row: {
          category: Database["public"]["Enums"]["purchase_category"]
          created_at: string
          current_saved: number
          id: string
          monthly_contribution: number
          name: string
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["purchase_category"]
          created_at?: string
          current_saved?: number
          id?: string
          monthly_contribution: number
          name: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["purchase_category"]
          created_at?: string
          current_saved?: number
          id?: string
          monthly_contribution?: number
          name?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          created_at: string
          currency: string | null
          daily_limit: number | null
          days_in_month: number | null
          id: string
          left_budget: number | null
          month: string
          notes: string | null
          spent_budget: number | null
          status: string | null
          total_budget: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          daily_limit?: number | null
          days_in_month?: number | null
          id?: string
          left_budget?: number | null
          month: string
          notes?: string | null
          spent_budget?: number | null
          status?: string | null
          total_budget: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          daily_limit?: number | null
          days_in_month?: number | null
          id?: string
          left_budget?: number | null
          month?: string
          notes?: string | null
          spent_budget?: number | null
          status?: string | null
          total_budget?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          card_id: string | null
          category: string
          created_at: string
          description: string
          expense_date: string
          expense_month: string | null
          id: string
          kind: Database["public"]["Enums"]["expense_kind"]
          month: string
          month_of_expense: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          recurring_day_of_month: number | null
          recurring_type: Database["public"]["Enums"]["recurring_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          category: string
          created_at?: string
          description: string
          expense_date: string
          expense_month?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["expense_kind"]
          month: string
          month_of_expense?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          recurring_day_of_month?: number | null
          recurring_type?: Database["public"]["Enums"]["recurring_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          expense_month?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["expense_kind"]
          month?: string
          month_of_expense?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          recurring_day_of_month?: number | null
          recurring_type?: Database["public"]["Enums"]["recurring_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          income_date: string | null
          month: string
          name: string
          recurring_day_of_month: number | null
          recurring_type: Database["public"]["Enums"]["recurring_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          income_date?: string | null
          month: string
          name: string
          recurring_day_of_month?: number | null
          recurring_type?: Database["public"]["Enums"]["recurring_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          income_date?: string | null
          month?: string
          name?: string
          recurring_day_of_month?: number | null
          recurring_type?: Database["public"]["Enums"]["recurring_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_incomes: {
        Row: {
          created_at: string
          day_of_month: number
          default_amount: number
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_month: number
          default_amount: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_month?: number
          default_amount?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_payments: {
        Row: {
          card_id: string | null
          category: string
          created_at: string
          day_of_month: number
          default_amount: number
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id?: string | null
          category: string
          created_at?: string
          day_of_month: number
          default_amount: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string | null
          category?: string
          created_at?: string
          day_of_month?: number
          default_amount?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_savings: {
        Row: {
          action_type: Database["public"]["Enums"]["savings_action"]
          card_id: string | null
          created_at: string
          currency: string | null
          day_of_month: number
          default_amount: number
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          transfer_method: Database["public"]["Enums"]["transfer_method"]
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["savings_action"]
          card_id?: string | null
          created_at?: string
          currency?: string | null
          day_of_month: number
          default_amount: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          transfer_method: Database["public"]["Enums"]["transfer_method"]
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["savings_action"]
          card_id?: string | null
          created_at?: string
          currency?: string | null
          day_of_month?: number
          default_amount?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          transfer_method?: Database["public"]["Enums"]["transfer_method"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings: {
        Row: {
          action: Database["public"]["Enums"]["savings_action"] | null
          action_amount: number | null
          amount: number
          card_id: string | null
          closed_at: string | null
          created_at: string
          currency: string | null
          id: string
          month: string
          monthly_deposit: number | null
          name: string
          recurring_day_of_month: number | null
          recurring_type: Database["public"]["Enums"]["recurring_type"] | null
          transfer_method: Database["public"]["Enums"]["transfer_method"]
          updated_at: string
          user_id: string
        }
        Insert: {
          action?: Database["public"]["Enums"]["savings_action"] | null
          action_amount?: number | null
          amount: number
          card_id?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          month: string
          monthly_deposit?: number | null
          name: string
          recurring_day_of_month?: number | null
          recurring_type?: Database["public"]["Enums"]["recurring_type"] | null
          transfer_method: Database["public"]["Enums"]["transfer_method"]
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["savings_action"] | null
          action_amount?: number | null
          amount?: number
          card_id?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          month?: string
          monthly_deposit?: number | null
          name?: string
          recurring_day_of_month?: number | null
          recurring_type?: Database["public"]["Enums"]["recurring_type"] | null
          transfer_method?: Database["public"]["Enums"]["transfer_method"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_growth: {
        Row: {
          created_at: string
          id: string
          month: string
          notes: string | null
          savings_id: string
          user_id: string
          value_after_growth: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          savings_id: string
          user_id: string
          value_after_growth: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          savings_id?: string
          user_id?: string
          value_after_growth?: number
        }
        Relationships: [
          {
            foreignKeyName: "savings_growth_savings_id_fkey"
            columns: ["savings_id"]
            isOneToOne: false
            referencedRelation: "savings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      expense_kind: "planned" | "payed" | "predicted"
      payment_method: "bank_transfer" | "credit_card"
      priority_level: "high" | "medium" | "low"
      purchase_category:
        | "furniture"
        | "electronics"
        | "education"
        | "vehicle"
        | "property"
        | "vacation"
        | "other"
      recurring_type: "monthly" | "weekly"
      savings_action: "deposit" | "withdrawal"
      transfer_method: "bank_account" | "credit_card"
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
      expense_kind: ["planned", "payed", "predicted"],
      payment_method: ["bank_transfer", "credit_card"],
      priority_level: ["high", "medium", "low"],
      purchase_category: [
        "furniture",
        "electronics",
        "education",
        "vehicle",
        "property",
        "vacation",
        "other",
      ],
      recurring_type: ["monthly", "weekly"],
      savings_action: ["deposit", "withdrawal"],
      transfer_method: ["bank_account", "credit_card"],
    },
  },
} as const

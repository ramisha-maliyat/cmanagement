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
      canteens: {
        Row: {
          closing_time: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          opening_time: string | null
          slug: string
          timezone: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          closing_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          opening_time?: string | null
          slug: string
          timezone?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          closing_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          opening_time?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canteens_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          canteen_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          canteen_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          canteen_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_canteen_vendor_fk"
            columns: ["canteen_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id", "vendor_id"]
          },
        ]
      }
      menu_items: {
        Row: {
          canteen_id: string
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          preparation_minutes: number
          price: number
          slug: string
          stock_quantity: number
          track_stock: boolean
          updated_at: string
          vendor_id: string
        }
        Insert: {
          canteen_id: string
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          preparation_minutes?: number
          price: number
          slug: string
          stock_quantity?: number
          track_stock?: boolean
          updated_at?: string
          vendor_id: string
        }
        Update: {
          canteen_id?: string
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          preparation_minutes?: number
          price?: number
          slug?: string
          stock_quantity?: number
          track_stock?: boolean
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_canteen_vendor_fk"
            columns: ["canteen_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id", "vendor_id"]
          },
          {
            foreignKeyName: "menu_items_category_canteen_vendor_fk"
            columns: ["category_id", "canteen_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id", "canteen_id", "vendor_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          line_total: number | null
          menu_item_id: string | null
          order_id: string
          quantity: number
          special_instruction: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          line_total?: number | null
          menu_item_id?: string | null
          order_id: string
          quantity: number
          special_instruction?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          line_total?: number | null
          menu_item_id?: string | null
          order_id?: string
          quantity?: number
          special_instruction?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          canteen_id: string
          completed_at: string | null
          created_at: string
          currency_code: string
          customer_id: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number
          discount_amount: number
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_time: string | null
          service_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          cancelled_at?: string | null
          canteen_id: string
          completed_at?: string | null
          created_at?: string
          currency_code?: string
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          discount_amount?: number
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_time?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          cancelled_at?: string | null
          canteen_id?: string
          completed_at?: string | null
          created_at?: string
          currency_code?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          discount_amount?: number
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_time?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_canteen_vendor_fk"
            columns: ["canteen_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id", "vendor_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency_code: string
          id: string
          order_id: string
          paid_at: string | null
          payment_provider: string
          provider_payload: Json
          status: Database["public"]["Enums"]["payment_status"]
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency_code?: string
          id?: string
          order_id: string
          paid_at?: string | null
          payment_provider?: string
          provider_payload?: Json
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency_code?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_provider?: string
          provider_payload?: Json
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          business_name: string
          commission_rate: number
          created_at: string
          currency_code: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          owner_id: string
          phone: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name: string
          commission_rate?: number
          created_at?: string
          currency_code?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          owner_id: string
          phone?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          commission_rate?: number
          created_at?: string
          currency_code?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          owner_id?: string
          phone?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_order: { Args: { target_order_id: string }; Returns: boolean }
      health_check: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      owns_vendor: { Args: { target_vendor_id: string }; Returns: boolean }
      review_vendor_application: {
        Args: {
          p_decision: string
          p_review_notes?: string
          p_vendor_id: string
        }
        Returns: undefined
      }
      submit_vendor_application: {
        Args: {
          p_address: string
          p_business_name: string
          p_currency_code: string
          p_description: string
          p_email: string
          p_phone: string
          p_slug: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "admin"
      fulfillment_type: "pickup" | "delivery"
      order_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
        | "rejected"
      payment_method: "cash" | "card" | "online"
      payment_status: "unpaid" | "pending" | "paid" | "failed" | "refunded"
      vendor_status: "pending" | "approved" | "suspended" | "rejected"
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
      app_role: ["customer", "vendor", "admin"],
      fulfillment_type: ["pickup", "delivery"],
      order_status: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "cancelled",
        "rejected",
      ],
      payment_method: ["cash", "card", "online"],
      payment_status: ["unpaid", "pending", "paid", "failed", "refunded"],
      vendor_status: ["pending", "approved", "suspended", "rejected"],
    },
  },
} as const

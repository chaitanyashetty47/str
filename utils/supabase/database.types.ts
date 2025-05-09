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
      exercise: {
        Row: {
          created_at: string | null
          id: string
          name: string
          trainer_id: string
          updated_at: string | null
          youtube_link: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          trainer_id: string
          updated_at?: string | null
          youtube_link?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          trainer_id?: string
          updated_at?: string | null
          youtube_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises_workout: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          reps: number
          rest_time: unknown | null
          sets: number
          weight: number
          workout_day_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          reps: number
          rest_time?: unknown | null
          sets: number
          weight: number
          workout_day_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number
          rest_time?: unknown | null
          sets?: number
          weight?: number
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_workout_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_history: {
        Row: {
          date_achieved: string
          exercise_id: string | null
          id: string
          log_set_id: string | null
          one_rm: number | null
          reps: number
          user_id: string | null
          weight: number
        }
        Insert: {
          date_achieved?: string
          exercise_id?: string | null
          id?: string
          log_set_id?: string | null
          one_rm?: number | null
          reps: number
          user_id?: string | null
          weight: number
        }
        Update: {
          date_achieved?: string
          exercise_id?: string | null
          id?: string
          log_set_id?: string | null
          one_rm?: number | null
          reps?: number
          user_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "pr_history_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_workout"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_history_log_set_id_fkey"
            columns: ["log_set_id"]
            isOneToOne: false
            referencedRelation: "workout_log_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          body_fat_percentage: number | null
          id: string
          manifestation_goals: string | null
          psychological_tracker: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          id?: string
          manifestation_goals?: string | null
          psychological_tracker?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          id?: string
          manifestation_goals?: string | null
          psychological_tracker?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          amount: number | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          payment_id: string | null
          subscription_id: string | null
          subscription_plan_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          subscription_id?: string | null
          subscription_plan_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          subscription_id?: string | null
          subscription_plan_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: number
          billing_period: string
          category: Database["public"]["Enums"]["subscription_category"]
          features: Json | null
          id: string
          name: string
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          price: number
          razorpay_plan_id: string | null
        }
        Insert: {
          billing_cycle?: number
          billing_period?: string
          category: Database["public"]["Enums"]["subscription_category"]
          features?: Json | null
          id?: string
          name: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          price: number
          razorpay_plan_id?: string | null
        }
        Update: {
          billing_cycle?: number
          billing_period?: string
          category?: Database["public"]["Enums"]["subscription_category"]
          features?: Json | null
          id?: string
          name?: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          price?: number
          razorpay_plan_id?: string | null
        }
        Relationships: []
      }
      trainer_clients: {
        Row: {
          assigned_at: string | null
          client_id: string
          id: string
          trainer_id: string
        }
        Insert: {
          assigned_at?: string | null
          client_id: string
          id?: string
          trainer_id: string
        }
        Update: {
          assigned_at?: string | null
          client_id?: string
          id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_clients_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transformation_photos: {
        Row: {
          description: string | null
          id: string
          image_url: string
          photo_date: string
          photo_type: Database["public"]["Enums"]["photo_type"]
          privacy_setting: Database["public"]["Enums"]["photo_privacy"] | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          image_url: string
          photo_date?: string
          photo_type: Database["public"]["Enums"]["photo_type"]
          privacy_setting?: Database["public"]["Enums"]["photo_privacy"] | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          description?: string | null
          id?: string
          image_url?: string
          photo_date?: string
          photo_type?: Database["public"]["Enums"]["photo_type"]
          privacy_setting?: Database["public"]["Enums"]["photo_privacy"] | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transformation_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          end_date: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          plan_id: string
          razorpay_subscription_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          user_id: string
        }
        Insert: {
          end_date: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan_id: string
          razorpay_subscription_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          user_id: string
        }
        Update: {
          end_date?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan_id?: string
          razorpay_subscription_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workout_logs: {
        Row: {
          completed_reps: number
          completed_sets: number
          date_logged: string
          exercise_id: string
          id: string
          optional_exercise: string | null
          plan_week_id: string | null
          user_id: string
          week_number: number
          weight_used: number | null
          workout_day_id: string
        }
        Insert: {
          completed_reps: number
          completed_sets: number
          date_logged: string
          exercise_id: string
          id?: string
          optional_exercise?: string | null
          plan_week_id?: string | null
          user_id: string
          week_number: number
          weight_used?: number | null
          workout_day_id: string
        }
        Update: {
          completed_reps?: number
          completed_sets?: number
          date_logged?: string
          exercise_id?: string
          id?: string
          optional_exercise?: string | null
          plan_week_id?: string | null
          user_id?: string
          week_number?: number
          weight_used?: number | null
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_workout"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_logs_plan_week_id_fkey"
            columns: ["plan_week_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_logs_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      workout_day_completion: {
        Row: {
          completed_at: string | null
          id: string
          plan_id: string | null
          user_id: string | null
          week_number: number
          workout_day_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          plan_id?: string | null
          user_id?: string | null
          week_number: number
          workout_day_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          plan_id?: string | null
          user_id?: string | null
          week_number?: number
          workout_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_day_completion_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_day_completion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_day_completion_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          day_number: number
          id: string
          plan_id: string
          workout_type: string
        }
        Insert: {
          day_number: number
          id?: string
          plan_id: string
          workout_type: string
        }
        Update: {
          day_number?: number
          id?: string
          plan_id?: string
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_log_sets: {
        Row: {
          created_at: string | null
          duration: unknown | null
          id: string
          log_id: string
          reps: number
          set_number: number
          weight: number
        }
        Insert: {
          created_at?: string | null
          duration?: unknown | null
          id?: string
          log_id: string
          reps: number
          set_number: number
          weight: number
        }
        Update: {
          created_at?: string | null
          duration?: unknown | null
          id?: string
          log_id?: string
          reps?: number
          set_number?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_log_sets_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "user_workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_weeks: {
        Row: {
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["week_status"] | null
          week_number: number
        }
        Insert: {
          end_date: string
          id?: string
          plan_id: string
          start_date: string
          status?: Database["public"]["Enums"]["week_status"] | null
          week_number: number
        }
        Update: {
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["week_status"] | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_weeks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          category: Database["public"]["Enums"]["workout_category"]
          created_at: string | null
          days: number | null
          description: string | null
          duration_weeks: number
          end_date: string
          id: string
          name: string
          start_date: string
          trainer_id: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["workout_category"]
          created_at?: string | null
          days?: number | null
          description?: string | null
          duration_weeks: number
          end_date: string
          id?: string
          name: string
          start_date: string
          trainer_id: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["workout_category"]
          created_at?: string | null
          days?: number | null
          description?: string | null
          duration_weeks?: number
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          trainer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "client" | "trainer" | "admin"
      payment_status: "pending" | "completed" | "failed"
      photo_privacy: "private" | "public"
      photo_type: "before" | "after"
      plan_type: "online" | "in-person" | "self-paced"
      subscription_category: "fitness" | "psychology" | "manifestation"
      subscription_status: "active" | "expired" | "canceled"
      week_status: "active" | "completed" | "pending"
      workout_category: "hypertrophy" | "strength" | "deload" | "endurance"
      workout_type: "legs" | "chest_triceps" | "back_biceps" | "full_body"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      calculator_sessions: {
        Row: {
          calculator: Database["public"]["Enums"]["CalculatorType"]
          created_at: string
          id: string
          inputs: Json
          result: number
          result_unit: string | null
          user_id: string
        }
        Insert: {
          calculator: Database["public"]["Enums"]["CalculatorType"]
          created_at?: string
          id: string
          inputs: Json
          result: number
          result_unit?: string | null
          user_id: string
        }
        Update: {
          calculator?: Database["public"]["Enums"]["CalculatorType"]
          created_at?: string
          id?: string
          inputs?: Json
          result?: number
          result_unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "CalculatorSession_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      client_max_lifts: {
        Row: {
          client_id: string
          date_achieved: string
          id: string
          last_updated: string
          list_exercise_id: string
          max_weight: number
        }
        Insert: {
          client_id: string
          date_achieved?: string
          id: string
          last_updated: string
          list_exercise_id: string
          max_weight: number
        }
        Update: {
          client_id?: string
          date_achieved?: string
          id?: string
          last_updated?: string
          list_exercise_id?: string
          max_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "ClientMaxLift_clientId_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClientMaxLift_listExerciseId_fkey"
            columns: ["list_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercise_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          client_id: string
          id: string
          notes: string | null
          performed_date: string
          reps_done: number | null
          rpe: number | null
          scheduled_date: string
          set_id: string
          weight_used: number | null
        }
        Insert: {
          client_id: string
          id: string
          notes?: string | null
          performed_date?: string
          reps_done?: number | null
          rpe?: number | null
          scheduled_date: string
          set_id: string
          weight_used?: number | null
        }
        Update: {
          client_id?: string
          id?: string
          notes?: string | null
          performed_date?: string
          reps_done?: number | null
          rpe?: number | null
          scheduled_date?: string
          set_id?: string
          weight_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ExerciseLog_clientId_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ExerciseLog_setId_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "workout_set_instructions"
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
          id: string
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
        Relationships: [
          {
            foreignKeyName: "SubscriptionEvent_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: number
          billing_period: string
          category: Database["public"]["Enums"]["SubscriptionCategory"]
          features: Json | null
          id: string
          name: string
          plan_type: Database["public"]["Enums"]["PlanType"]
          price: number
          razorpay_plan_id: string
        }
        Insert: {
          billing_cycle?: number
          billing_period?: string
          category: Database["public"]["Enums"]["SubscriptionCategory"]
          features?: Json | null
          id: string
          name: string
          plan_type?: Database["public"]["Enums"]["PlanType"]
          price: number
          razorpay_plan_id: string
        }
        Update: {
          billing_cycle?: number
          billing_period?: string
          category?: Database["public"]["Enums"]["SubscriptionCategory"]
          features?: Json | null
          id?: string
          name?: string
          plan_type?: Database["public"]["Enums"]["PlanType"]
          price?: number
          razorpay_plan_id?: string
        }
        Relationships: []
      }
      trainer_clients: {
        Row: {
          assigned_at: string
          client_id: string
          id: string
          trainer_id: string
        }
        Insert: {
          assigned_at?: string
          client_id: string
          id: string
          trainer_id: string
        }
        Update: {
          assigned_at?: string
          client_id?: string
          id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "TrainerClient_clientId_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TrainerClient_trainerId_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
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
          photo_type: Database["public"]["Enums"]["PhotoType"]
          privacy_setting: Database["public"]["Enums"]["PhotoPrivacy"] | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          description?: string | null
          id: string
          image_url: string
          photo_date?: string
          photo_type: Database["public"]["Enums"]["PhotoType"]
          privacy_setting?: Database["public"]["Enums"]["PhotoPrivacy"] | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          description?: string | null
          id?: string
          image_url?: string
          photo_date?: string
          photo_type?: Database["public"]["Enums"]["PhotoType"]
          privacy_setting?: Database["public"]["Enums"]["PhotoPrivacy"] | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "TransformationPhoto_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          end_date: string | null
          id: string
          payment_status: Database["public"]["Enums"]["PaymentStatus"] | null
          plan_id: string
          razorpay_subscription_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["SubscriptionStatus"] | null
          user_id: string
        }
        Insert: {
          end_date?: string | null
          id: string
          payment_status?: Database["public"]["Enums"]["PaymentStatus"] | null
          plan_id: string
          razorpay_subscription_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["SubscriptionStatus"] | null
          user_id: string
        }
        Update: {
          end_date?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["PaymentStatus"] | null
          plan_id?: string
          razorpay_subscription_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["SubscriptionStatus"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserSubscription_planId_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserSubscription_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          activity_level: Database["public"]["Enums"]["ActivityLevel"] | null
          created_at: string
          date_of_birth: string | null
          email: string
          gender: Database["public"]["Enums"]["Gender"] | null
          height: number | null
          height_unit: Database["public"]["Enums"]["HeightUnit"] | null
          hips: number | null
          id: string
          name: string
          neck: number | null
          onboarding_completed: string | null
          onboarding_started: string | null
          profile_completed: boolean
          role: Database["public"]["Enums"]["Role"]
          waist: number | null
          weight: number | null
          weight_unit: Database["public"]["Enums"]["WeightUnit"] | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["ActivityLevel"] | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          gender?: Database["public"]["Enums"]["Gender"] | null
          height?: number | null
          height_unit?: Database["public"]["Enums"]["HeightUnit"] | null
          hips?: number | null
          id: string
          name: string
          neck?: number | null
          onboarding_completed?: string | null
          onboarding_started?: string | null
          profile_completed?: boolean
          role?: Database["public"]["Enums"]["Role"]
          waist?: number | null
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["WeightUnit"] | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["ActivityLevel"] | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          gender?: Database["public"]["Enums"]["Gender"] | null
          height?: number | null
          height_unit?: Database["public"]["Enums"]["HeightUnit"] | null
          hips?: number | null
          id?: string
          name?: string
          neck?: number | null
          onboarding_completed?: string | null
          onboarding_started?: string | null
          profile_completed?: boolean
          role?: Database["public"]["Enums"]["Role"]
          waist?: number | null
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["WeightUnit"] | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string
          retry_count: number
          status: string
          webhook_id: string
        }
        Insert: {
          error?: string | null
          event_type: string
          id: string
          payload: Json
          processed_at?: string
          retry_count?: number
          status?: string
          webhook_id: string
        }
        Update: {
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          retry_count?: number
          status?: string
          webhook_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date_logged: string
          id: string
          notes: string | null
          user_id: string
          weight: number
          weight_unit: Database["public"]["Enums"]["WeightUnit"]
        }
        Insert: {
          created_at?: string
          date_logged: string
          id: string
          notes?: string | null
          user_id: string
          weight: number
          weight_unit?: Database["public"]["Enums"]["WeightUnit"]
        }
        Update: {
          created_at?: string
          date_logged?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight?: number
          weight_unit?: Database["public"]["Enums"]["WeightUnit"]
        }
        Relationships: [
          {
            foreignKeyName: "WeightLog_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_day_exercises: {
        Row: {
          id: string
          instructions: string | null
          list_exercise_id: string
          notes: string | null
          order: number
          workout_day_id: string
          youtube_link: string | null
        }
        Insert: {
          id: string
          instructions?: string | null
          list_exercise_id: string
          notes?: string | null
          order: number
          workout_day_id: string
          youtube_link?: string | null
        }
        Update: {
          id?: string
          instructions?: string | null
          list_exercise_id?: string
          notes?: string | null
          order?: number
          workout_day_id?: string
          youtube_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "WorkoutDayExercise_listExerciseId_fkey"
            columns: ["list_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercise_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkoutDayExercise_workoutDayId_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          day_date: string
          day_number: number
          id: string
          plan_id: string
          title: string
          week_number: number
          workout_type: string | null
        }
        Insert: {
          day_date: string
          day_number: number
          id: string
          plan_id: string
          title: string
          week_number: number
          workout_type?: string | null
        }
        Update: {
          day_date?: string
          day_number?: number
          id?: string
          plan_id?: string
          title?: string
          week_number?: number
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "WorkoutDay_planId_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercise_lists: {
        Row: {
          created_at: string
          created_by_id: string
          gif_url: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["BodyPart"]
          youtube_link: string | null
        }
        Insert: {
          created_at?: string
          created_by_id: string
          gif_url?: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["BodyPart"]
          youtube_link?: string | null
        }
        Update: {
          created_at?: string
          created_by_id?: string
          gif_url?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["BodyPart"]
          youtube_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "WorkoutExerciseList_createdById_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          category: Database["public"]["Enums"]["WorkoutCategory"]
          client_id: string
          created_at: string
          description: string | null
          duration_in_weeks: number
          end_date: string
          id: string
          intensity_mode: Database["public"]["Enums"]["IntensityMode"]
          start_date: string
          status: Database["public"]["Enums"]["WorkoutPlanStatus"]
          title: string
          trainer_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["WorkoutCategory"]
          client_id: string
          created_at?: string
          description?: string | null
          duration_in_weeks: number
          end_date: string
          id: string
          intensity_mode?: Database["public"]["Enums"]["IntensityMode"]
          start_date: string
          status?: Database["public"]["Enums"]["WorkoutPlanStatus"]
          title: string
          trainer_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["WorkoutCategory"]
          client_id?: string
          created_at?: string
          description?: string | null
          duration_in_weeks?: number
          end_date?: string
          id?: string
          intensity_mode?: Database["public"]["Enums"]["IntensityMode"]
          start_date?: string
          status?: Database["public"]["Enums"]["WorkoutPlanStatus"]
          title?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkoutPlan_clientId_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkoutPlan_trainerId_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_instructions: {
        Row: {
          exercise_id: string
          id: string
          intensity: Database["public"]["Enums"]["IntensityMode"] | null
          notes: string | null
          reps: number | null
          rest_time: number | null
          set_number: number
          weight_prescribed: number | null
        }
        Insert: {
          exercise_id: string
          id: string
          intensity?: Database["public"]["Enums"]["IntensityMode"] | null
          notes?: string | null
          reps?: number | null
          rest_time?: number | null
          set_number: number
          weight_prescribed?: number | null
        }
        Update: {
          exercise_id?: string
          id?: string
          intensity?: Database["public"]["Enums"]["IntensityMode"] | null
          notes?: string | null
          reps?: number | null
          rest_time?: number | null
          set_number?: number
          weight_prescribed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "WorkoutSetInstruction_exerciseId_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_day_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
    }
    Enums: {
      ActivityLevel:
        | "SEDENTARY"
        | "LIGHTLY_ACTIVE"
        | "MODERATELY_ACTIVE"
        | "VERY_ACTIVE"
        | "EXTRA_ACTIVE"
      BodyPart:
        | "CHEST"
        | "BACK"
        | "SHOULDERS"
        | "BICEPS"
        | "TRICEPS"
        | "LEGS"
        | "CORE"
        | "CARDIO"
        | "FULL_BODY"
      CalculatorType:
        | "BMI"
        | "BMR"
        | "BODY_FAT"
        | "CALORIE_NEEDS"
        | "IDEAL_WEIGHT"
        | "LEAN_BODY_MASS"
        | "ONE_REP_MAX"
        | "MACRO_SPLIT"
      Gender: "MALE" | "FEMALE"
      HeightUnit: "CM" | "INCHES" | "FEET"
      IntensityMode: "ABSOLUTE" | "PERCENT"
      PaymentStatus: "PENDING" | "COMPLETED" | "FAILED"
      PhotoPrivacy: "PRIVATE" | "PUBLIC"
      PhotoType: "BEFORE" | "AFTER"
      PlanType: "ONLINE" | "IN_PERSON" | "SELF_PACED"
      Role: "CLIENT" | "TRAINER" | "ADMIN"
      SubscriptionCategory:
        | "FITNESS"
        | "PSYCHOLOGY"
        | "MANIFESTATION"
        | "ALL_IN_ONE"
      SubscriptionStatus: "CREATED" | "ACTIVE" | "EXPIRED" | "CANCELED"
      WeightUnit: "KG" | "LB"
      WorkoutCategory: "HYPERTROPHY" | "STRENGTH" | "DELOAD" | "ENDURANCE"
      WorkoutPlanStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
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
    Enums: {
      ActivityLevel: [
        "SEDENTARY",
        "LIGHTLY_ACTIVE",
        "MODERATELY_ACTIVE",
        "VERY_ACTIVE",
        "EXTRA_ACTIVE",
      ],
      BodyPart: [
        "CHEST",
        "BACK",
        "SHOULDERS",
        "BICEPS",
        "TRICEPS",
        "LEGS",
        "CORE",
        "CARDIO",
        "FULL_BODY",
      ],
      CalculatorType: [
        "BMI",
        "BMR",
        "BODY_FAT",
        "CALORIE_NEEDS",
        "IDEAL_WEIGHT",
        "LEAN_BODY_MASS",
        "ONE_REP_MAX",
        "MACRO_SPLIT",
      ],
      Gender: ["MALE", "FEMALE"],
      HeightUnit: ["CM", "INCHES", "FEET"],
      IntensityMode: ["ABSOLUTE", "PERCENT"],
      PaymentStatus: ["PENDING", "COMPLETED", "FAILED"],
      PhotoPrivacy: ["PRIVATE", "PUBLIC"],
      PhotoType: ["BEFORE", "AFTER"],
      PlanType: ["ONLINE", "IN_PERSON", "SELF_PACED"],
      Role: ["CLIENT", "TRAINER", "ADMIN"],
      SubscriptionCategory: [
        "FITNESS",
        "PSYCHOLOGY",
        "MANIFESTATION",
        "ALL_IN_ONE",
      ],
      SubscriptionStatus: ["CREATED", "ACTIVE", "EXPIRED", "CANCELED"],
      WeightUnit: ["KG", "LB"],
      WorkoutCategory: ["HYPERTROPHY", "STRENGTH", "DELOAD", "ENDURANCE"],
      WorkoutPlanStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    },
  },
} as const

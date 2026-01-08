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
      assessment_groups: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          end_date: string | null
          group_link_token: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          start_date: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          end_date?: string | null
          group_link_token?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          start_date?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          end_date?: string | null
          group_link_token?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_groups_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_graded: boolean | null
          language: string | null
          organization_id: string
          status: string | null
          title: string
          type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_graded?: boolean | null
          language?: string | null
          organization_id: string
          status?: string | null
          title: string
          type: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_graded?: boolean | null
          language?: string | null
          organization_id?: string
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_ar: string
          body_en: string
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          subject_ar: string
          subject_en: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body_ar: string
          body_en: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          subject_ar: string
          subject_en: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body_ar?: string
          body_en?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          subject_ar?: string
          subject_en?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_talent_snapshots: {
        Row: {
          assessment_count: number
          created_at: string
          employee_email: string
          generated_at: string
          id: string
          organization_id: string
          snapshot_text: string
          updated_at: string
        }
        Insert: {
          assessment_count?: number
          created_at?: string
          employee_email: string
          generated_at?: string
          id?: string
          organization_id: string
          snapshot_text: string
          updated_at?: string
        }
        Update: {
          assessment_count?: number
          created_at?: string
          employee_email?: string
          generated_at?: string
          id?: string
          organization_id?: string
          snapshot_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_talent_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          organization_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          organization_id: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          organization_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      organization_email_settings: {
        Row: {
          created_at: string
          email_language: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_enabled: boolean | null
          organization_id: string
          resend_api_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_language?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id: string
          resend_api_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_language?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id?: string
          resend_api_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_email_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          assessment_limit: number | null
          billing_cycle_start: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_hr_admins: number | null
          name: string
          plan: string | null
          primary_color: string | null
          primary_language: string | null
          slug: string | null
        }
        Insert: {
          assessment_limit?: number | null
          billing_cycle_start?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_hr_admins?: number | null
          name: string
          plan?: string | null
          primary_color?: string | null
          primary_language?: string | null
          slug?: string | null
        }
        Update: {
          assessment_limit?: number | null
          billing_cycle_start?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_hr_admins?: number | null
          name?: string
          plan?: string | null
          primary_color?: string | null
          primary_language?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          access_token: string | null
          ai_report_text: string | null
          completed_at: string | null
          department: string | null
          email: string | null
          employee_code: string | null
          full_name: string | null
          group_id: string | null
          id: string
          job_title: string | null
          organization_id: string
          score_summary: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          access_token?: string | null
          ai_report_text?: string | null
          completed_at?: string | null
          department?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string | null
          group_id?: string | null
          id?: string
          job_title?: string | null
          organization_id: string
          score_summary?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          access_token?: string | null
          ai_report_text?: string | null
          completed_at?: string | null
          department?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string | null
          group_id?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string
          score_summary?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "assessment_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          assessment_type: string | null
          correct_answer: Json | null
          created_at: string
          difficulty: string | null
          id: string
          language: string
          options: Json | null
          organization_id: string
          question_id: string | null
          subdomain: string | null
          tags: string[] | null
          text: string
          type: string
          updated_at: string
        }
        Insert: {
          assessment_type?: string | null
          correct_answer?: Json | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string
          options?: Json | null
          organization_id: string
          question_id?: string | null
          subdomain?: string | null
          tags?: string[] | null
          text: string
          type: string
          updated_at?: string
        }
        Update: {
          assessment_type?: string | null
          correct_answer?: Json | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string
          options?: Json | null
          organization_id?: string
          question_id?: string | null
          subdomain?: string | null
          tags?: string[] | null
          text?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          assessment_id: string | null
          correct_answer: Json | null
          created_at: string | null
          id: string
          options: Json | null
          order_index: number | null
          organization_id: string
          text: string
          type: string
        }
        Insert: {
          assessment_id?: string | null
          correct_answer?: Json | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          organization_id: string
          text: string
          type: string
        }
        Update: {
          assessment_id?: string | null
          correct_answer?: Json | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          organization_id?: string
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          answer_data: Json | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          participant_id: string | null
          question_id: string | null
          score_value: number | null
        }
        Insert: {
          answer_data?: Json | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          participant_id?: string | null
          question_id?: string | null
          score_value?: number | null
        }
        Update: {
          answer_data?: Json | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          participant_id?: string | null
          question_id?: string | null
          score_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_participant_by_token: {
        Args: { p_access_token: string }
        Returns: string
      }
      get_user_organization_id: { Args: { _user_id?: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hr_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_org_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      verify_participant_access: {
        Args: { p_access_token: string; p_participant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "org_admin" | "hr_admin"
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
      app_role: ["super_admin", "org_admin", "hr_admin"],
    },
  },
} as const

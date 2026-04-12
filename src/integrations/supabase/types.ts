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
      bank_transfer_requests: {
        Row: {
          activated_subscription_id: string | null
          amount_usd: number
          billing_address: string | null
          billing_cycle: string
          billing_email: string
          company_name: string
          company_vat_number: string | null
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          plan_id: string
          proforma_invoice_id: string | null
          rejection_reason: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          activated_subscription_id?: string | null
          amount_usd: number
          billing_address?: string | null
          billing_cycle?: string
          billing_email: string
          company_name: string
          company_vat_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          plan_id: string
          proforma_invoice_id?: string | null
          rejection_reason?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          activated_subscription_id?: string | null
          amount_usd?: number
          billing_address?: string | null
          billing_cycle?: string
          billing_email?: string
          company_name?: string
          company_vat_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          plan_id?: string
          proforma_invoice_id?: string | null
          rejection_reason?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfer_requests_activated_subscription_id_fkey"
            columns: ["activated_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_requests_proforma_invoice_id_fkey"
            columns: ["proforma_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      invoices: {
        Row: {
          amount_usd: number
          bank_transfer_confirmed_at: string | null
          bank_transfer_confirmed_by: string | null
          bank_transfer_reference: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          metadata: Json | null
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_hosted_url: string | null
          stripe_invoice_id: string | null
          subscription_id: string | null
          tax_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount_usd: number
          bank_transfer_confirmed_at?: string | null
          bank_transfer_confirmed_by?: string | null
          bank_transfer_reference?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_hosted_url?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_usd?: number
          bank_transfer_confirmed_at?: string | null
          bank_transfer_confirmed_by?: string | null
          bank_transfer_reference?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_hosted_url?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
          encrypted_resend_api_key: string | null
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
          encrypted_resend_api_key?: string | null
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
          encrypted_resend_api_key?: string | null
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
          submission_type: string | null
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
          submission_type?: string | null
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
          submission_type?: string | null
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
      payment_providers: {
        Row: {
          account_id: string | null
          activated_at: string | null
          activated_by: string | null
          api_key_encrypted: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_currency: string | null
          bank_iban: string | null
          bank_instructions: string | null
          bank_instructions_ar: string | null
          bank_name: string | null
          bank_swift: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          is_test_mode: boolean | null
          provider_type: string
          publishable_key: string | null
          updated_at: string | null
          webhook_secret_encrypted: string | null
        }
        Insert: {
          account_id?: string | null
          activated_at?: string | null
          activated_by?: string | null
          api_key_encrypted?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_currency?: string | null
          bank_iban?: string | null
          bank_instructions?: string | null
          bank_instructions_ar?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_test_mode?: boolean | null
          provider_type: string
          publishable_key?: string | null
          updated_at?: string | null
          webhook_secret_encrypted?: string | null
        }
        Update: {
          account_id?: string | null
          activated_at?: string | null
          activated_by?: string | null
          api_key_encrypted?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_currency?: string | null
          bank_iban?: string | null
          bank_instructions?: string | null
          bank_instructions_ar?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_test_mode?: boolean | null
          provider_type?: string
          publishable_key?: string | null
          updated_at?: string | null
          webhook_secret_encrypted?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_ai_questions_monthly: number | null
          max_assessments: number | null
          max_groups: number | null
          max_organizations: number | null
          max_users: number | null
          name: string
          name_ar: string | null
          price_annual_usd: number | null
          price_monthly_usd: number | null
          slug: string
          sort_order: number | null
          stripe_price_annual_id: string | null
          stripe_price_monthly_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_ai_questions_monthly?: number | null
          max_assessments?: number | null
          max_groups?: number | null
          max_organizations?: number | null
          max_users?: number | null
          name: string
          name_ar?: string | null
          price_annual_usd?: number | null
          price_monthly_usd?: number | null
          slug: string
          sort_order?: number | null
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_ai_questions_monthly?: number | null
          max_assessments?: number | null
          max_groups?: number | null
          max_organizations?: number | null
          max_users?: number | null
          name?: string
          name_ar?: string | null
          price_annual_usd?: number | null
          price_monthly_usd?: number | null
          slug?: string
          sort_order?: number | null
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          subdomain: string | null
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
          subdomain?: string | null
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
          subdomain?: string | null
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
      subscriptions: {
        Row: {
          bank_transfer_reference: string | null
          billing_cycle: string
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          manual_activation_notes: string | null
          manually_activated_at: string | null
          manually_activated_by: string | null
          organization_id: string
          payment_method: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          bank_transfer_reference?: string | null
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          manual_activation_notes?: string | null
          manually_activated_at?: string | null
          manually_activated_by?: string | null
          organization_id: string
          payment_method?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_transfer_reference?: string | null
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          manual_activation_notes?: string | null
          manually_activated_at?: string | null
          manually_activated_by?: string | null
          organization_id?: string
          payment_method?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_ai_providers: {
        Row: {
          base_url: string | null
          created_at: string | null
          default_model: string
          display_name: string | null
          encrypted_api_key: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_test_error: string | null
          last_test_latency_ms: number | null
          last_test_status: string | null
          last_tested_at: string | null
          max_tokens: number | null
          monthly_cost_cap_usd: number | null
          monthly_token_cap: number | null
          narrative_model: string | null
          organization_header: string | null
          organization_id: string
          provider_type: string
          question_gen_model: string | null
          snapshot_model: string | null
          temperature: number | null
          top_p: number | null
          updated_at: string | null
        }
        Insert: {
          base_url?: string | null
          created_at?: string | null
          default_model?: string
          display_name?: string | null
          encrypted_api_key?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_error?: string | null
          last_test_latency_ms?: number | null
          last_test_status?: string | null
          last_tested_at?: string | null
          max_tokens?: number | null
          monthly_cost_cap_usd?: number | null
          monthly_token_cap?: number | null
          narrative_model?: string | null
          organization_header?: string | null
          organization_id: string
          provider_type: string
          question_gen_model?: string | null
          snapshot_model?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
        }
        Update: {
          base_url?: string | null
          created_at?: string | null
          default_model?: string
          display_name?: string | null
          encrypted_api_key?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_error?: string | null
          last_test_latency_ms?: number | null
          last_test_status?: string | null
          last_tested_at?: string | null
          max_tokens?: number | null
          monthly_cost_cap_usd?: number | null
          monthly_token_cap?: number | null
          narrative_model?: string | null
          organization_header?: string | null
          organization_id?: string
          provider_type?: string
          question_gen_model?: string | null
          snapshot_model?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_ai_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_ai_usage: {
        Row: {
          completion_tokens: number
          cost_estimate_usd: number | null
          created_at: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          model: string
          organization_id: string
          prompt_tokens: number
          provider_id: string | null
          total_tokens: number | null
          use_case: string
        }
        Insert: {
          completion_tokens?: number
          cost_estimate_usd?: number | null
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model: string
          organization_id: string
          prompt_tokens?: number
          provider_id?: string | null
          total_tokens?: number | null
          use_case: string
        }
        Update: {
          completion_tokens?: number
          cost_estimate_usd?: number | null
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model?: string
          organization_id?: string
          prompt_tokens?: number
          provider_id?: string | null
          total_tokens?: number | null
          use_case?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_ai_usage_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "tenant_ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_email_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          from_email: string
          id: string
          metadata: Json | null
          organization_id: string
          provider_id: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_key: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          from_email: string
          id?: string
          metadata?: Json | null
          organization_id: string
          provider_id?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_key?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          from_email?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          provider_id?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_email_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "tenant_email_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_email_providers: {
        Row: {
          created_at: string | null
          display_name: string | null
          encrypted_api_key: string | null
          encrypted_smtp_password: string | null
          from_email: string
          from_name: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_test_error: string | null
          last_test_status: string | null
          last_tested_at: string | null
          organization_id: string
          provider_domain: string | null
          provider_region: string | null
          provider_type: string
          reply_to: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_username: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          encrypted_api_key?: string | null
          encrypted_smtp_password?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_error?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          organization_id: string
          provider_domain?: string | null
          provider_region?: string | null
          provider_type: string
          reply_to?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          encrypted_api_key?: string | null
          encrypted_smtp_password?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_test_error?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          organization_id?: string
          provider_domain?: string | null
          provider_region?: string | null
          provider_type?: string
          reply_to?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_email_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_prompt_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string
          organization_id: string | null
          template_text: string
          updated_at: string | null
          use_case: string
          variables: Json | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          organization_id?: string | null
          template_text: string
          updated_at?: string | null
          use_case: string
          variables?: Json | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          organization_id?: string | null
          template_text?: string
          updated_at?: string | null
          use_case?: string
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_prompt_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric: string
          organization_id: string
          period_month: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric: string
          organization_id: string
          period_month?: string
          quantity?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric?: string
          organization_id?: string
          period_month?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      check_ai_usage_cap: { Args: { p_org_id: string }; Returns: boolean }
      check_subscription_limit: {
        Args: { p_org_id: string; p_resource: string }
        Returns: boolean
      }
      encrypt_email_secret: { Args: { plain_text: string }; Returns: string }
      expire_trial_subscriptions: { Args: never; Returns: number }
      get_decrypted_resend_api_key: {
        Args: { p_org_id: string }
        Returns: string
      }
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

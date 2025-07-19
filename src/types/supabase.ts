export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string
          department: string | null
          manager_id: string | null
          azure_id: string | null
          is_active: boolean
          preferences: Json
          last_login: string | null
          password_last_changed: string | null
          mfa_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role: string
          department?: string | null
          manager_id?: string | null
          azure_id?: string | null
          is_active?: boolean
          preferences?: Json
          last_login?: string | null
          password_last_changed?: string | null
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string
          department?: string | null
          manager_id?: string | null
          azure_id?: string | null
          is_active?: boolean
          preferences?: Json
          last_login?: string | null
          password_last_changed?: string | null
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          created_by: string
          roi_target: number | null
          estimated_effort: number | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: string
          created_by: string
          roi_target?: number | null
          estimated_effort?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string
          created_by?: string
          roi_target?: number | null
          estimated_effort?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          status: string
          context: Json
          ai_summary: string | null
          extracted_requirements: Json
          confidence_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          status?: string
          context: Json
          ai_summary?: string | null
          extracted_requirements: Json
          confidence_score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          status?: string
          context?: Json
          ai_summary?: string | null
          extracted_requirements?: Json
          confidence_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      quality_gates: {
        Row: {
          id: string
          project_id: string
          gate_type: string
          status: string
          criteria: Json
          approvers: Json
          sla_deadline: string | null
          score: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          gate_type: string
          status?: string
          criteria: Json
          approvers: Json
          sla_deadline?: string | null
          score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          gate_type?: string
          status?: string
          criteria?: Json
          approvers?: Json
          sla_deadline?: string | null
          score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
} 
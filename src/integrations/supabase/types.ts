export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          channels: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered: string | null
          metric_threshold: Json
          name: string
          recipients: Json
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          metric_threshold: Json
          name: string
          recipients: Json
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          metric_threshold?: Json
          name?: string
          recipients?: Json
        }
        Relationships: [
          {
            foreignKeyName: "alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          success: boolean | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      code_artifacts: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string
          file_path: string | null
          id: string
          language: string | null
          name: string
          project_id: string | null
          quality_score: number | null
          reviewed_by: string | null
          security_score: number | null
          status: string | null
          type: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by: string
          file_path?: string | null
          id?: string
          language?: string | null
          name: string
          project_id?: string | null
          quality_score?: number | null
          reviewed_by?: string | null
          security_score?: number | null
          status?: string | null
          type: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string
          file_path?: string | null
          id?: string
          language?: string | null
          name?: string
          project_id?: string | null
          quality_score?: number | null
          reviewed_by?: string | null
          security_score?: number | null
          status?: string | null
          type?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_artifacts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_summary: string | null
          created_at: string | null
          id: string
          project_id: string | null
          requirements_extracted: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          requirements_extracted?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          requirements_extracted?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_public: boolean | null
          layout: Json
          name: string
          permissions: Json | null
          refresh_interval: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_public?: boolean | null
          layout: Json
          name: string
          permissions?: Json | null
          refresh_interval?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_public?: boolean | null
          layout?: Json
          name?: string
          permissions?: Json | null
          refresh_interval?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          completed_at: string | null
          deployed_by: string
          deployment_config: Json | null
          environment: string
          id: string
          logs: string | null
          project_id: string | null
          rollback_at: string | null
          started_at: string | null
          status: string | null
          version: string
        }
        Insert: {
          completed_at?: string | null
          deployed_by: string
          deployment_config?: Json | null
          environment: string
          id?: string
          logs?: string | null
          project_id?: string | null
          rollback_at?: string | null
          started_at?: string | null
          status?: string | null
          version: string
        }
        Update: {
          completed_at?: string | null
          deployed_by?: string
          deployment_config?: Json | null
          environment?: string
          id?: string
          logs?: string | null
          project_id?: string | null
          rollback_at?: string | null
          started_at?: string | null
          status?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: Json
          created_at: string | null
          created_by: string
          export_paths: Json | null
          id: string
          project_id: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          template_version: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string | null
          version: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content: Json
          created_at?: string | null
          created_by: string
          export_paths?: Json | null
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          template_version?: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string
          export_paths?: Json | null
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          template_version?: string | null
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          project_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          sla_deadline: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          project_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          sla_deadline?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          project_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          sla_deadline?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_analysis: Json | null
          confidence_score: number | null
          content: string | null
          conversation_id: string | null
          created_at: string | null
          file_path: string | null
          file_size: number | null
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          project_id: string | null
          status: string | null
          tags: Json | null
          threshold_critical: number | null
          threshold_warning: number | null
          timestamp: string | null
          unit: string | null
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          project_id?: string | null
          status?: string | null
          tags?: Json | null
          threshold_critical?: number | null
          threshold_warning?: number | null
          timestamp?: string | null
          unit?: string | null
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          project_id?: string | null
          status?: string | null
          tags?: Json | null
          threshold_critical?: number | null
          threshold_warning?: number | null
          timestamp?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          expires_at: string | null
          granted_at: string | null
          granted_by: string
          id: string
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by: string
          id?: string
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string
          id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_roi: number | null
          assigned_architect: string | null
          completed_date: string | null
          complexity_score: number | null
          created_at: string | null
          created_by: string
          description: string | null
          estimated_roi: number | null
          id: string
          methodology: string | null
          name: string
          priority: number | null
          product_owner: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          actual_roi?: number | null
          assigned_architect?: string | null
          completed_date?: string | null
          complexity_score?: number | null
          created_at?: string | null
          created_by: string
          description?: string | null
          estimated_roi?: number | null
          id?: string
          methodology?: string | null
          name: string
          priority?: number | null
          product_owner?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_roi?: number | null
          assigned_architect?: string | null
          completed_date?: string | null
          complexity_score?: number | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          estimated_roi?: number | null
          id?: string
          methodology?: string | null
          name?: string
          priority?: number | null
          product_owner?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_architect_fkey"
            columns: ["assigned_architect"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_product_owner_fkey"
            columns: ["product_owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_gates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checklist_completed: Json | null
          comments: string | null
          created_at: string | null
          criteria: Json
          escalated: boolean | null
          gate_type: Database["public"]["Enums"]["quality_gate_type"]
          id: string
          project_id: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checklist_completed?: Json | null
          comments?: string | null
          created_at?: string | null
          criteria: Json
          escalated?: boolean | null
          gate_type: Database["public"]["Enums"]["quality_gate_type"]
          id?: string
          project_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checklist_completed?: Json | null
          comments?: string | null
          created_at?: string | null
          criteria?: Json
          escalated?: boolean | null
          gate_type?: Database["public"]["Enums"]["quality_gate_type"]
          id?: string
          project_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_gates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_gates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          capacity: number | null
          created_at: string | null
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string | null
          start_date: string
          status: string | null
          velocity: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id?: string | null
          start_date: string
          status?: string | null
          velocity?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string | null
          start_date?: string
          status?: string | null
          velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          actual_result: string | null
          automated: boolean | null
          created_at: string | null
          created_by: string
          description: string | null
          evidence_path: string | null
          executed_by: string | null
          execution_date: string | null
          expected_result: string | null
          id: string
          name: string
          priority: number | null
          project_id: string | null
          status: string | null
          steps: Json | null
          type: string
          user_story_id: string | null
        }
        Insert: {
          actual_result?: string | null
          automated?: boolean | null
          created_at?: string | null
          created_by: string
          description?: string | null
          evidence_path?: string | null
          executed_by?: string | null
          execution_date?: string | null
          expected_result?: string | null
          id?: string
          name: string
          priority?: number | null
          project_id?: string | null
          status?: string | null
          steps?: Json | null
          type: string
          user_story_id?: string | null
        }
        Update: {
          actual_result?: string | null
          automated?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          evidence_path?: string | null
          executed_by?: string | null
          execution_date?: string | null
          expected_result?: string | null
          id?: string
          name?: string
          priority?: number | null
          project_id?: string | null
          status?: string | null
          steps?: Json | null
          type?: string
          user_story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_user_story_id_fkey"
            columns: ["user_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_recommendations: {
        Row: {
          analysis_criteria: Json
          confidence: number | null
          created_at: string | null
          id: string
          project_id: string | null
          reasoning: string | null
          recommended_tools: Json
          roi_projection: Json | null
          scores: Json
          selected_tool: string | null
          selection_reason: string | null
        }
        Insert: {
          analysis_criteria: Json
          confidence?: number | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          reasoning?: string | null
          recommended_tools: Json
          roi_projection?: Json | null
          scores: Json
          selected_tool?: string | null
          selection_reason?: string | null
        }
        Update: {
          analysis_criteria?: Json
          confidence?: number | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          reasoning?: string | null
          recommended_tools?: Json
          roi_projection?: Json | null
          scores?: Json
          selected_tool?: string | null
          selection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stories: {
        Row: {
          acceptance_criteria: Json | null
          assigned_to: string | null
          business_value: number | null
          created_at: string | null
          description: string | null
          epic_id: string | null
          id: string
          priority: number | null
          project_id: string | null
          sprint_id: string | null
          status: string | null
          story_points: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: Json | null
          assigned_to?: string | null
          business_value?: number | null
          created_at?: string | null
          description?: string | null
          epic_id?: string | null
          id?: string
          priority?: number | null
          project_id?: string | null
          sprint_id?: string | null
          status?: string | null
          story_points?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: Json | null
          assigned_to?: string | null
          business_value?: number | null
          created_at?: string | null
          description?: string | null
          epic_id?: string | null
          id?: string
          priority?: number | null
          project_id?: string | null
          sprint_id?: string | null
          status?: string | null
          story_points?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stories_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          azure_id: string | null
          created_at: string | null
          department: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          azure_id?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          azure_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
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
      approval_status: "pendente" | "aprovado" | "rejeitado" | "em_revisao"
      document_type:
        | "pdd"
        | "sdd"
        | "gmud"
        | "user_story"
        | "bpmn"
        | "requisitos"
      project_status:
        | "ideacao"
        | "planejamento"
        | "desenvolvimento"
        | "homologacao"
        | "producao"
        | "suspenso"
        | "concluido"
      quality_gate_type: "G1" | "G2" | "G3" | "G4"
      user_role:
        | "admin"
        | "arquiteto"
        | "product_owner"
        | "desenvolvedor"
        | "qa_tester"
        | "stakeholder"
        | "auditor"
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
      approval_status: ["pendente", "aprovado", "rejeitado", "em_revisao"],
      document_type: ["pdd", "sdd", "gmud", "user_story", "bpmn", "requisitos"],
      project_status: [
        "ideacao",
        "planejamento",
        "desenvolvimento",
        "homologacao",
        "producao",
        "suspenso",
        "concluido",
      ],
      quality_gate_type: ["G1", "G2", "G3", "G4"],
      user_role: [
        "admin",
        "arquiteto",
        "product_owner",
        "desenvolvedor",
        "qa_tester",
        "stakeholder",
        "auditor",
      ],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemoryCategory = 'person' | 'place' | 'routine' | 'event' | 'preference';
export type MemoryStatus = 'new' | 'introduced' | 'practiced' | 'recall_observed';
export type ReminderType = 'recurring' | 'one_time';
export type ReminderStatus = 'scheduled' | 'delivered' | 'acknowledged' | 'postponed' | 'missed';
export type GameCategory = 'core' | 'personalized';
export type CaregiverRelationship = 'son' | 'daughter' | 'spouse' | 'professional' | 'other';

export type Database = {
  public: {
    Tables: {
      caregivers: {
        Row: {
          id: string;
          name: string;
          email: string;
          password_hash: string;
          preferred_language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password_hash: string;
          preferred_language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password_hash?: string;
          preferred_language?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          caregiver_id: string;
          name: string;
          patient_code: string;
          pin_hash: string;
          preferred_language: string;
          date_of_birth: string | null;
          gender: string | null;
          time_zone: string | null;
          profile_photo_url: string | null;
          is_active: boolean;
          voice_enabled: boolean;
          text_size: string;
          daily_target_activities: number;
          session_duration_minutes: number;
          preferred_activity_time: string;
          preferred_activity_types: string[];
          last_active_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          name: string;
          patient_code: string;
          pin_hash: string;
          preferred_language?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          time_zone?: string | null;
          profile_photo_url?: string | null;
          is_active?: boolean;
          voice_enabled?: boolean;
          text_size?: string;
          daily_target_activities?: number;
          session_duration_minutes?: number;
          preferred_activity_time?: string;
          preferred_activity_types?: string[];
          last_active_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          name?: string;
          patient_code?: string;
          pin_hash?: string;
          preferred_language?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          time_zone?: string | null;
          profile_photo_url?: string | null;
          is_active?: boolean;
          voice_enabled?: boolean;
          text_size?: string;
          daily_target_activities?: number;
          session_duration_minutes?: number;
          preferred_activity_time?: string;
          preferred_activity_types?: string[];
          last_active_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'patients_caregiver_id_fkey';
            columns: ['caregiver_id'];
            isOneToOne: false;
            referencedRelation: 'caregivers';
            referencedColumns: ['id'];
          }
        ];
      };
      caregiver_patient_relationships: {
        Row: {
          id: string;
          caregiver_id: string;
          patient_id: string;
          relationship_type: CaregiverRelationship;
          is_primary: boolean;
          can_manage_access: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          patient_id: string;
          relationship_type?: CaregiverRelationship;
          is_primary?: boolean;
          can_manage_access?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          patient_id?: string;
          relationship_type?: CaregiverRelationship;
          is_primary?: boolean;
          can_manage_access?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'caregiver_patient_relationships_caregiver_id_fkey';
            columns: ['caregiver_id'];
            isOneToOne: false;
            referencedRelation: 'caregivers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'caregiver_patient_relationships_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          }
        ];
      };
      daily_routines: {
        Row: {
          id: string;
          patient_id: string;
          time_of_day: string;
          title: string;
          description: string | null;
          days_of_week: string[];
          is_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          time_of_day: string;
          title: string;
          description?: string | null;
          days_of_week?: string[];
          is_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          time_of_day?: string;
          title?: string;
          description?: string | null;
          days_of_week?: string[];
          is_enabled?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_routines_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          }
        ];
      };
      memory_bank: {
        Row: {
          id: string;
          patient_id: string;
          category: MemoryCategory;
          key_term: string;
          description: string;
          status: MemoryStatus;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          category: MemoryCategory;
          key_term: string;
          description: string;
          status?: MemoryStatus;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          category?: MemoryCategory;
          key_term?: string;
          description?: string;
          status?: MemoryStatus;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memory_bank_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          }
        ];
      };
      reminders: {
        Row: {
          id: string;
          patient_id: string;
          type: ReminderType;
          title: string;
          description: string | null;
          scheduled_time: string;
          recurrence_rule: string | null;
          is_done: boolean;
          voice_enabled: boolean;
          notification_enabled: boolean;
          memory_prompt_enabled: boolean;
          status: ReminderStatus;
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          type: ReminderType;
          title: string;
          description?: string | null;
          scheduled_time: string;
          recurrence_rule?: string | null;
          is_done?: boolean;
          voice_enabled?: boolean;
          notification_enabled?: boolean;
          memory_prompt_enabled?: boolean;
          status?: ReminderStatus;
          acknowledged_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          type?: ReminderType;
          title?: string;
          description?: string | null;
          scheduled_time?: string;
          recurrence_rule?: string | null;
          is_done?: boolean;
          voice_enabled?: boolean;
          notification_enabled?: boolean;
          memory_prompt_enabled?: boolean;
          status?: ReminderStatus;
          acknowledged_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reminders_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          }
        ];
      };
      games: {
        Row: {
          id: string;
          name: string;
          category: GameCategory;
          base_difficulty: number;
        };
        Insert: {
          id?: string;
          name: string;
          category: GameCategory;
          base_difficulty?: number;
        };
        Update: {
          id?: string;
          name?: string;
          category?: GameCategory;
          base_difficulty?: number;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          patient_id: string;
          game_id: string;
          difficulty_level: number;
          accuracy: number;
          avg_response_time_ms: number;
          mistakes: number;
          completed: boolean;
          played_at: string;
          duration_seconds?: number;
        };
        Insert: {
          id?: string;
          patient_id: string;
          game_id: string;
          difficulty_level: number;
          accuracy: number;
          avg_response_time_ms: number;
          mistakes?: number;
          completed?: boolean;
          played_at?: string;
          duration_seconds?: number;
        };
        Update: {
          id?: string;
          patient_id?: string;
          game_id?: string;
          difficulty_level?: number;
          accuracy?: number;
          avg_response_time_ms?: number;
          mistakes?: number;
          completed?: boolean;
          played_at?: string;
          duration_seconds?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'game_sessions_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_sessions_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          }
        ];
      };
      weekly_reports: {
        Row: {
          id: string;
          patient_id: string;
          week_start: string;
          summary_text: string | null;
          metrics_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          week_start: string;
          summary_text?: string | null;
          metrics_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          week_start?: string;
          summary_text?: string | null;
          metrics_json?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'weekly_reports_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      memory_category: MemoryCategory;
      memory_status: MemoryStatus;
      reminder_type: ReminderType;
      reminder_status: ReminderStatus;
      game_category: GameCategory;
      caregiver_relationship: CaregiverRelationship;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

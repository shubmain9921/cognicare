import {
  CaregiverRelationship,
  MemoryCategory,
  MemoryStatus,
  ReminderType,
  ReminderStatus,
} from '@/types/database.types';

export interface DemoPatient {
  id: string;
  caregiver_id: string;
  name: string;
  patient_code: string;
  pin: string;
  preferred_language: string;
  date_of_birth: string;
  gender: string;
  time_zone: string;
  is_active: boolean;
  voice_enabled: boolean;
  text_size: string;
  daily_target_activities: number;
  session_duration_minutes: number;
  preferred_activity_time: string;
  preferred_activity_types: string[];
  relationship?: CaregiverRelationship;
  is_primary: boolean;
  last_active_at: string;
  created_at: string;
}

export interface DemoRoutine {
  id: string;
  patient_id: string;
  time_of_day: string;
  title: string;
  description: string;
  days_of_week: string[];
  is_enabled: boolean;
  created_at: string;
}

export interface DemoReminder {
  id: string;
  patient_id: string;
  type: ReminderType;
  title: string;
  description: string;
  scheduled_time: string;
  recurrence_rule: string | null;
  is_done: boolean;
  voice_enabled: boolean;
  notification_enabled: boolean;
  memory_prompt_enabled: boolean;
  status: ReminderStatus;
  acknowledged_at: string | null;
  created_at: string;
}

export interface DemoMemory {
  id: string;
  patient_id: string;
  category: MemoryCategory;
  key_term: string;
  description: string;
  status: MemoryStatus;
  image_url: string | null;
  created_at: string;
}

export interface DemoGameSession {
  id: string;
  patient_id: string;
  game_name: string;
  game_type?: string;
  started_at?: string;
  completed_at?: string;
  played_at?: string;
  duration_seconds: number;
  difficulty_level: number;
  accuracy: number;
  avg_response_time_ms: number;
  mistakes: number;
  completed: boolean;
}

export interface DemoStoreData {
  patients: DemoPatient[];
  routines: DemoRoutine[];
  reminders: DemoReminder[];
  memories: DemoMemory[];
  sessions: DemoGameSession[];
}

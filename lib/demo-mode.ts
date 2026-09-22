import fs from 'fs';
import path from 'path';
import { MemoryCategory, MemoryStatus, ReminderType, ReminderStatus, CaregiverRelationship } from '@/types/database.types';

import {
  DEMO_CAREGIVER_EMAIL,
  DEMO_CAREGIVER_PASSWORD,
  DEMO_PATIENT_CODE,
  DEMO_PATIENT_PIN,
  DEMO_CAREGIVER_COOKIE,
  isDemoMode,
} from './demo-constants';

export * from './demo-constants';

let dynamicDemoCaregiver = {
  id: 'demo-caregiver-1',
  name: 'Rahul Sharma',
  email: DEMO_CAREGIVER_EMAIL,
  preferred_language: 'en',
};

export function getDemoCaregiver() {
  return dynamicDemoCaregiver;
}

export function updateDemoCaregiver(updates: Partial<typeof dynamicDemoCaregiver>) {
  dynamicDemoCaregiver = { ...dynamicDemoCaregiver, ...updates };
  syncState();
}

export function isDemoCaregiverAuthenticated(): boolean {
  return isDemoMode();
}

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
  relationship: CaregiverRelationship;
  is_primary: boolean;
  secondary_caregivers?: Array<{ name: string; email: string; relationship: string }>;
  last_active_at: string;
  created_at: string;
}

// Exactly ONE demo patient for SIH 2026 judges (Anita Sharma, DEMO-001 / 202626)
const INITIAL_DEMO_PATIENTS: DemoPatient[] = [
  {
    id: 'demo-patient-1',
    caregiver_id: 'demo-caregiver-1',
    name: 'Anita Sharma',
    patient_code: 'DEMO-001',
    pin: '202626',
    preferred_language: 'en', // Default English
    date_of_birth: '1954-04-12',
    gender: 'Female',
    time_zone: 'Asia/Kolkata',
    is_active: true,
    voice_enabled: true,
    text_size: 'large',
    daily_target_activities: 5,
    session_duration_minutes: 10,
    preferred_activity_time: 'morning',
    preferred_activity_types: ['memory', 'sequence', 'routine'],
    relationship: 'son', // Rahul is Son of Anita
    is_primary: true,
    secondary_caregivers: [
      { name: 'Priya Sharma', email: 'priya@cognicare.health', relationship: 'Daughter' },
    ],
    last_active_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    created_at: '2026-01-15T09:00:00.000Z',
  },
];

// Dynamic store declarations and persistent accessors are implemented below after initial seeds

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

const INITIAL_DEMO_ROUTINES: DemoRoutine[] = [
  {
    id: 'routine-1',
    patient_id: 'demo-patient-1',
    time_of_day: '07:00',
    title: 'Wake up',
    description: 'Gentle alarm and warm glass of water',
    days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_enabled: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'routine-2',
    patient_id: 'demo-patient-1',
    time_of_day: '08:00',
    title: 'Breakfast',
    description: 'Healthy breakfast with tea',
    days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_enabled: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'routine-3',
    patient_id: 'demo-patient-1',
    time_of_day: '09:00',
    title: 'Morning Medicine',
    description: 'Blood pressure & vitamins prescription',
    days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_enabled: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'routine-4',
    patient_id: 'demo-patient-1',
    time_of_day: '10:00',
    title: 'Morning Walk',
    description: '15-minute garden walk with sun exposure',
    days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri'],
    is_enabled: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'routine-5',
    patient_id: 'demo-patient-1',
    time_of_day: '13:00',
    title: 'Lunch',
    description: 'Nutritious warm lunch',
    days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_enabled: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'routine-6',
    patient_id: 'demo-patient-1',
    time_of_day: '18:00',
    title: 'Family Call',
    description: 'Call with Priya and grandson Aarav',
    days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_enabled: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
];

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

export function getInitialDemoReminders(patientId: string = 'demo-patient-1'): DemoReminder[] {
  return [
    {
      id: 'demo-rem-1',
      patient_id: patientId,
      type: 'recurring',
      title: 'Daily Blood Pressure Medicine',
      description: 'Take with half glass of water after breakfast',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Every day @ 9:00 AM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: true,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-2',
      patient_id: patientId,
      type: 'recurring',
      title: 'Morning Hydration Check-in',
      description: 'Drink warm water with lemon',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Every morning @ 8:30 AM',
      is_done: true,
      voice_enabled: false,
      notification_enabled: true,
      memory_prompt_enabled: false,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-3',
      patient_id: patientId,
      type: 'recurring',
      title: 'Morning Walk in Garden',
      description: 'Light exercise and fresh air',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Mon–Fri @ 10:00 AM',
      is_done: false,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: true,
      status: 'postponed',
      acknowledged_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-4',
      patient_id: patientId,
      type: 'recurring',
      title: 'Morning Breakfast & Porridge',
      description: 'Nutritious breakfast prepared by caregiver',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 8:00 AM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: false,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-5',
      patient_id: patientId,
      type: 'recurring',
      title: 'Mid-Morning Fruit Snack',
      description: 'Fresh papaya or sliced apple',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 11:30 AM',
      is_done: true,
      voice_enabled: false,
      notification_enabled: true,
      memory_prompt_enabled: false,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-6',
      patient_id: patientId,
      type: 'recurring',
      title: 'Vitamin D & Calcium Drops',
      description: 'Take 4 drops after lunch',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 1:30 PM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: true,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-7',
      patient_id: patientId,
      type: 'recurring',
      title: 'Warm Lunch Routine',
      description: 'Healthy khichdi or chapati with dal',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 1:00 PM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: false,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-8',
      patient_id: patientId,
      type: 'recurring',
      title: 'Afternoon Rest & Quiet Time',
      description: '30-minute peaceful nap in quiet bedroom',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 2:30 PM',
      is_done: true,
      voice_enabled: false,
      notification_enabled: true,
      memory_prompt_enabled: false,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-9',
      patient_id: patientId,
      type: 'recurring',
      title: 'Afternoon Hydration',
      description: 'Glass of warm coconut water',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 3:30 PM',
      is_done: true,
      voice_enabled: false,
      notification_enabled: true,
      memory_prompt_enabled: false,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-10',
      patient_id: patientId,
      type: 'recurring',
      title: 'Evening Herbal Tea with Rahul',
      description: 'Cup of tulsi tea and pleasant conversation',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 5:00 PM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: true,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-11',
      patient_id: patientId,
      type: 'recurring',
      title: 'Cognitive Game & Memory Time',
      description: 'Play Remember the Objects or Story Recall',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 11:00 AM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: true,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-12',
      patient_id: patientId,
      type: 'recurring',
      title: 'Family Video Call with Priya & Aarav',
      description: 'Weekly video catch-up with daughter and grandson',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Sat & Sun @ 6:00 PM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: true,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-13',
      patient_id: patientId,
      type: 'recurring',
      title: 'Evening Dinner Routine',
      description: 'Light soup and vegetable khichdi',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 7:30 PM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: false,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rem-14',
      patient_id: patientId,
      type: 'recurring',
      title: 'Night Medicine & Bedtime Relaxation',
      description: 'Sleep aid & glass of warm milk',
      scheduled_time: new Date().toISOString(),
      recurrence_rule: 'Daily @ 9:30 PM',
      is_done: true,
      voice_enabled: true,
      notification_enabled: true,
      memory_prompt_enabled: true,
      status: 'acknowledged',
      acknowledged_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
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

export function getInitialDemoMemories(patientId: string = 'demo-patient-1'): DemoMemory[] {
  return [
    {
      id: 'demo-mem-1',
      patient_id: patientId,
      category: 'person',
      key_term: 'Priya',
      description: 'Daughter who lives in Mumbai and calls every Sunday',
      status: 'recall_observed',
      image_url: null,
      created_at: '2024-01-10T10:00:00.000Z',
    },
    {
      id: 'demo-mem-2',
      patient_id: patientId,
      category: 'person',
      key_term: 'Aarav',
      description: '8-year-old grandson who loves drawing animals',
      status: 'practiced',
      image_url: null,
      created_at: '2024-01-12T11:00:00.000Z',
    },
    {
      id: 'demo-mem-3',
      patient_id: patientId,
      category: 'place',
      key_term: 'Favorite Park (Nehru Garden)',
      description: 'The green park where she enjoys sitting near the fountain',
      status: 'introduced',
      image_url: null,
      created_at: '2024-02-01T08:30:00.000Z',
    },
    {
      id: 'demo-mem-4',
      patient_id: patientId,
      category: 'place',
      key_term: 'City Hospital',
      description: 'Where Dr. Sen has his clinic on the 2nd floor',
      status: 'practiced',
      image_url: null,
      created_at: '2024-02-05T09:15:00.000Z',
    },
    {
      id: 'demo-mem-5',
      patient_id: patientId,
      category: 'event',
      key_term: 'Wedding Anniversary (Nov 24)',
      description: 'Celebrated in Jaipur with classical violin music',
      status: 'recall_observed',
      image_url: null,
      created_at: '2024-01-18T12:00:00.000Z',
    },
    {
      id: 'demo-mem-6',
      patient_id: patientId,
      category: 'preference',
      key_term: 'Favorite Food: Masala Dosa',
      description: 'Enjoys crispy dosa with coconut chutney on weekend mornings',
      status: 'practiced',
      image_url: null,
      created_at: '2024-02-10T14:00:00.000Z',
    },
    {
      id: 'demo-mem-7',
      patient_id: patientId,
      category: 'preference',
      key_term: 'Favorite Song: Morning Raag Bhairav',
      description: 'Listens softly with tea around 7:30 AM',
      status: 'new',
      image_url: null,
      created_at: '2024-03-01T15:20:00.000Z',
    },
  ];
}

export function getDemoAIInsights() {
  return [
    {
      id: 'insight-1',
      type: 'observation',
      title: 'Visual Memory Consistency',
      message: 'Visual-memory activities have been consistently stronger than sequence recall (82% vs 68%).',
      category: 'strength',
    },
    {
      id: 'insight-2',
      type: 'trend',
      title: 'Routine Recall Variation',
      message: 'Routine recall has been lower than the patient’s recent baseline (59% vs 72% average).',
      category: 'support_needed',
    },
    {
      id: 'insight-3',
      type: 'engagement',
      title: 'Higher Activity Completion',
      message: 'Activity completion was higher this week, achieving 6 of 7 planned daily sessions.',
      category: 'positive',
    },
  ];
}

export interface DemoGameSession {
  id: string;
  patient_id: string;
  game_name: string;
  game_type?: string;
  difficulty_level: number;
  accuracy: number;
  avg_response_time_ms: number;
  duration_seconds: number;
  mistakes: number;
  completed: boolean;
  played_at: string;
  started_at?: string;
  completed_at?: string;
}

function createSeededDemoSessions(): DemoGameSession[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (currentDay + 6) % 7; // days since Monday of current week

  const mondayCurrentWeek = new Date(now);
  mondayCurrentWeek.setDate(now.getDate() - distanceToMonday);
  mondayCurrentWeek.setHours(10, 0, 0, 0);

  const prevWeekMonday = new Date(mondayCurrentWeek);
  prevWeekMonday.setDate(mondayCurrentWeek.getDate() - 7);

  // Today's 3 sessions (15m + 15m + 12m = 42 minutes total)
  const today1 = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
  const today2 = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const today3 = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  // Current week earlier sessions:
  const getEarlierDayInWeek = (dayOffset: number, hours: number) => {
    const d = new Date(mondayCurrentWeek);
    d.setDate(mondayCurrentWeek.getDate() + Math.min(dayOffset, Math.max(0, distanceToMonday - 1)));
    d.setHours(hours, 30, 0, 0);
    if (d.getTime() >= now.getTime()) {
      return new Date(now.getTime() - (hours + 5) * 60 * 60 * 1000).toISOString();
    }
    return d.toISOString();
  };

  // Previous week sessions:
  const getPrevWeekDay = (dayOffset: number, hours: number) => {
    const d = new Date(prevWeekMonday);
    d.setDate(prevWeekMonday.getDate() + dayOffset);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString();
  };

  return [
    // Today's 3 sessions (Total duration: 900 + 900 + 720 = 2520s = 42 min)
    {
      id: 'demo-session-today-1',
      patient_id: 'demo-patient-1',
      game_name: 'Remember the Objects',
      difficulty_level: 2,
      accuracy: 0.85, // 85%
      avg_response_time_ms: 2100,
      duration_seconds: 900, // 15 min
      mistakes: 1,
      completed: true,
      played_at: today1,
    },
    {
      id: 'demo-session-today-2',
      patient_id: 'demo-patient-1',
      game_name: 'Sequence Recall',
      difficulty_level: 2,
      accuracy: 0.80, // 80%
      avg_response_time_ms: 2400,
      duration_seconds: 900, // 15 min
      mistakes: 1,
      completed: true,
      played_at: today2,
    },
    {
      id: 'demo-session-today-3',
      patient_id: 'demo-patient-1',
      game_name: 'Find the Pair',
      difficulty_level: 2,
      accuracy: 0.88, // 88%
      avg_response_time_ms: 1800,
      duration_seconds: 720, // 12 min
      mistakes: 0,
      completed: true,
      played_at: today3,
    },
    // Current week earlier sessions:
    // (85 + 80 + 88 + 62 + 59 + 70) / 6 = 444 / 6 = 74.0%
    {
      id: 'demo-session-cw-4',
      patient_id: 'demo-patient-1',
      game_name: 'Story Recall',
      difficulty_level: 2,
      accuracy: 0.62, // 62%
      avg_response_time_ms: 2300,
      duration_seconds: 600,
      mistakes: 2,
      completed: true,
      played_at: getEarlierDayInWeek(0, 10), // Monday
    },
    {
      id: 'demo-session-cw-5',
      patient_id: 'demo-patient-1',
      game_name: 'Daily Routine Recall',
      difficulty_level: 2,
      accuracy: 0.59, // 59%
      avg_response_time_ms: 2600,
      duration_seconds: 600,
      mistakes: 3,
      completed: true,
      played_at: getEarlierDayInWeek(1, 11), // Tuesday
    },
    {
      id: 'demo-session-cw-6',
      patient_id: 'demo-patient-1',
      game_name: 'What Changed?',
      difficulty_level: 2,
      accuracy: 0.70, // 70%
      avg_response_time_ms: 2000,
      duration_seconds: 600,
      mistakes: 1,
      completed: true,
      played_at: getEarlierDayInWeek(2, 14), // Wednesday
    },
    // Previous week 5 sessions:
    // (76 + 62 + 75 + 60 + 67) / 5 = 340 / 5 = 68.0%
    {
      id: 'demo-session-pw-1',
      patient_id: 'demo-patient-1',
      game_name: 'Remember the Objects',
      difficulty_level: 2,
      accuracy: 0.76,
      avg_response_time_ms: 2200,
      duration_seconds: 600,
      mistakes: 2,
      completed: true,
      played_at: getPrevWeekDay(1, 10),
    },
    {
      id: 'demo-session-pw-2',
      patient_id: 'demo-patient-1',
      game_name: 'Sequence Recall',
      difficulty_level: 2,
      accuracy: 0.62,
      avg_response_time_ms: 2500,
      duration_seconds: 600,
      mistakes: 3,
      completed: true,
      played_at: getPrevWeekDay(2, 11),
    },
    {
      id: 'demo-session-pw-3',
      patient_id: 'demo-patient-1',
      game_name: 'Find the Pair',
      difficulty_level: 2,
      accuracy: 0.75,
      avg_response_time_ms: 1900,
      duration_seconds: 600,
      mistakes: 1,
      completed: true,
      played_at: getPrevWeekDay(3, 14),
    },
    {
      id: 'demo-session-pw-4',
      patient_id: 'demo-patient-1',
      game_name: 'Story Recall',
      difficulty_level: 2,
      accuracy: 0.60,
      avg_response_time_ms: 2400,
      duration_seconds: 600,
      mistakes: 2,
      completed: true,
      played_at: getPrevWeekDay(4, 15),
    },
    {
      id: 'demo-session-pw-5',
      patient_id: 'demo-patient-1',
      game_name: 'Daily Routine Recall',
      difficulty_level: 2,
      accuracy: 0.67,
      avg_response_time_ms: 2300,
      duration_seconds: 600,
      mistakes: 2,
      completed: true,
      played_at: getPrevWeekDay(5, 10),
    },
  ];
}

const INITIAL_DEMO_SESSIONS: DemoGameSession[] = createSeededDemoSessions();

// =========================================================================
// REAL-TIME PERSISTENT STORE FOR DEMO MODE (.demo-state.json)
// =========================================================================
const STORAGE_FILE = '.demo-state.json';

interface PersistedDemoState {
  caregiver?: typeof dynamicDemoCaregiver;
  patients: DemoPatient[];
  routines: DemoRoutine[];
  reminders: DemoReminder[];
  memories: DemoMemory[];
  sessions: DemoGameSession[];
}

function loadStateFromDisk(): PersistedDemoState | null {
  try {
    const filePath = path.join(process.cwd(), STORAGE_FILE);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // safe fallback if file cannot be read
  }
  return null;
}

function saveStateToDisk(state: PersistedDemoState): void {
  try {
    const filePath = path.join(process.cwd(), STORAGE_FILE);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // safe fallback if file cannot be written
  }
}

const persisted = loadStateFromDisk();

if (persisted?.caregiver) {
  dynamicDemoCaregiver = { ...dynamicDemoCaregiver, ...persisted.caregiver };
}

let dynamicDemoPatients: DemoPatient[] = persisted?.patients && persisted.patients.length > 0
  ? persisted.patients
  : [...INITIAL_DEMO_PATIENTS];

let dynamicDemoRoutines: DemoRoutine[] = persisted?.routines && persisted.routines.length > 0
  ? persisted.routines
  : [...INITIAL_DEMO_ROUTINES];

let dynamicDemoReminders: DemoReminder[] = persisted?.reminders && persisted.reminders.length > 0
  ? persisted.reminders
  : getInitialDemoReminders();

let dynamicDemoMemories: DemoMemory[] = persisted?.memories && persisted.memories.length > 0
  ? persisted.memories
  : getInitialDemoMemories();

let dynamicDemoSessions: DemoGameSession[] = persisted?.sessions && persisted.sessions.length > 0
  ? persisted.sessions
  : [...INITIAL_DEMO_SESSIONS];

function syncState(): void {
  saveStateToDisk({
    caregiver: dynamicDemoCaregiver,
    patients: dynamicDemoPatients,
    routines: dynamicDemoRoutines,
    reminders: dynamicDemoReminders,
    memories: dynamicDemoMemories,
    sessions: dynamicDemoSessions,
  });
}

// Ensure initial disk file is generated if not present
if (!persisted && typeof window === 'undefined') {
  syncState();
}

// -------------------------------------------------------------------------
// Patient Accessors & Mutations
// -------------------------------------------------------------------------
export function getDemoPatients(): DemoPatient[] {
  return dynamicDemoPatients;
}

export function getDemoPatient(patientId?: string): DemoPatient {
  if (patientId) {
    const found = dynamicDemoPatients.find((p) => p.id === patientId);
    if (found) return found;
  }
  return dynamicDemoPatients[0] || INITIAL_DEMO_PATIENTS[0];
}

export function addDemoPatient(patient: DemoPatient): void {
  dynamicDemoPatients.unshift(patient);
  syncState();
}

export function updateDemoPatientPasscode(patientId: string, newPin: string): void {
  const patient = dynamicDemoPatients.find((p) => p.id === patientId);
  if (patient) {
    patient.pin = newPin;
    syncState();
  }
}

export function updateDemoPatientActive(patientId: string, isActive: boolean): void {
  const patient = dynamicDemoPatients.find((p) => p.id === patientId);
  if (patient) {
    patient.is_active = isActive;
    syncState();
  }
}

export function updateDemoPatientRelationship(patientId: string, rel: CaregiverRelationship): void {
  const patient = dynamicDemoPatients.find((p) => p.id === patientId);
  if (patient) {
    patient.relationship = rel;
    syncState();
  }
}

export function updateDemoPatientPreferences(patientId: string, prefs: Partial<DemoPatient>): void {
  const patient = dynamicDemoPatients.find((p) => p.id === patientId);
  if (patient) {
    Object.assign(patient, prefs);
    syncState();
  }
}

// -------------------------------------------------------------------------
// Routine Accessors & Mutations
// -------------------------------------------------------------------------
export function getDemoRoutines(patientId: string = 'demo-patient-1', onlyEnabled: boolean = false): DemoRoutine[] {
  let list = dynamicDemoRoutines.filter((r) => r.patient_id === patientId);
  if (onlyEnabled) {
    list = list.filter((r) => r.is_enabled !== false);
  }
  return [...list].sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));
}

export function addDemoRoutine(routine: DemoRoutine): void {
  dynamicDemoRoutines.push(routine);
  syncState();
}

export function updateDemoRoutine(routineId: string, updates: Partial<DemoRoutine>): boolean {
  const item = dynamicDemoRoutines.find((r) => r.id === routineId);
  if (item) {
    Object.assign(item, updates);
    syncState();
    return true;
  }
  return false;
}

export function toggleDemoRoutine(routineId: string, isEnabled: boolean): boolean {
  const item = dynamicDemoRoutines.find((r) => r.id === routineId);
  if (item) {
    item.is_enabled = isEnabled;
    syncState();
    return true;
  }
  return false;
}

export function deleteDemoRoutine(routineId: string): boolean {
  const idx = dynamicDemoRoutines.findIndex((r) => r.id === routineId);
  if (idx !== -1) {
    dynamicDemoRoutines.splice(idx, 1);
    syncState();
    return true;
  }
  return false;
}

// -------------------------------------------------------------------------
// Reminder Accessors & Mutations
// -------------------------------------------------------------------------
export function getDemoReminders(patientId: string = 'demo-patient-1'): DemoReminder[] {
  return dynamicDemoReminders.filter((r) => r.patient_id === patientId);
}

export function addDemoReminder(reminder: DemoReminder): void {
  dynamicDemoReminders.push(reminder);
  syncState();
}

export function updateDemoReminder(reminderId: string, updates: Partial<DemoReminder>): boolean {
  const item = dynamicDemoReminders.find((r) => r.id === reminderId);
  if (item) {
    Object.assign(item, updates);
    syncState();
    return true;
  }
  return false;
}

export function updateDemoReminderStatus(reminderId: string, newStatus: ReminderStatus): boolean {
  const item = dynamicDemoReminders.find((r) => r.id === reminderId);
  if (item) {
    item.status = newStatus;
    item.is_done = newStatus === 'acknowledged';
    item.acknowledged_at = newStatus === 'acknowledged' ? new Date().toISOString() : null;
    syncState();
    return true;
  }
  return false;
}

export function toggleDemoReminder(reminderId: string, newStatus: boolean): boolean {
  return updateDemoReminderStatus(reminderId, newStatus ? 'acknowledged' : 'postponed');
}

export function deleteDemoReminder(reminderId: string): boolean {
  const idx = dynamicDemoReminders.findIndex((r) => r.id === reminderId);
  if (idx !== -1) {
    dynamicDemoReminders.splice(idx, 1);
    syncState();
    return true;
  }
  return false;
}

// -------------------------------------------------------------------------
// Memory Bank Accessors & Mutations
// -------------------------------------------------------------------------
export function getDemoMemories(patientId: string = 'demo-patient-1'): DemoMemory[] {
  return dynamicDemoMemories.filter((m) => m.patient_id === patientId);
}

export function addDemoMemory(memory: DemoMemory): void {
  dynamicDemoMemories.push(memory);
  syncState();
}

export function updateDemoMemory(memoryId: string, updates: Partial<DemoMemory>): boolean {
  const item = dynamicDemoMemories.find((m) => m.id === memoryId);
  if (item) {
    Object.assign(item, updates);
    syncState();
    return true;
  }
  return false;
}

export function updateDemoMemoryStatus(memoryId: string, newStatus: MemoryStatus): boolean {
  const item = dynamicDemoMemories.find((m) => m.id === memoryId);
  if (item) {
    item.status = newStatus;
    syncState();
    return true;
  }
  return false;
}

export function deleteDemoMemory(memoryId: string): boolean {
  const idx = dynamicDemoMemories.findIndex((m) => m.id === memoryId);
  if (idx !== -1) {
    dynamicDemoMemories.splice(idx, 1);
    syncState();
    return true;
  }
  return false;
}

// -------------------------------------------------------------------------
// Game Session Accessors & Mutations
// -------------------------------------------------------------------------
export function getDemoGameSessions(patientId?: string): DemoGameSession[] {
  if (!patientId) return dynamicDemoSessions;
  return dynamicDemoSessions.filter((s) => s.patient_id === patientId);
}

export function addDemoGameSession(session: DemoGameSession): void {
  dynamicDemoSessions.unshift(session);
  syncState();
}

// -------------------------------------------------------------------------
// Reseed / Reset Helper
// -------------------------------------------------------------------------
export function resetDemoState(): void {
  dynamicDemoCaregiver = {
    id: 'demo-caregiver-1',
    name: 'Rahul Sharma',
    email: DEMO_CAREGIVER_EMAIL,
    preferred_language: 'en',
  };
  dynamicDemoPatients = [...INITIAL_DEMO_PATIENTS];
  dynamicDemoRoutines = [...INITIAL_DEMO_ROUTINES];
  dynamicDemoReminders = getInitialDemoReminders();
  dynamicDemoMemories = getInitialDemoMemories();
  dynamicDemoSessions = createSeededDemoSessions();
  syncState();
}

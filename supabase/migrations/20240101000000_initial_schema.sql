-- ==============================================================================
-- CogniCare Initial Database Schema Migration
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- Custom ENUM Types
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE memory_category AS ENUM ('person', 'place', 'routine');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reminder_type AS ENUM ('recurring', 'one_time');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE game_category AS ENUM ('core', 'personalized');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 1. Caregivers Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caregivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Patients Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    patient_code VARCHAR(6) UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. Memory Bank Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    category memory_category NOT NULL,
    key_term TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. Reminders Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type reminder_type NOT NULL,
    title TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    recurrence_rule TEXT,
    is_done BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. Games Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category game_category NOT NULL,
    base_difficulty INT NOT NULL DEFAULT 1
);

-- ------------------------------------------------------------------------------
-- 6. Game Sessions Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    difficulty_level INT NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    avg_response_time_ms INT NOT NULL,
    mistakes INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    played_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. Weekly Reports Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    summary_text TEXT,
    metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Indexes for Foreign Keys & Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_caregiver_id ON patients(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_memory_bank_patient_id ON memory_bank(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_patient_id ON game_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_patient_id ON weekly_reports(patient_id);

-- ------------------------------------------------------------------------------
-- Seed Data: Initial 7 Games
-- ------------------------------------------------------------------------------
INSERT INTO games (name, category, base_difficulty)
VALUES
    ('Remember the Objects', 'core', 1),
    ('Sequence Recall', 'core', 1),
    ('Find the Pair', 'core', 1),
    ('What Changed?', 'core', 1),
    ('Story Recall', 'personalized', 1),
    ('Daily Routine Recall', 'personalized', 1),
    ('Who/Where/When?', 'personalized', 1)
ON CONFLICT (name) DO UPDATE 
SET 
    category = EXCLUDED.category,
    base_difficulty = EXCLUDED.base_difficulty;

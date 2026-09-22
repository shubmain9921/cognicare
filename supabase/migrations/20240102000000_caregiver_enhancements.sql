-- ==============================================================================
-- CogniCare Caregiver Responsibilities & Features Schema Migration
-- ==============================================================================

-- 1. Extend Patients Table with demographic and personalized preferences
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'UTC';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT true;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS text_size TEXT DEFAULT 'medium';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS daily_target_activities INT DEFAULT 3;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS session_duration_minutes INT DEFAULT 10;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_activity_time TEXT DEFAULT 'morning';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_activity_types TEXT[] DEFAULT ARRAY['memory', 'sequence', 'routine'];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- 2. Caregiver-Patient Relationships (Multi-Caregiver / Multi-Patient)
CREATE TABLE IF NOT EXISTS caregiver_patient_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'caregiver', -- 'son', 'daughter', 'spouse', 'professional', 'other'
    is_primary BOOLEAN NOT NULL DEFAULT false,
    can_manage_access BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(caregiver_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_relationships_caregiver_id ON caregiver_patient_relationships(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_relationships_patient_id ON caregiver_patient_relationships(patient_id);

-- 3. Daily Routines Table (powers "My Day" and "Daily Routine Recall")
CREATE TABLE IF NOT EXISTS daily_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    time_of_day TIME NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    days_of_week TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri','sat','sun'],
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_daily_routines_patient_id ON daily_routines(patient_id);

-- 4. Extend Memory Bank with Lifecycle Progression & Multimedia
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'; -- 'new', 'introduced', 'practiced', 'recall_observed'
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 5. Extend Reminders with Voice, Memory Prompt & Adherence Lifecycle
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT true;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS memory_prompt_enabled BOOLEAN DEFAULT false;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'; -- 'scheduled', 'delivered', 'acknowledged', 'postponed', 'missed'
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

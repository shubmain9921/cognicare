'use server';

import { createClient } from '@/lib/supabase/server';
import { setPatientSession, clearPatientSession, getPatientSession } from '@/lib/patient-session';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  isDemoMode,
  DEMO_PATIENT_CODE,
  DEMO_PATIENT_PIN,
  getDemoPatient,
  getDemoPatients,
  addDemoPatient,
  updateDemoPatientPasscode,
  updateDemoPatientActive,
  updateDemoPatientRelationship,
  updateDemoPatientPreferences,
  DemoPatient,
} from '@/lib/demo-mode';
import { CaregiverRelationship } from '@/types/database.types';

export interface CreatePatientResult {
  error?: string;
  success?: boolean;
  patient?: {
    id: string;
    name: string;
    patient_code: string;
    pin: string;
    preferred_language: string;
    relationship?: string;
  };
}

export interface PatientLoginResult {
  error?: string;
  success?: boolean;
}

export interface StandardActionResult {
  error?: string;
  success?: boolean;
  message?: string;
  data?: any;
}

/**
 * Generates an alphanumeric Patient ID in format 'K7M4-82P' or 'MC-4827'
 */
function generatePatientCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  let part2 = '';
  for (let i = 0; i < 3; i++) {
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${part1}-${part2}`;
}

/**
 * Generates a 6-digit numeric Passcode e.g. 583921
 */
function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a new patient record by the authenticated caregiver
 */
export async function createPatient(
  _prevState: CreatePatientResult | null,
  formData: FormData
): Promise<CreatePatientResult> {
  const name = (formData.get('name') as string) || '';
  const dateOfBirth = (formData.get('date_of_birth') as string) || null;
  const gender = (formData.get('gender') as string) || null;
  const preferredLanguage = (formData.get('preferred_language') as string) || 'en';
  const timeZone = (formData.get('time_zone') as string) || 'Asia/Kolkata';
  const textSize = (formData.get('text_size') as string) || 'medium';
  const voiceEnabled = formData.get('voice_enabled') === 'on' || formData.get('voice_enabled') === 'true';
  const relationship = (formData.get('relationship') as CaregiverRelationship) || 'other';

  if (!name || name.trim().length === 0) {
    return { error: 'Patient name is required.' };
  }

  const patientCode = generatePatientCode();
  const plainPasscode = generatePasscode();

  if (isDemoMode()) {
    const newDemoPatient: DemoPatient = {
      id: `demo-patient-${Date.now()}`,
      caregiver_id: 'demo-caregiver-1',
      name: name.trim(),
      patient_code: patientCode,
      pin: plainPasscode,
      preferred_language: preferredLanguage,
      date_of_birth: dateOfBirth || '1955-01-01',
      gender: gender || 'Prefer not to say',
      time_zone: timeZone,
      is_active: true,
      voice_enabled: voiceEnabled,
      text_size: textSize,
      daily_target_activities: 3,
      session_duration_minutes: 10,
      preferred_activity_time: 'morning',
      preferred_activity_types: ['memory', 'routine'],
      relationship: relationship,
      is_primary: true,
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    addDemoPatient(newDemoPatient);
    revalidatePath('/caregiver/dashboard');

    return {
      success: true,
      patient: {
        id: newDemoPatient.id,
        name: newDemoPatient.name,
        patient_code: newDemoPatient.patient_code,
        pin: plainPasscode,
        preferred_language: newDemoPatient.preferred_language,
        relationship: newDemoPatient.relationship,
      },
    };
  }

  const supabase = createClient();
  const {
    data: { user: caregiverUser },
  } = await supabase.auth.getUser();

  if (!caregiverUser) {
    return { error: 'You must be logged in as a caregiver to create a patient.' };
  }

  const pinHash = await bcrypt.hash(plainPasscode, 10);

  const { data: newPatient, error: insertError } = await supabase
    .from('patients')
    .insert({
      caregiver_id: caregiverUser.id,
      name: name.trim(),
      patient_code: patientCode,
      pin_hash: pinHash,
      preferred_language: preferredLanguage,
      date_of_birth: dateOfBirth,
      gender,
      time_zone: timeZone,
      text_size: textSize,
      voice_enabled: voiceEnabled,
      is_active: true,
      daily_target_activities: 3,
      session_duration_minutes: 10,
      preferred_activity_time: 'morning',
    })
    .select('id, name, patient_code, preferred_language')
    .single();

  if (insertError || !newPatient) {
    return { error: insertError?.message || 'Failed to create patient record.' };
  }

  // Also record relationship
  await supabase.from('caregiver_patient_relationships').insert({
    caregiver_id: caregiverUser.id,
    patient_id: newPatient.id,
    relationship_type: relationship,
    is_primary: true,
    can_manage_access: true,
  });

  revalidatePath('/caregiver/dashboard');

  return {
    success: true,
    patient: {
      id: newPatient.id,
      name: newPatient.name,
      patient_code: newPatient.patient_code,
      pin: plainPasscode,
      preferred_language: newPatient.preferred_language,
      relationship,
    },
  };
}

/**
 * Reset patient passcode (generates a fresh 6-digit passcode)
 */
export async function resetPatientPasscode(patientId: string): Promise<StandardActionResult> {
  const newPasscode = generatePasscode();

  if (isDemoMode()) {
    updateDemoPatientPasscode(patientId, newPasscode);
    revalidatePath('/caregiver/dashboard');
    return {
      success: true,
      message: `Passcode successfully reset to ${newPasscode}. Please share this with the patient.`,
      data: { passcode: newPasscode },
    };
  }

  const supabase = createClient();
  const pinHash = await bcrypt.hash(newPasscode, 10);

  const { error } = await supabase
    .from('patients')
    .update({ pin_hash: pinHash })
    .eq('id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  return {
    success: true,
    message: `Passcode successfully reset to ${newPasscode}.`,
    data: { passcode: newPasscode },
  };
}

/**
 * Toggle patient active status (temporarily disable / reactivate)
 */
export async function togglePatientActiveStatus(
  patientId: string,
  isActive: boolean
): Promise<StandardActionResult> {
  if (isDemoMode()) {
    updateDemoPatientActive(patientId, isActive);
    revalidatePath('/caregiver/dashboard');
    return {
      success: true,
      message: `Patient account ${isActive ? 'reactivated' : 'temporarily paused'}.`,
    };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('patients')
    .update({ is_active: isActive })
    .eq('id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  return {
    success: true,
    message: `Patient account ${isActive ? 'reactivated' : 'temporarily paused'}.`,
  };
}

/**
 * Update patient preferences & accessibility
 */
export async function updatePatientPreferences(
  patientId: string,
  formData: FormData
): Promise<StandardActionResult> {
  const preferredLanguage = formData.get('preferred_language') as string;
  const textSize = formData.get('text_size') as string;
  const voiceEnabled = formData.get('voice_enabled') === 'on' || formData.get('voice_enabled') === 'true';
  const dailyTarget = parseInt(formData.get('daily_target_activities') as string, 10) || 3;
  const sessionDuration = parseInt(formData.get('session_duration_minutes') as string, 10) || 10;
  const preferredTime = (formData.get('preferred_activity_time') as string) || 'morning';

  if (isDemoMode()) {
    updateDemoPatientPreferences(patientId, {
      preferred_language: preferredLanguage,
      text_size: textSize,
      voice_enabled: voiceEnabled,
      daily_target_activities: dailyTarget,
      session_duration_minutes: sessionDuration,
      preferred_activity_time: preferredTime,
    });
    revalidatePath('/caregiver/dashboard');
    return { success: true, message: 'Patient preferences successfully updated.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('patients')
    .update({
      preferred_language: preferredLanguage,
      text_size: textSize,
      voice_enabled: voiceEnabled,
      daily_target_activities: dailyTarget,
      session_duration_minutes: sessionDuration,
      preferred_activity_time: preferredTime,
    })
    .eq('id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  return { success: true, message: 'Patient preferences updated successfully.' };
}

/**
 * Update patient preferred language directly from language switcher or patient settings
 */
export async function updatePatientLanguage(
  language: string
): Promise<StandardActionResult> {
  const preferredLanguage = (language || 'en').toLowerCase();
  const session = await getPatientSession();

  if (!session) {
    return { error: 'Unauthorized: No active patient session.' };
  }

  if (isDemoMode()) {
    updateDemoPatientPreferences(session.id, {
      preferred_language: preferredLanguage,
    });
    await setPatientSession({
      ...session,
      preferred_language: preferredLanguage,
    });
    revalidatePath('/patient/home');
    revalidatePath('/patient/games');
    revalidatePath('/patient/my-day');
    revalidatePath('/patient/my-memories');
    revalidatePath('/patient/progress');
    revalidatePath('/patient/help');
    return { success: true, message: `Language updated to ${preferredLanguage}.` };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('patients')
    .update({ preferred_language: preferredLanguage })
    .eq('id', session.id);

  if (error) {
    return { error: error.message };
  }

  await setPatientSession({
    ...session,
    preferred_language: preferredLanguage,
  });

  revalidatePath('/patient/home');
  revalidatePath('/patient/games');
  revalidatePath('/patient/my-day');
  revalidatePath('/patient/my-memories');
  revalidatePath('/patient/progress');
  revalidatePath('/patient/help');
  return { success: true, message: `Language updated to ${preferredLanguage}.` };
}

/**
 * Update caregiver-patient relationship
 */
export async function updatePatientRelationship(
  patientId: string,
  relationshipType: CaregiverRelationship
): Promise<StandardActionResult> {
  if (isDemoMode()) {
    updateDemoPatientRelationship(patientId, relationshipType);
    revalidatePath('/caregiver/dashboard');
    return { success: true, message: `Relationship updated to ${relationshipType}.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('caregiver_patient_relationships')
    .upsert({
      caregiver_id: user.id,
      patient_id: patientId,
      relationship_type: relationshipType,
    });

  if (error) return { error: error.message };

  revalidatePath('/caregiver/dashboard');
  return { success: true, message: 'Relationship updated.' };
}

/**
 * Verify patient login with patient code and PIN, then issue session cookie
 */
export async function patientLogin(
  _prevState: PatientLoginResult | null,
  formData: FormData
): Promise<PatientLoginResult> {
  const rawCode = ((formData.get('patient_code') as string) || '').trim().toUpperCase();
  const rawPin = ((formData.get('pin') as string) || '').trim();

  // 1. Validate empty inputs: "Please enter your Patient ID and passcode."
  if (!rawCode || !rawPin) {
    return { error: 'Please enter your Patient ID and passcode.' };
  }

  const normalizedCode = rawCode.replace(/[\s-]/g, '');

  if (isDemoMode()) {
    const demoPatients = getDemoPatients();

    // Check matching against DEMO-001, K7M4-82P, MC-4827 or dynamic demo code
    const isDemoIdMatch = (pCode: string) => {
      const normP = pCode.replace(/[\s-]/g, '');
      return (
        normP === normalizedCode ||
        (normalizedCode === 'DEMO001' && pCode === DEMO_PATIENT_CODE) ||
        (normalizedCode === 'MC4827' && pCode === DEMO_PATIENT_CODE)
      );
    };

    const isDemoPinMatch = (pPin: string) => {
      return (
        rawPin === pPin ||
        rawPin === '202626' ||
        rawPin === '583921' ||
        rawPin === '1234' ||
        rawPin === DEMO_PATIENT_PIN
      );
    };

    const matched = demoPatients.find((p) => isDemoIdMatch(p.patient_code) && isDemoPinMatch(p.pin));

    if (!matched && normalizedCode !== 'DEMO001' && normalizedCode !== 'MC4827' && normalizedCode !== DEMO_PATIENT_CODE.replace(/[\s-]/g, '')) {
      return { error: "Those details don't match. Please check your Patient ID and passcode or ask your caregiver." };
    }

    const patient = matched || getDemoPatient();

    if (patient.is_active === false) {
      return { error: 'Your account is currently unavailable. Please contact your caregiver.' };
    }

    await setPatientSession({
      id: patient.id,
      caregiver_id: patient.caregiver_id,
      name: patient.name,
      patient_code: patient.patient_code,
      preferred_language: patient.preferred_language,
    });

    redirect('/patient/dashboard');
  }

  try {
    const supabase = createClient();

    // Query patient by code (or stripped format)
    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, caregiver_id, name, patient_code, pin_hash, preferred_language, is_active')
      .or(`patient_code.eq.${rawCode},patient_code.eq.${normalizedCode}`)
      .maybeSingle();

    if (error || !patient) {
      return { error: "Those details don't match. Please check your Patient ID and passcode or ask your caregiver." };
    }

    if (patient.is_active === false) {
      return { error: 'Your account is currently unavailable. Please contact your caregiver.' };
    }

    const isPinValid = await bcrypt.compare(rawPin, patient.pin_hash);
    if (!isPinValid) {
      return { error: "Those details don't match. Please check your Patient ID and passcode or ask your caregiver." };
    }

    // Update last_active_at
    await supabase
      .from('patients')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', patient.id);

    // Create lightweight session
    await setPatientSession({
      id: patient.id,
      caregiver_id: patient.caregiver_id,
      name: patient.name,
      patient_code: patient.patient_code,
      preferred_language: patient.preferred_language,
    });

    redirect('/patient/dashboard');
  } catch (err: any) {
    if (err.digest?.startsWith('NEXT_REDIRECT')) {
      throw err; // Allow Next.js redirect to pass through
    }
    console.error('Patient login error:', err);
    return { error: "We couldn't sign you in right now. Please try again." };
  }
}

/**
 * Logout patient by destroying session cookie
 */
export async function patientLogout() {
  await clearPatientSession();
  redirect('/patient/login');
}

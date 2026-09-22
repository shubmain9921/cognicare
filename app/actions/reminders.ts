'use server';

import { createClient } from '@/lib/supabase/server';
import { getPatientSession } from '@/lib/patient-session';
import { ReminderType, ReminderStatus } from '@/types/database.types';
import { revalidatePath } from 'next/cache';
import {
  isDemoMode,
  addDemoReminder,
  updateDemoReminder,
  updateDemoReminderStatus,
  toggleDemoReminder,
  deleteDemoReminder,
} from '@/lib/demo-mode';

export interface ReminderActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * Add a new reminder for a patient with voice, notification, and memory-support options
 */
export async function addReminder(
  _prevState: ReminderActionResult | null,
  formData: FormData
): Promise<ReminderActionResult> {
  const patientId = formData.get('patient_id') as string;
  const type = formData.get('type') as ReminderType;
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const scheduledTimeStr = formData.get('scheduled_time') as string;
  const recurrenceRule = (formData.get('recurrence_rule') as string)?.trim() || null;
  const voiceEnabled = formData.get('voice_enabled') === 'on' || formData.get('voice_enabled') === 'true';
  const notificationEnabled = formData.get('notification_enabled') === 'on' || formData.get('notification_enabled') === 'true';
  const memoryPromptEnabled = formData.get('memory_prompt_enabled') === 'on' || formData.get('memory_prompt_enabled') === 'true';

  if (!patientId || !type || !title || !scheduledTimeStr) {
    return { error: 'Patient, type, title, and scheduled time are required.' };
  }

  const scheduledTime = new Date(scheduledTimeStr).toISOString();

  if (isDemoMode()) {
    addDemoReminder({
      id: `demo-rem-${Date.now()}`,
      patient_id: patientId,
      type,
      title,
      description: description || '',
      scheduled_time: scheduledTime,
      recurrence_rule: type === 'recurring' ? (recurrenceRule || 'Daily') : null,
      is_done: false,
      voice_enabled: voiceEnabled,
      notification_enabled: notificationEnabled,
      memory_prompt_enabled: memoryPromptEnabled,
      status: 'scheduled',
      acknowledged_at: null,
      created_at: new Date().toISOString(),
    });
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/home');
    return { success: true, message: `Reminder "${title}" created successfully.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase.from('reminders').insert({
    patient_id: patientId,
    type,
    title,
    description,
    scheduled_time: scheduledTime,
    recurrence_rule: type === 'recurring' ? (recurrenceRule || 'daily') : null,
    is_done: false,
    voice_enabled: voiceEnabled,
    notification_enabled: notificationEnabled,
    memory_prompt_enabled: memoryPromptEnabled,
    status: 'scheduled',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/home');
  return { success: true, message: `Reminder "${title}" created.` };
}

/**
 * Update an existing reminder
 */
export async function updateReminder(
  _prevState: ReminderActionResult | null,
  formData: FormData
): Promise<ReminderActionResult> {
  const id = formData.get('id') as string;
  const patientId = formData.get('patient_id') as string;
  const type = formData.get('type') as ReminderType;
  const title = (formData.get('title') as string)?.trim();
  const scheduledTimeStr = formData.get('scheduled_time') as string;
  const recurrenceRule = (formData.get('recurrence_rule') as string)?.trim() || null;
  const isDone = formData.get('is_done') === 'true';

  if (!id || !patientId || !type || !title || !scheduledTimeStr) {
    return { error: 'All fields are required.' };
  }

  const scheduledTime = new Date(scheduledTimeStr).toISOString();

  if (isDemoMode()) {
    updateDemoReminder(id, {
      type,
      title,
      scheduled_time: scheduledTime,
      recurrence_rule: type === 'recurring' ? (recurrenceRule || 'Daily') : null,
      is_done: isDone,
      status: isDone ? 'acknowledged' : 'scheduled',
      acknowledged_at: isDone ? new Date().toISOString() : null,
    });
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/home');
    return { success: true, message: 'Reminder updated.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('reminders')
    .update({
      type,
      title,
      scheduled_time: scheduledTime,
      recurrence_rule: type === 'recurring' ? (recurrenceRule || 'daily') : null,
      is_done: isDone,
    })
    .eq('id', id)
    .eq('patient_id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/home');
  return { success: true, message: 'Reminder updated.' };
}

/**
 * Toggle reminder done status (Caregiver)
 */
export async function toggleReminderCaregiver(
  id: string,
  patientId: string,
  newStatus: boolean
): Promise<ReminderActionResult> {
  if (isDemoMode()) {
    toggleDemoReminder(id, newStatus);
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/home');
    return { success: true };
  }

  const supabase = createClient();
  const status: ReminderStatus = newStatus ? 'acknowledged' : 'postponed';

  const { error } = await supabase
    .from('reminders')
    .update({
      is_done: newStatus,
      status: status,
      acknowledged_at: newStatus ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('patient_id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/home');
  return { success: true };
}

/**
 * Update reminder adherence status (Caregiver / Patient interaction)
 */
export async function updateReminderStatus(
  id: string,
  patientId: string,
  newStatus: ReminderStatus
): Promise<ReminderActionResult> {
  if (isDemoMode()) {
    updateDemoReminderStatus(id, newStatus);
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/home');
    return { success: true, message: `Reminder marked as ${newStatus}.` };
  }

  const supabase = createClient();
  const isDone = newStatus === 'acknowledged';
  const acknowledgedAt = isDone ? new Date().toISOString() : null;

  const { error } = await supabase
    .from('reminders')
    .update({
      status: newStatus,
      is_done: isDone,
      acknowledged_at: acknowledgedAt,
    })
    .eq('id', id)
    .eq('patient_id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/home');
  return { success: true, message: `Reminder marked as ${newStatus}.` };
}

/**
 * Delete a reminder (Caregiver)
 */
export async function deleteReminder(id: string, patientId: string): Promise<ReminderActionResult> {
  if (isDemoMode()) {
    deleteDemoReminder(id);
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/home');
    return { success: true, message: 'Reminder deleted.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('patient_id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/home');
  return { success: true, message: 'Reminder deleted.' };
}

/**
 * Toggle reminder done status (Patient Home)
 */
export async function toggleReminderPatient(
  reminderId: string,
  newStatus: boolean
): Promise<ReminderActionResult> {
  const session = await getPatientSession();

  if (!session) {
    return { error: 'Unauthorized. Please login again.' };
  }

  if (isDemoMode()) {
    toggleDemoReminder(reminderId, newStatus);
    revalidatePath('/patient/home');
    revalidatePath('/caregiver/dashboard');
    return { success: true };
  }

  const supabase = createClient();
  const status: ReminderStatus = newStatus ? 'acknowledged' : 'postponed';

  const { error } = await supabase
    .from('reminders')
    .update({
      is_done: newStatus,
      status: status,
      acknowledged_at: newStatus ? new Date().toISOString() : null,
    })
    .eq('id', reminderId)
    .eq('patient_id', session.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/patient/home');
  revalidatePath('/caregiver/dashboard');
  return { success: true };
}

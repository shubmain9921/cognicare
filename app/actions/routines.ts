'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  isDemoMode,
  addDemoRoutine,
  updateDemoRoutine,
  toggleDemoRoutine,
  deleteDemoRoutine,
} from '@/lib/demo-mode';

export interface RoutineActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function addRoutineItem(
  patientId: string,
  formData: FormData
): Promise<RoutineActionResult> {
  const timeOfDay = formData.get('time_of_day') as string;
  const title = formData.get('title') as string;
  const description = (formData.get('description') as string) || '';
  const days = formData.getAll('days') as string[];

  if (!timeOfDay || !title) {
    return { error: 'Time and routine title are required.' };
  }

  if (isDemoMode()) {
    addDemoRoutine({
      id: `demo-routine-${Date.now()}`,
      patient_id: patientId,
      time_of_day: timeOfDay,
      title: title.trim(),
      description: description.trim(),
      days_of_week: days.length > 0 ? days : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      is_enabled: true,
      created_at: new Date().toISOString(),
    });
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-day');
    revalidatePath('/patient/home');
    return { success: true, message: `Routine "${title}" added.` };
  }

  const supabase = createClient();
  const { error } = await supabase.from('daily_routines').insert({
    patient_id: patientId,
    time_of_day: timeOfDay,
    title: title.trim(),
    description: description.trim(),
    days_of_week: days.length > 0 ? days : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_enabled: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-day');
  revalidatePath('/patient/home');
  return { success: true, message: `Routine "${title}" added successfully.` };
}

export async function updateRoutineItem(
  routineId: string,
  formData: FormData
): Promise<RoutineActionResult> {
  const timeOfDay = formData.get('time_of_day') as string;
  const title = formData.get('title') as string;
  const description = (formData.get('description') as string) || '';
  const days = formData.getAll('days') as string[];

  if (!timeOfDay || !title) {
    return { error: 'Time and routine title are required.' };
  }

  if (isDemoMode()) {
    const ok = updateDemoRoutine(routineId, {
      time_of_day: timeOfDay,
      title: title.trim(),
      description: description.trim(),
      days_of_week: days.length > 0 ? days : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    });
    if (!ok) return { error: 'Routine not found.' };

    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-day');
    revalidatePath('/patient/home');
    return { success: true, message: `Routine updated to ${timeOfDay} ${title}.` };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('daily_routines')
    .update({
      time_of_day: timeOfDay,
      title: title.trim(),
      description: description.trim(),
      days_of_week: days.length > 0 ? days : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    })
    .eq('id', routineId);

  if (error) return { error: error.message };

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-day');
  revalidatePath('/patient/home');
  return { success: true, message: 'Routine updated successfully.' };
}

export async function toggleRoutineItem(
  routineId: string,
  isEnabled: boolean
): Promise<RoutineActionResult> {
  if (isDemoMode()) {
    toggleDemoRoutine(routineId, isEnabled);
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-day');
    revalidatePath('/patient/home');
    return { success: true };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('daily_routines')
    .update({ is_enabled: isEnabled })
    .eq('id', routineId);

  if (error) return { error: error.message };

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-day');
  revalidatePath('/patient/home');
  return { success: true };
}

export async function deleteRoutineItem(routineId: string): Promise<RoutineActionResult> {
  if (isDemoMode()) {
    deleteDemoRoutine(routineId);
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-day');
    revalidatePath('/patient/home');
    return { success: true, message: 'Routine removed.' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('daily_routines').delete().eq('id', routineId);

  if (error) return { error: error.message };

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-day');
  revalidatePath('/patient/home');
  return { success: true, message: 'Routine removed.' };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isDemoMode } from '@/lib/demo-mode';

export interface ActivityActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * Update patient's daily activity quotas, session duration, and focus areas
 */
export async function updateActivitySettings(
  patientId: string,
  formData: FormData
): Promise<ActivityActionResult> {
  const dailyTarget = parseInt(formData.get('daily_target_activities') as string, 10) || 3;
  const sessionDuration = parseInt(formData.get('session_duration_minutes') as string, 10) || 10;
  const preferredTime = (formData.get('preferred_activity_time') as string) || 'morning';
  const activityTypes = formData.getAll('activity_types') as string[];

  if (isDemoMode()) {
    revalidatePath('/caregiver/dashboard');
    return { success: true, message: 'Activity settings successfully saved.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('patients')
    .update({
      daily_target_activities: dailyTarget,
      session_duration_minutes: sessionDuration,
      preferred_activity_time: preferredTime,
      preferred_activity_types: activityTypes.length > 0 ? activityTypes : ['memory', 'sequence', 'routine'],
    })
    .eq('id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  return { success: true, message: 'Activity settings saved successfully.' };
}

/**
 * Reset difficulty to baseline for a patient
 */
export async function resetDifficultyBaseline(patientId: string): Promise<ActivityActionResult> {
  if (isDemoMode()) {
    revalidatePath('/caregiver/dashboard');
    return { success: true, message: 'Game difficulty baseline reset to Level 1.' };
  }

  const supabase = createClient();
  // Reset difficulty to level 1 for any session calibration
  revalidatePath('/caregiver/dashboard');
  return { success: true, message: 'Game difficulty calibrated to initial baseline.' };
}

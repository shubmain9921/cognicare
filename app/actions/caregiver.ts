'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isDemoMode, updateDemoCaregiver } from '@/lib/demo-mode';

export interface CaregiverActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function updateCaregiverLanguage(
  language: string
): Promise<CaregiverActionResult> {
  const preferredLanguage = (language || 'en').toLowerCase();

  if (isDemoMode()) {
    updateDemoCaregiver({ preferred_language: preferredLanguage });
    revalidatePath('/caregiver/dashboard');
    return { success: true, message: `Language updated to ${preferredLanguage}.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('caregivers')
    .update({ preferred_language: preferredLanguage })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  return { success: true, message: `Language updated to ${preferredLanguage}.` };
}

export async function updateCaregiverProfile(
  formData: FormData
): Promise<CaregiverActionResult> {
  const name = (formData.get('name') as string)?.trim();
  const preferredLanguage = (formData.get('preferred_language') as string) || 'en';

  if (!name) {
    return { error: 'Name is required.' };
  }

  if (isDemoMode()) {
    updateDemoCaregiver({ name, preferred_language: preferredLanguage });
    revalidatePath('/caregiver/dashboard');
    return { success: true, message: 'Caregiver profile updated successfully.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('caregivers')
    .update({
      name,
      preferred_language: preferredLanguage,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  return { success: true, message: 'Profile updated successfully.' };
}

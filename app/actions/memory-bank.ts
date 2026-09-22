'use server';

import { createClient } from '@/lib/supabase/server';
import { MemoryCategory, MemoryStatus } from '@/types/database.types';
import { revalidatePath } from 'next/cache';
import {
  isDemoMode,
  addDemoMemory,
  updateDemoMemory,
  updateDemoMemoryStatus,
  deleteDemoMemory,
} from '@/lib/demo-mode';

export interface MemoryActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * Add a memory item to patient's memory bank with initial status
 */
export async function addMemoryBankItem(
  _prevState: MemoryActionResult | null,
  formData: FormData
): Promise<MemoryActionResult> {
  const patientId = formData.get('patient_id') as string;
  const category = formData.get('category') as MemoryCategory;
  const keyTerm = (formData.get('key_term') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const status = ((formData.get('status') as MemoryStatus) || 'new') as MemoryStatus;

  if (!patientId || !category || !keyTerm || !description) {
    return { error: 'All fields are required.' };
  }

  if (isDemoMode()) {
    addDemoMemory({
      id: `demo-mem-${Date.now()}`,
      patient_id: patientId,
      category,
      key_term: keyTerm,
      description,
      status,
      image_url: null,
      created_at: new Date().toISOString(),
    });
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-memories');
    revalidatePath('/patient/home');
    return { success: true, message: `Added "${keyTerm}" to Memory Bank.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase.from('memory_bank').insert({
    patient_id: patientId,
    category,
    key_term: keyTerm,
    description,
    status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-memories');
  revalidatePath('/patient/home');
  return { success: true, message: `Added "${keyTerm}" to Memory Bank.` };
}

/**
 * Update memory lifecycle status: new -> introduced -> practiced -> recall_observed
 */
export async function updateMemoryStatus(
  memoryId: string,
  patientId: string,
  newStatus: MemoryStatus
): Promise<MemoryActionResult> {
  if (isDemoMode()) {
    updateDemoMemoryStatus(memoryId, newStatus);
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-memories');
    revalidatePath('/patient/home');
    return { success: true, message: `Memory status updated to ${newStatus}.` };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('memory_bank')
    .update({ status: newStatus })
    .eq('id', memoryId)
    .eq('patient_id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-memories');
  revalidatePath('/patient/home');
  return { success: true, message: `Memory status updated to ${newStatus}.` };
}

/**
 * Update an existing memory bank entry
 */
export async function updateMemoryBankItem(
  _prevState: MemoryActionResult | null,
  formData: FormData
): Promise<MemoryActionResult> {
  const id = formData.get('id') as string;
  const patientId = formData.get('patient_id') as string;
  const category = formData.get('category') as MemoryCategory;
  const keyTerm = (formData.get('key_term') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const status = (formData.get('status') as MemoryStatus) || 'new';

  if (!id || !patientId || !category || !keyTerm || !description) {
    return { error: 'All fields are required.' };
  }

  if (isDemoMode()) {
    updateDemoMemory(id, {
      category,
      key_term: keyTerm,
      description,
      status,
    });
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-memories');
    revalidatePath('/patient/home');
    return { success: true, message: 'Memory updated successfully.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('memory_bank')
    .update({
      category,
      key_term: keyTerm,
      description,
      status,
    })
    .eq('id', id)
    .eq('patient_id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-memories');
  revalidatePath('/patient/home');
  return { success: true, message: 'Memory updated successfully.' };
}

/**
 * Delete a memory bank entry
 */
export async function deleteMemoryBankItem(
  id: string,
  patientId: string
): Promise<MemoryActionResult> {
  if (isDemoMode()) {
    deleteDemoMemory(id);
    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/my-memories');
    revalidatePath('/patient/home');
    return { success: true, message: 'Memory deleted.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('memory_bank')
    .delete()
    .eq('id', id)
    .eq('patient_id', patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/my-memories');
  revalidatePath('/patient/home');
  return { success: true, message: 'Memory deleted.' };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  isDemoMode,
  DEMO_CAREGIVER_EMAIL,
  DEMO_CAREGIVER_PASSWORD,
  DEMO_CAREGIVER_COOKIE,
} from '@/lib/demo-mode';

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

export async function caregiverSignUp(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const preferredLanguage = (formData.get('preferred_language') as string) || 'en';

  if (!name || !email || !password) {
    return { error: 'Please provide all required fields.' };
  }

  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        preferred_language: preferredLanguage,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Insert into caregivers table
    const { error: dbError } = await supabase.from('caregivers').upsert(
      {
        id: authData.user.id,
        name,
        email,
        password_hash: 'supabase_auth_managed',
        preferred_language: preferredLanguage,
      },
      { onConflict: 'id' }
    );

    if (dbError) {
      console.error('Failed to sync caregiver row:', dbError);
    }
  }

  redirect('/caregiver/dashboard');
}

export async function caregiverLogin(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  if (isDemoMode()) {
    const isAllowedEmail = email === DEMO_CAREGIVER_EMAIL.toLowerCase() || email === 'demo@memorycare.app';
    const isAllowedPassword = password === DEMO_CAREGIVER_PASSWORD || password === 'Demo@2026' || password === 'demo123';

    if (!isAllowedEmail || !isAllowedPassword) {
      return { error: 'Invalid email or password. Use the demo caregiver credentials.' };
    }

    const cookieStore = cookies();
    cookieStore.set({
      name: DEMO_CAREGIVER_COOKIE,
      value: 'demo-caregiver',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect('/caregiver/dashboard');
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/caregiver/dashboard');
}

export async function caregiverLogout() {
  if (isDemoMode()) {
    const cookieStore = cookies();
    cookieStore.set({
      name: DEMO_CAREGIVER_COOKIE,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    redirect('/caregiver/login');
  }

  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/caregiver/login');
}

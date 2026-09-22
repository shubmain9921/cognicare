import { cookies } from 'next/headers';
import {
  PatientSessionData,
  PATIENT_SESSION_COOKIE,
  encodePatientSession,
  decodePatientSession,
} from './patient-session-core';

export * from './patient-session-core';

/**
 * Sets patient session in HTTP-only cookie
 */
export async function setPatientSession(data: Omit<PatientSessionData, 'createdAt'>) {
  const sessionData: PatientSessionData = {
    ...data,
    createdAt: Date.now(),
  };
  const token = await encodePatientSession(sessionData);

  const cookieStore = cookies();
  cookieStore.set({
    name: PATIENT_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Retrieves the current patient session from cookies (server-side)
 */
export async function getPatientSession(): Promise<PatientSessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(PATIENT_SESSION_COOKIE)?.value;
  return decodePatientSession(token);
}

/**
 * Clears the patient session cookie
 */
export async function clearPatientSession() {
  const cookieStore = cookies();
  cookieStore.set({
    name: PATIENT_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

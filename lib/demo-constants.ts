export * from './demo-types';

export const DEMO_CAREGIVER_EMAIL = 'demo@memorycare.app';
export const DEMO_CAREGIVER_PASSWORD = 'Demo@2026';
export const DEMO_CAREGIVER_COOKIE = 'cognicare_demo_caregiver';
export const DEMO_PATIENT_CODE = 'DEMO-001';
export const DEMO_PATIENT_PIN = '202626';

export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') {
    return false;
  }
  return true;
}

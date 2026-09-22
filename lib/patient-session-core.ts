export interface PatientSessionData {
  id: string;
  caregiver_id: string;
  name: string;
  patient_code: string;
  preferred_language: string;
  createdAt: number;
}

export const PATIENT_SESSION_COOKIE = 'cognicare_patient_session';
const SESSION_SECRET = process.env.PATIENT_SESSION_SECRET || 'cognicare-patient-secret-key-salt';

// Converts string to Uint8Array as BufferSource
function textToBufferSource(text: string): BufferSource {
  return new TextEncoder().encode(text) as unknown as BufferSource;
}

// Generates HMAC SHA-256 signature using Web Crypto API
async function generateSignatureWebCrypto(payload: string): Promise<string> {
  const secretBytes = textToBufferSource(SESSION_SECRET);
  const payloadBytes = textToBufferSource(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuf = await crypto.subtle.sign('HMAC', key, payloadBytes);
  return Array.from(new Uint8Array(signatureBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Base64URL encode/decode helpers
function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64Url: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64Url, 'base64url').toString('utf-8');
  }
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Encodes patient session data into a secure tamper-proof token
 */
export async function encodePatientSession(data: PatientSessionData): Promise<string> {
  const payloadStr = JSON.stringify(data);
  const base64Payload = toBase64Url(payloadStr);
  const signature = await generateSignatureWebCrypto(base64Payload);
  return `${base64Payload}.${signature}`;
}

/**
 * Decodes and verifies a patient session token
 */
export async function decodePatientSession(token: string | undefined | null): Promise<PatientSessionData | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [base64Payload, signature] = parts;
  try {
    const expectedSignature = await generateSignatureWebCrypto(base64Payload);
    if (signature !== expectedSignature) {
      return null;
    }

    const payloadStr = fromBase64Url(base64Payload);
    return JSON.parse(payloadStr) as PatientSessionData;
  } catch {
    return null;
  }
}

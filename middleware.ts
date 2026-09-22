import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PATIENT_SESSION_COOKIE, decodePatientSession } from '@/lib/patient-session-core';
import { DEMO_CAREGIVER_COOKIE, isDemoMode } from '@/lib/demo-constants';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Initialize Supabase client for Caregiver Auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  let caregiverUser = null as { id: string } | null;
  if (!isDemoMode()) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    caregiverUser = user;
  }

  // 1. Caregiver Route Protection
  const isCaregiverAuthPage =
    pathname === '/caregiver/login' || pathname === '/caregiver/signup';
  const isCaregiverProtected =
    pathname.startsWith('/caregiver') && !isCaregiverAuthPage;

  if (isDemoMode()) {
    if (pathname.startsWith('/caregiver')) {
      return response;
    }
  }

  if (isCaregiverProtected && !caregiverUser) {
    const loginUrl = new URL('/caregiver/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isCaregiverAuthPage && caregiverUser) {
    return NextResponse.redirect(new URL('/caregiver/dashboard', request.url));
  }

  // 2. Patient Route Protection
  const patientToken = request.cookies.get(PATIENT_SESSION_COOKIE)?.value;
  const patientSession = await decodePatientSession(patientToken);

  const isPatientLoginPage = pathname === '/patient/login';
  const isPatientProtected = pathname.startsWith('/patient') && !isPatientLoginPage;

  // Protect all /patient/* routes (except /patient/login).
  // Unauthenticated users are redirected to /patient/login.
  if (isPatientProtected && !patientSession) {
    const loginUrl = new URL('/patient/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Always allow rendering /patient/login page when explicitly requested
  return response;
}

export const config = {
  matcher: [
    '/caregiver/:path*',
    '/patient/:path*',
  ],
};

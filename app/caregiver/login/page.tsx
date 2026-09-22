'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { caregiverLogin } from '@/app/actions/auth';
import Link from 'next/link';
import { I18nProvider, useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow active:scale-95"
    >
      {pending ? t('auth.signingIn') : t('auth.signInButton')}
    </button>
  );
}

function CaregiverLoginForm() {
  const [state, formAction] = useFormState(caregiverLogin, null);
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 text-gray-900">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200 space-y-6">
        
        {/* Top bar with Language Switcher */}
        <div className="flex justify-between items-center">
          <Link
            href="/patient/login"
            className="text-xs font-bold text-gray-500 hover:text-gray-900"
          >
            {t('auth.backToPatientLogin')}
          </Link>
          <LanguageSwitcher variant="select" size="sm" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('auth.caregiverLoginTitle')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('auth.caregiverLoginSubtitle')}</p>
        </div>

        {state?.error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl font-medium">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="email">
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="demo@memorycare.app"
              required
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="password">
              {t('auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue="Demo@2026"
              required
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>

          <SubmitButton />
        </form>

        {/* Demo Mode Quick Reference Box */}
        <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs space-y-1">
          <p className="font-extrabold text-amber-900">{t('auth.demoCaregiverQuickFill')}</p>
          <p className="text-amber-800 font-mono font-bold">demo@memorycare.app / Demo@2026</p>
        </div>

        <div className="text-center text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <Link href="/caregiver/signup" className="text-blue-600 font-bold hover:underline">
            {t('auth.signUp')}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CaregiverLoginPage() {
  return (
    <I18nProvider>
      <CaregiverLoginForm />
    </I18nProvider>
  );
}

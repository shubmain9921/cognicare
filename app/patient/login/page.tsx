'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { patientLogin, PatientLoginResult } from '@/app/actions/patient';
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
      className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xl rounded-2xl transition shadow-md flex items-center justify-center gap-2 active:scale-[0.99] border-2 border-black"
    >
      {pending ? (
        <>
          <span className="animate-spin text-xl">⏳</span>
          <span>{t('auth.signingIn')}</span>
        </>
      ) : (
        <>
          <span>🌻</span>
          <span>{t('auth.signInButton')}</span>
        </>
      )}
    </button>
  );
}

function PatientLoginForm() {
  const [patientIdInput, setPatientIdInput] = useState('DEMO-001');
  const [passcodeInput, setPasscodeInput] = useState('202626');
  const { t } = useI18n();

  const [state, formAction] = useFormState<PatientLoginResult | null, FormData>(
    patientLogin,
    null
  );

  const handleQuickSelect = (id: string, code: string) => {
    setPatientIdInput(id);
    setPasscodeInput(code);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-amber-50/40 via-emerald-50/30 to-teal-50/40 text-gray-900">
      <div className="max-w-lg w-full bg-white p-6 sm:p-10 rounded-3xl shadow-xl border-4 border-black space-y-6">
        
        {/* Top bar with Language Switcher */}
        <div className="flex justify-end">
          <LanguageSwitcher variant="select" size="sm" />
        </div>

        {/* Branding & Welcome Header */}
        <div className="text-center space-y-2">
          <div className="text-6xl sm:text-7xl">🧠</div>
          <h1 className="text-4xl font-extrabold text-black tracking-tight">
            {t('auth.patientLoginTitle')}
          </h1>
          <p className="text-2xl font-extrabold text-emerald-700">
            {t('auth.welcomeBack')}
          </p>
          <p className="text-lg font-bold text-gray-700">
            {t('auth.signInToContinue')}
          </p>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="p-4 text-base font-bold text-red-900 bg-red-50 border-3 border-red-300 rounded-2xl flex items-center gap-2 animate-in fade-in">
            <span className="text-2xl">⚠️</span>
            <span>{state.error}</span>
          </div>
        )}

        {/* Login Form */}
        <form action={formAction} className="space-y-6">
          {/* Patient ID Input */}
          <div className="space-y-2">
            <label
              className="block text-base font-extrabold text-gray-800 uppercase tracking-wider"
              htmlFor="patient_code"
            >
              {t('auth.patientId')}
            </label>
            <input
              id="patient_code"
              name="patient_code"
              type="text"
              required
              maxLength={12}
              autoComplete="off"
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value.toUpperCase())}
              placeholder={t('auth.patientIdPlaceholder')}
              className="w-full px-5 py-4 text-center text-3xl font-mono font-extrabold uppercase tracking-widest border-4 border-black rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-300 bg-emerald-50/40 text-gray-900 shadow-inner"
            />
          </div>

          {/* Passcode Input */}
          <div className="space-y-2">
            <label
              className="block text-base font-extrabold text-gray-800 uppercase tracking-wider"
              htmlFor="pin"
            >
              {t('auth.passcode')}
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              maxLength={8}
              required
              autoComplete="off"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="••••••"
              className="w-full px-5 py-4 text-center text-3xl font-mono font-extrabold tracking-widest border-4 border-black rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-300 bg-emerald-50/40 text-gray-900 shadow-inner"
            />
          </div>

          {/* Primary Action Button */}
          <SubmitButton />
        </form>

        {/* Quick Demo Credentials Selector for SIH Judges */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border-2 border-emerald-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <span>⚡</span> {t('auth.demoPatientQuickFill')}
            </p>
            <span className="text-xs text-emerald-800 font-bold">{t('auth.tapToFill')}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickSelect('DEMO-001', '202626')}
              className="p-3 bg-white hover:bg-emerald-100 border-2 border-black rounded-xl text-left transition active:scale-95 flex items-center justify-between"
            >
              <div>
                <p className="font-extrabold text-gray-900 text-sm">Anita Sharma</p>
                <p className="font-mono text-xs text-emerald-700 font-bold mt-0.5">ID: DEMO-001</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs bg-emerald-100 text-emerald-900 px-2 py-1 rounded-lg border border-emerald-300 font-bold">Passcode: 202626</span>
              </div>
            </button>
          </div>
        </div>

        {/* Secondary / Help Option */}
        <div className="pt-2 text-center border-t-2 border-gray-100 space-y-2">
          <p className="text-base font-bold text-gray-700">
            {t('auth.needHelp')} <span className="text-emerald-800">{t('auth.askCaregiver')}</span>
          </p>
          <div>
            <Link
              href="/caregiver/login"
              className="text-sm font-bold text-gray-500 hover:text-black underline underline-offset-2"
            >
              {t('auth.caregiverPortalLink')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PatientLoginPage() {
  return (
    <I18nProvider>
      <PatientLoginForm />
    </I18nProvider>
  );
}

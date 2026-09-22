'use client';

import Link from 'next/link';
import { I18nProvider, useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

function LandingContent() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50/40 via-emerald-50/30 to-teal-50/40 flex flex-col items-center justify-center p-6 text-gray-900">
      {/* Top Bar with Language Switcher */}
      <div className="w-full max-w-lg flex justify-end mb-4">
        <LanguageSwitcher variant="select" size="sm" />
      </div>

      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo & Tagline */}
        <div className="space-y-3">
          <div className="text-7xl sm:text-8xl">🧠</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-lg sm:text-xl font-bold text-emerald-800">
            {t('landing.heroTagline')}
          </p>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto">
            {t('landing.heroSubtitle')}
          </p>
        </div>

        {/* 2 Separate Login Options as Required */}
        <div className="flex flex-col gap-4">
          <Link
            href="/patient/login"
            className="w-full py-4 sm:py-5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl sm:text-2xl rounded-2xl border-4 border-black transition shadow-lg active:scale-95 flex items-center justify-center gap-3"
          >
            <span>🌻</span>
            <span>{t('landing.patientLoginBtn')}</span>
          </Link>

          <Link
            href="/caregiver/login"
            className="w-full py-4 sm:py-5 px-6 bg-gray-900 hover:bg-black text-white font-extrabold text-xl sm:text-2xl rounded-2xl border-4 border-black transition shadow-lg active:scale-95 flex items-center justify-center gap-3"
          >
            <span>👨‍⚕️</span>
            <span>{t('landing.caregiverLoginBtn')}</span>
          </Link>
        </div>

        {/* Demo Credentials Quick Guide for SIH Hackathon 2026 Judges */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 text-left space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
            <span className="text-xs font-extrabold text-gray-900 uppercase tracking-widest">
              {t('landing.judgeDemoTitle')}
            </span>
            <span className="text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full">
              {t('landing.judgeDemoReady')}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border-2 border-emerald-300">
              <p className="font-extrabold text-emerald-950 text-sm">{t('landing.demoPatientTitle')}</p>
              <p className="font-mono text-gray-900 font-bold mt-1 text-sm">
                {t('landing.patientLabel')} <span className="text-gray-800">Anita Sharma</span>
              </p>
              <p className="font-mono text-gray-900 font-bold text-sm">
                {t('landing.patientIdLabel')} <span className="text-emerald-700">DEMO-001</span>
              </p>
              <p className="font-mono text-gray-900 font-bold text-sm">
                {t('landing.passcodeLabel')} <span className="text-emerald-700">202626</span>
              </p>
            </div>

            <div className="bg-amber-50/80 p-3.5 rounded-2xl border-2 border-amber-300">
              <p className="font-extrabold text-amber-950 text-sm">{t('landing.demoCaregiverTitle')}</p>
              <p className="font-mono text-gray-900 font-bold mt-1 text-sm">
                {t('landing.emailLabel')} <span className="text-amber-800">demo@memorycare.app</span>
              </p>
              <p className="font-mono text-gray-900 font-bold text-sm">
                {t('landing.passwordLabel')} <span className="text-amber-800">Demo@2026</span>
              </p>
            </div>
          </div>
        </div>

        {/* Learn More Link */}
        <Link
          href="/about"
          className="inline-block text-sm font-bold text-gray-600 hover:text-black underline underline-offset-2 transition"
        >
          {t('landing.learnMore')}
        </Link>
      </div>
    </main>
  );
}

export default function RootPage() {
  return (
    <I18nProvider>
      <LandingContent />
    </I18nProvider>
  );
}

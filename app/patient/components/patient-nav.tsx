'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { updatePatientLanguage } from '@/app/actions/patient';

export default function PatientNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/patient/home', label: t('nav.home'), icon: '🏠' },
    { href: '/patient/games', label: t('nav.games'), icon: '🎮' },
    { href: '/patient/my-day', label: t('nav.myDay'), icon: '🗓️' },
    { href: '/patient/my-memories', label: t('nav.myMemories'), icon: '❤️' },
    { href: '/patient/progress', label: t('nav.progress'), icon: '📈' },
    { href: '/patient/help', label: t('nav.help'), icon: '❓' },
  ];

  return (
    <nav className="bg-white border-b-4 border-black px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto py-1">
        <Link
          href="/patient/home"
          className="flex items-center gap-2 font-extrabold text-xl text-black shrink-0 mr-2"
        >
          <span className="text-2xl">🧠</span>
          <span className="hidden sm:inline">CogniCare</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/patient/home' && pathname === '/patient/dashboard');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 sm:px-4 py-2 rounded-2xl border-2 font-extrabold text-sm sm:text-base transition flex items-center gap-1.5 shadow-2xs ${
                  isActive
                    ? 'bg-emerald-600 text-white border-black shadow-xs scale-[1.02]'
                    : 'bg-amber-50/60 text-gray-800 border-gray-300 hover:bg-emerald-100 hover:border-black'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="ml-2 shrink-0">
            <LanguageSwitcher
              variant="select"
              size="sm"
              onLanguageChange={async (newLang) => {
                try {
                  await updatePatientLanguage(newLang);
                } catch {
                  // Fallback safely if unauthenticated
                }
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

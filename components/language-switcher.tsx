'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import { SUPPORTED_LANGUAGES, LanguageMeta } from '@/lib/i18n/languages';

interface LanguageSwitcherProps {
  variant?: 'pills' | 'select' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onLanguageChange?: (lang: string) => Promise<any> | void;
}

export default function LanguageSwitcher({
  variant = 'pills',
  size = 'md',
  className = '',
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  const handleSelect = async (code: string) => {
    if (code === locale) return;
    await setLocale(code);
    if (onLanguageChange) {
      await onLanguageChange(code);
    }
  };

  const languages = Object.values(SUPPORTED_LANGUAGES).filter(
    (l) => l.code === 'en' || l.code === 'hi' || l.code === 'mr' || l.code === 'as'
  );

  if (variant === 'select') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <span className="sr-only">Select Language</span>
        <select
          value={locale}
          onChange={(e) => handleSelect(e.target.value)}
          aria-label="Select Language"
          className="appearance-none bg-white border-2 border-black rounded-xl px-3 py-1.5 pr-8 font-bold text-sm text-gray-900 shadow-2xs hover:border-emerald-600 focus:outline-none cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 text-xs text-gray-700">▼</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm sm:text-base px-3 sm:px-4 py-1.5',
    lg: 'text-base sm:text-lg px-4 sm:px-5 py-2',
  }[size];

  return (
    <div
      role="group"
      aria-label="Language Selector"
      className={`inline-flex items-center gap-1.5 bg-amber-50/80 p-1 rounded-2xl border-2 border-black shadow-2xs ${className}`}
    >
      <span className="text-base sm:text-lg px-1.5 select-none" aria-hidden="true">
        🌐
      </span>
      {languages.map((lang) => {
        const isCurrent = locale === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelect(lang.code)}
            aria-pressed={isCurrent}
            className={`font-extrabold rounded-xl transition border-2 ${sizeClasses} ${
              isCurrent
                ? 'bg-emerald-600 text-white border-black shadow-xs scale-[1.02]'
                : 'bg-white text-gray-800 border-transparent hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {lang.nativeName}
          </button>
        );
      })}
    </div>
  );
}

export { LanguageSwitcher };

export function CaregiverHeaderLanguageSwitcher() {
  return (
    <LanguageSwitcher
      variant="select"
      size="sm"
      onLanguageChange={async (lang) => {
        try {
          const { updateCaregiverLanguage } = await import('@/app/actions/caregiver');
          await updateCaregiverLanguage(lang);
        } catch (e) {
          console.error('Failed to update caregiver language:', e);
        }
      }}
    />
  );
}


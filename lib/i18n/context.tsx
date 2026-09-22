'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dictionary,
  SupportedLanguage,
  getDictionary,
  t as translateFn,
  isSupportedLanguage,
  formatDate as fmtDate,
  formatTime as fmtTime,
  formatNumber as fmtNum,
  formatPercent as fmtPct,
  formatDuration as fmtDur,
  formatPlural as fmtPlural,
} from './index';

interface I18nContextType {
  locale: SupportedLanguage;
  dict: Dictionary;
  t: (path: string, params?: Record<string, string | number>) => string;
  setLocale: (newLocale: string) => Promise<void>;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (time: Date | string, timeZone?: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
  formatDuration: (minutes: number) => string;
  formatPlural: (count: number, forms: { one: string; other: string; zero?: string }) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function normalizeLocale(loc?: string | null): SupportedLanguage {
  if (!loc) return 'en';
  const l = loc.toLowerCase();
  if (l === 'hi' || l === 'hi-in') return 'hi';
  if (l === 'mr' || l === 'mr-in') return 'mr';
  if (l === 'as' || l === 'as-in') return 'as';
  return 'en';
}

export function I18nProvider({
  locale = 'en',
  dictionary,
  onLanguageChange,
  children,
}: {
  locale?: string;
  dictionary?: Dictionary;
  onLanguageChange?: (newLocale: string) => Promise<any> | void;
  children: React.ReactNode;
}) {
  const [activeLocale, setActiveLocale] = useState<SupportedLanguage>(() => normalizeLocale(locale));

  // Sync state if server prop changes
  useEffect(() => {
    if (locale) {
      setActiveLocale(normalizeLocale(locale));
    }
  }, [locale]);

  // Update HTML lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLocale;
    }
  }, [activeLocale]);

  const dict = useMemo(() => {
    return dictionary && activeLocale === normalizeLocale(locale)
      ? dictionary
      : getDictionary(activeLocale);
  }, [dictionary, activeLocale, locale]);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return translateFn(dict, path, params);
    },
    [dict]
  );

  const setLocale = useCallback(
    async (newLoc: string) => {
      const resolved = normalizeLocale(newLoc);
      setActiveLocale(resolved);

      // Persist in cookie for SSR hydration
      if (typeof document !== 'undefined') {
        document.cookie = `cognicare_lang=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
        try {
          localStorage.setItem('cognicare_preferred_lang', resolved);
        } catch {
          // ignore
        }
      }

      if (onLanguageChange) {
        try {
          await onLanguageChange(resolved);
        } catch (err) {
          console.error('Failed to persist language change on server:', err);
        }
      }
    },
    [onLanguageChange]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      fmtDate(date, activeLocale, options),
    [activeLocale]
  );

  const formatTime = useCallback(
    (time: Date | string, timeZone?: string) =>
      fmtTime(time, activeLocale, timeZone),
    [activeLocale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      fmtNum(value, activeLocale, options),
    [activeLocale]
  );

  const formatPercent = useCallback(
    (value: number) => fmtPct(value, activeLocale),
    [activeLocale]
  );

  const formatDuration = useCallback(
    (minutes: number) => fmtDur(minutes, activeLocale),
    [activeLocale]
  );

  const formatPlural = useCallback(
    (count: number, forms: { one: string; other: string; zero?: string }) =>
      fmtPlural(count, forms, activeLocale),
    [activeLocale]
  );

  const contextValue: I18nContextType = useMemo(
    () => ({
      locale: activeLocale,
      dict,
      t,
      setLocale,
      formatDate,
      formatTime,
      formatNumber,
      formatPercent,
      formatDuration,
      formatPlural,
    }),
    [
      activeLocale,
      dict,
      t,
      setLocale,
      formatDate,
      formatTime,
      formatNumber,
      formatPercent,
      formatDuration,
      formatPlural,
    ]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    const dict = getDictionary('en');
    return {
      locale: 'en' as SupportedLanguage,
      dict,
      t: (path: string, params?: Record<string, string | number>) =>
        translateFn(dict, path, params),
      setLocale: async () => {},
      formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        fmtDate(date, 'en', options),
      formatTime: (time: Date | string, timeZone?: string) =>
        fmtTime(time, 'en', timeZone),
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        fmtNum(value, 'en', options),
      formatPercent: (value: number) => fmtPct(value, 'en'),
      formatDuration: (minutes: number) => fmtDur(minutes, 'en'),
      formatPlural: (count: number, forms: { one: string; other: string; zero?: string }) =>
        fmtPlural(count, forms, 'en'),
    };
  }
  return context;
}

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  locale: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageMeta> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en-IN',
    direction: 'ltr',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    direction: 'ltr',
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    locale: 'mr-IN',
    direction: 'ltr',
  },
  as: {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    locale: 'as-IN',
    direction: 'ltr',
  },
};

export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES);

export function isSupportedLanguage(code?: string | null): boolean {
  if (!code) return false;
  return Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, code.toLowerCase());
}

export function getLanguageMeta(code?: string | null): LanguageMeta {
  const normalized = (code || DEFAULT_LANGUAGE).toLowerCase();
  return SUPPORTED_LANGUAGES[normalized] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
}

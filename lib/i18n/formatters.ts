import { getLanguageMeta } from './languages';

/**
 * Format a Date or date string according to the given language locale.
 */
export function formatDate(
  dateInput: Date | string | number,
  languageOrOptions: string | Intl.DateTimeFormatOptions = 'en',
  optionsOrLanguage?: Intl.DateTimeFormatOptions | string
): string {
  let languageCode = 'en';
  let options: Intl.DateTimeFormatOptions | undefined = undefined;

  if (typeof languageOrOptions === 'string') {
    languageCode = languageOrOptions;
    if (typeof optionsOrLanguage === 'object') {
      options = optionsOrLanguage;
    }
  } else if (typeof languageOrOptions === 'object' && languageOrOptions !== null) {
    options = languageOrOptions;
    if (typeof optionsOrLanguage === 'string') {
      languageCode = optionsOrLanguage;
    }
  }

  const meta = getLanguageMeta(languageCode);
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(meta.locale, options || defaultOptions).format(date);
  } catch {
    return date.toDateString();
  }
}

/**
 * Format time of day (e.g. "09:00" or ISO string) respecting locale and timezone.
 */
export function formatTime(
  timeInput: Date | string,
  languageCode: string = 'en',
  timeZone: string = 'Asia/Kolkata'
): string {
  const meta = getLanguageMeta(languageCode);

  // If simple HH:MM string, parse hour and minute
  if (typeof timeInput === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeInput)) {
    const [hours, minutes] = timeInput.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    try {
      return new Intl.DateTimeFormat(meta.locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone,
      }).format(date);
    } catch {
      return timeInput;
    }
  }

  const date = timeInput instanceof Date ? timeInput : new Date(timeInput);
  if (isNaN(date.getTime())) {
    return String(timeInput);
  }

  try {
    return new Intl.DateTimeFormat(meta.locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

/**
 * Format numbers according to locale digits / formatting.
 */
export function formatNumber(
  value: number,
  languageCode: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const meta = getLanguageMeta(languageCode);
  try {
    return new Intl.NumberFormat(meta.locale, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format percentage (e.g. 76 -> "76%" or formatted with locale digits).
 */
export function formatPercent(value: number, languageCode: string = 'en'): string {
  const meta = getLanguageMeta(languageCode);
  try {
    // If value is between 0 and 1, multiply or use percent style
    const normalized = value > 1 ? value / 100 : value;
    return new Intl.NumberFormat(meta.locale, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(normalized);
  } catch {
    return `${Math.round(value)}%`;
  }
}

/**
 * Localized duration in minutes (e.g. "42 minutes" / "४२ मिनिटे" / "42 मिनट").
 */
export function formatDuration(minutes: number, languageCode: string = 'en'): string {
  const lang = (languageCode || 'en').toLowerCase();
  const numStr = formatNumber(minutes, languageCode);

  if (lang === 'hi') {
    return `${numStr} मिनट`;
  }
  if (lang === 'mr') {
    return `${numStr} मिनिटे`;
  }
  if (lang === 'as') {
    return `${numStr} মিনিট`;
  }
  return `${numStr} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/**
 * Pluralization helper using Intl.PluralRules.
 */
export function formatPlural(
  count: number,
  forms: { one: string; other: string; zero?: string },
  languageCode: string = 'en'
): string {
  const meta = getLanguageMeta(languageCode);
  try {
    const pr = new Intl.PluralRules(meta.locale);
    const rule = pr.select(count);

    if (count === 0 && forms.zero) {
      return forms.zero.replace('{count}', formatNumber(count, languageCode));
    }

    const template = rule === 'one' ? forms.one : forms.other;
    return template.replace('{count}', formatNumber(count, languageCode));
  } catch {
    const template = count === 1 ? forms.one : forms.other;
    return template.replace('{count}', String(count));
  }
}

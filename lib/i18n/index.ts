import en from './dictionaries/en.json';
import hi from './dictionaries/hi.json';
import mr from './dictionaries/mr.json';
import as from './dictionaries/as.json';

export * from './languages';
export * from './formatters';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'as';
export type Dictionary = typeof en;

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key as keyof T] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

const rawDictionaries: Record<string, any> = {
  en,
  hi,
  mr,
  as,
};

/**
 * Returns the dictionary object for the given locale.
 * Deeply merges with English dictionary so no property is ever undefined.
 */
export function getDictionary(locale?: string | null): Dictionary {
  const lang = (locale || 'en').toLowerCase();
  const selectedDict = rawDictionaries[lang] || rawDictionaries.en;

  if (lang === 'en') {
    return en as Dictionary;
  }

  // Safely fallback missing properties to English
  return deepMerge(en, selectedDict) as Dictionary;
}

/**
 * Helper to safely resolve nested dictionary keys with parameter interpolation.
 * If translation missing, gracefully falls back to English before returning key.
 */
export function t(
  dict: Dictionary,
  path: string,
  params?: Record<string, string | number>
): string {
  const parts = path.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current === undefined || current === null) {
      break;
    }
    current = current[part];
  }

  // Fallback to English dictionary if missing in current dictionary
  if (typeof current !== 'string') {
    let fallback: any = en;
    for (const part of parts) {
      if (fallback === undefined || fallback === null) break;
      fallback = fallback[part];
    }
    if (typeof fallback === 'string') {
      current = fallback;
    } else {
      return path;
    }
  }

  let result = current;
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    });
  }

  return result;
}

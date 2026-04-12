import { describe, expect, it } from 'vitest';

import {
  defaultLocale,
  isLocale,
  localeDirs,
  localeNames,
  locales,
} from '@/lib/i18n/config';

describe('i18n config', () => {
  it('has English and Arabic locales', () => {
    expect(locales).toContain('en');
    expect(locales).toContain('ar');
    expect(locales).toHaveLength(2);
  });

  it('defaults to English', () => {
    expect(defaultLocale).toBe('en');
  });

  it('maps locales to correct text direction', () => {
    expect(localeDirs.en).toBe('ltr');
    expect(localeDirs.ar).toBe('rtl');
  });

  it('has human-readable names', () => {
    expect(localeNames.en).toBe('English');
    expect(localeNames.ar).toBe('العربية');
  });

  describe('isLocale', () => {
    it('returns true for valid locales', () => {
      expect(isLocale('en')).toBe(true);
      expect(isLocale('ar')).toBe(true);
    });

    it('returns false for invalid locales', () => {
      expect(isLocale('fr')).toBe(false);
      expect(isLocale('es')).toBe(false);
      expect(isLocale('')).toBe(false);
      expect(isLocale('EN')).toBe(false);
    });
  });
});

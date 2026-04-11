import { describe, expect, it } from 'vitest';

import en from '@/../messages/en.json';
import ar from '@/../messages/ar.json';

/**
 * Enforce parity between English and Arabic translation files.
 * Prevents drift: if a key exists in one, it must exist in the other.
 */

type AnyObject = Record<string, unknown>;

function collectKeys(obj: AnyObject, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      keys.push(...collectKeys(value as AnyObject, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe('translation parity', () => {
  const enKeys = collectKeys(en as AnyObject);
  const arKeys = collectKeys(ar as AnyObject);

  it('has identical key sets in EN and AR', () => {
    const onlyInEn = enKeys.filter((k) => !arKeys.includes(k));
    const onlyInAr = arKeys.filter((k) => !enKeys.includes(k));

    expect(
      onlyInEn,
      `Keys only in en.json: ${onlyInEn.join(', ')}`,
    ).toEqual([]);
    expect(
      onlyInAr,
      `Keys only in ar.json: ${onlyInAr.join(', ')}`,
    ).toEqual([]);
  });

  it('has no empty string values', () => {
    const findEmpty = (obj: AnyObject, prefix = ''): string[] => {
      const empty: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string' && value.trim() === '') {
          empty.push(path);
        } else if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          empty.push(...findEmpty(value as AnyObject, path));
        }
      }
      return empty;
    };

    expect(findEmpty(en as AnyObject)).toEqual([]);
    expect(findEmpty(ar as AnyObject)).toEqual([]);
  });

  it('has core required namespaces', () => {
    const required = [
      'meta.title',
      'nav.login',
      'auth.login.title',
      'auth.register.title',
      'dashboard.title',
      'assessments.title',
      'groups.title',
      'employees.title',
      'results.title',
      'common.loading',
      'errors.notFound.title',
    ];

    for (const key of required) {
      expect(enKeys, `en.json missing ${key}`).toContain(key);
      expect(arKeys, `ar.json missing ${key}`).toContain(key);
    }
  });
});

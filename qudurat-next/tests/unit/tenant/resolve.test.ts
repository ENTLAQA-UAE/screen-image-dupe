import { describe, expect, it } from 'vitest';

import { validateSubdomain } from '@/lib/tenant/resolve';

describe('validateSubdomain', () => {
  it('accepts a valid subdomain', () => {
    expect(validateSubdomain('acme')).toBeNull();
    expect(validateSubdomain('my-company')).toBeNull();
    expect(validateSubdomain('abc123')).toBeNull();
    expect(validateSubdomain('a1b2c3')).toBeNull();
  });

  it('rejects empty subdomain', () => {
    expect(validateSubdomain('')).toContain('required');
  });

  it('rejects subdomain shorter than 3 characters', () => {
    expect(validateSubdomain('ab')).toContain('at least 3');
    expect(validateSubdomain('a')).toContain('at least 3');
  });

  it('rejects subdomain longer than 63 characters', () => {
    const long = 'a'.repeat(64);
    expect(validateSubdomain(long)).toContain('at most 63');
  });

  it('rejects uppercase letters', () => {
    expect(validateSubdomain('Acme')).toContain('lowercase');
    expect(validateSubdomain('ACME')).toContain('lowercase');
  });

  it('rejects special characters', () => {
    expect(validateSubdomain('acme_corp')).toContain('lowercase');
    expect(validateSubdomain('acme.corp')).toContain('lowercase');
    expect(validateSubdomain('acme@corp')).toContain('lowercase');
  });

  it('rejects leading or trailing hyphen', () => {
    expect(validateSubdomain('-acme')).toContain('lowercase');
    expect(validateSubdomain('acme-')).toContain('lowercase');
  });

  it('rejects reserved subdomains', () => {
    expect(validateSubdomain('www')).toContain('reserved');
    expect(validateSubdomain('api')).toContain('reserved');
    expect(validateSubdomain('admin')).toContain('reserved');
    expect(validateSubdomain('app')).toContain('reserved');
    expect(validateSubdomain('docs')).toContain('reserved');
    expect(validateSubdomain('blog')).toContain('reserved');
    expect(validateSubdomain('status')).toContain('reserved');
    expect(validateSubdomain('cdn')).toContain('reserved');
    expect(validateSubdomain('staging')).toContain('reserved');
  });

  it('accepts edge cases within bounds', () => {
    expect(validateSubdomain('abc')).toBeNull(); // Exactly 3 chars
    const sixtyThree = 'a'.repeat(63);
    expect(validateSubdomain(sixtyThree)).toBeNull(); // Exactly 63 chars
  });
});

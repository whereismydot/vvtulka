import packageJson from '../../package.json';
import { describe, expect, it } from 'vitest';
import { SITE_VERSION, resolveSiteVersion } from './site-version';

describe('site version', () => {
  it('uses package version as the source of truth', () => {
    const expectedVersion = typeof packageJson.version === 'string' && packageJson.version.trim().length > 0
      ? packageJson.version.trim()
      : 'dev';

    expect(SITE_VERSION).toBe(expectedVersion);
  });

  it('falls back to dev for non-string or empty values', () => {
    expect(resolveSiteVersion(undefined)).toBe('dev');
    expect(resolveSiteVersion(null)).toBe('dev');
    expect(resolveSiteVersion(101)).toBe('dev');
    expect(resolveSiteVersion('')).toBe('dev');
    expect(resolveSiteVersion('   ')).toBe('dev');
  });

  it('normalizes version with trim', () => {
    expect(resolveSiteVersion('  1.2.3  ')).toBe('1.2.3');
  });
});

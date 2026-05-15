import packageJson from '../../package.json';

interface PackageJsonLike {
  readonly version?: unknown;
}

/**
 * Normalizes a raw version value to a UI-safe string.
 */
export function resolveSiteVersion(raw: unknown): string {
  if (typeof raw !== 'string') {
    return 'dev';
  }

  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : 'dev';
}

export const SITE_VERSION = resolveSiteVersion((packageJson as PackageJsonLike).version);

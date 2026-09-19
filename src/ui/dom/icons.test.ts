/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import { createThemeIcon } from './icons';

describe('theme icons', () => {
  it('creates a decorative svg for the moon', () => {
    const icon = createThemeIcon('moon');

    expect(icon.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelectorAll('path')).toHaveLength(1);
    expect(icon.querySelector('circle')).toBeNull();
  });

  it('adds a circle to the sun icon', () => {
    const icon = createThemeIcon('sun');

    expect(icon.querySelector('circle')?.getAttribute('r')).toBe('4');
    expect(icon.querySelectorAll('path')).toHaveLength(1);
  });
});

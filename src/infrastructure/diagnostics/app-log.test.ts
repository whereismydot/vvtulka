/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import { createAppLog, installGlobalErrorLogging, redact, type ReportContext } from './app-log';

const CONTEXT: ReportContext = {
  version: '1.6.0',
  nowIso: '2026-09-19T10:00:00.000Z',
  timeZone: 'Europe/Moscow',
  url: 'https://sanlover.ru/vvtulka/',
  language: 'ru-RU',
  theme: 'dark',
  viewport: '375x812',
  online: true,
  userAgent: 'TestBrowser/1.0'
};

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key)
  };
}

const fixedNow = (): Date => new Date('2026-09-19T10:00:00.000Z');

describe('redact', () => {
  it('hides api keys in urls and key-like strings', () => {
    expect(redact('GET https://x/y?ranges=A1&key=AIzaSyABCDEFGHIJKLMNOP&z=1')).toBe('GET https://x/y?ranges=A1&key=***&z=1');
    expect(redact('ключ AIzaSyABCDEFGHIJKLMNOPQRS утёк')).toBe('ключ *** утёк');
  });

  it('collapses whitespace and truncates long messages', () => {
    expect(redact('a\n  b')).toBe('a b');
    expect(redact('x'.repeat(500))).toHaveLength(401);
  });
});

describe('app log', () => {
  it('keeps only the latest entries within the limit', () => {
    const log = createAppLog({ storage: null, now: fixedNow, context: () => CONTEXT, limit: 3 });
    for (let i = 1; i <= 5; i += 1) {
      log.info('t', `m${i}`);
    }
    expect(log.entries().map((entry) => entry.message)).toEqual(['m3', 'm4', 'm5']);
  });

  it('builds a report with a header, counters and redacted lines', () => {
    const log = createAppLog({ storage: null, now: fixedNow, context: () => CONTEXT });
    log.info('sheets', 'GET ?key=AIzaSyABCDEFGHIJKLMNOP: 200');
    log.error('urgent', 'Ошибка на шаге 2');

    const report = log.buildReport();
    expect(report).toContain('Версия: 1.6.0');
    expect(report).toContain('окно: 375x812');
    expect(report).toContain('Записей: 2, ошибок: 1');
    expect(report).toContain('INFO  [sheets] GET ?key=***: 200');
    expect(report).toContain('ERROR [urgent] Ошибка на шаге 2');
    expect(report).not.toContain('AIza');
  });

  it('survives a reload through storage and ignores broken data', () => {
    const storage = memoryStorage();
    createAppLog({ storage, now: fixedNow, context: () => CONTEXT }).warn('a', 'one');
    const restored = createAppLog({ storage, now: fixedNow, context: () => CONTEXT });
    expect(restored.entries()).toHaveLength(1);

    storage.setItem('vv-local-tool.support-log', '{oops');
    expect(createAppLog({ storage, now: fixedNow, context: () => CONTEXT }).entries()).toEqual([]);
  });

  it('keeps working when storage throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => undefined
    };
    const log = createAppLog({ storage, now: fixedNow, context: () => CONTEXT });
    log.info('a', 'still works');
    expect(log.entries()).toHaveLength(1);
  });

  it('clears entries', () => {
    const log = createAppLog({ storage: null, now: fixedNow, context: () => CONTEXT });
    log.info('a', 'x');
    log.clear();
    expect(log.entries()).toEqual([]);
  });
});

describe('installGlobalErrorLogging', () => {
  it('records script errors, rejected promises and network changes', () => {
    const log = createAppLog({ storage: null, now: fixedNow, context: () => CONTEXT });
    installGlobalErrorLogging(window, log);

    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename: 'https://x/assets/app.js', lineno: 3, colno: 7 }));
    const rejection = new Event('unhandledrejection') as Event & { reason?: unknown };
    rejection.reason = new TypeError('bad');
    window.dispatchEvent(rejection);
    window.dispatchEvent(new Event('offline'));

    const messages = log.entries().map((entry) => `${entry.scope}: ${entry.message}`);
    expect(messages).toContain('window: boom (app.js:3:7)');
    expect(messages).toContain('promise: TypeError: bad');
    expect(messages).toContain('network: Соединение потеряно');
  });
});

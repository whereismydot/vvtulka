export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly time: string;
  readonly level: LogLevel;
  readonly scope: string;
  readonly message: string;
}

export interface ReportContext {
  readonly version: string;
  readonly nowIso: string;
  readonly timeZone: string;
  readonly url: string;
  readonly language: string;
  readonly theme: string;
  readonly viewport: string;
  readonly online: boolean;
  readonly userAgent: string;
}

export interface AppLog {
  info(scope: string, message: string): void;
  warn(scope: string, message: string): void;
  error(scope: string, message: string): void;
  entries(): readonly LogEntry[];
  buildReport(): string;
  clear(): void;
}

export interface AppLogOptions {
  readonly storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  readonly now?: () => Date;
  readonly context?: (nowIso: string) => ReportContext;
  readonly limit?: number;
}

const STORAGE_KEY = 'vv-local-tool.support-log';
const DEFAULT_LIMIT = 300;
const MAX_MESSAGE_LENGTH = 400;

/**
 * Вырезает из текста всё, что нельзя показывать в отчёте: ключ API в запросах и строки, похожие на ключи Google.
 *
 * @param value Исходный текст.
 * @returns Очищенный и обрезанный текст.
 */
export function redact(value: string): string {
  const cleaned = value
    .replace(/([?&]key=)[\w-]*/gi, '$1***')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '***')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > MAX_MESSAGE_LENGTH ? `${cleaned.slice(0, MAX_MESSAGE_LENGTH)}…` : cleaned;
}

function isLogEntry(value: unknown): value is LogEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.time === 'string' &&
    typeof entry.scope === 'string' &&
    typeof entry.message === 'string' &&
    (entry.level === 'info' || entry.level === 'warn' || entry.level === 'error')
  );
}

function defaultStorage(): AppLogOptions['storage'] {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

function defaultContext(nowIso: string): ReportContext {
  const hasWindow = typeof window !== 'undefined';
  const nav = typeof navigator === 'undefined' ? null : navigator;
  let timeZone = 'unknown';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Часовой пояс необязателен для отчёта.
  }
  return {
    version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev',
    nowIso,
    timeZone,
    url: hasWindow ? `${window.location.origin}${window.location.pathname}` : 'n/a',
    language: nav?.language ?? 'n/a',
    theme: hasWindow ? (document.documentElement.dataset.theme ?? 'auto') : 'n/a',
    viewport: hasWindow ? `${window.innerWidth}x${window.innerHeight}` : 'n/a',
    online: nav?.onLine ?? true,
    userAgent: nav?.userAgent ?? 'n/a'
  };
}

/**
 * Создаёт журнал работы сайта: кольцевой буфер, который переживает перезагрузку вкладки и собирается в текстовый отчёт.
 * В журнал нельзя писать введённые пользователем данные (тексты, ФИО, теги): только счётчики, статусы и коды сбоев.
 *
 * @param options Хранилище, часы, сборщик контекста и лимит записей (для тестов).
 * @returns Журнал.
 */
export function createAppLog(options: AppLogOptions = {}): AppLog {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const now = options.now ?? (() => new Date());
  const context = options.context ?? defaultContext;
  const limit = options.limit ?? DEFAULT_LIMIT;

  let items: LogEntry[] = [];
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      items = parsed.filter(isLogEntry).slice(-limit);
    }
  } catch {
    items = [];
  }

  const persist = (): void => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Хранилище может быть недоступно; журнал остаётся в памяти.
    }
  };

  const add = (level: LogLevel, scope: string, message: string): void => {
    items.push({ time: now().toISOString(), level, scope: redact(scope), message: redact(message) });
    if (items.length > limit) {
      items = items.slice(-limit);
    }
    persist();
  };

  return {
    info: (scope, message) => add('info', scope, message),
    warn: (scope, message) => add('warn', scope, message),
    error: (scope, message) => add('error', scope, message),
    entries: () => items,
    buildReport(): string {
      const ctx = context(now().toISOString());
      const header = [
        'Отчёт о работе VVTulka',
        `Версия: ${ctx.version}`,
        `Время: ${ctx.nowIso}`,
        `Часовой пояс: ${ctx.timeZone}`,
        `Страница: ${redact(ctx.url)}`,
        `Язык: ${ctx.language}, тема: ${ctx.theme}, окно: ${ctx.viewport}, онлайн: ${ctx.online ? 'да' : 'нет'}`,
        `Браузер: ${redact(ctx.userAgent)}`,
        `Записей: ${items.length}, ошибок: ${items.filter((item) => item.level === 'error').length}`,
        '---'
      ];
      const lines = items.map((item) => `${item.time} ${item.level.toUpperCase().padEnd(5)} [${item.scope}] ${item.message}`);
      return [...header, ...lines].join('\n');
    },
    clear(): void {
      items = [];
      persist();
    }
  };
}

export const appLog: AppLog = createAppLog();

/**
 * Подписывается на необработанные ошибки страницы, отклонённые промисы, нарушения CSP и смену состояния сети.
 *
 * @param target Окно (для тестов можно передать своё).
 * @param log Журнал.
 */
export function installGlobalErrorLogging(target: Window = window, log: AppLog = appLog): void {
  target.addEventListener('error', (event) => {
    const where = event.filename ? ` (${event.filename.split('/').pop()}:${event.lineno}:${event.colno})` : '';
    log.error('window', `${event.message || 'Ошибка скрипта'}${where}`);
  });
  target.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    log.error('promise', reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason));
  });
  target.document.addEventListener('securitypolicyviolation', (event) => {
    log.error('csp', `${event.violatedDirective} заблокировал ${event.blockedURI || 'ресурс'}`);
  });
  target.addEventListener('offline', () => log.warn('network', 'Соединение потеряно'));
  target.addEventListener('online', () => log.info('network', 'Соединение восстановлено'));
}

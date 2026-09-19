export type UrgentGroup = 'Поздние' | 'Ранние';

/** Сотрудник из листа графика. */
export interface SchedulePerson {
  readonly name: string;
  readonly tag: string;
  /** Номер команды (1–4) или `null`, если человек вне команд 1–4 (ночная поддержка, стажёры и т.д.). */
  readonly team: number | null;
  /** Временный лидер (бирюзовая заливка имени) — на срочные не ставится. */
  readonly temporaryLeader: boolean;
  /** Номер строки в листе (с 1). */
  readonly row: number;
  /** День месяца → смена вида `08/20`. */
  readonly shifts: Readonly<Record<number, string>>;
  /** Дни месяца, в которые сотрудник вышел на срочные (фиолетовая ячейка). */
  readonly urgentDays: readonly number[];
}

/** График операторов за один месяц. */
export interface MonthSchedule {
  readonly sheetTitle: string;
  readonly sheetGid: number;
  readonly spreadsheetId: string;
  readonly people: readonly SchedulePerson[];
  /** Теги лидеров команд (розовые строки «К») в нижнем регистре. */
  readonly leaderTags: readonly string[];
  /** `true`, если лист длиннее прочитанного диапазона и хвост мог быть потерян. */
  readonly truncated: boolean;
  /** ФИО (без учёта регистра и «ё»), которые встречаются в листе несколько раз; учитывается первая строка. */
  readonly duplicateNames: readonly string[];
}

/** Строка распределения из текста бота. */
export interface BotDutyLine {
  readonly lineIndex: number;
  readonly group: UrgentGroup;
  readonly name: string;
  readonly tag: string;
  readonly shift: string;
}

export interface ParsedBotText {
  readonly lines: readonly string[];
  readonly duties: readonly BotDutyLine[];
  /** Нормализованные ФИО лидеров. */
  readonly leaders: ReadonlySet<string>;
}

export interface PersonUsage {
  readonly name: string;
  readonly tag: string;
  /** Номер команды (1–4) или `null`, если человек вне команд 1–4. */
  readonly team: number | null;
  readonly count: number;
  /** Дни срочных до выбранной даты. */
  readonly days: readonly number[];
  readonly link: string;
}

export interface PlanRow {
  readonly group: UrgentGroup;
  readonly name: string;
  readonly tag: string;
  readonly shift: string;
  /** `null`, если ФИО не найдено в таблице. */
  readonly current: PersonUsage | null;
  readonly replacement: PersonUsage | null;
}

export interface PlanCheck {
  readonly ok: boolean;
  readonly text: string;
}

export interface UrgentPlan {
  readonly dateLabel: string;
  readonly rows: readonly PlanRow[];
  readonly text: string;
  readonly originalText: string;
  readonly warnings: readonly string[];
  readonly checks: readonly PlanCheck[];
}

export interface PlanDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export type ProgressStage = 1 | 2 | 3 | 4;
type ProgressState = 'run' | 'info' | 'ok' | 'err';

export interface ProgressEvent {
  readonly stage: ProgressStage;
  readonly state: ProgressState;
  readonly message: string;
}

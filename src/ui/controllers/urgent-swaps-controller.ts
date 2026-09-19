import type { StatusTone } from '../../application/app-results';
import { runUrgentSwaps, tomorrowIso } from '../../application/urgent-swaps-service';
import { SCHEDULE_SPREADSHEET_ID, SHEETS_API_KEY } from '../../config/google-sheets';
import type { PlanSortKey, SortDirection } from '../../domain/urgent-swaps/plan-sort';
import type { ProgressEvent, ProgressStage, UrgentPlan } from '../../domain/urgent-swaps/types';
import { findBotTextDate } from '../../domain/urgent-swaps/bot-text-template';
import { appLog } from '../../infrastructure/diagnostics/app-log';
import { createScheduleClient, type ScheduleLoader } from '../../infrastructure/google-sheets/schedule-client';
import type { AppElements } from '../dom/elements';
import {
  applyProgressEvent,
  renderOutput,
  renderPlanTable,
  renderSteps,
  renderWarnings,
  type StepView
} from '../render/urgent-swaps-renderer';

interface UrgentSwapsControllerDependencies {
  readonly elements: AppElements;
  readonly copyText: (value: string) => Promise<boolean>;
  readonly setStatus: (message: string, tone?: StatusTone) => void;
  readonly loadSchedule?: ScheduleLoader;
  readonly now?: () => Date;
}

/**
 * Связывает вкладку «Срочные: замены» с сервисом: запуск расчёта, прогресс, поиск, копирование.
 *
 * @param dependencies Элементы DOM, копирование, вывод статуса и (для тестов) загрузчик графика и часы.
 */
export function createUrgentSwapsController(dependencies: UrgentSwapsControllerDependencies): void {
  const { elements, copyText, setStatus } = dependencies;
  const loadSchedule = dependencies.loadSchedule ?? createScheduleClient({ spreadsheetId: SCHEDULE_SPREADSHEET_ID, apiKey: SHEETS_API_KEY });
  const now = dependencies.now ?? (() => new Date());

  let plan: UrgentPlan | null = null;
  let running = false;

  elements.urgentDateInput.value = tomorrowIso(now());


  /**
   * Читает выбранную сортировку из значения списка вида `ключ:направление` (`text` — порядок текста бота).
   */
  const readSort = (): { key: PlanSortKey; direction: SortDirection } => {
    const [key, direction] = elements.urgentSortSelect.value.split(':');
    return { key: key as PlanSortKey, direction: direction === 'desc' ? 'desc' : 'asc' };
  };

  const renderTable = (): void => {
    if (plan === null) {
      return;
    }
    renderPlanTable(elements.urgentTable, plan, {
      query: elements.urgentSearchInput.value,
      onlySwaps: elements.urgentOnlySwapsInput.checked,
      sort: readSort()
    });
  };


  const copy = async (value: string): Promise<void> => {
    const copied = await copyText(value);
    if (!copied) {
      appLog.warn('urgent', 'Не удалось скопировать в буфер обмена');
    }
    setStatus(copied ? `Скопировано: ${value.length > 60 ? `${value.slice(0, 57)}…` : value}` : 'Не удалось скопировать.', copied ? 'success' : 'error');
  };

  const showPlan = (result: UrgentPlan): void => {
    plan = result;
    const swaps = result.rows.filter((row) => row.replacement !== null).length;
    elements.urgentStat.textContent = `На ${result.dateLabel} · дежурных: ${result.rows.length} · замен: ${swaps}`;
    elements.urgentKpiTotal.textContent = String(result.rows.length);
    elements.urgentKpiSwaps.textContent = String(swaps);
    elements.urgentKpiUnchanged.textContent = String(result.rows.length - swaps);
    renderWarnings(elements.urgentWarnings, result.warnings);
    renderTable();
    renderOutput(elements.urgentOutput, result);
    elements.urgentResult.hidden = false;
    elements.urgentOutputPanel.hidden = false;
  };

  const run = async (): Promise<void> => {
    if (running) {
      return;
    }
    if (elements.urgentTextInput.value.trim() === '') {
      setStatus('Сначала вставьте текст от бота.', 'warning');
      return;
    }

    running = true;
    elements.urgentRunButton.disabled = true;
    elements.urgentResult.hidden = true;
    elements.urgentOutputPanel.hidden = true;
    elements.urgentSteps.hidden = false;

    const startedAt = Date.now();

    let views: Partial<Record<ProgressStage, StepView>> = {};
    let lastStage: ProgressStage | null = null;
    renderSteps(elements.urgentSteps, views);
    appLog.info('urgent', `Запуск: дата ${elements.urgentDateInput.value}, текст ${elements.urgentTextInput.value.length} симв.`);

    const onProgress = (event: ProgressEvent): void => {
      lastStage = event.stage;
      views = applyProgressEvent(views, event);
      renderSteps(elements.urgentSteps, views);
      if (event.state !== 'info') {
        appLog.info('urgent', `шаг ${event.stage} ${event.state}: ${event.message}`);
      }
    };

    try {
      const result = await runUrgentSwaps(
        { dateIso: elements.urgentDateInput.value, botText: elements.urgentTextInput.value },
        { loadSchedule, onProgress }
      );
      showPlan(result);
      appLog.info('urgent', `Готово за ${((Date.now() - startedAt) / 1000).toFixed(1)} с: дежурных ${result.rows.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка.';
      if (lastStage !== null) {
        views = applyProgressEvent(views, { stage: lastStage, state: 'err', message });
        renderSteps(elements.urgentSteps, views);
      }
      appLog.error('urgent', `Ошибка на шаге ${lastStage ?? 0}: ${message}`);
      setStatus(message, 'error');
    } finally {
      running = false;
      elements.urgentRunButton.disabled = false;
    }
  };

  elements.urgentRunButton.addEventListener('click', () => {
    void run();
  });
  /** Дата берётся из строки «Распределение на …» вставленного текста, чтобы не путаться с полем даты. */
  elements.urgentTextInput.addEventListener('input', () => {
    const textDate = findBotTextDate(elements.urgentTextInput.value);
    if (textDate !== null) {
      const pad = (value: number): string => String(value).padStart(2, '0');
      elements.urgentDateInput.value = `${textDate.year}-${pad(textDate.month)}-${pad(textDate.day)}`;
    }
  });
  elements.urgentSearchInput.addEventListener('input', renderTable);
  elements.urgentOnlySwapsInput.addEventListener('change', renderTable);
  elements.urgentSortSelect.addEventListener('change', renderTable);
  elements.urgentCopyButton.addEventListener('click', () => {
    if (plan !== null) {
      void copy(plan.text);
    }
  });
  elements.urgentTable.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const copyable = target.closest<HTMLElement>('[data-copy]');
    if (copyable !== null && copyable.dataset.copy) {
      void copy(copyable.dataset.copy);
    }
  });
}

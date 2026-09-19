import type { StatusTone } from '../../application/app-results';
import { calculateShelfLife, type CalculateShelfLifeInput, type ShelfLifeField } from '../../application/shelf-life-service';
import { explainShelfLifeDateInput, formatDateForInput, parseShelfLifeDateInput, yesterdayOf } from '../../domain/shelf-life/date-time-io';
import type { AppElements } from '../dom/elements';
import { formatDateInputWithCaret, formatDateTyping, normalizeDateInput } from '../formatters/shelf-life-date-input';

interface ShelfLifeControllerDependencies {
  readonly elements: AppElements;
  readonly setStatus: (message: string, tone?: StatusTone) => void;
  readonly now?: () => Date;
}

const INVALID_FIELD_CLASS = 'field-invalid';

function setTimeRowVisibility(elements: AppElements, shouldShow: boolean): void {
  elements.shelfLifeTimeRow.hidden = !shouldShow;
}

function setFieldInvalidState(field: HTMLElement, isInvalid: boolean): void {
  field.classList.toggle(INVALID_FIELD_CLASS, isInvalid);
}

function clearValidationState(elements: AppElements): void {
  setFieldInvalidState(elements.shelfLifeDateInput, false);
  setFieldInvalidState(elements.shelfLifeTermInput, false);
  setFieldInvalidState(elements.shelfLifeTimeInput, false);
  setFieldInvalidState(elements.shelfLifeUnitSelect, false);
  hideDateError(elements);
}

function hideResult(elements: AppElements): void {
  elements.shelfLifeResult.hidden = true;
  elements.shelfLifeResult.classList.remove('shelf-life-result-valid');
  elements.shelfLifeResultText.textContent = '';
}

function showResult(elements: AppElements, text: string): void {
  elements.shelfLifeResult.hidden = false;
  elements.shelfLifeResult.classList.remove('shelf-life-result-valid');
  elements.shelfLifeResult.classList.add('shelf-life-result-valid');
  elements.shelfLifeResultText.textContent = text;
}

function showDateError(elements: AppElements, message: string): void {
  elements.shelfLifeDateError.textContent = message;
  elements.shelfLifeDateError.hidden = false;
  elements.shelfLifeDateInput.setAttribute('aria-invalid', 'true');
  setFieldInvalidState(elements.shelfLifeDateInput, true);
}

function hideDateError(elements: AppElements): void {
  elements.shelfLifeDateError.textContent = '';
  elements.shelfLifeDateError.hidden = true;
  elements.shelfLifeDateInput.removeAttribute('aria-invalid');
}

function highlightInvalidFields(elements: AppElements, fields: readonly ShelfLifeField[]): void {
  fields.forEach((field) => {
    switch (field) {
      case 'date':
        setFieldInvalidState(elements.shelfLifeDateInput, true);
        break;
      case 'term':
        setFieldInvalidState(elements.shelfLifeTermInput, true);
        break;
      case 'time':
        setFieldInvalidState(elements.shelfLifeTimeInput, true);
        break;
      case 'unit':
        setFieldInvalidState(elements.shelfLifeUnitSelect, true);
        break;
    }
  });
}

function readCalculationInput(elements: AppElements): CalculateShelfLifeInput {
  return {
    manufactureDateRaw: elements.shelfLifeDateInput.value,
    shelfLifeTermRaw: elements.shelfLifeTermInput.value,
    shelfLifeUnitRaw: elements.shelfLifeUnitSelect.value,
    includeTime: elements.shelfLifeUseTimeInput.checked,
    manufactureTimeRaw: elements.shelfLifeTimeInput.value
  };
}

/**
 * Связывает форму «Срок годности» с расчётом: умное поле даты, «Вчера», календарь, ошибка под полем
 * и результат сразу при каждом изменении корректных данных.
 *
 * @param dependencies Элементы DOM, вывод статуса и (для тестов) часы.
 */
export function createShelfLifeController(dependencies: ShelfLifeControllerDependencies): void {
  const { elements, setStatus } = dependencies;
  const now = dependencies.now ?? (() => new Date());
  const dateInput = elements.shelfLifeDateInput;

  setTimeRowVisibility(elements, elements.shelfLifeUseTimeInput.checked);
  clearValidationState(elements);
  hideResult(elements);

  /** Пересчитывает результат без ошибок в интерфейсе: пока данные неполные, результат просто скрыт. */
  const recalculateLive = (): void => {
    const result = calculateShelfLife(readCalculationInput(elements));
    if (result.ok) {
      showResult(elements, `Годен до ${result.formattedValidUntil}`);
    } else {
      hideResult(elements);
    }
  };

  /** Показывает подсказку под полем: для готовой, но несуществующей даты сразу, для неполной — если просят. */
  const updateDateHint = (includeIncomplete: boolean): void => {
    const explanation = explainShelfLifeDateInput(dateInput.value);
    if (explanation.message !== null && (explanation.status === 'invalid' || includeIncomplete)) {
      showDateError(elements, explanation.message);
      return;
    }
    hideDateError(elements);
    setFieldInvalidState(dateInput, false);
  };

  const setDateValue = (value: string): void => {
    dateInput.value = value;
    hideDateError(elements);
    setFieldInvalidState(dateInput, false);
    recalculateLive();
    updateDateHint(false);
  };

  elements.shelfLifeUseTimeInput.addEventListener('change', () => {
    const includeTime = elements.shelfLifeUseTimeInput.checked;
    setTimeRowVisibility(elements, includeTime);
    if (!includeTime) {
      setFieldInvalidState(elements.shelfLifeTimeInput, false);
    }
    recalculateLive();
  });

  dateInput.addEventListener('input', (event) => {
    const value = dateInput.value;
    const caret = dateInput.selectionStart;
    const isDeleting = event instanceof InputEvent && event.inputType.startsWith('delete');
    const isTypingAtEnd = !isDeleting && (caret === null || caret >= value.length);

    let formatted: string;
    let nextCaret: number;
    if (isTypingAtEnd) {
      formatted = formatDateTyping(value);
      nextCaret = formatted.length;
    } else {
      ({ formatted, caret: nextCaret } = formatDateInputWithCaret(value, caret));
    }

    if (dateInput.value !== formatted) {
      dateInput.value = formatted;
    }
    dateInput.setSelectionRange(nextCaret, nextCaret);

    setFieldInvalidState(dateInput, false);
    recalculateLive();
    updateDateHint(false);
  });

  dateInput.addEventListener('blur', () => {
    const normalized = normalizeDateInput(dateInput.value);
    if (normalized !== dateInput.value) {
      dateInput.value = normalized;
    }
    recalculateLive();
    updateDateHint(true);
  });

  elements.shelfLifeYesterdayButton.addEventListener('click', () => {
    setDateValue(formatDateForInput(yesterdayOf(now())));
  });

  elements.shelfLifeCalendarButton.addEventListener('click', () => {
    const picker = elements.shelfLifeDatePicker;
    const parsed = parseShelfLifeDateInput(dateInput.value);
    if (parsed.ok) {
      const { year, month, day } = parsed.value;
      picker.value = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    if (typeof picker.showPicker === 'function') {
      try {
        picker.showPicker();
        return;
      } catch {
        // showPicker может быть запрещён браузером; ниже запасной вариант.
      }
    }
    picker.focus();
    picker.click();
  });

  elements.shelfLifeDatePicker.addEventListener('change', () => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(elements.shelfLifeDatePicker.value);
    if (match !== null) {
      setDateValue(`${match[3]}.${match[2]}.${match[1]}`);
    }
  });

  elements.shelfLifeTermInput.addEventListener('input', () => {
    setFieldInvalidState(elements.shelfLifeTermInput, false);
    recalculateLive();
  });
  elements.shelfLifeTimeInput.addEventListener('input', () => {
    setFieldInvalidState(elements.shelfLifeTimeInput, false);
    recalculateLive();
  });
  elements.shelfLifeUnitSelect.addEventListener('change', () => {
    setFieldInvalidState(elements.shelfLifeUnitSelect, false);
    recalculateLive();
  });

  elements.shelfLifeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideResult(elements);
    clearValidationState(elements);

    const normalized = normalizeDateInput(dateInput.value);
    if (normalized !== dateInput.value) {
      dateInput.value = normalized;
    }

    const result = calculateShelfLife(readCalculationInput(elements));

    if (!result.ok) {
      highlightInvalidFields(elements, result.invalidFields);
      if (result.invalidFields.includes('date')) {
        const explanation = explainShelfLifeDateInput(dateInput.value);
        showDateError(elements, explanation.message ?? result.message);
      }
      setStatus(result.message, 'warning');
      return;
    }

    showResult(elements, `Годен до ${result.formattedValidUntil}`);
  });
}

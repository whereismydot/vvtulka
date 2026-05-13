import type { StatusTone } from '../../application/app-results';
import { calculateShelfLife, type ShelfLifeField } from '../../application/shelf-life-service';
import type { AppElements } from '../dom/elements';
import { formatDateInputWithCaret } from '../formatters/shelf-life-date-input';

interface ShelfLifeControllerDependencies {
  readonly elements: AppElements;
  readonly setStatus: (message: string, tone?: StatusTone) => void;
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

export function createShelfLifeController(dependencies: ShelfLifeControllerDependencies): void {
  const { elements, setStatus } = dependencies;

  setTimeRowVisibility(elements, elements.shelfLifeUseTimeInput.checked);
  clearValidationState(elements);
  hideResult(elements);

  elements.shelfLifeUseTimeInput.addEventListener('change', () => {
    const includeTime = elements.shelfLifeUseTimeInput.checked;
    setTimeRowVisibility(elements, includeTime);
    if (!includeTime) {
      setFieldInvalidState(elements.shelfLifeTimeInput, false);
    }
  });

  elements.shelfLifeDateInput.addEventListener('input', () => {
    const { formatted, caret } = formatDateInputWithCaret(elements.shelfLifeDateInput.value, elements.shelfLifeDateInput.selectionStart);
    if (elements.shelfLifeDateInput.value !== formatted) {
      elements.shelfLifeDateInput.value = formatted;
    }
    elements.shelfLifeDateInput.setSelectionRange(caret, caret);
    setFieldInvalidState(elements.shelfLifeDateInput, false);
  });
  elements.shelfLifeTermInput.addEventListener('input', () => {
    setFieldInvalidState(elements.shelfLifeTermInput, false);
  });
  elements.shelfLifeTimeInput.addEventListener('input', () => {
    setFieldInvalidState(elements.shelfLifeTimeInput, false);
  });
  elements.shelfLifeUnitSelect.addEventListener('change', () => {
    setFieldInvalidState(elements.shelfLifeUnitSelect, false);
  });

  elements.shelfLifeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideResult(elements);
    clearValidationState(elements);

    const result = calculateShelfLife({
      manufactureDateRaw: elements.shelfLifeDateInput.value,
      shelfLifeTermRaw: elements.shelfLifeTermInput.value,
      shelfLifeUnitRaw: elements.shelfLifeUnitSelect.value,
      includeTime: elements.shelfLifeUseTimeInput.checked,
      manufactureTimeRaw: elements.shelfLifeTimeInput.value
    });

    if (!result.ok) {
      highlightInvalidFields(elements, result.invalidFields);
      setStatus(result.message, 'warning');
      return;
    }

    showResult(elements, `Годен до ${result.formattedValidUntil}`);
  });
}

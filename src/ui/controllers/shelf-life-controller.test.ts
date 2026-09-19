/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppElements } from '../dom/elements';
import { createShelfLifeController } from './shelf-life-controller';

const VALID_UNTIL_PREFIX = '\u0413\u043e\u0434\u0435\u043d \u0434\u043e ';

function buildUnitSelect(): HTMLSelectElement {
  const select = document.createElement('select');

  const options: Array<{ value: string; label: string }> = [
    { value: 'days', label: 'days' },
    { value: 'weeks', label: 'weeks' },
    { value: 'months', label: 'months' },
    { value: 'years', label: 'years' }
  ];

  options.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });

  select.value = 'months';
  return select;
}

function createElements(): AppElements {
  const form = document.createElement('form');
  const dateInput = document.createElement('input');
  const dateError = document.createElement('p');
  dateError.hidden = true;
  const yesterdayButton = document.createElement('button');
  yesterdayButton.type = 'button';
  const calendarButton = document.createElement('button');
  calendarButton.type = 'button';
  const datePicker = document.createElement('input');
  datePicker.type = 'date';
  const termInput = document.createElement('input');
  termInput.type = 'number';
  const unitSelect = buildUnitSelect();
  const useTimeInput = document.createElement('input');
  useTimeInput.type = 'checkbox';
  const timeRow = document.createElement('div');
  timeRow.hidden = true;
  const timeInput = document.createElement('input');
  timeInput.type = 'time';
  const checkButton = document.createElement('button');
  checkButton.type = 'submit';
  const result = document.createElement('section');
  result.hidden = true;
  const resultText = document.createElement('p');
  result.appendChild(resultText);

  timeRow.appendChild(timeInput);
  form.append(dateInput, dateError, yesterdayButton, calendarButton, datePicker, termInput, unitSelect, useTimeInput, timeRow, checkButton);

  const host = document.createElement('div');
  host.append(form, result);
  document.body.appendChild(host);

  return {
    shelfLifeForm: form,
    shelfLifeDateInput: dateInput,
    shelfLifeDateError: dateError,
    shelfLifeYesterdayButton: yesterdayButton,
    shelfLifeCalendarButton: calendarButton,
    shelfLifeDatePicker: datePicker,
    shelfLifeTermInput: termInput,
    shelfLifeUnitSelect: unitSelect,
    shelfLifeUseTimeInput: useTimeInput,
    shelfLifeTimeRow: timeRow,
    shelfLifeTimeInput: timeInput,
    shelfLifeCheckButton: checkButton,
    shelfLifeResult: result,
    shelfLifeResultText: resultText
  } as unknown as AppElements;
}

function typeText(elements: AppElements, text: string): void {
  for (const char of text) {
    const input = elements.shelfLifeDateInput;
    input.value = `${input.value}${char}`;
    input.setSelectionRange(input.value.length, input.value.length);
    input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: char }));
  }
}

function pressBackspace(elements: AppElements): void {
  const input = elements.shelfLifeDateInput;
  input.value = input.value.slice(0, -1);
  input.setSelectionRange(input.value.length, input.value.length);
  input.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward' }));
}

function setup(now?: () => Date): AppElements {
  const elements = createElements();
  createShelfLifeController({ elements, setStatus: vi.fn(), now });
  elements.shelfLifeTermInput.value = '1';
  elements.shelfLifeUnitSelect.value = 'days';
  return elements;
}

function submitForm(elements: AppElements): void {
  elements.shelfLifeForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('shelf life controller', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('toggles time row by checkbox state', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    expect(elements.shelfLifeTimeRow.hidden).toBe(true);

    elements.shelfLifeUseTimeInput.checked = true;
    elements.shelfLifeUseTimeInput.dispatchEvent(new Event('change'));
    expect(elements.shelfLifeTimeRow.hidden).toBe(false);

    elements.shelfLifeUseTimeInput.checked = false;
    elements.shelfLifeUseTimeInput.dispatchEvent(new Event('change'));
    expect(elements.shelfLifeTimeRow.hidden).toBe(true);
  });

  it('highlights time when includeTime is enabled but time is empty', () => {
    const elements = createElements();
    const setStatus = vi.fn();

    createShelfLifeController({
      elements,
      setStatus
    });

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';
    elements.shelfLifeUseTimeInput.checked = true;
    elements.shelfLifeUseTimeInput.dispatchEvent(new Event('change'));
    elements.shelfLifeTimeInput.value = '';

    submitForm(elements);

    expect(elements.shelfLifeTimeInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
    expect(setStatus).toHaveBeenCalledWith('Некорректное время изготовления.', 'warning');
  });

  it('allows empty time when includeTime is disabled', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';
    elements.shelfLifeUseTimeInput.checked = false;
    elements.shelfLifeTimeInput.value = '';

    submitForm(elements);

    expect(elements.shelfLifeResult.hidden).toBe(false);
    expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}06.05.2026`);
  });

  it('handles submit from button click', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';

    elements.shelfLifeCheckButton.click();

    expect(elements.shelfLifeResult.hidden).toBe(false);
    expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}06.05.2026`);
  });

  it('autoformats date while typing digits only', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31122026';
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));

    expect(elements.shelfLifeDateInput.value).toBe('31.12.2026');
  });

  it('keeps caret at natural position after autoformatting digits-only input', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31122026';
    elements.shelfLifeDateInput.setSelectionRange(8, 8);
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));

    expect(elements.shelfLifeDateInput.value).toBe('31.12.2026');
    expect(elements.shelfLifeDateInput.selectionStart).toBe(10);
    expect(elements.shelfLifeDateInput.selectionEnd).toBe(10);
  });

  it('autoformats pasted date with slash separators', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31/12/2026';
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));

    expect(elements.shelfLifeDateInput.value).toBe('31.12.2026');
  });

  it('does not jump caret to end when editing in the middle', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31.12.2026';
    elements.shelfLifeDateInput.setSelectionRange(3, 3);
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));
    expect(elements.shelfLifeDateInput.selectionStart).toBe(3);

    elements.shelfLifeDateInput.value = '3.12.2026';
    elements.shelfLifeDateInput.setSelectionRange(1, 1);
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));
    expect(elements.shelfLifeDateInput.value).toBe('3.12.2026');
    expect(elements.shelfLifeDateInput.selectionStart).toBe(1);

    elements.shelfLifeDateInput.value = '31.2.2026';
    elements.shelfLifeDateInput.setSelectionRange(3, 3);
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));
    expect(elements.shelfLifeDateInput.value).toBe('31.2.2026');
    expect(elements.shelfLifeDateInput.selectionStart).toBe(3);
  });

  it('calculates successfully after autoformatting digits-only date', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31122026';
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));
    elements.shelfLifeTermInput.value = '1';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeResult.hidden).toBe(false);
    expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}01.01.2027`);
  });

  it('expands a two-digit year on submit', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03.05.26';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeDateInput.value).toBe('03.05.2026');
    expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(false);
    expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}06.05.2026`);
  });

  it('expands DD.MM.YY typed as digits on submit', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    typeText(elements, '030526');
    expect(elements.shelfLifeDateInput.value).toBe('03.05.26');
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeDateInput.value).toBe('03.05.2026');
    expect(elements.shelfLifeResult.hidden).toBe(false);
  });

  it('highlights date input when format is invalid', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03/05';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('highlights date input when calendar date is impossible', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31.02.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('rejects invalid calendar date after autoformatting 31042026', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31042026';
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));
    elements.shelfLifeTermInput.value = '1';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeDateInput.value).toBe('31.04.2026');
    expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('rejects non-leap date after autoformatting 29022025', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '29022025';
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));
    elements.shelfLifeTermInput.value = '1';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeDateInput.value).toBe('29.02.2025');
    expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('highlights term input when term is invalid', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeTermInput.value = '0';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);

    expect(elements.shelfLifeTermInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('highlights time input when time is invalid and includeTime is enabled', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';
    elements.shelfLifeUseTimeInput.checked = true;
    elements.shelfLifeUseTimeInput.dispatchEvent(new Event('change'));
    Object.defineProperty(elements.shelfLifeTimeInput, 'value', {
      configurable: true,
      get: () => '24:00'
    });

    submitForm(elements);

    expect(elements.shelfLifeTimeInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('highlights time input when includeTime is enabled and time getter returns undefined', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';
    elements.shelfLifeUseTimeInput.checked = true;
    elements.shelfLifeUseTimeInput.dispatchEvent(new Event('change'));
    Object.defineProperty(elements.shelfLifeTimeInput, 'value', {
      configurable: true,
      get: () => undefined as unknown as string
    });

    submitForm(elements);

    expect(elements.shelfLifeTimeInput.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('highlights unit when value is unknown', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';
    elements.shelfLifeUnitSelect.value = 'unknown';

    submitForm(elements);

    expect(elements.shelfLifeUnitSelect.classList.contains('field-invalid')).toBe(true);
    expect(elements.shelfLifeResult.hidden).toBe(true);
  });

  it('clears invalid state after user edits the field', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeDateInput.value = '31.02.2026';
    elements.shelfLifeTermInput.value = '3';
    elements.shelfLifeUnitSelect.value = 'days';

    submitForm(elements);
    expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(true);

    elements.shelfLifeDateInput.value = '03.05.2026';
    elements.shelfLifeDateInput.dispatchEvent(new Event('input'));

    expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(false);
  });

  it('clears invalid state for term, time and unit after field interaction', () => {
    const elements = createElements();

    createShelfLifeController({
      elements,
      setStatus: vi.fn()
    });

    elements.shelfLifeTermInput.classList.add('field-invalid');
    elements.shelfLifeTermInput.dispatchEvent(new Event('input'));
    expect(elements.shelfLifeTermInput.classList.contains('field-invalid')).toBe(false);

    elements.shelfLifeUseTimeInput.checked = true;
    elements.shelfLifeUseTimeInput.dispatchEvent(new Event('change'));
    elements.shelfLifeTimeInput.classList.add('field-invalid');
    elements.shelfLifeTimeInput.dispatchEvent(new Event('input'));
    expect(elements.shelfLifeTimeInput.classList.contains('field-invalid')).toBe(false);

    elements.shelfLifeUnitSelect.classList.add('field-invalid');
    elements.shelfLifeUnitSelect.dispatchEvent(new Event('change'));
    expect(elements.shelfLifeUnitSelect.classList.contains('field-invalid')).toBe(false);
  });

  describe('smart date field', () => {
    it('adds dots while typing digits and keeps the final value', () => {
      const elements = setup();

      typeText(elements, '01');
      expect(elements.shelfLifeDateInput.value).toBe('01.');
      typeText(elements, '09');
      expect(elements.shelfLifeDateInput.value).toBe('01.09.');
      typeText(elements, '2026');
      expect(elements.shelfLifeDateInput.value).toBe('01.09.2026');
    });

    it('pads a lone digit when a separator or a large first digit is typed', () => {
      const elements = setup();

      typeText(elements, '1.');
      expect(elements.shelfLifeDateInput.value).toBe('01.');

      elements.shelfLifeDateInput.value = '';
      typeText(elements, '7');
      expect(elements.shelfLifeDateInput.value).toBe('07.');
    });

    it('lets Backspace remove characters without re-adding the automatic dot', () => {
      const elements = setup();

      typeText(elements, '0109');
      expect(elements.shelfLifeDateInput.value).toBe('01.09.');

      pressBackspace(elements);
      expect(elements.shelfLifeDateInput.value).toBe('01.09');
      pressBackspace(elements);
      expect(elements.shelfLifeDateInput.value).toBe('01.0');
      pressBackspace(elements);
      expect(elements.shelfLifeDateInput.value).toBe('01');
      pressBackspace(elements);
      expect(elements.shelfLifeDateInput.value).toBe('0');
    });

    it('shows the result immediately once the date and the term are valid', () => {
      const elements = setup();

      typeText(elements, '3112202');
      expect(elements.shelfLifeResult.hidden).toBe(true);
      typeText(elements, '6');

      expect(elements.shelfLifeResult.hidden).toBe(false);
      expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}01.01.2027`);

      elements.shelfLifeTermInput.value = '2';
      elements.shelfLifeTermInput.dispatchEvent(new Event('input'));
      expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}02.01.2027`);

      elements.shelfLifeTermInput.value = '';
      elements.shelfLifeTermInput.dispatchEvent(new Event('input'));
      expect(elements.shelfLifeResult.hidden).toBe(true);
      expect(elements.shelfLifeTermInput.classList.contains('field-invalid')).toBe(false);
    });

    it('shows a hint under the field when a complete date does not exist', () => {
      const elements = setup();

      typeText(elements, '31022026');

      expect(elements.shelfLifeDateError.hidden).toBe(false);
      expect(elements.shelfLifeDateError.textContent).toBe('Такой даты нет: 31.02.2026');
      expect(elements.shelfLifeDateInput.getAttribute('aria-invalid')).toBe('true');
      expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(true);
      expect(elements.shelfLifeResult.hidden).toBe(true);

      pressBackspace(elements);
      expect(elements.shelfLifeDateInput.value).toBe('31.02.202');
      expect(elements.shelfLifeDateError.hidden).toBe(true);
      expect(elements.shelfLifeDateInput.getAttribute('aria-invalid')).toBeNull();
    });

    it('does not nag about incomplete dates while typing but does after leaving the field', () => {
      const elements = setup();

      typeText(elements, '0109');
      expect(elements.shelfLifeDateError.hidden).toBe(true);

      elements.shelfLifeDateInput.dispatchEvent(new Event('blur'));
      expect(elements.shelfLifeDateError.hidden).toBe(false);
      expect(elements.shelfLifeDateError.textContent).toBe('Введите дату полностью: ДД.ММ.ГГГГ');
    });

    it('does not show an error for an empty field on blur', () => {
      const elements = setup();

      elements.shelfLifeDateInput.dispatchEvent(new Event('blur'));

      expect(elements.shelfLifeDateError.hidden).toBe(true);
    });

    it('expands a two-digit year and pads zeros on blur', () => {
      const elements = setup();

      elements.shelfLifeDateInput.value = '1.9.26';
      elements.shelfLifeDateInput.dispatchEvent(new Event('blur'));

      expect(elements.shelfLifeDateInput.value).toBe('01.09.2026');
      expect(elements.shelfLifeDateError.hidden).toBe(true);
      expect(elements.shelfLifeResult.hidden).toBe(false);
    });

    it('fills yesterday with the button and recalculates', () => {
      const elements = setup(() => new Date(2026, 2, 1, 10, 0));

      elements.shelfLifeYesterdayButton.click();

      expect(elements.shelfLifeDateInput.value).toBe('28.02.2026');
      expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}01.03.2026`);
    });

    it('clears a previous error when yesterday is chosen', () => {
      const elements = setup(() => new Date(2026, 8, 19, 12, 0));
      typeText(elements, '31022026');
      expect(elements.shelfLifeDateError.hidden).toBe(false);

      elements.shelfLifeYesterdayButton.click();

      expect(elements.shelfLifeDateError.hidden).toBe(true);
      expect(elements.shelfLifeDateInput.value).toBe('18.09.2026');
    });

    it('takes the date from the calendar picker', () => {
      const elements = setup();

      elements.shelfLifeDatePicker.value = '2026-09-01';
      elements.shelfLifeDatePicker.dispatchEvent(new Event('change'));

      expect(elements.shelfLifeDateInput.value).toBe('01.09.2026');
      expect(elements.shelfLifeResultText.textContent).toBe(`${VALID_UNTIL_PREFIX}02.09.2026`);
    });

    it('opens the calendar with the current date preselected and falls back without showPicker', () => {
      const elements = setup();
      const showPicker = vi.fn();
      (elements.shelfLifeDatePicker as unknown as { showPicker: () => void }).showPicker = showPicker;
      elements.shelfLifeDateInput.value = '05.06.2026';

      elements.shelfLifeCalendarButton.click();

      expect(showPicker).toHaveBeenCalledTimes(1);
      expect(elements.shelfLifeDatePicker.value).toBe('2026-06-05');

      showPicker.mockImplementation(() => {
        throw new DOMException('not allowed', 'NotAllowedError');
      });
      const click = vi.spyOn(elements.shelfLifeDatePicker, 'click');
      elements.shelfLifeCalendarButton.click();
      expect(click).toHaveBeenCalledTimes(1);
    });

    it('shows the reason under the field when submitting an incomplete date', () => {
      const elements = setup();
      elements.shelfLifeDateInput.value = '01.09';

      submitForm(elements);

      expect(elements.shelfLifeDateError.textContent).toBe('Введите дату полностью: ДД.ММ.ГГГГ');
      expect(elements.shelfLifeDateInput.classList.contains('field-invalid')).toBe(true);
    });
  });
});

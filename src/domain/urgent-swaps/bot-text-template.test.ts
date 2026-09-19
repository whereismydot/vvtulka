import { describe, expect, it } from 'vitest';
import { buildBotText } from './bot-text-fixture';
import { checkBotTextTemplate, findBotTextDate } from './bot-text-template';

const DATE = { year: 2026, month: 9, day: 19 };
const LATE = ['Джалилов Равшан Рахман Оглы  @ravshan2114  07/19', 'Иванов Данила Сергеевич 0024184118  @xdanila_ivanov  13/01'];

describe('checkBotTextTemplate', () => {
  it('accepts the usual bot message, including names with an employee number', () => {
    expect(checkBotTextTemplate(buildBotText('19.09.2026', LATE, ['Самолдина Ольга Геннадьевна  @samoldos  07/19']), DATE)).toEqual([]);
  });

  it('accepts Windows line endings and typographic quotes', () => {
    const text = buildBotText('19.09.2026', LATE).replace(/\n/g, '\r\n').replace(/"Срочные"/, '«Срочные»');
    expect(checkBotTextTemplate(text, DATE)).toEqual([]);
  });

  it('rejects random text', () => {
    expect(checkBotTextTemplate('привет', DATE).length).toBeGreaterThanOrEqual(5);
  });

  it('rejects a message for another date', () => {
    const problems = checkBotTextTemplate(buildBotText('18.09.2026', LATE), DATE);
    expect(problems).toEqual(['в тексте дата 18.09.2026, а выбрана 19.09.2026']);
  });

  it('rejects a truncated message', () => {
    const text = buildBotText('19.09.2026', LATE).replace(/\n\nПродуктивного.*$/, '');
    expect(checkBotTextTemplate(text, DATE).join()).toContain('Продуктивного');
  });

  it('rejects unexpected lines inside the urgent block', () => {
    const problems = checkBotTextTemplate(buildBotText('19.09.2026', [...LATE, 'что-то постороннее']), DATE);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('что-то постороннее');
  });
});

describe('findBotTextDate', () => {
  it('reads the date from the header line', () => {
    expect(findBotTextDate(buildBotText('19.09.2026', LATE))).toEqual(DATE);
  });

  it('returns null when there is no valid header date', () => {
    expect(findBotTextDate('привет')).toBeNull();
    expect(findBotTextDate('Распределение на 31.02.2026')).toBeNull();
  });
});

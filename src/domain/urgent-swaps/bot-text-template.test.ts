import { describe, expect, it } from 'vitest';
import { buildBotText } from './bot-text-fixture';
import { checkBotTextTemplate, findBotTextDate } from './bot-text-template';

const DATE = { year: 2026, month: 9, day: 19 };
const LATE = ['Джалилов Равшан Рахман Оглы  @ravshan2114  07/19', 'Иванов Данила Сергеевич 0024184118  @xdanila_ivanov  13/01', 'Корбанова Анна Михайловна  @anna_korbanova  08/20'];

describe('checkBotTextTemplate', () => {
  it('accepts the usual bot message, including names with an employee number', () => {
    expect(checkBotTextTemplate(buildBotText('19.09.2026', LATE, ['Самолдина Ольга Геннадьевна  @samoldos  07/19']))).toEqual([]);
  });

  it('accepts Windows line endings and typographic quotes', () => {
    const text = buildBotText('19.09.2026', LATE).replace(/\n/g, '\r\n').replace(/"Срочные"/, '«Срочные»');
    expect(checkBotTextTemplate(text)).toEqual([]);
  });

  it('rejects random text', () => {
    expect(checkBotTextTemplate('привет')).toHaveLength(3);
  });

  it('does not care which date the message is for', () => {
    expect(checkBotTextTemplate(buildBotText('18.09.2026', LATE))).toEqual([]);
  });

  it('is not strict about the rest of the template', () => {
    const noFooter = buildBotText('19.09.2026', LATE).replace(/\n\nПродуктивного.*$/, '');
    expect(checkBotTextTemplate(noFooter)).toEqual([]);

    const extraLine = buildBotText('19.09.2026', [...LATE, 'что-то постороннее']);
    expect(checkBotTextTemplate(extraLine)).toEqual([]);

    const noHeader = buildBotText('19.09.2026', LATE).replace(/^Распределение[^\n]*\n/, '');
    expect(checkBotTextTemplate(noHeader)).toEqual([]);
  });

  it('still rejects text without the duty block skeleton', () => {
    expect(checkBotTextTemplate('Дежурные на линию\nПоздние:\nпусто')).toEqual(['нет строк вида «ФИО @тег ЧЧ/ЧЧ»']);
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

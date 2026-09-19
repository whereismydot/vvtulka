import { describe, expect, it } from 'vitest';
import { buildBotText } from './bot-text-fixture';
import { checkBotTextTemplate, findBotTextDate } from './bot-text-template';

const DATE = { year: 2026, month: 9, day: 19 };
const LATE = ['Джалилов Равшан Рахман Оглы  @ravshan2114  07/19', 'Иванов Данила Сергеевич 0024184118  @xdanila_ivanov  13/01', 'Корбанова Анна Михайловна  @anna_korbanova  08/20'];

describe('checkBotTextTemplate', () => {
  it('accepts the usual bot message, including names with an employee number', () => {
    expect(checkBotTextTemplate(buildBotText('19.09.2026', LATE, ['Самолдина Ольга Геннадьевна  @samoldos  07/19']), DATE)).toEqual([]);
  });

  it('accepts Windows line endings and typographic quotes', () => {
    const text = buildBotText('19.09.2026', LATE).replace(/\n/g, '\r\n').replace(/"Срочные"/, '«Срочные»');
    expect(checkBotTextTemplate(text, DATE)).toEqual([]);
  });

  it('rejects random text', () => {
    expect(checkBotTextTemplate('привет', DATE).length).toHaveLength(3);
  });

  it('rejects a message for another date', () => {
    const problems = checkBotTextTemplate(buildBotText('18.09.2026', LATE), DATE);
    expect(problems).toEqual(['в тексте дата 18.09.2026, а выбрана 19.09.2026']);
  });

  it('is not strict about the rest of the template', () => {
    const noFooter = buildBotText('19.09.2026', LATE).replace(/\n\nПродуктивного.*$/, '');
    expect(checkBotTextTemplate(noFooter, DATE)).toEqual([]);

    const extraLine = buildBotText('19.09.2026', [...LATE, 'что-то постороннее']);
    expect(checkBotTextTemplate(extraLine, DATE)).toEqual([]);

    const noHeader = buildBotText('19.09.2026', LATE).replace(/^Распределение[^\n]*\n/, '');
    expect(checkBotTextTemplate(noHeader, DATE)).toEqual([]);
  });

  it('still rejects text without the duty block skeleton', () => {
    expect(checkBotTextTemplate('Дежурные на линию\nПоздние:\nпусто', DATE)).toEqual(['нет строк вида «ФИО @тег ЧЧ/ЧЧ»']);
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

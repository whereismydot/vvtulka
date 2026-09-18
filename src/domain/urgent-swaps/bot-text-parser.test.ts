import { describe, expect, it } from 'vitest';
import { normalizeName, normalizeShift, parseBotText } from './bot-text-parser';

const SAMPLE = [
  'Распределение на 19.09.2026',
  '',
  'График лидеров 🔆',
  'Елена Кашапова  @e_kashap  08/20',
  '',
  'Дежурные на линию "Срочные" ✍️',
  '',
  'Поздние:',
  'Джалилов Равшан Рахман Оглы  @ravshan2114  07/19',
  'Аносова Алёна Евгеньевна  @anosova_alyona  20/02',
  '',
  'Ранние:',
  'Самолдина Ольга Геннадьевна  @samoldos  7/19',
  '',
  'Продуктивного рабочего дня ♥️'
].join('\r\n');

describe('bot text parser', () => {
  it('normalizes names: case, yo and spaces', () => {
    expect(normalizeName('  Аносова   АЛЁНА  Евгеньевна ')).toBe('аносова алена евгеньевна');
  });

  it('pads shifts with zeros', () => {
    expect(normalizeShift('7/19')).toBe('07/19');
    expect(normalizeShift('08/20')).toBe('08/20');
  });

  it('parses leaders and duties with groups', () => {
    const parsed = parseBotText(SAMPLE);

    expect([...parsed.leaders]).toEqual(['елена кашапова']);
    expect(parsed.duties.map((duty) => [duty.group, duty.name, duty.tag, duty.shift])).toEqual([
      ['Поздние', 'Джалилов Равшан Рахман Оглы', '@ravshan2114', '07/19'],
      ['Поздние', 'Аносова Алёна Евгеньевна', '@anosova_alyona', '20/02'],
      ['Ранние', 'Самолдина Ольга Геннадьевна', '@samoldos', '07/19']
    ]);
  });

  it('keeps original line indexes and converts CRLF', () => {
    const parsed = parseBotText(SAMPLE);

    expect(parsed.lines).toHaveLength(15);
    expect(parsed.lines[parsed.duties[0].lineIndex]).toContain('Джалилов');
  });

  it('ignores person lines outside of known sections', () => {
    const parsed = parseBotText('Иванов Иван  @ivan  08/20\n\nПоздние:\nПетров Пётр  @petr  08/20');

    expect(parsed.duties).toHaveLength(0);
    expect(parsed.leaders.size).toBe(0);
  });

  it('stops collecting after the closing phrase', () => {
    const parsed = parseBotText('Дежурные на линию "Срочные"\nПоздние:\nА Б  @a  08/20\nПродуктивного дня\nВ Г  @v  08/20');

    expect(parsed.duties.map((duty) => duty.tag)).toEqual(['@a']);
  });
});

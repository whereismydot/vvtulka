import { describe, expect, it } from 'vitest';
import { parseOrderText } from './parser';

const sampleInput = `
Чек_unf

п.п.\tТовар\tКолво\tСумма\tВходитВкусБэк
1\tКорм для кошек\t1,000\t69,000\tДа
2\tВода\t1,000\t145,000\tНет
3\tСок\t1,000\t196,000\tда
битая строка\t\t\t\t
ИТОГО:\t\t\t410,000\t
`;

describe('order parser', () => {
  it('parses rows and skips ИТОГО', () => {
    const result = parseOrderText(sampleInput);

    expect(result.errors).toHaveLength(0);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].sumRaw).toBe('69.000');
    expect(result.items[2].isVkusbackEligible).toBe(true);
  });

  it('collects warnings for broken lines', () => {
    const result = parseOrderText(sampleInput);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns error when header is missing', () => {
    const result = parseOrderText('просто текст без таблицы');
    expect(result.errors.length).toBe(1);
  });

  it('returns error when a required column is missing', () => {
    const input = `
п.п.\tТовар\tКолво\tСумма
1\tТовар A\t1\t100
`;

    const result = parseOrderText(input);

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('supports different eligible values and keeps source rows', () => {
    const input = `
п.п.\tТовар\tКолво\tСумма\tВкусбек
1\tA\t1\t10\tyes
2\tB\t1\t20\t1
3\tC\t1\t30\ttrue
`;

    const result = parseOrderText(input);

    expect(result.errors).toEqual([]);
    expect(result.items).toHaveLength(3);
    expect(result.items.map((item) => item.isVkusbackEligible)).toEqual([true, true, true]);
    expect(result.items.map((item) => item.sourceRow)).toEqual([3, 4, 5]);
  });

  it('returns warnings and empty items when all rows are invalid', () => {
    const input = `
п.п.\tТовар\tКолво\tСумма\tВходитВкусБэк
1\tA\t1\t--\tДа
2\tB\t2\t--\tНет
`;

    const result = parseOrderText(input);

    expect(result.errors).toEqual([]);
    expect(result.items).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

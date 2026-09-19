const SVG_NS = 'http://www.w3.org/2000/svg';

type ThemeIconName = 'sun' | 'moon';

const THEME_ICON_PATHS: Readonly<Record<ThemeIconName, readonly string[]>> = {
  sun: ['M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  moon: ['M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z']
};

/**
 * Создаёт SVG-иконку темы (солнце или луна) одинаковую во всех браузерах и ОС, в отличие от emoji.
 *
 * @param name Название иконки.
 * @returns Готовый SVG-элемент для вставки в кнопку.
 */
export function createThemeIcon(name: ThemeIconName): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  if (name === 'sun') {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '4');
    svg.append(circle);
  }

  for (const d of THEME_ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }

  return svg;
}

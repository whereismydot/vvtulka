/**
 * Настройки чтения графика операторов из Google Sheets.
 *
 * Ключ публичный (виден в браузере), поэтому в Google Cloud он ДОЛЖЕН быть ограничен:
 * только Google Sheets API и только HTTP referrers сайта. Таблица открыта «по ссылке», запись невозможна.
 * Для локальной разработки ключ можно переопределить через `VITE_SHEETS_API_KEY` в `.env.local`.
 */
export const SCHEDULE_SPREADSHEET_ID = '1pZDRHCg-NlFfEhKUSKQGrKlKYmNvCAd68u7G8dFQNkc';

const PUBLISHED_SHEETS_API_KEY = '__SHEETS_API_KEY__';

export const SHEETS_API_KEY: string = import.meta.env?.VITE_SHEETS_API_KEY ?? PUBLISHED_SHEETS_API_KEY;

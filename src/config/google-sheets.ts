/**
 * Настройки чтения графика операторов из Google Sheets.
 *
 * Ключ в репозитории не хранится: он подставляется при сборке из переменной `VITE_SHEETS_API_KEY`
 * (в GitHub Actions — из секрета `SHEETS_API_KEY`, локально — из `.env.local`).
 * В собранном сайте ключ всё равно виден в браузере, поэтому в Google Cloud он ДОЛЖЕН быть ограничен:
 * только Google Sheets API и только HTTP referrers сайта. Таблица открыта «по ссылке», запись невозможна.
 */
export const SCHEDULE_SPREADSHEET_ID = '1pZDRHCg-NlFfEhKUSKQGrKlKYmNvCAd68u7G8dFQNkc';

export const SHEETS_API_KEY: string = import.meta.env?.VITE_SHEETS_API_KEY ?? '';

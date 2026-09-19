// Готовит артефакт GitHub Pages: приложение лежит в dist/vvtulka/ (адрес /vvtulka/),
// а корень домена перебрасывает на него и хранит CNAME.
import path from 'node:path';
import { readdir, rm, stat, writeFile } from 'node:fs/promises';

const DIST_ROOT = path.join(process.cwd(), 'dist');
const APP_DIR_NAME = 'vvtulka';
const APP_INDEX = path.join(DIST_ROOT, APP_DIR_NAME, 'index.html');
const DOMAIN = 'sanlover.ru';

const ROOT_REDIRECT_HTML = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/${APP_DIR_NAME}/" />
    <link rel="canonical" href="https://${DOMAIN}/${APP_DIR_NAME}/" />
    <title>ВВТулка</title>
  </head>
  <body>
    <p>Перейти на сайт: <a href="/${APP_DIR_NAME}/">${DOMAIN}/${APP_DIR_NAME}/</a></p>
  </body>
</html>
`;

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(APP_INDEX))) {
    throw new Error(`Не найден ${APP_INDEX}: сначала выполните vite build.`);
  }

  // Убираем всё, кроме приложения (например, файлы прежних сборок в корне dist).
  for (const entry of await readdir(DIST_ROOT)) {
    if (entry !== APP_DIR_NAME) {
      await rm(path.join(DIST_ROOT, entry), { recursive: true, force: true });
    }
  }

  await writeFile(path.join(DIST_ROOT, 'index.html'), ROOT_REDIRECT_HTML, 'utf8');
  await writeFile(path.join(DIST_ROOT, 'CNAME'), `${DOMAIN}\n`, 'utf8');
  console.log(`Артефакт Pages готов: dist/${APP_DIR_NAME}/, переадресация с корня и CNAME ${DOMAIN}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

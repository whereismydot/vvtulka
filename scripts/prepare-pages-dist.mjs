import path from 'node:path';
import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';

const PROJECT_ROOT = process.cwd();
const DIST_ROOT = path.join(PROJECT_ROOT, 'dist');
const APP_DIR = path.join(DIST_ROOT, 'vvtulka');
const APP_INDEX = path.join(APP_DIR, 'index.html');

const ROOT_REDIRECT_HTML = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/vvtulka/" />
    <title>Redirecting...</title>
    <script>
      window.location.replace('/vvtulka/');
    </script>
  </head>
  <body>
    <p>Go to <a href="/vvtulka/">/vvtulka/</a></p>
  </body>
</html>
`;

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveCnameSource() {
  const candidates = [path.join(PROJECT_ROOT, 'public', 'CNAME'), path.join(PROJECT_ROOT, 'CNAME')];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error('CNAME file not found in public/CNAME or CNAME.');
}

async function cleanDistRootExceptApp() {
  const entries = await readdir(DIST_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'vvtulka') {
      continue;
    }

    await rm(path.join(DIST_ROOT, entry.name), { recursive: true, force: true });
  }
}

async function assertAppBuilt() {
  if (!(await pathExists(APP_INDEX))) {
    throw new Error('Build output is missing dist/vvtulka/index.html.');
  }
}

async function assertAssetPaths() {
  const html = await readFile(APP_INDEX, 'utf8');
  const hasVvtulkaAssets = /(?:src|href)="\/vvtulka\/assets\/[^"]+"/.test(html);

  if (!hasVvtulkaAssets) {
    throw new Error('dist/vvtulka/index.html does not contain /vvtulka/assets/... links.');
  }
}

async function writeRootRedirect() {
  await writeFile(path.join(DIST_ROOT, 'index.html'), ROOT_REDIRECT_HTML, 'utf8');
}

async function writeRootCname() {
  const cnameSource = await resolveCnameSource();
  const raw = await readFile(cnameSource, 'utf8');
  const normalized = raw.replace(/\r/g, '').trim();

  if (normalized !== 'sanlover.ru') {
    throw new Error(`CNAME must be exactly "sanlover.ru", got "${normalized || '(empty)'}".`);
  }

  await writeFile(path.join(DIST_ROOT, 'CNAME'), `${normalized}\n`, 'utf8');
}

async function removeNestedCname() {
  await rm(path.join(APP_DIR, 'CNAME'), { force: true });
}

async function main() {
  await assertAppBuilt();
  await cleanDistRootExceptApp();
  await removeNestedCname();
  await writeRootRedirect();
  await writeRootCname();
  await assertAssetPaths();
  console.log('Prepared GitHub Pages artifact in dist/.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const zones = ['UTC', 'Europe/Vilnius', 'Europe/Moscow', 'America/New_York', 'Pacific/Kiritimati', 'Pacific/Honolulu'];
const root = process.cwd();
const tempDir = path.join(root, '.tmp-shelf-life-tz');
const tscEntrypoint = path.join(root, 'node_modules', 'typescript', 'lib', 'tsc.js');

const compileArgs = [
  tscEntrypoint,
  '--target',
  'ES2020',
  '--module',
  'commonjs',
  '--moduleResolution',
  'node',
  '--strict',
  '--esModuleInterop',
  '--skipLibCheck',
  '--outDir',
  tempDir,
  'src/domain/types.ts',
  'src/domain/shelf-life/calculator.ts',
  'src/domain/shelf-life/date-time-io.ts',
  'src/application/shelf-life-service.ts'
];

function runCommand(cmd, args, env = process.env) {
  const run = spawnSync(cmd, args, {
    stdio: 'inherit',
    env
  });

  if (run.status !== 0) {
    process.exit(run.status ?? 1);
  }
}

function runTimezoneCheck(zone) {
  const testScript = `
const { calculateShelfLife } = require(${JSON.stringify(path.join(tempDir, 'application', 'shelf-life-service.js'))});
const fixtures = [
  { manufactureDateRaw: '31.12.2026', manufactureTimeRaw: '23:59', shelfLifeTermRaw: '1', shelfLifeUnitRaw: 'days', expected: '01.01.2027 23:59' },
  { manufactureDateRaw: '28.02.2024', manufactureTimeRaw: '00:00', shelfLifeTermRaw: '1', shelfLifeUnitRaw: 'days', expected: '29.02.2024 00:00' },
  { manufactureDateRaw: '29.02.2024', manufactureTimeRaw: '23:59', shelfLifeTermRaw: '1', shelfLifeUnitRaw: 'years', expected: '28.02.2025 23:59' },
  { manufactureDateRaw: '31.01.2026', manufactureTimeRaw: '08:30', shelfLifeTermRaw: '1', shelfLifeUnitRaw: 'months', expected: '28.02.2026 08:30' }
];

for (const fixture of fixtures) {
  const result = calculateShelfLife({
    manufactureDateRaw: fixture.manufactureDateRaw,
    manufactureTimeRaw: fixture.manufactureTimeRaw,
    shelfLifeTermRaw: fixture.shelfLifeTermRaw,
    shelfLifeUnitRaw: fixture.shelfLifeUnitRaw,
    includeTime: true
  });

  if (!result.ok) {
    console.error('Unexpected error for fixture', fixture, result);
    process.exit(1);
  }

  if (result.formattedValidUntil !== fixture.expected) {
    console.error('Timezone mismatch in TZ=' + process.env.TZ, fixture, result.formattedValidUntil);
    process.exit(1);
  }
}

console.log('[tz-check] TZ=' + process.env.TZ + ' passed');
`;

  const run = spawnSync(process.execPath, ['-e', testScript], {
    stdio: 'inherit',
    env: {
      ...process.env,
      TZ: zone
    }
  });

  if (run.status !== 0) {
    process.exit(run.status ?? 1);
  }
}

rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });
writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'commonjs' }), 'utf8');

console.log('[tz-check] Compiling shelf-life modules for isolated timezone run...');
runCommand(process.execPath, compileArgs);

for (const zone of zones) {
  console.log(`\n[tz-check] Running fixtures with TZ=${zone}`);
  runTimezoneCheck(zone);
}

rmSync(tempDir, { recursive: true, force: true });
console.log('\n[tz-check] All timezone runs passed.');

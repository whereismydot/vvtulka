import '@fontsource-variable/nunito/wght.css';
import './style.css';
import { AppService } from './application/app-service';
import { parseOrderText } from './domain/receipt/parser';
import { createClock } from './infrastructure/browser/clock';
import { appLog, installGlobalErrorLogging } from './infrastructure/diagnostics/app-log';
import { createIdGenerator } from './infrastructure/browser/id-generator';
import { createThemePreference } from './infrastructure/browser/theme-preference';
import { buildStorageState, loadState, saveState } from './infrastructure/storage/local-storage-state';
import { createAppController } from './ui/controllers/app-controller';
import { getAppElements, getAppRoot } from './ui/dom/elements';
import { APP_TEMPLATE } from './ui/template/app-template';

installGlobalErrorLogging();
appLog.info('app', `Загрузка, версия ${typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'}`);

const appRoot = getAppRoot();
appRoot.innerHTML = APP_TEMPLATE;

const initialStorageState = loadState();
const idGenerator = createIdGenerator();
const clock = createClock();
const themePreference = createThemePreference();

const service = new AppService(
  {
    orders: initialStorageState.orders,
    percentRaw: initialStorageState.percentRaw
  },
  {
    parseOrderText,
    createOrderId: () => idGenerator.nextId(),
    nowIso: () => clock.nowIso(),
    persistState: (state) => {
      const saved = saveState(buildStorageState(state.orders, state.percentRaw));
      if (saved === false) {
        appLog.warn('storage', 'Не удалось сохранить данные в браузере');
      }
      return saved;
    }
  }
);

createAppController({
  service,
  elements: getAppElements(),
  themePreference
});

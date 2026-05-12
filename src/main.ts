import './style.css';
import { AppService } from './application/app-service';
import { parseOrderText } from './domain/receipt/parser';
import { createClock } from './infrastructure/browser/clock';
import { createIdGenerator } from './infrastructure/browser/id-generator';
import { createThemePreference } from './infrastructure/browser/theme-preference';
import { buildStorageState, loadState, saveState } from './infrastructure/storage/local-storage-state';
import { createAppController } from './ui/controllers/app-controller';
import { getAppElements, getAppRoot } from './ui/dom/elements';
import { APP_TEMPLATE } from './ui/template/app-template';

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
      saveState(buildStorageState(state.orders, state.percentRaw));
    }
  }
);

createAppController({
  service,
  elements: getAppElements(),
  themePreference
});

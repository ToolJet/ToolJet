require('@testing-library/jest-dom');

// The bundlers inline these as build-time constants via DefinePlugin; under jest
// they're live process.env reads, so give them the same defaults the bundlers use.
// Keep the edition default in sync with jest.config.js (ee when the submodule
// exists, ce otherwise).
const fs = require('fs');
const path = require('path');
process.env.TOOLJET_EDITION =
  process.env.TOOLJET_EDITION || (fs.existsSync(path.resolve(__dirname, '../../ee')) ? 'ee' : 'ce');
process.env.ASSET_PATH = process.env.ASSET_PATH || '';
process.env.PYODIDE_BASE_URL = process.env.PYODIDE_BASE_URL || '/assets/libs/pyodide-0.23.2/';

// ~100 components call useTranslation; echoing the key back is the cheapest
// stable contract and keeps tests independent of locale files.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallbackOrOptions) => (typeof fallbackOrOptions === 'string' ? fallbackOrOptions : key),
    i18n: { changeLanguage: jest.fn(), language: 'en' },
  }),
  Trans: ({ children }) => children,
  withTranslation: () => (Component) => Component,
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Suites can opt out of jsdom with a `@jest-environment node` docblock,
// so everything DOM-related must stay behind this guard.
if (typeof window !== 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: window.ResizeObserver || ResizeObserverMock,
  });

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: window.IntersectionObserver || IntersectionObserverMock,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value:
      window.matchMedia ||
      jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
  });

  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    configurable: true,
    value: jest.fn(),
  });

  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    configurable: true,
    value: URL.createObjectURL || jest.fn(() => 'blob:mock-url'),
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    configurable: true,
    value: URL.revokeObjectURL || jest.fn(),
  });

  if (!HTMLCanvasElement.prototype.getContext) {
    HTMLCanvasElement.prototype.getContext = jest.fn();
  }
}

afterEach(() => {
  // Reset every zustand store created during the test (see __mocks__/zustand.js)
  // plus the AppBuilder mega-store's production-side resetters array, so store
  // state can't leak between tests.
  require('zustand').__resetAllStores?.();
  try {
    require('@/AppBuilder/_stores/utils').resetAllStores();
  } catch (_e) {
    // Suite runs without the store module (e.g. pure-node helpers) — nothing to reset.
  }
  jest.clearAllMocks();
  jest.useRealTimers();
});

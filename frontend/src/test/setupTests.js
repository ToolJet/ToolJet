require('@testing-library/jest-dom');

// The bundlers inline these as build-time constants via DefinePlugin; under jest
// they're live process.env reads, so give them the same defaults the bundlers use.
// Keep the edition default in sync with jest.config.js (ee when the submodule
// exists, ce otherwise).
const fs = require('fs');
const path = require('path');
process.env.TOOLJET_EDITION =
  process.env.TOOLJET_EDITION || (fs.existsSync(path.resolve(__dirname, '../../ee/modules')) ? 'ee' : 'ce');
process.env.ASSET_PATH = process.env.ASSET_PATH || '';
process.env.PYODIDE_BASE_URL = process.env.PYODIDE_BASE_URL || '/assets/libs/pyodide-0.23.2/';

// Suites can opt out of jsdom with a `@jest-environment node` docblock,
// so everything DOM-related must stay behind this guard.
if (typeof window !== 'undefined') {
  // Production Zustand connects to the optional Redux DevTools browser
  // extension. Provide only that external boundary; App Builder code remains real.
  if (!window.__REDUX_DEVTOOLS_EXTENSION__) {
    window.__REDUX_DEVTOOLS_EXTENSION__ = {
      connect: () => ({
        init() {},
        send() {},
        subscribe() {
          return () => {};
        },
        unsubscribe() {},
      }),
    };
  }
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

  // Assign unconditionally. jsdom DOES define getContext — it just throws
  // "Not implemented: HTMLCanvasElement.prototype.getContext" when called, so
  // the old `if (!...)` guard never fired and plotly/chart widgets flooded
  // stderr. Stubbing the method is cheaper than mapping plotly to a stub,
  // and keeps the real chart component under test.
  HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
}

afterEach(async () => {
  const sessions = globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ || [];
  while (sessions.length) await sessions.pop()();
  // Reset every zustand store created during the test (see __mocks__/zustand.js).
  require('zustand').__resetAllStores?.();
  jest.useRealTimers();
});

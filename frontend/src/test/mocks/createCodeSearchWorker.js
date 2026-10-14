// See jest.config.js: no worker in tests, so code search falls back to the main thread.
export const createCodeSearchWorker = () => null;

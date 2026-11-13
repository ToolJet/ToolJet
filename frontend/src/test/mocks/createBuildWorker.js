// Jest stand-in for CodePanel/build/createBuildWorker.ts (Jest cannot parse its `import.meta`). Tests that build mock
// buildClient or run buildCore directly; a test that reaches the worker gets a clear failure instead.
export const createBuildWorker = () => {
  throw new Error('The build worker does not run under Jest: mock its client');
};

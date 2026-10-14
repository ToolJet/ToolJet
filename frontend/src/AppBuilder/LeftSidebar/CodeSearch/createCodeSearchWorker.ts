// The only `import.meta` in code search: Jest can't parse it, so tests mock this module.
// Returns null when workers aren't available; the caller then searches on the main thread.
export const createCodeSearchWorker = (): Worker | null => {
  try {
    return new Worker(new URL('./codeSearch.worker.ts', import.meta.url));
  } catch {
    return null;
  }
};

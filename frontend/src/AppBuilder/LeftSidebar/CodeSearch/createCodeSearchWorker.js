// The only `import.meta` in code search: Jest can't parse it, so tests mock this module.
// Returns null when workers aren't available; the caller then searches on the main thread.
export const createCodeSearchWorker = () => {
  try {
    return new Worker(new URL('./codeSearch.worker.js', import.meta.url));
  } catch {
    return null;
  }
};

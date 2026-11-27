// frontend/src/AppBuilder/_utils/libraryQuery.js

export const LIBRARY_KIND = 'library';

// Names `queries.x.run({ ... })` passes on: a library query's inputs, any other query's parameters.
export const runArgNames = (query) =>
  query?.kind === LIBRARY_KIND
    ? Object.keys(query.options?.inputs ?? {})
    : (query?.options?.parameters ?? []).map((parameter) => parameter.name);
export const LIBRARY_QUERY_IS_CLIENT_SIDE = 'LIBRARY_QUERY_IS_CLIENT_SIDE';

// Rejects with an AbortError as soon as `signal` fires, even if `promise` (e.g. user code) never settles.
// The promise's later result is ignored.
export function raceAbort(promise, signal) {
  if (!signal) return promise;
  const aborted = () => new DOMException('Query was cancelled', 'AbortError');
  if (signal.aborted) return Promise.reject(aborted());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(aborted());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

// Names a library query's {{ }} templates may use. The server resolves the same set for consumers
// (server/src/modules/data-queries/library/library-query.util.ts), so the library editor matches it.
export function libraryTemplateState(exposedValues, input = {}) {
  return {
    input,
    constants: exposedValues?.constants,
    globals: { currentUser: exposedValues?.globals?.currentUser ?? {} },
  };
}

const TEMPLATE = /\{\{([\s\S]*?)\}\}/g;
// Resolved by the server against the consumer's environment (same set as the server's SERVER_RESOLVED).
const SERVER_RESOLVED = /^\{\{\s*(constants|secrets|globals\.server)\./;

// Same rules as the server's resolveLibraryDefault. `resolveTemplate` resolves one `{{ }}` template.
// A whole template `{{5}}` keeps its type; mixed text `id-{{1+1}}` becomes text; constants/secrets stay text.
function resolveDefault(defaultValue, resolveTemplate) {
  if (typeof defaultValue !== 'string') return defaultValue;
  const templates = defaultValue.match(TEMPLATE);
  if (!templates) return defaultValue;
  if (defaultValue.trim() === templates[0]) {
    return SERVER_RESOLVED.test(templates[0]) ? defaultValue : resolveTemplate(templates[0]);
  }
  return defaultValue.replace(TEMPLATE, (template) => {
    if (SERVER_RESOLVED.test(template)) return template;
    const value = resolveTemplate(template);
    return value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

// A library query's input values: a supplied value wins over the declared default, per declared name.
export function mergeLibraryInputs(definitions = [], inputs = {}, resolveTemplate = (value) => value) {
  const safeInputs = inputs ?? {};
  return (definitions ?? []).reduce((acc, { name, defaultValue } = {}) => {
    if (!name) return acc;
    // Own properties only: a declared name like `constructor` must not pick up Object.prototype members.
    acc[name] =
      Object.prototype.hasOwnProperty.call(safeInputs, name) && safeInputs[name] !== undefined
        ? safeInputs[name]
        : resolveDefault(defaultValue, resolveTemplate);
    return acc;
  }, {});
}

// frontend/src/AppBuilder/_utils/libraryQuery.js
import _ from 'lodash';
import moment from 'moment';
import axios from 'axios';

export const LIBRARY_KIND = 'library';
export const MAX_LIBRARY_DEPTH = 5;
export const LIBRARY_QUERY_IS_CLIENT_SIDE = 'LIBRARY_QUERY_IS_CLIENT_SIDE';

// Built from a string so Babel's async transform can't rewrite it to a plain Function (same as queryPanelSlice).
const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();

const failed = (message) => ({ status: 'failed', data: { message, description: message } });

// Names a library query's {{ }} templates may use. The server resolves the same set for consumers
// (server/src/modules/data-queries/library/library-query.util.ts), so the library editor matches it.
export function libraryTemplateState(exposedValues, parameters) {
  return {
    parameters,
    constants: exposedValues?.constants,
    globals: { currentUser: exposedValues?.globals?.currentUser ?? {} },
  };
}

export function mergeLibraryParameters(definitions = [], inputs = {}, resolveDefault = (value) => value) {
  const safeInputs = inputs ?? {};
  return (definitions ?? []).reduce((acc, { name, defaultValue } = {}) => {
    if (!name) return acc;
    acc[name] = safeInputs[name] !== undefined ? safeInputs[name] : resolveDefault(defaultValue);
    return acc;
  }, {});
}

// Library RunJS gets inputs and utilities only (spec D14). Anything not in this list —
// components, variables, page, actions — is simply not defined, so it throws ReferenceError.
export async function executeLibraryJS({
  code,
  parameters = {},
  siblings = [],
  runSibling,
  constants = {},
  currentUser = {},
  depth = 0,
  timers = { setTimeout, setInterval, clearTimeout, clearInterval },
}) {
  if (depth > MAX_LIBRARY_DEPTH) return failed('Library query nesting is too deep');

  const queries = Object.fromEntries(
    siblings.map((sibling) => [sibling.name, { run: (params = {}) => runSibling(sibling, params ?? {}, depth + 1) }])
  );

  try {
    const fn = new AsyncFunction(
      'moment',
      '_',
      'axios',
      'constants',
      'globals',
      'parameters',
      'queries',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      code ?? ''
    );
    const data = await fn(
      moment,
      _,
      axios,
      constants,
      { currentUser },
      parameters,
      queries,
      timers.setTimeout,
      timers.setInterval,
      timers.clearTimeout,
      timers.clearInterval
    );
    return { status: 'ok', data };
  } catch (err) {
    return failed(err?.message || 'JS execution failed');
  }
}

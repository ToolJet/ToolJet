import {
  ALL_LEVELS,
  SCOPE_ALL,
  SCOPE_PAGE,
  countLogsByLevel,
  filterLogs,
  formatLogAge,
  getLogAction,
  getLogLevel,
  getLogMessage,
  getLogSource,
  getLogTitle,
  hasLogDetails,
} from '../runtimeDebuggerUtils';

// Shapes copied from the producers: queryPanelSlice (query, transformation), debuggerSlice
// (component validation), eventsSlice (event errors, custom logs, disabled page navigation).
const queryError = {
  logLevel: 'error',
  type: 'query',
  kind: 'restapi',
  key: 'getUsers',
  message: 'Request failed with status code 401',
  errorTarget: 'Queries',
  page: 'p1',
  error: { request: { url: 'https://api.acme.dev/users' }, response: { statusCode: 401 } },
};
const querySuccess = {
  logLevel: 'success',
  type: 'query',
  key: 'createOrder',
  message: 'Query executed successfully',
  page: 'p1',
};
const queryAborted = {
  logLevel: 'warning',
  type: 'query',
  key: 'search',
  message: 'Query aborted by user',
  page: 'p1',
};
const querySkipped = { logLevel: 'info', type: 'query', key: 'syncCart', message: 'Query skipped', page: 'p2' };
const componentError = {
  logLevel: 'error',
  type: 'component',
  key: 'table1 - Columns',
  componentId: 'c-91f',
  message: 'Expected an array',
  errorTarget: 'Component Property',
  page: 'p1',
};
const eventError = {
  logLevel: 'error',
  type: 'run_query',
  key: '[Page home] [Component button1] [Event onClick] [Action run-query]',
  componentId: 'c-12a',
  error: { message: 'No query selected', description: '"No query selected"' },
  errorTarget: 'Component Event',
  page: 'p1',
};
const customLog = {
  logLevel: 'success',
  type: 'Custom Log',
  key: 'Selected row',
  description: 'Row 42',
  error: { message: undefined, description: undefined },
  page: 'p1',
};
const disabledPage = {
  logLevel: 'error',
  type: 'navToDisablePage',
  kind: 'page',
  message: 'Attempt blocked.',
  error: 'Page is disabled',
  page: 'p1',
};
const transformation = {
  logLevel: 'error',
  type: 'transformation',
  key: 'getOrders, transformation, line 3',
  message: 'data.map is not a function',
  page: 'p2',
};

const allLogs = [
  queryError,
  querySuccess,
  queryAborted,
  querySkipped,
  componentError,
  eventError,
  customLog,
  disabledPage,
  transformation,
];

describe('getLogMessage', () => {
  it('should prefer message, then the error message', () => {
    expect(getLogMessage(queryError)).toBe('Request failed with status code 401');
    expect(getLogMessage(eventError)).toBe('No query selected');
  });

  it('should read custom logs from description', () => {
    expect(getLogMessage(customLog)).toBe('Row 42');
  });

  it('should skip non-string error descriptions', () => {
    expect(getLogMessage({ error: { description: { traceback: [] } }, description: 'fallback' })).toBe('fallback');
  });
});

describe('getLogTitle and getLogSource', () => {
  it('should use key and errorTarget when present', () => {
    expect(getLogTitle(componentError)).toBe('table1 - Columns');
    expect(getLogSource(componentError)).toBe('Component Property');
  });

  it('should name logs that have neither key nor errorTarget', () => {
    expect(getLogTitle(disabledPage)).toBe('Page navigation');
    expect(getLogSource(disabledPage)).toBe('Navigation');
    expect(getLogSource(customLog)).toBe('Custom log');
  });
});

describe('getLogLevel', () => {
  it('should default unknown levels to error', () => {
    expect(getLogLevel({})).toBe('error');
    expect(getLogLevel(queryAborted)).toBe('warning');
  });
});

describe('getLogAction', () => {
  it('should select the component a log names', () => {
    expect(getLogAction(eventError)).toEqual({ type: 'component', id: 'c-12a', label: 'Select component' });
  });

  it('should open the query for query logs only', () => {
    expect(getLogAction(queryError)).toEqual({ type: 'query', name: 'getUsers', label: 'Open query' });
    expect(getLogAction(transformation)).toBeNull();
    expect(getLogAction(disabledPage)).toBeNull();
  });
});

describe('hasLogDetails', () => {
  it('should show object and string payloads', () => {
    expect(hasLogDetails(queryError)).toBe(true);
    expect(hasLogDetails(disabledPage)).toBe(true);
  });

  it('should hide missing payloads and objects with only undefined fields', () => {
    expect(hasLogDetails(querySuccess)).toBe(false);
    expect(hasLogDetails(customLog)).toBe(false);
  });
});

describe('filterLogs', () => {
  it('should keep only the current page by default', () => {
    const result = filterLogs(allLogs, { currentPageId: 'p1' });

    expect(result).not.toContain(querySkipped);
    expect(result).not.toContain(transformation);
    expect(result).toHaveLength(7);
  });

  it('should include every page when scoped to all pages', () => {
    expect(filterLogs(allLogs, { scope: SCOPE_ALL, currentPageId: 'p1' })).toHaveLength(allLogs.length);
  });

  it('should apply the level filter within the scope', () => {
    expect(filterLogs(allLogs, { scope: SCOPE_PAGE, currentPageId: 'p1', level: 'error' })).toEqual([
      queryError,
      componentError,
      eventError,
      disabledPage,
    ]);
  });

  it('should search title, message, and source case-insensitively', () => {
    expect(filterLogs(allLogs, { scope: SCOPE_ALL, query: 'DATA.MAP' })).toEqual([transformation]);
    expect(filterLogs(allLogs, { scope: SCOPE_ALL, query: 'component event' })).toEqual([eventError]);
  });
});

describe('countLogsByLevel', () => {
  it('should count each level and the total', () => {
    expect(countLogsByLevel(allLogs)).toEqual({ [ALL_LEVELS]: 9, error: 5, warning: 1, info: 1, success: 2 });
  });
});

describe('formatLogAge', () => {
  const now = Date.parse('2026-10-23T14:03:00.000Z');

  it('should give compact ages for recent logs', () => {
    expect(formatLogAge('2026-10-23T14:02:58.000Z', now)).toBe('now');
    expect(formatLogAge('2026-10-23T14:02:48.000Z', now)).toBe('12s');
    expect(formatLogAge('2026-10-23T13:59:00.000Z', now)).toBe('4m');
    expect(formatLogAge('2026-10-23T11:03:00.000Z', now)).toBe('3h');
  });

  it('should return nothing for a missing or invalid timestamp', () => {
    expect(formatLogAge(undefined, now)).toBe('');
    expect(formatLogAge('not a date', now)).toBe('');
  });
});

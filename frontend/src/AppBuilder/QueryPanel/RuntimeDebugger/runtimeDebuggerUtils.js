// Pure helpers that map debugger log entries (written by debugger.log / logMultiple across the App
// Builder) onto the bottom panel's split-view Debugger. Fields are read as producers write them:
// logLevel, type, kind, key, message, description, error, errorTarget, componentId, page, timestamp.

export const ALL_LEVELS = 'all';
export const LOG_LEVELS = ['error', 'warning', 'info', 'success'];
export const LEVEL_LABELS = { error: 'Error', warning: 'Warning', info: 'Info', success: 'Success' };
export const LEVEL_FILTER_LABELS = { error: 'Errors', warning: 'Warnings', info: 'Info', success: 'Success' };

export const SCOPE_PAGE = 'page';
export const SCOPE_ALL = 'all';

const isString = (value) => typeof value === 'string' || value instanceof String;

// Unknown or missing levels are treated as errors, matching how event errors default in logError.
export const getLogLevel = (log) => (LOG_LEVELS.includes(log?.logLevel) ? log.logLevel : 'error');

// Prefer `message`, then the error's own message or description (the latter can be an object for
// some runtimes, e.g. runpy), then `description` — where event errors and custom logs keep their text.
export const getLogMessage = (log) => {
  if (!log) return '';
  const candidates = [log.message, log.error?.message, log.error?.description, log.description];
  return candidates.find((value) => isString(value) && value.trim()) ?? '';
};

export const getLogTitle = (log) => {
  if (log?.key) return log.key;
  if (log?.type === 'navToDisablePage') return 'Page navigation';
  return LEVEL_LABELS[getLogLevel(log)];
};

export const getLogSource = (log) => {
  if (log?.errorTarget) return log.errorTarget;
  if (log?.type === 'Custom Log') return 'Custom log';
  if (log?.type === 'navToDisablePage') return 'Navigation';
  return log?.type ?? '';
};

/**
 * The one navigation a log supports: select the component it names, or open the query it came from.
 * Transformation logs are left out because their `key` is "<query>, transformation, line N", not a query name.
 */
export const getLogAction = (log) => {
  if (log?.componentId) return { type: 'component', id: log.componentId, label: 'Select component' };
  if (log?.type === 'query' && log.key) return { type: 'query', name: log.key, label: 'Open query' };
  return null;
};

// Only object/primitive payloads worth showing; an object whose fields are all undefined is noise.
export const hasLogDetails = (log) => {
  const details = log?.error;
  if (details === undefined || details === null || details === '') return false;
  if (typeof details === 'object') return Object.values(details).some((value) => value !== undefined);
  return true;
};

export const isLogInScope = (log, scope, currentPageId) => scope === SCOPE_ALL || log?.page === currentPageId;

export const filterLogs = (logs = [], { scope = SCOPE_PAGE, currentPageId, level = ALL_LEVELS, query = '' } = {}) => {
  const needle = query.trim().toLowerCase();
  return logs.filter(
    (log) =>
      isLogInScope(log, scope, currentPageId) &&
      (level === ALL_LEVELS || getLogLevel(log) === level) &&
      (!needle || `${getLogTitle(log)} ${getLogMessage(log)} ${getLogSource(log)}`.toLowerCase().includes(needle))
  );
};

export const countLogsByLevel = (logs = []) =>
  logs.reduce(
    (counts, log) => {
      counts[getLogLevel(log)] += 1;
      counts[ALL_LEVELS] += 1;
      return counts;
    },
    { [ALL_LEVELS]: 0, error: 0, warning: 0, info: 0, success: 0 }
  );

// Compact age for the log list ("12s", "4m", "2h"); older entries fall back to a short date.
export const formatLogAge = (timestamp, now = Date.now()) => {
  const time = Date.parse(timestamp);
  if (Number.isNaN(time)) return '';
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

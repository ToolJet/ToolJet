import React, { useEffect, useMemo, useState } from 'react';
import cx from 'classnames';
import moment from 'moment';
import { shallow } from 'zustand/shallow';
import {
  AlertTriangle,
  ArrowRight,
  CircleCheck,
  CircleX,
  Copy,
  Info,
  ListChecks,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import useStore from '@/AppBuilder/_stores/store';
import { ToolTip } from '@/_components/ToolTip';
import CustomJSONViewer from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/CustomJSONViewer/CustomJSONViewer';
import { copyToClipboard } from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/utils';
import {
  ALL_LEVELS,
  LEVEL_FILTER_LABELS,
  LEVEL_LABELS,
  LOG_LEVELS,
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
  isLogInScope,
} from './runtimeDebuggerUtils';
// Toolbar, search, filter chips, detail header, and value styles are shared with the Inspector.
import '@/AppBuilder/QueryPanel/RuntimeInspector/styles.scss';
import RuntimePanelCloseButton from '@/AppBuilder/QueryPanel/RuntimePanelCloseButton';
import RuntimeFilterSelect from '@/AppBuilder/QueryPanel/RuntimeFilterSelect';
import './styles.scss';

const LEVEL_ICONS = { error: CircleX, warning: AlertTriangle, info: Info, success: CircleCheck };
const RELATIVE_TIME_REFRESH_MS = 30000;

const LevelIcon = ({ level }) => {
  const Icon = LEVEL_ICONS[level];
  return <Icon size={14} className={cx('runtime-debugger__level', `is-${level}`)} aria-label={LEVEL_LABELS[level]} />;
};

// Re-render periodically so "2m ago" labels stay current while the panel is open.
const useRelativeTimeTick = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((tick) => tick + 1), RELATIVE_TIME_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);
};

const useLogAction = (log) => {
  const getQueryIdFromName = useStore((state) => state.getQueryIdFromName, shallow);
  const setSelectedQuery = useStore((state) => state.queryPanel.setSelectedQuery, shallow);
  const expandQueryPaneIfNeeded = useStore((state) => state.queryPanel.expandQueryPaneIfNeeded, shallow);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(), shallow);

  const action = getLogAction(log);
  if (!action) return null;

  // Only offer the jump when its target still exists: queries can be renamed or deleted, and
  // components may live on another page.
  if (action.type === 'query') {
    const queryId = getQueryIdFromName(action.name);
    if (!queryId) return null;
    return {
      label: action.label,
      run: () => {
        setSelectedQuery(queryId);
        expandQueryPaneIfNeeded();
        // Re-selecting the already-selected query doesn't retrigger the panel's open effect, so open it here.
        setActiveRightSideBarTab('query');
        setRightSidebarOpen(true);
      },
    };
  }

  if (!currentPageComponents?.[action.id]) return null;
  return { label: action.label, run: () => setSelectedComponents([action.id]) };
};

const LogDetail = ({ log, pageName }) => {
  const action = useLogAction(log);
  const level = getLogLevel(log);
  const message = getLogMessage(log);

  return (
    <>
      <div className="runtime-inspector__detail-header">
        <span className={cx('runtime-debugger__badge', `is-${level}`)}>{LEVEL_LABELS[level]}</span>
        <span className="runtime-debugger__detail-title" title={getLogTitle(log)}>
          {getLogTitle(log)}
        </span>
        <div className="runtime-inspector__actions">
          {action && (
            <button type="button" className="runtime-debugger__link" onClick={action.run} data-cy="debugger-log-action">
              {action.label}
              <ArrowRight size={13} />
            </button>
          )}
          <ToolTip message="Copy details" placement="top">
            <button
              type="button"
              className="runtime-inspector__icon-btn"
              onClick={() => copyToClipboard(hasLogDetails(log) ? log.error : message)}
              aria-label="Copy details"
              data-cy="debugger-copy-details"
            >
              <Copy size={14} />
            </button>
          </ToolTip>
        </div>
      </div>
      <div className="runtime-inspector__values runtime-debugger__detail-body">
        {message && <p className="runtime-debugger__message">{message}</p>}
        <dl className="runtime-debugger__meta">
          {log.timestamp && (
            <>
              <dt>Time</dt>
              <dd>{moment(log.timestamp).format('MMM D, HH:mm:ss')}</dd>
            </>
          )}
          {pageName && (
            <>
              <dt>Page</dt>
              <dd>{pageName}</dd>
            </>
          )}
          {getLogSource(log) && (
            <>
              <dt>Source</dt>
              <dd>{getLogSource(log)}</dd>
            </>
          )}
          {log.kind && (
            <>
              <dt>Kind</dt>
              <dd>{log.kind}</dd>
            </>
          )}
        </dl>
        {hasLogDetails(log) && (
          <>
            <div className="runtime-debugger__section-label">Details</div>
            <CustomJSONViewer absolutePath="error" data={log.error} showPathCopy={false} />
          </>
        )}
      </div>
    </>
  );
};

/**
 * Bottom-panel Debugger: filterable log list on the left, the selected log's details on the right.
 * One page scope applies to every level filter (the sidebar version mixed page-scoped errors with
 * all-page logs).
 */
const RuntimeDebugger = ({ darkMode, onClose }) => {
  const logs = useStore((state) => state.debugger.logs, shallow);
  const clearLogs = useStore((state) => state.debugger.clear, shallow);
  const currentPageId = useStore((state) => state.modules.canvas.currentPageId);
  const pages = useStore((state) => state.modules.canvas.pages, shallow);

  const [scope, setScope] = useState(SCOPE_PAGE);
  const [level, setLevel] = useState(ALL_LEVELS);
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  useRelativeTimeTick();

  const pageNames = useMemo(() => Object.fromEntries((pages ?? []).map((page) => [page.id, page.name])), [pages]);
  const scopedCounts = useMemo(
    () => countLogsByLevel(logs.filter((log) => isLogInScope(log, scope, currentPageId))),
    [logs, scope, currentPageId]
  );
  const visibleLogs = useMemo(
    () => filterLogs(logs, { scope, currentPageId, level, query }),
    [logs, scope, currentPageId, level, query]
  );
  const activeLog = visibleLogs.includes(selectedLog) ? selectedLog : visibleLogs[0];

  return (
    <div className={cx('runtime-inspector runtime-debugger', { 'dark-theme': darkMode })} data-cy="runtime-debugger">
      <div className="runtime-inspector__toolbar">
        <label className="runtime-inspector__search">
          <Search size={13} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter logs"
            aria-label="Filter logs"
            data-cy="debugger-search-input"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear filter">
              <X size={12} />
            </button>
          )}
        </label>
        <div className="runtime-inspector__filters" role="tablist" aria-label="Filter by level">
          {[ALL_LEVELS, ...LOG_LEVELS].map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={level === item}
              className={cx('runtime-inspector__filter', {
                'is-active': level === item,
                'is-empty': item !== ALL_LEVELS && scopedCounts[item] === 0,
              })}
              onClick={() => setLevel(item)}
              data-cy={`debugger-filter-${item}`}
            >
              {item === ALL_LEVELS ? 'All' : LEVEL_FILTER_LABELS[item]}
              <span className="runtime-debugger__count">{scopedCounts[item]}</span>
            </button>
          ))}
        </div>
        <RuntimeFilterSelect
          value={level}
          onChange={setLevel}
          ariaLabel="Filter by level"
          dataCy="debugger-filter-select"
          options={[ALL_LEVELS, ...LOG_LEVELS].map((item) => ({
            value: item,
            label: item === ALL_LEVELS ? 'All levels' : LEVEL_FILTER_LABELS[item],
            count: scopedCounts[item],
          }))}
        />
        <div className="runtime-debugger__scope" role="radiogroup" aria-label="Page scope">
          {[
            [SCOPE_PAGE, 'This page'],
            [SCOPE_ALL, 'All pages'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={scope === value}
              className={cx({ 'is-active': scope === value })}
              onClick={() => setScope(value)}
              data-cy={`debugger-scope-${value}`}
            >
              {label}
            </button>
          ))}
        </div>
        <ToolTip message="Clear logs" placement="top">
          <button
            type="button"
            className="runtime-inspector__icon-btn"
            onClick={clearLogs}
            aria-label="Clear logs"
            data-cy="debugger-clear-button"
          >
            <Trash2 size={14} />
          </button>
        </ToolTip>
        {onClose && <RuntimePanelCloseButton onClose={onClose} dataCy="debugger-close-button" />}
      </div>

      <div className="runtime-inspector__body">
        <ul className="runtime-debugger__list" aria-label="Logs">
          {visibleLogs.map((log, index) => {
            const logLevel = getLogLevel(log);
            return (
              <li key={`${log.timestamp}-${index}`}>
                <button
                  type="button"
                  className={cx('runtime-debugger__row', { 'is-selected': log === activeLog })}
                  onClick={() => setSelectedLog(log)}
                  data-cy="debugger-log-row"
                >
                  <LevelIcon level={logLevel} />
                  <span className="runtime-debugger__row-text">
                    <span className="runtime-debugger__row-message">{getLogMessage(log) || getLogTitle(log)}</span>
                    <span className="runtime-debugger__row-source">
                      {getLogSource(log)}
                      {log.key && (
                        <>
                          {' · '}
                          <span>{log.key}</span>
                        </>
                      )}
                      {scope === SCOPE_ALL && pageNames[log.page] && ` · ${pageNames[log.page]}`}
                    </span>
                  </span>
                  {log.timestamp && <span className="runtime-debugger__row-time">{formatLogAge(log.timestamp)}</span>}
                </button>
              </li>
            );
          })}
          {visibleLogs.length === 0 && (
            <li className="runtime-inspector__muted">{logs.length ? 'No logs match' : 'No logs yet'}</li>
          )}
        </ul>

        <section className="runtime-inspector__detail" aria-label="Selected log">
          {activeLog ? (
            <LogDetail
              key={`${activeLog.timestamp}-${getLogTitle(activeLog)}`}
              log={activeLog}
              pageName={pageNames[activeLog.page]}
            />
          ) : (
            <div className="runtime-inspector__empty">
              <ListChecks size={18} />
              <span>{scope === SCOPE_PAGE ? 'No logs on this page' : 'No logs yet'}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RuntimeDebugger;

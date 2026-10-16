import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { ChevronsDownUp, ChevronsUpDown, FileText, type LucideIcon } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { pageConfig } from '@/AppBuilder/RightSideBar/PageSettingsTab/pageConfig';
import { ActionTypes } from '@/AppBuilder/RightSideBar/Inspector/ActionTypes';
import { Button as RawButton } from '@/components/ui/Button/Button';
import RawInput from '@/components/ui/Input/Index';
import { ToolTip } from '@/_components/ToolTip';
import type { CodeSearchOptions } from '@/AppBuilder/_stores/slices/codeSearchSlice';
import { toPlainDefs, type EntityType, type PlainDefs } from './buildSearchRecords';
import {
  searchRecords,
  MIN_TERM_LENGTH,
  RESULT_TYPES,
  SECTION_OF,
  type ResultEntity,
  type ResultGroup,
  type ResultRow as ResultRowData,
  type SectionKey,
  type SearchResult,
} from './searchRecords';
import { runSearch, disposeSearchWorker } from './searchWorker';
import { navigateToResult } from './navigateToResult';
import { Chevron, CountBadge, EntityIcon, ResultRow } from './ResultRow';
import './codeSearch.scss';

// Untyped JS components.
const ButtonComponent = RawButton as React.ComponentType<any>;
const InputComponent = RawInput as React.ComponentType<any>;
// The App Builder store is untyped JS.
type StoreState = any;

const SEARCH_DEBOUNCE_MS = 150;
const EMPTY: never[] = [];
const REGEX_TOO_SLOW = 'Regular expression takes too long to run';
const EMPTY_RESULT = searchRecords([], '');

// The editor's widget / action / page-settings definitions, reduced to the labels the index shows.
// They never change at runtime, so they are reduced once.
let plainDefs: PlainDefs | null = null;
const getPlainDefs = () =>
  (plainDefs ||= toPlainDefs({
    widgetDefs: componentTypeDefinitionMap,
    actionDefs: ActionTypes,
    pageSettingsDef: pageConfig,
  }));

const MATCH_TOGGLES: {
  key: 'caseSensitive' | 'wholeWord' | 'regex';
  label: string;
  title: string;
  className?: string;
}[] = [
  { key: 'caseSensitive', label: 'Aa', title: 'Match case' },
  { key: 'wholeWord', label: 'ab', title: 'Match whole word', className: 'tw-underline' },
  { key: 'regex', label: '.*', title: 'Use regular expression' },
];

// Icon-only controls get a real tooltip (the native `title` is slow and easy to miss). A mouse click
// leaves focus in the search input, as in code editors' find widgets: a focused toggle would keep its
// focus-triggered tooltip up over the results and the Inspector while you keep searching.
const IconButton = ({
  title,
  pressed,
  className,
  onClick,
  children,
}: {
  title: string;
  pressed: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) => (
  <ToolTip message={title} placement="bottom">
    <button
      type="button"
      aria-label={title}
      aria-pressed={pressed}
      className={cx('code-search-toggle', className, { active: pressed })}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  </ToolTip>
);
const SECTION_TITLES: Record<SectionKey, string> = {
  components: 'Components',
  queries: 'Queries',
  events: 'Events',
  pages: 'Pages & app',
};
// Per section: a component with matching events is listed in both Components and Events.
const entityKey = (group: ResultGroup, entity: ResultEntity) => `entity:${group.key}:${entity.entityId}`;

const TYPE_LABELS: Record<'all' | EntityType, string> = {
  all: 'All',
  component: 'Components',
  query: 'Queries',
  event: 'Events',
  page: 'Pages',
  app: 'App',
};

const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;

interface CodeSearchProps {
  darkMode: boolean;
  onClose: () => void;
  moduleId?: string;
}

const CodeSearch = ({ darkMode, onClose, moduleId = 'canvas' }: CodeSearchProps) => {
  const [term, options, setTerm, setOptions]: [
    string,
    CodeSearchOptions,
    (term: string) => void,
    (options: Partial<CodeSearchOptions>) => void
  ] = useStore(
    (state: StoreState) => [
      state.codeSearch.term,
      state.codeSearch.options,
      state.setCodeSearchTerm,
      state.setCodeSearchOptions,
    ],
    shallow
  );
  const [pages, queries, events, globalSettings, pageSettings, currentPageId, queryIdNameMapping] = useStore(
    (state: StoreState) => [
      state.modules[moduleId]?.pages || EMPTY,
      state.dataQuery.queries.modules[moduleId] || EMPTY,
      state.eventsSlice.module[moduleId]?.events || EMPTY,
      state.globalSettings,
      state.pageSettings,
      state.modules[moduleId]?.currentPageId,
      state.modules[moduleId]?.queryIdNameMapping,
    ],
    shallow
  );

  const [debouncedTerm, setDebouncedTerm] = useState(term);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Collapsed group (`group:<key>`) and entity (`entity:<id>`) keys; reset whenever the results change.
  const [collapsed, setCollapsed] = useState(() => new Set<string>());
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    rootRef.current?.querySelector('input')?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  // Indexing and matching run in a worker (searchWorker.js); this thread only hands it the saved
  // definition, which it re-indexes when this object changes.
  const input = useMemo(
    () => ({ pages, queries, events, globalSettings, pageSettings, queryIdNameMapping, defs: getPlainDefs() }),
    [pages, queries, events, globalSettings, pageSettings, queryIdNameMapping]
  );

  const { caseSensitive, wholeWord, regex, type, currentPageOnly } = options;

  // The panel keeps showing the last result until the worker answers.
  const [result, setResult] = useState<SearchResult>(EMPTY_RESULT);
  useEffect(() => {
    if (debouncedTerm.length < MIN_TERM_LENGTH) return setResult(EMPTY_RESULT);
    let current = true;
    const filters = { caseSensitive, wholeWord, regex, type, currentPageOnly };
    runSearch({ input, term: debouncedTerm, filters, currentPageId }).then((outcome) => {
      if (!current || 'superseded' in outcome) return;
      setResult('timedOut' in outcome ? { ...EMPTY_RESULT, error: REGEX_TOO_SLOW } : outcome.result);
    });
    return () => {
      current = false;
    };
  }, [input, debouncedTerm, caseSensitive, wholeWord, regex, type, currentPageOnly, currentPageId]);

  useEffect(() => disposeSearchWorker, []);

  // A new search starts fully expanded; editing the app while searching keeps what you folded.
  useEffect(() => {
    setCollapsed(new Set());
    setActiveIndex(-1);
  }, [debouncedTerm, caseSensitive, wholeWord, regex, type, currentPageOnly]);

  // Rows the user can currently see, in display order — the keyboard moves through these.
  const visibleRows = useMemo(
    () =>
      result.groups.flatMap((group) =>
        collapsed.has(`group:${group.key}`)
          ? []
          : group.entities.flatMap((entity) => (collapsed.has(entityKey(group, entity)) ? [] : entity.rows))
      ),
    [result, collapsed]
  );

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const toggle = (key: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const entityKeys = result.groups.flatMap((group) => group.entities.map((entity) => entityKey(group, entity)));
  const allCollapsed = entityKeys.length > 0 && entityKeys.every((key) => collapsed.has(key));
  // Like VS Code: collapse-all folds every entity and leaves sections open.
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(entityKeys));

  // Opening the same row again steps to its next occurrence; a clicked mark opens that one.
  const lastOpened = useRef<{ row: ResultRowData | null; occurrence: number }>({ row: null, occurrence: 0 });
  const open = (row: ResultRowData, occurrence?: number) => {
    const previous = lastOpened.current;
    const next = occurrence ?? (previous.row === row ? (previous.occurrence + 1) % row.matches.length : 0);
    lastOpened.current = { row, occurrence: next };
    setActiveIndex(visibleRows.indexOf(row));
    navigateToResult({ record: row.record, ...row.matches[next] }, moduleId);
  };

  const entityKeyOf = (row: ResultRowData) =>
    `entity:${SECTION_OF[row.record.entityType]}:${row.record.ownerId || row.record.entityId}`;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const activeRow = visibleRows[activeIndex];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visibleRows.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + visibleRows.length) % visibleRows.length);
    } else if (e.key === 'Enter' && activeRow) {
      e.preventDefault();
      open(activeRow);
    } else if (
      activeRow &&
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
      (e.target as HTMLElement).tagName !== 'INPUT'
    ) {
      e.preventDefault();
      const key = entityKeyOf(activeRow);
      if ((e.key === 'ArrowLeft') !== collapsed.has(key)) toggle(key);
      if (e.key === 'ArrowLeft') setActiveIndex(-1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (term) setTerm('');
      else onClose();
    }
  };

  const pageName = (pageId?: string | null) =>
    pages.find((page: { id: string; name: string }) => page.id === pageId)?.name || 'Page';
  // Sections don't split by page, so components and event owners carry their page — when there is
  // more than one to tell apart.
  const pageTagOf = (group: ResultGroup, entity: ResultEntity) =>
    pages.length > 1 && (group.key === 'components' || group.key === 'events') && entity.pageId
      ? pageName(entity.pageId)
      : null;
  const entityCount = result.groups.reduce((count, group) => count + group.entities.length, 0);
  const hasSearch = debouncedTerm.length >= MIN_TERM_LENGTH && !result.error;

  const renderRow = (row: ResultRowData) => {
    const index = visibleRows.indexOf(row);
    return (
      <ResultRow
        key={`${row.record.entityId}:${row.record.eventId || ''}:${row.record.fieldPath.join('.')}`}
        ref={index === activeIndex ? activeRowRef : undefined}
        row={row}
        active={index === activeIndex}
        onOpen={open}
      />
    );
  };

  const renderTree = () =>
    result.groups.map((group) => {
      const groupOpen = !collapsed.has(`group:${group.key}`);
      return (
        <div key={group.key} className="code-search-group">
          <button type="button" className="code-search-group-header" onClick={() => toggle(`group:${group.key}`)}>
            <Chevron open={groupOpen} />
            <span className="code-search-group-title">{SECTION_TITLES[group.key]}</span>
            <CountBadge count={group.count} />
          </button>
          {groupOpen &&
            group.entities.map((entity) => {
              const key = entityKey(group, entity);
              const entityOpen = !collapsed.has(key);
              const pageTag = pageTagOf(group, entity);
              return (
                <div key={entity.entityId} className="code-search-entity">
                  <button type="button" className="code-search-entity-header" onClick={() => toggle(key)}>
                    <Chevron open={entityOpen} />
                    <EntityIcon entity={entity} darkMode={darkMode} />
                    <span className="code-search-entity-name">{entity.entityName}</span>
                    {entity.entitySubtype && <span className="code-search-entity-type">{entity.entitySubtype}</span>}
                    {pageTag && (
                      <span className={cx('code-search-entity-page', { current: entity.pageId === currentPageId })}>
                        {pageTag}
                      </span>
                    )}
                    {entity.defined && <span className="code-search-tag">Defined</span>}
                    <CountBadge count={entity.count} />
                  </button>
                  {entityOpen && entity.rows.map(renderRow)}
                </div>
              );
            })}
        </div>
      );
    });

  const renderBody = () => {
    if (result.error) return <div className="code-search-empty code-search-error">{result.error}</div>;
    if (debouncedTerm.length < MIN_TERM_LENGTH)
      return (
        <div className="code-search-empty">Search names, bindings, queries, code and settings across all pages.</div>
      );
    if (result.total === 0)
      return (
        <div className="code-search-empty">
          No matches for “{debouncedTerm}”{currentPageOnly ? ' on this page' : ''}
          <div className="code-search-empty-actions">
            {currentPageOnly && (
              <ButtonComponent variant="ghost" size="small" onClick={() => setOptions({ currentPageOnly: false })}>
                Search all pages
              </ButtonComponent>
            )}
            <ButtonComponent variant="ghost" size="small" onClick={() => setTerm('')}>
              Clear search
            </ButtonComponent>
          </div>
        </div>
      );
    return renderTree();
  };

  const toolbarButton = ({
    key,
    title,
    pressed,
    onClick,
    icon: Icon,
  }: {
    key: string;
    title: string;
    pressed: boolean;
    onClick: () => void;
    icon: LucideIcon;
  }) => (
    <IconButton key={key} title={title} pressed={pressed} onClick={onClick}>
      <Icon width="14" height="14" />
    </IconButton>
  );

  return (
    <div ref={rootRef} className={cx('code-search', { 'dark-theme': darkMode })} onKeyDown={handleKeyDown}>
      <div className="inspector-header code-search-header">
        <div className="inspector-header-top">
          <span className="inspector-header-title">Code search</span>
          <ButtonComponent iconOnly leadingIcon="x" onClick={onClose} variant="ghost" size="medium" isLucid />
        </div>
        <div className="code-search-input-row">
          <div className="code-search-input">
            <InputComponent
              leadingIcon="search01"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTerm(e.target.value)}
              onClear={() => setTerm('')}
              size="medium"
              placeholder="Search in app"
              value={term}
              {...(term && { trailingAction: 'clear' })}
            />
          </div>
          {MATCH_TOGGLES.map(({ key, label, title, className }) => (
            <IconButton
              key={key}
              title={title}
              pressed={options[key]}
              className={cx('code-search-toggle--text', className)}
              onClick={() => setOptions({ [key]: !options[key] })}
            >
              {label}
            </IconButton>
          ))}
          <span className="code-search-divider" aria-hidden="true" />
          {toolbarButton({
            key: 'collapse',
            title: allCollapsed ? 'Expand all' : 'Collapse all',
            pressed: false,
            onClick: toggleAll,
            icon: allCollapsed ? ChevronsUpDown : ChevronsDownUp,
          })}
        </div>
        {/* Shown at zero results too, so "This page" can always be switched off. */}
        {hasSearch && (
          <div className="code-search-filters">
            <button
              type="button"
              aria-pressed={currentPageOnly}
              className={cx('code-search-chip', { active: currentPageOnly })}
              onClick={() => setOptions({ currentPageOnly: !currentPageOnly })}
            >
              <FileText width="11" height="11" aria-hidden="true" /> This page
            </button>
            {result.typeCounts.all > 0 && <span className="code-search-divider" aria-hidden="true" />}
            {result.typeCounts.all > 0 && (
              <div className="code-search-chips" role="radiogroup" aria-label="Filter by type">
                {(['all', ...RESULT_TYPES] as const)
                  .filter((key) => key === 'all' || result.typeCounts[key] > 0)
                  .map((key) => (
                    <button
                      type="button"
                      key={key}
                      role="radio"
                      aria-checked={type === key}
                      className={cx('code-search-chip', { active: type === key })}
                      onClick={() => setOptions({ type: key })}
                    >
                      {TYPE_LABELS[key]} <span className="code-search-chip-count">{result.typeCounts[key]}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
        {hasSearch && result.total > 0 && (
          <div className="code-search-summary">
            {result.truncated
              ? `Showing ${plural(result.rows.length, 'field')} of ${result.fieldCount.toLocaleString()}`
              : `${plural(result.total, 'result')} in ${plural(result.fieldCount, 'field')} · ${plural(
                  entityCount,
                  'item'
                )}`}
          </div>
        )}
      </div>
      <div className="code-search-results">{renderBody()}</div>
    </div>
  );
};

export default CodeSearch;

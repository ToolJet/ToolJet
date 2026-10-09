import React, { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { ChevronsDownUp, ChevronsUpDown, FileText } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import InputComponent from '@/components/ui/Input/Index';
import { buildSearchRecords } from './buildSearchRecords';
import { searchRecords, MIN_TERM_LENGTH, RESULT_TYPES } from './searchRecords';
import { navigateToResult } from './navigateToResult';
import { Chevron, CountBadge, EntityIcon, ResultRow } from './ResultRow';
import './codeSearch.scss';

const SEARCH_DEBOUNCE_MS = 150;
const EMPTY = [];

const MATCH_TOGGLES = [
  { key: 'caseSensitive', label: 'Aa', title: 'Match case' },
  { key: 'wholeWord', label: 'ab', title: 'Match whole word', className: 'tw-underline' },
  { key: 'regex', label: '.*', title: 'Use regular expression' },
];
const TYPE_LABELS = {
  all: 'All',
  component: 'Components',
  query: 'Queries',
  event: 'Events',
  page: 'Pages',
  app: 'App',
};

const plural = (count, word) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;

const CodeSearch = ({ darkMode, onClose, moduleId = 'canvas' }) => {
  const [term, options, setTerm, setOptions] = useStore(
    (state) => [state.codeSearch.term, state.codeSearch.options, state.setCodeSearchTerm, state.setCodeSearchOptions],
    shallow
  );
  const [pages, queries, events, globalSettings, currentPageId, replaceIdsWithName] = useStore(
    (state) => [
      state.modules[moduleId]?.pages || EMPTY,
      state.dataQuery.queries.modules[moduleId] || EMPTY,
      state.eventsSlice.module[moduleId]?.events || EMPTY,
      state.globalSettings,
      state.modules[moduleId]?.currentPageId,
      state.replaceIdsWithName,
    ],
    shallow
  );

  const [debouncedTerm, setDebouncedTerm] = useState(term);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Collapsed group (`group:<key>`) and entity (`entity:<id>`) keys; reset whenever the results change.
  const [collapsed, setCollapsed] = useState(() => new Set());
  const rootRef = useRef(null);
  const activeRowRef = useRef(null);

  useEffect(() => {
    rootRef.current?.querySelector('input')?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  // ponytail: rebuilt on the main thread on every definition change while the panel is open;
  // move buildSearchRecords + searchRecords into a Web Worker when large apps feel it (spec §6).
  const records = useMemo(
    () =>
      buildSearchRecords({
        pages,
        queries,
        events,
        globalSettings,
        translate: (text) => replaceIdsWithName(text, moduleId),
        widgetDefs: componentTypeDefinitionMap,
      }),
    [pages, queries, events, globalSettings, replaceIdsWithName, moduleId]
  );

  const { caseSensitive, wholeWord, regex, type, currentPageOnly } = options;
  const result = useMemo(
    () =>
      searchRecords(
        records,
        debouncedTerm,
        { caseSensitive, wholeWord, regex, type, currentPageOnly },
        { currentPageId, pages }
      ),
    [records, debouncedTerm, caseSensitive, wholeWord, regex, type, currentPageOnly, currentPageId, pages]
  );

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
          : group.entities.flatMap((entity) => (collapsed.has(`entity:${entity.entityId}`) ? [] : entity.rows))
      ),
    [result, collapsed]
  );

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const toggle = (key) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const entityKeys = result.groups.flatMap((group) => group.entities.map((entity) => `entity:${entity.entityId}`));
  const allCollapsed = entityKeys.length > 0 && entityKeys.every((key) => collapsed.has(key));
  // Like VS Code: collapse-all folds every entity and leaves page groups open.
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(entityKeys));

  const open = (row) => {
    setActiveIndex(visibleRows.indexOf(row));
    navigateToResult({ record: row.record, ...row.matches[0] }, moduleId);
  };

  const entityKeyOf = (row) => `entity:${row.record.ownerId || row.record.entityId}`;

  const handleKeyDown = (e) => {
    const activeRow = visibleRows[activeIndex];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visibleRows.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + visibleRows.length) % visibleRows.length);
    } else if (e.key === 'Enter' && activeRow) {
      e.preventDefault();
      navigateToResult({ record: activeRow.record, ...activeRow.matches[0] }, moduleId);
    } else if (activeRow && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.tagName !== 'INPUT') {
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

  const pageName = (pageId) => pages.find((page) => page.id === pageId)?.name || 'Page';
  const groupTitle = (group) =>
    group.key === 'queries' ? 'Queries' : group.key === 'app' ? 'App' : pageName(group.pageId);
  const entityCount = result.groups.reduce((count, group) => count + group.entities.length, 0);
  const hasSearch = debouncedTerm.length >= MIN_TERM_LENGTH && !result.error;

  const renderRow = (row) => {
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
            <span className="code-search-group-title">{groupTitle(group)}</span>
            {group.pageId === currentPageId && <span className="code-search-tag">current page</span>}
            <CountBadge count={group.count} />
          </button>
          {groupOpen &&
            group.entities.map((entity) => {
              const entityOpen = !collapsed.has(`entity:${entity.entityId}`);
              return (
                <div key={entity.entityId}>
                  <button
                    type="button"
                    className="code-search-entity-header"
                    onClick={() => toggle(`entity:${entity.entityId}`)}
                  >
                    <Chevron open={entityOpen} />
                    <EntityIcon entity={entity} darkMode={darkMode} />
                    <span className="code-search-entity-name">{entity.entityName}</span>
                    {entity.entitySubtype && <span className="code-search-entity-type">{entity.entitySubtype}</span>}
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
          <ButtonComponent variant="ghost" size="small" onClick={() => setTerm('')}>
            Clear search
          </ButtonComponent>
        </div>
      );
    return renderTree();
  };

  const toolbarButton = ({ key, title, pressed, onClick, icon: Icon }) => (
    <button
      type="button"
      key={key}
      title={title}
      aria-label={title}
      aria-pressed={pressed}
      className={cx('code-search-toggle', { active: pressed })}
      onClick={onClick}
    >
      <Icon width="14" height="14" />
    </button>
  );

  return (
    <div ref={rootRef} className={cx('code-search', { 'dark-theme': darkMode })} onKeyDown={handleKeyDown}>
      <div className="inspector-header code-search-header">
        <div className="inspector-header-top">
          <span className="inspector-header-title">Code search</span>
          <ButtonComponent iconOnly leadingIcon="x" onClick={onClose} variant="ghost" size="medium" isLucid />
        </div>
        <div className="code-search-input-row">
          <div className="tw-flex-1">
            <InputComponent
              leadingIcon="search01"
              onChange={(e) => setTerm(e.target.value)}
              onClear={() => setTerm('')}
              size="medium"
              placeholder="Search in app"
              value={term}
              {...(term && { trailingAction: 'clear' })}
            />
          </div>
          {MATCH_TOGGLES.map(({ key, label, title, className }) => (
            <button
              type="button"
              key={key}
              title={title}
              aria-label={title}
              aria-pressed={options[key]}
              className={cx('code-search-toggle code-search-toggle--text', className, { active: options[key] })}
              onClick={() => setOptions({ [key]: !options[key] })}
            >
              {label}
            </button>
          ))}
        </div>
        {hasSearch && result.typeCounts.all > 0 && (
          <div className="code-search-chips" role="radiogroup" aria-label="Filter by type">
            {['all', ...RESULT_TYPES]
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
        <div className="code-search-summary-row">
          <span className="code-search-summary">
            {hasSearch && result.total > 0
              ? result.truncated
                ? `Showing ${plural(result.rows.length, 'field')} of ${result.fieldCount.toLocaleString()}`
                : `${plural(result.total, 'result')} in ${plural(result.fieldCount, 'field')} · ${plural(
                    entityCount,
                    'item'
                  )}`
              : ''}
          </span>
          {toolbarButton({
            key: 'page',
            title: 'Current page only',
            pressed: currentPageOnly,
            onClick: () => setOptions({ currentPageOnly: !currentPageOnly }),
            icon: FileText,
          })}
          {toolbarButton({
            key: 'collapse',
            title: allCollapsed ? 'Expand all' : 'Collapse all',
            pressed: false,
            onClick: toggleAll,
            icon: allCollapsed ? ChevronsUpDown : ChevronsDownUp,
          })}
        </div>
      </div>
      <div className="code-search-results">{renderBody()}</div>
    </div>
  );
};

export default CodeSearch;

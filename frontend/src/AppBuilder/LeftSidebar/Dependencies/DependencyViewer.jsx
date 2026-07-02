import React, { useEffect, useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { ChevronRightIcon, Maximize2Icon, WaypointsIcon } from 'lucide-react';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import InputComponent from '@/components/ui/Input/Index';
import { ToolTip } from '@/_components/ToolTip';
import { getComponentUsage, getPageLoadQueries } from '@/AppBuilder/_utils/entityUsage';
import EntityUsageList from '@/AppBuilder/Shared/EntityUsage/EntityUsageList';
import DependencyGraphOverlay from './DependencyGraphOverlay';
import './styles.scss';

// Left sidebar "Dependencies" panel: lists the current page's components, each
// expandable to show what it uses (queries/variables/components), who uses its
// exposed values, and which queries its event handlers trigger.
const DependencyViewer = ({ darkMode, onClose, moduleId }) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [showGraph, setShowGraph] = useState(false);
  const [graphFocus, setGraphFocus] = useState(null);
  const [pageLoadExpanded, setPageLoadExpanded] = useState(false);

  // Subscriptions that make the list recompute when bindings can have changed:
  // page components (property bindings), queries (options refs) and events (triggers).
  const pageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const queries = useStore((state) => state.dataQuery.queries.modules[moduleId]);
  const events = useStore((state) => state.eventsSlice.module[moduleId]?.events);
  const selectedComponent = useStore((state) => state.selectedComponents?.[0]);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);

  const selectedComponentId = typeof selectedComponent === 'string' ? selectedComponent : selectedComponent?.id;

  const loadQueries = useMemo(
    () => getPageLoadQueries(useStore.getState(), moduleId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queries, events, moduleId]
  );
  const loadQueriesCount = loadQueries.appLoad.length + loadQueries.pageLoad.length;

  const componentList = useMemo(() => {
    const state = useStore.getState();
    return Object.entries(pageComponents || {})
      .map(([id, definition]) => {
        const usage = getComponentUsage(state, id, moduleId);
        return {
          id,
          name: definition?.component?.name ?? id,
          usage,
          count: usage.uses.length + usage.usedBy.length + usage.triggers.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageComponents, queries, events, moduleId]);

  // Auto-expand the component selected on canvas
  useEffect(() => {
    if (!selectedComponentId) return;
    setExpandedIds((prev) => (prev.has(selectedComponentId) ? prev : new Set(prev).add(selectedComponentId)));
  }, [selectedComponentId]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Row click selects the component on canvas (and keeps the row expanded);
  // the chevron alone toggles expansion without changing selection.
  const selectComponent = (id) => {
    setSelectedComponents([id]);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setExpandedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  const visibleComponents = componentList.filter(
    (item) => !searchValue || item.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div
      className={`left-sidebar-dependency-viewer ${darkMode ? 'dark-theme' : ''}`}
      style={{ resize: 'horizontal', minWidth: 288 }}
    >
      <div className={`inspector-header ${darkMode ? 'dark-theme' : ''}`}>
        <div className="inspector-header-top">
          <span className="inspector-header-title" data-cy="dependency-viewer-title">
            Dependencies
          </span>
          <div className="dependency-viewer-header-actions">
            <ToolTip message="Open graph view" placement="bottom">
              <div>
                <ButtonComponent
                  iconOnly
                  onClick={() => {
                    setGraphFocus(null);
                    setShowGraph(true);
                  }}
                  variant="ghost"
                  size="medium"
                  data-cy="dependency-viewer-graph-button"
                >
                  <Maximize2Icon size={14} color="var(--icon-strong)" />
                </ButtonComponent>
              </div>
            </ToolTip>
            <ButtonComponent
              iconOnly
              leadingIcon="x"
              onClick={onClose}
              variant="ghost"
              size="medium"
              isLucid={true}
              data-cy="dependency-viewer-close-button"
            />
          </div>
        </div>
        <div className="inspector-header-search">
          <InputComponent
            leadingIcon="search01"
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
            size="medium"
            placeholder="Search components"
            value={searchValue}
            {...(searchValue && { trailingAction: 'clear' })}
            data-cy="dependency-viewer-search-input"
          />
        </div>
      </div>

      <div className="dependency-viewer-body">
        {loadQueriesCount > 0 && (
          <div className="dependency-viewer-row dependency-viewer-pageload">
            <div
              className="dependency-viewer-row-header"
              onClick={() => setPageLoadExpanded((prev) => !prev)}
              role="button"
              data-cy="dependency-viewer-pageload-header"
            >
              <span className="dependency-viewer-chevron-wrapper">
                <ChevronRightIcon
                  size={14}
                  className={`dependency-viewer-chevron ${pageLoadExpanded ? 'expanded' : ''}`}
                />
              </span>
              <span className="dependency-viewer-component-name text-truncate">Runs on load</span>
              <span className="dependency-viewer-count">{loadQueriesCount}</span>
            </div>
            {pageLoadExpanded && (
              <div className="dependency-viewer-row-body">
                <EntityUsageList
                  groups={[
                    { title: 'On app load (once)', entries: loadQueries.appLoad },
                    { title: 'On page load (every visit)', entries: loadQueries.pageLoad },
                  ]}
                />
              </div>
            )}
          </div>
        )}
        {componentList.length === 0 && (
          <div className="dependency-viewer-empty" data-cy="dependency-viewer-empty">
            No components on this page yet.
          </div>
        )}
        {componentList.length > 0 && visibleComponents.length === 0 && (
          <div className="dependency-viewer-empty">No components match your search.</div>
        )}
        {visibleComponents.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          return (
            <div className="dependency-viewer-row" key={item.id}>
              <div
                className={`dependency-viewer-row-header ${selectedComponentId === item.id ? 'selected' : ''}`}
                onClick={() => selectComponent(item.id)}
                role="button"
                data-cy={`dependency-viewer-row-${item.name.toLowerCase()}`}
              >
                <span
                  className="dependency-viewer-chevron-wrapper"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(item.id);
                  }}
                  role="button"
                  data-cy={`dependency-viewer-toggle-${item.name.toLowerCase()}`}
                >
                  <ChevronRightIcon size={14} className={`dependency-viewer-chevron ${isExpanded ? 'expanded' : ''}`} />
                </span>
                <span className="dependency-viewer-component-name text-truncate">{item.name}</span>
                <span
                  className="dependency-viewer-row-graph-btn"
                  role="button"
                  title="View in graph"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGraphFocus(`component:${item.id}`);
                    setShowGraph(true);
                  }}
                  data-cy={`dependency-viewer-row-graph-${item.name.toLowerCase()}`}
                >
                  <WaypointsIcon size={12} />
                </span>
                <span className="dependency-viewer-count">{item.count}</span>
              </div>
              {isExpanded && (
                <div className="dependency-viewer-row-body">
                  <EntityUsageList
                    groups={[
                      { title: 'Uses', entries: item.usage.uses },
                      { title: 'Used by', entries: item.usage.usedBy },
                      { title: 'Triggers', entries: item.usage.triggers },
                    ]}
                    emptyMessage="No dependencies. Bindings, and events that run queries, will show up here."
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showGraph && (
        <DependencyGraphOverlay
          onClose={() => {
            setShowGraph(false);
            setGraphFocus(null);
          }}
          moduleId={moduleId}
          darkMode={darkMode}
          initialFocus={graphFocus}
        />
      )}
    </div>
  );
};

export default DependencyViewer;

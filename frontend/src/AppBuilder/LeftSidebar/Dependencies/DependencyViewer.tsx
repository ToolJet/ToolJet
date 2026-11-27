import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getPanelCloseLabel, SIDEBAR_ITEMS } from '@/AppBuilder/panelLayout';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import RawPanelHeader from '@/AppBuilder/Shared/Panel/PanelHeader';
import RawInputComponent from '@/components/ui/Input/Index';
import { getDependencySections } from '@/AppBuilder/_utils/entityUsage';
import type { DependencySections } from '@/AppBuilder/_utils/entityUsage';
import useEntityNavigation from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';
import type { NavigateToEntity } from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';
import MainTab from './MainTab';
import DetailTab, { DetailHeader, detailMenuIcons, subSectionIcons } from './DetailTab';
import { ComponentIcon, EntityIcon, QueryIcon } from './entityIcons';
import type {
  ComponentsById,
  DependencyEntry,
  DependencySelection,
  DetailGroup,
  DetailView,
  QueriesById,
} from './types';
import '../panelHeader.scss';
import './styles.scss';

// Untyped JS modules — cast at the import site.
const PanelHeader = RawPanelHeader as React.ComponentType<any>;
const InputComponent = RawInputComponent as React.ComponentType<any>;

export type DependencyViewerProps = {
  darkMode?: boolean;
  onClose: () => void;
  moduleId: string;
};

// Left sidebar "Dependencies" panel. The main tab lists every entity on the page
// that participates in a relationship; selecting one opens its detail tab.
const DependencyViewer = ({ darkMode, onClose, moduleId }: DependencyViewerProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [selected, setSelected] = useState<DependencySelection | null>(null);

  // Subscriptions that make the lists recompute when bindings can have changed:
  // page components (property bindings), queries (options refs) and events (triggers).
  const pageComponents = useStore((state: any) => state.getCurrentPageComponents(moduleId), shallow);
  const queries = useStore((state: any) => state.dataQuery.queries.modules[moduleId]);
  const events = useStore((state: any) => state.eventsSlice.module[moduleId]?.events);
  const variableMaps = useStore(
    (state: any) => [
      state.getGlobalSettings(moduleId)?.variables,
      state.modules[moduleId]?.pages?.find((page: any) => page.id === state.getCurrentPageId(moduleId))?.variables,
      state.resolvedStore.modules[moduleId]?.exposedValues?.variables,
      state.resolvedStore.modules[moduleId]?.exposedValues?.page?.variables,
    ],
    shallow
  );
  const variablesByScope = useMemo(() => {
    const names = { app: new Set<string>(), page: new Set<string>() };
    useStore
      .getState()
      .getVariableDefinitions(moduleId)
      .forEach((definition: any) => {
        names[definition.scope as 'app' | 'page'].add(definition.name);
      });
    Object.keys(variableMaps[2] ?? {}).forEach((name) => names.app.add(name));
    Object.keys(variableMaps[3] ?? {}).forEach((name) => names.page.add(name));
    return names;
  }, [variableMaps, moduleId]);
  // The graph itself. It is a class instance mutated in place, so nothing above changes
  // identity when an edge is added — and graph writes are batched, landing a tick after the
  // definition write that triggered them. Without this the panel renders against the graph
  // as it was before the flush and never recomputes, which is why it went stale on pages
  // large enough for construction to actually batch. DependencyGraph#version is a plain
  // number, so the selector's value changes even though the instance's identity does not.
  const graphVersion = useStore((state: any) => state.dependencyGraph?.modules?.[moduleId]?.graph?.version);
  const selectedComponent = useStore((state: any) => state.selectedComponents?.[0]);
  const requestedSelection = useStore((state: any) => state.dependencyPanelSelection);
  const clearRequestedSelection = useStore((state: any) => state.clearDependencyPanelSelection);
  const navigateToEntity = useEntityNavigation();

  const selectedComponentId = typeof selectedComponent === 'string' ? selectedComponent : selectedComponent?.id;

  const sections = useMemo<DependencySections>(
    () => getDependencySections(useStore.getState(), moduleId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageComponents, queries, events, graphVersion, variableMaps, moduleId]
  );

  const queriesById = useMemo<QueriesById>(
    () => Object.fromEntries((queries ?? []).map((query: any) => [query.id, query])),
    [queries]
  );
  const componentsById: ComponentsById = pageComponents ?? {};

  const sectionsRef = useRef<DependencySections>(sections);
  sectionsRef.current = sections;
  const lastSyncedComponentId = useRef<string | null>(null);

  // An explicit request (config handle, query card menu) wins over the canvas sync below,
  // and is consumed immediately so asking for the same entity twice still works.
  useEffect(() => {
    if (!requestedSelection?.kind || !requestedSelection?.id) return;
    setSelected({ kind: requestedSelection.kind, id: requestedSelection.id });
    // The canvas sync is keyed on the last id it acted on; align it so it does not
    // immediately overwrite this selection with the current canvas selection.
    lastSyncedComponentId.current = selectedComponentId ?? null;
    clearRequestedSelection?.();
  }, [requestedSelection, clearRequestedSelection, selectedComponentId]);

  // Selecting a component on canvas opens its detail tab, when it has relationships.
  // Keyed off the id alone so that later edits to bindings don't yank the panel back
  // to the canvas selection while the user is browsing something else.
  useEffect(() => {
    if (!selectedComponentId || selectedComponentId === lastSyncedComponentId.current) return;
    lastSyncedComponentId.current = selectedComponentId;
    if (!sectionsRef.current.components.some((item) => item.id === selectedComponentId)) return;
    setSelected({ kind: 'component', id: selectedComponentId });
  }, [selectedComponentId]);

  const detail = useMemo<DetailView | null>(
    () => buildDetail(selected, sections, { queriesById, componentsById, variablesByScope, navigateToEntity }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, sections, queriesById, componentsById, variablesByScope]
  );

  return (
    <div className={`left-sidebar-dependency-viewer ${darkMode ? 'dark-theme' : ''}`}>
      <div className={`inspector-header ${darkMode ? 'dark-theme' : ''}`}>
        <PanelHeader
          title={SIDEBAR_ITEMS.dependencies.name}
          titleDataCy="dependency-viewer-title"
          onClose={onClose}
          closeLabel={getPanelCloseLabel('dependencies')}
          closeDataCy="dependency-viewer-close-button"
          divider={false}
        />
        {detail ? (
          <DetailHeader
            subject={detail.subject}
            breadcrumbRoot={detail.breadcrumbRoot}
            menuItems={detail.menuItems}
            darkMode={darkMode}
            onNavigateRoot={() => setSelected(null)}
          />
        ) : (
          <div className="inspector-header-search">
            <InputComponent
              leadingIcon="search01"
              onChange={(e: any) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue('')}
              size="medium"
              placeholder="Search dependencies"
              aria-label="Search dependencies"
              value={searchValue}
              {...(searchValue && { trailingAction: 'clear' })}
              data-cy="dependency-viewer-search-input"
            />
          </div>
        )}
      </div>

      <div className="dependency-viewer-body">
        {detail ? (
          <DetailTab
            subject={detail.subject}
            groups={detail.groups}
            moduleId={moduleId}
            onSelect={setSelected}
            onNavigateRoot={() => {
              setSearchValue('');
              setSelected(null);
            }}
            darkMode={darkMode}
          />
        ) : (
          <MainTab
            sections={sections}
            searchTerm={searchValue}
            queriesById={queriesById}
            componentsById={componentsById}
            onSelect={setSelected}
            onClearSearch={() => setSearchValue('')}
          />
        )}
      </div>
    </div>
  );
};

/** The optional flags `group()` folds onto a DetailGroup. */
type GroupExtra = {
  showCount?: boolean;
  eventSourceIsSubject?: boolean;
  bindingOwnerIsSubject?: boolean;
  subjectComponentType?: string;
};

type BuildDetailContext = {
  queriesById: QueriesById;
  componentsById: ComponentsById;
  variablesByScope: { app: Set<string>; page: Set<string> };
  navigateToEntity: NavigateToEntity;
};

/**
 * Turns the selected entity into everything DetailTab renders: breadcrumb subject,
 * the ordered relationship groups, and the kebab actions.
 * Returns null when nothing is selected or the selection no longer exists.
 */
function buildDetail(
  selected: DependencySelection | null,
  sections: DependencySections,
  { queriesById, componentsById, variablesByScope, navigateToEntity }: BuildDetailContext
): DetailView | null {
  if (!selected) return null;

  const lookups = { queriesById, componentsById };
  const componentTypeOf = (id: string | null): string | undefined =>
    id == null ? undefined : componentsById?.[id]?.component?.component;

  const group = (
    title: string,
    icon: React.ReactNode,
    verb: string,
    entries: DependencyEntry[],
    extra: GroupExtra = {}
  ): DetailGroup => ({
    title,
    icon,
    verb,
    entries,
    componentTypeOf,
    ...lookups,
    eventSourceTypeOf: (entry) => (extra.eventSourceIsSubject ? extra.subjectComponentType : componentTypeOf(entry.id)),
    bindingOwnerTypeOf: (entry, entryComponentType) =>
      extra.bindingOwnerIsSubject ? extra.subjectComponentType : entryComponentType,
    ...extra,
  });

  if (selected.kind === 'query') {
    const query = queriesById[selected.id];
    const item =
      sections.queries.find((q) => q.id === selected.id) ??
      (query && {
        id: selected.id,
        name: query.name,
        query,
        usage: { uses: [], usedBy: [], triggeredBy: [] },
        ownEvents: { onSuccess: [], onFailure: [] },
        loadTriggers: { appLoad: false, pageLoad: false },
      });
    if (!item) return null;
    const loadRows: DependencyEntry[] = [
      ...(item.loadTriggers.appLoad ? [{ kind: 'appLoad' as const, id: null, name: 'App load', details: [] }] : []),
      ...(item.loadTriggers.pageLoad ? [{ kind: 'pageLoad' as const, id: null, name: 'Page load', details: [] }] : []),
    ];
    return {
      breadcrumbRoot: 'Queries',
      subject: { kind: 'query', name: item.name, icon: <QueryIcon query={item.query} size={16} /> },
      groups: [
        group('Triggered by', subSectionIcons.events, 'is triggered by', [...loadRows, ...item.usage.triggeredBy]),
        group('Uses', subSectionIcons.uses, 'uses', item.usage.uses),
        group('Used by', subSectionIcons.usedBy, 'is used by', item.usage.usedBy),
        group(
          'Events',
          subSectionIcons.events,
          'triggers',
          [...item.ownEvents.onSuccess, ...item.ownEvents.onFailure],
          {
            showCount: false,
            eventSourceIsSubject: true,
          }
        ),
      ],
      menuItems: [
        {
          label: 'Inspect query',
          icon: detailMenuIcons.inspect,
          onClick: () => navigateToEntity.inspect({ kind: 'query', name: item.name }),
        },
        {
          label: 'View query',
          icon: detailMenuIcons.goTo,
          onClick: () => navigateToEntity({ kind: 'query', id: item.id, name: item.name }),
        },
      ],
    };
  }

  if (selected.kind === 'component') {
    const component = componentsById[selected.id]?.component;
    const item =
      sections.components.find((c) => c.id === selected.id) ??
      (component && {
        id: selected.id,
        name: component.name,
        componentType: component.component,
        usage: { uses: [], usedBy: [], triggers: [] },
      });
    if (!item) return null;
    const subjectComponentType = item.componentType;
    return {
      breadcrumbRoot: 'Components',
      subject: {
        kind: 'component',
        name: item.name,
        icon: <ComponentIcon componentType={item.componentType} size={16} />,
      },
      groups: [
        group('Uses', subSectionIcons.uses, 'uses', item.usage.uses, {
          bindingOwnerIsSubject: true,
          subjectComponentType,
        }),
        group('Used by', subSectionIcons.usedBy, 'is used by', item.usage.usedBy, { subjectComponentType }),
        group('Events', subSectionIcons.events, 'triggers', item.usage.triggers, {
          showCount: false,
          eventSourceIsSubject: true,
          subjectComponentType,
        }),
      ],
      menuItems: [
        {
          label: 'Inspect component',
          icon: detailMenuIcons.inspect,
          onClick: () => navigateToEntity.inspect({ kind: 'component', name: item.name }),
        },
        {
          label: 'Go to component',
          icon: detailMenuIcons.goTo,
          onClick: () => navigateToEntity({ kind: 'component', id: item.id, name: item.name }),
        },
      ],
    };
  }

  if (selected.kind === 'variable') {
    const [rawScope, ...rest] = String(selected.id).split(':');
    const scope = rawScope as 'app' | 'page';
    const name = rest.join(':');
    const item =
      sections.variables[scope]?.find((v) => v.name === name) ??
      (variablesByScope[scope]?.has(name) ? { name, uses: [], setBy: [], readBy: [] } : null);
    if (!item) return null;
    const entryKind = scope === 'app' ? 'variable' : 'pageVariable';
    return {
      breadcrumbRoot: 'Variables',
      subject: {
        kind: entryKind,
        name: item.name,
        icon: <EntityIcon kind="variable" size={16} />,
        variableScope: scope,
      },
      groups: [
        group('Uses', subSectionIcons.uses, 'uses', item.uses),
        group('Set by', subSectionIcons.usedBy, 'is set by', item.setBy),
        group('Read by', subSectionIcons.uses, 'is read by', item.readBy),
      ],
      menuItems: [
        {
          label: 'Inspect variable',
          icon: detailMenuIcons.inspect,
          onClick: () => navigateToEntity.inspect({ kind: entryKind, name: item.name }),
        },
      ],
    };
  }

  return null;
}

export default DependencyViewer;

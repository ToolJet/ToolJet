import React, { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import InputComponent from '@/components/ui/Input/Index';
import { getDependencySections } from '@/AppBuilder/_utils/entityUsage';
import useEntityNavigation from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';
import MainTab from './MainTab';
import DetailTab, { DetailHeader, detailMenuIcons, subSectionIcons } from './DetailTab';
import { ComponentIcon, EntityIcon, QueryIcon } from './entityIcons';
import './styles.scss';

// Left sidebar "Dependencies" panel. The main tab lists every entity on the page
// that participates in a relationship; selecting one opens its detail tab.
const DependencyViewer = ({ darkMode, onClose, moduleId }) => {
  const [searchValue, setSearchValue] = useState('');
  const [selected, setSelected] = useState(null); // { kind, id }

  // Subscriptions that make the lists recompute when bindings can have changed:
  // page components (property bindings), queries (options refs) and events (triggers).
  const pageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const queries = useStore((state) => state.dataQuery.queries.modules[moduleId]);
  const events = useStore((state) => state.eventsSlice.module[moduleId]?.events);
  const selectedComponent = useStore((state) => state.selectedComponents?.[0]);
  const navigateToEntity = useEntityNavigation();

  const selectedComponentId = typeof selectedComponent === 'string' ? selectedComponent : selectedComponent?.id;

  const sections = useMemo(
    () => getDependencySections(useStore.getState(), moduleId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageComponents, queries, events, moduleId]
  );

  const queriesById = useMemo(() => Object.fromEntries((queries ?? []).map((query) => [query.id, query])), [queries]);
  const componentsById = pageComponents ?? {};

  // Selecting a component on canvas opens its detail tab, when it has relationships.
  // Keyed off the id alone so that later edits to bindings don't yank the panel back
  // to the canvas selection while the user is browsing something else.
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const lastSyncedComponentId = useRef(null);
  useEffect(() => {
    if (!selectedComponentId || selectedComponentId === lastSyncedComponentId.current) return;
    lastSyncedComponentId.current = selectedComponentId;
    if (!sectionsRef.current.components.some((item) => item.id === selectedComponentId)) return;
    setSelected({ kind: 'component', id: selectedComponentId });
  }, [selectedComponentId]);

  const detail = useMemo(
    () => buildDetail(selected, sections, { queriesById, componentsById, navigateToEntity }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, sections, queriesById, componentsById]
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
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue('')}
              size="medium"
              placeholder="Search"
              value={searchValue}
              {...(searchValue && { trailingAction: 'clear' })}
              data-cy="dependency-viewer-search-input"
            />
          </div>
        )}
      </div>

      <div className="dependency-viewer-body">
        {detail ? (
          <DetailTab subject={detail.subject} groups={detail.groups} moduleId={moduleId} onSelect={setSelected} />
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

/**
 * Turns the selected entity into everything DetailTab renders: breadcrumb subject,
 * the ordered relationship groups, and the kebab actions.
 * Returns null when nothing is selected or the selection no longer exists.
 */
function buildDetail(selected, sections, { queriesById, componentsById, navigateToEntity }) {
  if (!selected) return null;

  const lookups = { queriesById, componentsById };
  const componentTypeOf = (id) => componentsById?.[id]?.component?.component;

  const group = (title, icon, verb, entries, extra = {}) => ({
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
    const item = sections.queries.find((q) => q.id === selected.id);
    if (!item) return null;
    const loadRows = [
      ...(item.loadTriggers.appLoad ? [{ kind: 'appLoad', id: null, name: 'App load', details: [] }] : []),
      ...(item.loadTriggers.pageLoad ? [{ kind: 'pageLoad', id: null, name: 'Page load', details: [] }] : []),
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
    const item = sections.components.find((c) => c.id === selected.id);
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
    const [scope, ...rest] = String(selected.id).split(':');
    const name = rest.join(':');
    const item = sections.variables[scope]?.find((v) => v.name === name);
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

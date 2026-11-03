import React, { useMemo } from 'react';
import i18next from 'i18next';

import Accordion from '@/_ui/Accordion';
import { EventManager } from '@/AppBuilder/RightSideBar/Inspector/EventManager';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '@/AppBuilder/RightSideBar/Inspector/inspectorConstants';
import { getLibraryComponentIdentity } from '@/AppBuilder/Widgets/libraryComponentRevision';
import { useEffectiveLibraryRevision } from '@/AppBuilder/Widgets/hooks/useEffectiveLibraryRevision';
import { useLibraryManifest } from '@/AppBuilder/Widgets/hooks/useLibraryManifest';
import {
  additionalActionProps,
  buildEventMetaDefinition,
  fieldMeta,
  filterVisibleProps,
  formatRevisionLabel,
  groupPropsBySection,
} from './utils';

import type { LibraryComponentPropertiesProps } from './types';

const AccordionComponent = Accordion as React.ComponentType<any>;
const EventManagerComponent = EventManager as React.ComponentType<any>;

// F4b: manifest-driven Inspector panel for the LibraryComponent widget (LLD §5.6,
// ModuleViewerInspector pattern). Identity (libraryId/componentName) lives ONLY in
// definition.properties — never rendered as editable fields. Props and events come
// from the PINNED revision's manifest (public, immutable-cached endpoint), so the
// Inspector always matches what the instance actually runs — not the library's latest.
export const LibraryComponentProperties = ({
  componentMeta,
  darkMode,
  layoutPropertyChanged,
  component,
  paramUpdated,
  dataQueries,
  currentState,
  eventsChanged,
  apps,
  allComponents,
  pages,
}: LibraryComponentPropertiesProps) => {
  const { libraryId, correlationId, componentName } = getLibraryComponentIdentity(component);

  // F5: same resolution as the runner — the library-level pin only, no per-instance
  // fallback — so the Inspector always describes the revision that's actually rendering.
  const effectiveRevision: string | undefined = useEffectiveLibraryRevision(correlationId);

  const manifest = useLibraryManifest(libraryId, effectiveRevision);

  const componentManifest = componentName ? manifest?.components?.[componentName] : undefined;
  const props = componentManifest?.props ?? [];
  const visibleProps = filterVisibleProps(props);
  const events = componentManifest?.events ?? [];

  const eventMetaDefinition = useMemo(() => buildEventMetaDefinition(componentMeta, events), [componentMeta, events]);

  // Static widget-config properties (e.g. visibility) — never come from the manifest, so
  // they must be rendered on top of it here, not folded into visibleProps.
  const staticProps = additionalActionProps(componentMeta);

  const items: { id?: string; title: string; isOpen: boolean; children: React.ReactNode }[] = [];

  // Identity — read-only context (picker UX arrives with F5's revision picker).
  items.push({
    title: 'Component',
    isOpen: true,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
        {[
          ['Component', componentManifest?.displayName ?? componentName],
          ['Revision', formatRevisionLabel(effectiveRevision)],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-placeholder)' }}>{label}</span>
            <span style={{ color: 'var(--text-default)', fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
    ),
  });

  groupPropsBySection(visibleProps).forEach(({ title, props: sectionProps }) => {
    items.push({
      title,
      isOpen: true,
      children: (
        <>
          {sectionProps.map((prop) =>
            renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              prop.name,
              'properties',
              currentState,
              allComponents,
              darkMode,
              '',
              undefined,
              null,
              fieldMeta(prop) as any // renderElement (untyped JS) infers customMeta as `null` from its default param
            )
          )}
        </>
      ),
    });
  });

  if (events.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.events', 'Events')}`,
      isOpen: true,
      children: (
        <EventManagerComponent
          sourceId={component?.id}
          eventSourceType="component"
          eventMetaDefinition={eventMetaDefinition}
          currentState={currentState}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
          pages={pages}
        />
      ),
    });
  }

  if (staticProps.length > 0) {
    items.push({
      id: ADDITIONAL_ACTIONS_ACCORDION_ID,
      title: `${i18next.t('widget.common.additionalActions', 'Additional Actions')}`,
      isOpen: true,
      children: (
        <>
          {staticProps.map((property) =>
            renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              property,
              'properties',
              currentState,
              allComponents,
              darkMode,
              (componentMeta.properties as Record<string, { placeholder?: string }>)?.[property]?.placeholder
            )
          )}
        </>
      ),
    });
  }

  items.push({
    title: `${i18next.t('widget.common.devices', 'Devices')}`,
    isOpen: true,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnDesktop',
          'others',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnMobile',
          'others',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  return <AccordionComponent items={items} />;
};

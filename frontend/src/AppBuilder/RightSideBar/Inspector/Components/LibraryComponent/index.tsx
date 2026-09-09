import React, { useEffect, useMemo, useState } from 'react';

import Accordion from '@/_ui/Accordion';
import { EventManager } from '@/AppBuilder/RightSideBar/Inspector/EventManager';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { useEffectiveLibraryRevision, libraryFileUrl } from '@/AppBuilder/Widgets/libraryComponentRevision';
import { useCustomComponentPreviewStore } from '@/_stores/customComponentPreviewStore';
import { buildEventMetaDefinition, fieldMeta, filterVisibleProps, formatRevisionLabel, getComponentIdentity } from './utils';

import type { LibraryComponentPropertiesProps } from './types';
import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';

const AccordionComponent = Accordion as React.ComponentType<any>;
const EventManagerComponent = EventManager as React.ComponentType<any>;

// F4b: manifest-driven Inspector panel for the LibraryComponent widget (LLD §5.6,
// ModuleViewerInspector pattern). Identity (libraryId/componentName/revisionId) lives
// ONLY in definition.properties — never rendered as editable fields. Props and events
// come from the PINNED revision's manifest (public, immutable-cached endpoint), so the
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
  const { libraryId, correlationId, componentName, revisionId } = getComponentIdentity(component);

  // F5: same resolution as the runner (dev preview > app pin > instance property),
  // so the Inspector always describes the revision that's actually rendering.
  const effectiveRevision: string | undefined = useEffectiveLibraryRevision(correlationId, revisionId);

  const [manifest, setManifest] = useState<LibraryManifest | null>(null);

  // Live-reload: a dev-preview push bumps this nonce
  const devNonce = useCustomComponentPreviewStore((state: any) =>
    effectiveRevision?.startsWith?.('dev:') ? state.devBundleUpdatedAt?.[libraryId ?? ''] : undefined
  );

  useEffect(() => {
    if (!libraryId || !effectiveRevision) return;
    // Published revisions: immutable-cached. Dev slots: no-store — always fresh.
    fetch(libraryFileUrl(libraryId, effectiveRevision, 'manifest.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then(setManifest)
      .catch(() => setManifest(null));
  }, [libraryId, effectiveRevision, devNonce]);

  const componentManifest = componentName ? manifest?.components?.[componentName] : undefined;
  const props = componentManifest?.props ?? [];
  const visibleProps = filterVisibleProps(props);
  const events = componentManifest?.events ?? [];

  const eventMetaDefinition = useMemo(() => buildEventMetaDefinition(componentMeta, events), [componentMeta, events]);

  const items: { title: string; isOpen: boolean; children: React.ReactNode }[] = [];

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

  if (visibleProps.length > 0) {
    items.push({
      title: 'Properties',
      isOpen: true,
      children: (
        <>
          {visibleProps.map((prop) =>
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
  }

  if (events.length > 0) {
    items.push({
      title: 'Events',
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

  items.push({
    title: 'Layout',
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

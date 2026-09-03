import React, { useEffect, useMemo, useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '@/AppBuilder/RightSideBar/Inspector/EventManager';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { useEffectiveLibraryRevision, libraryFileUrl } from '@/AppBuilder/Widgets/libraryComponentRevision';
import { useCustomComponentPreviewStore } from '@/_stores/customComponentPreviewStore';

// F4b: manifest-driven Inspector for LibraryComponent (LLD §5.6, ModuleViewerInspector
// pattern). Identity (libraryId/componentName/revisionId) lives ONLY in
// definition.properties — never rendered as editable fields. Props and events come
// from the PINNED revision's manifest (public, immutable-cached endpoint), so the
// Inspector always matches what the instance actually runs — not the library's latest.

// manifest prop.type → inspector field type (Code.jsx consumes customMeta wholesale).
// NEVER set customMeta.defaultValue here: Code.jsx getInitialValue() returns it BEFORE
// reading the stored definition.value, so edited values would display as the default
// again on every Inspector mount (found 2026-08-06). Drop-time stamping already writes
// manifest defaults into definition.properties — that's the correct default channel.
const fieldMeta = (prop) => {
  const displayName = prop.label ?? prop.name; // label lands with C2; name until then
  switch (prop.type) {
    case 'boolean':
      return { displayName, name: prop.name, type: 'toggle' };
    case 'enumeration':
      return {
        displayName,
        name: prop.name,
        type: 'select',
        options: (prop.enumValues ?? []).map((v) => ({ name: v, value: v })),
      };
    default: // string | number | object | array → CodeHinter
      return { displayName, name: prop.name, type: 'code' };
  }
};

export const LibraryComponent = ({
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
}) => {
  const definitionProps = component.component?.definition?.properties ?? {};
  const libraryId = definitionProps.libraryId?.value;
  const correlationId = definitionProps.correlationId?.value;
  const componentName = definitionProps.componentName?.value;
  const revisionId = definitionProps.revisionId?.value;

  // F5: same resolution as the runner (dev preview > app pin > instance property),
  // so the Inspector always describes the revision that's actually rendering.
  const effectiveRevision = useEffectiveLibraryRevision(correlationId, revisionId);

  const [manifest, setManifest] = useState(null);

  // Live-reload: a dev-preview push bumps this nonce
  const devNonce = useCustomComponentPreviewStore((state) =>
    effectiveRevision?.startsWith?.('dev:') ? state.devBundleUpdatedAt?.[libraryId] : undefined
  );

  useEffect(() => {
    if (!libraryId || !effectiveRevision) return;
    // Published revisions: immutable-cached. Dev slots: no-store — always fresh.
    fetch(libraryFileUrl(libraryId, effectiveRevision, 'manifest.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then(setManifest)
      .catch(() => setManifest(null));
  }, [libraryId, effectiveRevision, devNonce]);

  const componentManifest = manifest?.components?.[componentName];
  const props = componentManifest?.props ?? [];
  const events = componentManifest?.events ?? [];

  // EventManager's whole pipeline keys off eventMetaDefinition.events — synthesizing
  // it from the manifest reuses creation/storage/execution untouched (fireEvent(name)
  // from the shell bridge matches eventId = event.name).
  const eventMetaDefinition = useMemo(
    () => ({
      ...componentMeta,
      events: Object.fromEntries(events.map((e) => [e.name, { displayName: e.name }])),
    }),
    [componentMeta, events]
  );

  const items = [];

  // Identity — read-only context (picker UX arrives with F5's revision picker).
  items.push({
    title: 'Component',
    isOpen: true,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
        {[
          ['Component', componentManifest?.displayName ?? componentName],
          ['Revision', effectiveRevision?.startsWith?.('dev:') ? 'Dev preview' : effectiveRevision],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-placeholder)' }}>{label}</span>
            <span style={{ color: 'var(--text-default)', fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
    ),
  });

  if (props.length > 0) {
    items.push({
      title: 'Properties',
      isOpen: true,
      children: (
        <>
          {props.map((prop) =>
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
              fieldMeta(prop)
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
        <EventManager
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

  return <Accordion items={items} />;
};

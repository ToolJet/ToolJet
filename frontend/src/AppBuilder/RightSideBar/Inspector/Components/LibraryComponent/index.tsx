import React, { useMemo } from 'react';
import i18next from 'i18next';

import Accordion from '@/_ui/Accordion';
import { EventManager } from '@/AppBuilder/RightSideBar/Inspector/EventManager';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '@/AppBuilder/RightSideBar/Inspector/inspectorConstants';
import { getLibraryComponentIdentity } from '@/AppBuilder/Widgets/libraryComponentRevision';
import { useEffectiveLibraryRevision } from '@/AppBuilder/Widgets/hooks/useEffectiveLibraryRevision';
import { useLibraryManifest } from '@/AppBuilder/Widgets/hooks/useLibraryManifest';
import useStore from '@/AppBuilder/_stores/store';
import { usePackManifest } from '@/_stores/builtinPacksStore';
import type { ManifestComponent } from '@/AppBuilder/types/libraryComponent.types';
import {
  DISABLED_STATE_META,
  additionalActionProps,
  buildEventMetaDefinition,
  editorHint,
  fieldMeta,
  filterVisibleProps,
  formatRevisionLabel,
  groupPropsBySection,
  groupStylesBySection,
  hostStyleKeys,
  isFieldVisible,
  styleFieldMeta,
  validationFields,
  withManifestDefaults,
  withValidationMeta,
} from './utils';

import { HintedField } from './HintedField';
import type { LibraryComponentPropertiesProps, LibraryComponentStylesProps } from './types';

const AccordionComponent = Accordion as React.ComponentType<any>;
const EventManagerComponent = EventManager as React.ComponentType<any>;

// Read at render time from the live store, like native conditionallyRender (Utils.js resolveLiveValue), so a
// visibleWhen key bound to another component's value resolves too.
const resolveLive = (value: unknown): unknown =>
  (useStore.getState() as { getResolvedValue: (v: unknown) => unknown }).getResolvedValue(value);

// Manifest-driven Properties tab for a component built with the custom-component SDK (LibraryComponent, PackComponent;
// LLD §5.6, ModuleViewerInspector pattern). Which component the instance draws lives ONLY in definition.properties —
// never rendered as editable fields. `identityRows` is read-only context shown first (a library's revision).
const ManifestPropertiesPanel = ({
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
  componentManifest,
  identityRows = [],
}: LibraryComponentPropertiesProps & { componentManifest?: ManifestComponent; identityRows?: [string, string?][] }) => {
  const props = componentManifest?.props ?? [];
  const shownComponent = withManifestDefaults(component, 'properties', props);
  // visibleWhen is checked against shownComponent so a driver the instance never stored counts as its default.
  const visibleProps = filterVisibleProps(props).filter((prop) =>
    isFieldVisible(prop, shownComponent, 'properties', resolveLive)
  );
  const events = componentManifest?.events ?? [];

  const eventMetaDefinition = useMemo(() => buildEventMetaDefinition(componentMeta, events), [componentMeta, events]);

  // Static widget-config properties (e.g. visibility) — never come from the manifest, so
  // they must be rendered on top of it here, not folded into visibleProps.
  const staticProps = additionalActionProps(componentMeta, componentManifest?.controlState === true);
  const hostProperties = (componentMeta.properties ?? {}) as Record<string, { placeholder?: string }>;

  const validation = validationFields(componentManifest?.validation);
  const validationMeta = withValidationMeta(componentMeta, validation);

  const items: { id?: string; title: string; isOpen: boolean; children: React.ReactNode }[] = [];

  // Identity — read-only context (picker UX arrives with F5's revision picker).
  if (identityRows.length > 0)
    items.push({
      title: 'Component',
      isOpen: true,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
          {identityRows.map(([label, value]) => (
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
          {sectionProps.map((prop) => {
            const hint = editorHint(prop);
            if (hint) {
              return (
                <HintedField
                  key={prop.name}
                  hint={hint}
                  prop={prop}
                  component={shownComponent}
                  componentMeta={componentMeta}
                  paramUpdated={paramUpdated}
                  dataQueries={dataQueries}
                  currentState={currentState}
                  allComponents={allComponents}
                  darkMode={darkMode}
                />
              );
            }
            return (
              <React.Fragment key={prop.name}>
                {renderElement(
                  shownComponent,
                  componentMeta,
                  paramUpdated,
                  dataQueries,
                  prop.name,
                  'properties',
                  currentState,
                  allComponents,
                  darkMode,
                  prop.placeholder ?? '',
                  undefined,
                  null,
                  fieldMeta(prop) as any // renderElement (untyped JS) infers customMeta as `null` from its default param
                )}
              </React.Fragment>
            );
          })}
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

  // Native TextInput's validation fields, stored in definition.validation like every native input's.
  if (validation.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.validation', 'Validation')}`,
      isOpen: true,
      children: (
        <>
          {validation.map(({ name, meta }) => (
            <React.Fragment key={name}>
              {renderElement(
                component,
                validationMeta,
                paramUpdated,
                dataQueries,
                name,
                'validation',
                currentState,
                allComponents,
                darkMode,
                meta.placeholder
              )}
            </React.Fragment>
          ))}
        </>
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
          {staticProps.map((property) => (
            <React.Fragment key={property}>
              {renderElement(
                component,
                componentMeta,
                paramUpdated,
                dataQueries,
                property,
                'properties',
                currentState,
                allComponents,
                darkMode,
                hostProperties[property]?.placeholder,
                undefined,
                null,
                // disabledState for a controlState component whose host config does not declare it
                (hostProperties[property] ? null : DISABLED_STATE_META) as any
              )}
            </React.Fragment>
          ))}
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

// F4b: a custom-component library's instance. Props and events come from the PINNED revision's manifest (public,
// immutable-cached endpoint), so the Inspector always matches what the instance actually runs — not the latest.
export const LibraryComponentProperties = (props: LibraryComponentPropertiesProps) => {
  const { libraryId, correlationId, componentName } = getLibraryComponentIdentity(props.component);
  // F5: same resolution as the runner — the library-level pin only, no per-instance
  // fallback — so the Inspector always describes the revision that's actually rendering.
  const effectiveRevision: string | undefined = useEffectiveLibraryRevision(correlationId);
  const manifest = useLibraryManifest(libraryId, effectiveRevision);
  const componentManifest = componentName ? manifest?.components?.[componentName] : undefined;
  return (
    <ManifestPropertiesPanel
      {...props}
      componentManifest={componentManifest}
      identityRows={[
        ['Component', componentManifest?.displayName ?? componentName],
        ['Revision', formatRevisionLabel(effectiveRevision)],
      ]}
    />
  );
};

// A pack component, like a native widget: the build the release ships, with nothing to pick.
export const PackComponentProperties = (props: LibraryComponentPropertiesProps) => {
  const { pack, componentName } = packIdentity(props.component);
  const manifest = usePackManifest(pack);
  return (
    <ManifestPropertiesPanel
      {...props}
      componentManifest={componentName ? manifest?.components?.[componentName] : undefined}
    />
  );
};

const packIdentity = (component: LibraryComponentPropertiesProps['component']) => {
  const properties = (component as any)?.component?.definition?.properties ?? {};
  return { pack: properties.pack?.value as string | undefined, componentName: properties.componentName?.value as string | undefined };
};

// Styles tab: the manifest's ToolJet.useStyleX fields grouped by their `section`, then the host
// widget's own styles (box shadow). Values land in definition.styles and reach the bundle as styles only.
const ManifestStylesPanel = ({
  componentMeta,
  component,
  paramUpdated,
  dataQueries,
  currentState,
  allComponents,
  darkMode,
  componentManifest,
}: LibraryComponentStylesProps & { componentManifest?: ManifestComponent }) => {
  const manifestStyles = componentManifest?.styles ?? [];
  const shownComponent = withManifestDefaults(component, 'styles', manifestStyles);
  const styles = filterVisibleProps(manifestStyles).filter((style) =>
    isFieldVisible(style, shownComponent, 'styles', resolveLive)
  );

  const items: { title: string; isOpen: boolean; children: React.ReactNode }[] = groupStylesBySection(styles).map(
    ({ title, props: sectionStyles }) => ({
      title,
      isOpen: true,
      children: (
        <>
          {sectionStyles.map((style) => (
            <React.Fragment key={style.name}>
              {renderElement(
                shownComponent,
                componentMeta,
                paramUpdated,
                dataQueries,
                style.name,
                'styles',
                currentState,
                allComponents,
                darkMode,
                style.placeholder ?? '',
                undefined,
                null,
                styleFieldMeta(style) as any // see the same cast in LibraryComponentProperties
              )}
            </React.Fragment>
          ))}
        </>
      ),
    })
  );

  items.push({
    title: 'Container',
    isOpen: true,
    children: (
      <>
        {hostStyleKeys(componentMeta).map((key) => (
          <React.Fragment key={key}>
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              key,
              'styles',
              currentState,
              allComponents
            )}
          </React.Fragment>
        ))}
      </>
    ),
  });

  return <AccordionComponent items={items} />;
};

export const LibraryComponentStyles = (props: LibraryComponentStylesProps) => {
  const { libraryId, correlationId, componentName } = getLibraryComponentIdentity(props.component);
  const effectiveRevision: string | undefined = useEffectiveLibraryRevision(correlationId);
  const manifest = useLibraryManifest(libraryId, effectiveRevision);
  return (
    <ManifestStylesPanel
      {...props}
      componentManifest={componentName ? manifest?.components?.[componentName] : undefined}
    />
  );
};

export const PackComponentStyles = (props: LibraryComponentStylesProps) => {
  const { pack, componentName } = packIdentity(props.component);
  const manifest = usePackManifest(pack);
  return (
    <ManifestStylesPanel
      {...props}
      componentManifest={componentName ? manifest?.components?.[componentName] : undefined}
    />
  );
};

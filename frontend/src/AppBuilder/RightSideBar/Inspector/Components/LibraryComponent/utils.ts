import type { ComponentIdentity, FieldMeta, InspectorComponent } from './types';
import type { ManifestEvent, ManifestProp } from '@/AppBuilder/types/libraryComponent.types';

export const getComponentIdentity = (component: InspectorComponent): ComponentIdentity => {
  const definitionProps = component.component?.definition?.properties ?? {};

  return {
    libraryId: definitionProps.libraryId?.value,
    correlationId: definitionProps.correlationId?.value,
    componentName: definitionProps.componentName?.value,
    revisionId: definitionProps.revisionId?.value,
  };
};

export const filterVisibleProps = (props: ManifestProp[]): ManifestProp[] =>
  props.filter((prop) => prop.inspector !== 'hidden');

export const formatRevisionLabel = (revision: string | undefined): string | undefined =>
  revision?.startsWith?.('dev:') ? 'Dev preview' : revision;

// manifest prop.type → inspector field type (Code.jsx consumes customMeta wholesale).
// NEVER set customMeta.defaultValue here: Code.jsx getInitialValue() returns it BEFORE
// reading the stored definition.value, so edited values would display as the default
// again on every Inspector mount (found 2026-08-06). Drop-time stamping already writes
// manifest defaults into definition.properties — that's the correct default channel.
export const fieldMeta = (prop: ManifestProp): FieldMeta => {
  const displayName = prop.label ?? prop.name; // label lands with C2; name until then

  switch (prop.type) {
    case 'boolean': {
      const inputType = prop.inspector ?? 'toggle';

      return { displayName, name: prop.name, type: inputType, ...(inputType === 'checkbox' && { checkboxLabel: '' }) };
    }
    case 'enumeration': {
      const inputType = prop.inspector ?? 'select';
      const optionLabelKeyName = inputType === 'switch' ? 'displayName' : 'name';

      return {
        displayName,
        name: prop.name,
        type: inputType,
        options: (prop.enumValues ?? []).map((v) => ({ [optionLabelKeyName]: prop.enumLabels?.[v] ?? v, value: v })),
      };
    }
    default: // string | number | object | array → CodeHinter
      return { displayName, name: prop.name, type: prop.inspector ?? 'code' };
  }
};

// EventManager's whole pipeline keys off eventMetaDefinition.events — synthesizing
// it from the manifest reuses creation/storage/execution untouched (fireEvent(name)
// from the shell bridge matches eventId = event.name).
export const buildEventMetaDefinition = (
  componentMeta: Record<string, unknown>,
  events: ManifestEvent[]
): Record<string, unknown> => ({
  ...componentMeta,
  events: Object.fromEntries(events.map((e) => [e.name, { displayName: e.name }])),
});

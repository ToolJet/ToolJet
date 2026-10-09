import type { FieldMeta } from './types';
import type { ManifestEvent, ManifestProp } from '@/AppBuilder/types/libraryComponent.types';

const DEFAULT_PROPS_SECTION = 'Properties';

export const filterVisibleProps = (props: ManifestProp[]): ManifestProp[] =>
  props.filter((prop) => prop.inspector !== 'hidden');

// Groups manifest props into accordion sections by their author-declared `section`,
// defaulting ungrouped props to "Properties" (today's single-section behavior). Section
// order follows first appearance in the manifest, so authors control ordering by prop order.
export interface PropSection {
  title: string;
  props: ManifestProp[];
}

export const groupPropsBySection = (props: ManifestProp[]): PropSection[] => {
  const order: string[] = [];
  const groups: Record<string, ManifestProp[]> = {};

  for (const prop of props) {
    const title = prop.section ?? DEFAULT_PROPS_SECTION;
    if (!groups[title]) {
      groups[title] = [];
      order.push(title);
    }
    groups[title].push(prop);
  }

  return order.map((title) => ({ title, props: groups[title] }));
};

export const formatRevisionLabel = (revision: string | undefined): string | undefined =>
  revision?.startsWith?.('dev:') ? 'Dev preview' : revision;

// Static widget-config properties (e.g. visibility) — same section every other widget's
// DefaultComponent.jsx panel groups into "Additional Actions". Kept separate from the
// manifest-driven Properties list so dynamic CCL props never crowd these out.
export const additionalActionProps = (componentMeta: { properties?: Record<string, { section?: string }> }): string[] =>
  Object.entries(componentMeta.properties ?? {})
    .filter(([, prop]) => prop.section === 'additionalActions')
    .map(([key]) => key);

// Schema types validate() actually understands — anything else gets no validation
// rather than a broken one.
const VALIDATABLE_TYPES = new Set(['string', 'number', 'object', 'array']);

// PreviewBox renders this as code text, so object/array must be stringified.
const validationDefaultValue = (prop: ManifestProp): unknown => {
  if (prop.default === undefined) return undefined;
  return prop.type === 'object' || prop.type === 'array' ? JSON.stringify(prop.default) : prop.default;
};

// manifest prop.type → inspector field type (Code.jsx consumes customMeta wholesale).
// NEVER set customMeta.defaultValue here: Code.jsx getInitialValue() returns it BEFORE
// reading the stored definition.value, so edited values would display as the default
// again on every Inspector mount (found 2026-08-06). Drop-time stamping already writes
// manifest defaults into definition.properties — that's the correct default channel.
export const fieldMeta = (prop: ManifestProp): FieldMeta => {
  const displayName = prop.label ?? prop.name; // label lands with C2; name until then
  const defaultValue = validationDefaultValue(prop);

  switch (prop.type) {
    case 'boolean': {
      const inputType = prop.inspector ?? 'toggle';

      return {
        displayName,
        name: prop.name,
        type: inputType,
        validation: { schema: { type: 'boolean' }, ...(defaultValue !== undefined && { defaultValue }) },
        ...(inputType === 'checkbox' && { checkboxLabel: '' }),
      };
    }
    case 'enumeration': {
      const inputType = prop.inspector ?? 'select';
      const optionLabelKeyName = inputType === 'switch' ? 'displayName' : 'name';

      return {
        displayName,
        name: prop.name,
        type: inputType,
        // the selected option's value is always a string
        validation: { schema: { type: 'string' }, ...(defaultValue !== undefined && { defaultValue }) },
        options: (prop.enumValues ?? []).map((v) => ({ [optionLabelKeyName]: prop.enumLabels?.[v] ?? v, value: v })),
      };
    }
    default: {
      // string | number | object | array → CodeHinter
      const meta: FieldMeta = { displayName, name: prop.name, type: prop.inspector ?? 'code' };
      if (VALIDATABLE_TYPES.has(prop.type)) {
        meta.validation = { schema: { type: prop.type }, ...(defaultValue !== undefined && { defaultValue }) };
      }
      return meta;
    }
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

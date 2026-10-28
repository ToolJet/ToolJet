import type { FieldMeta, InspectorComponent, LibraryEditorHint } from './types';
import type {
  ManifestComponent,
  ManifestEvent,
  ManifestProp,
  ManifestValidationKind,
} from '@/AppBuilder/types/libraryComponent.types';
import { manifestDefaultToDefinitionValue } from '@/AppBuilder/Widgets/libraryComponentDefaults';
import { textinputConfig } from '@tooljet/widget-definitions';

const DEFAULT_PROPS_SECTION = 'Properties';
const DEFAULT_STYLES_SECTION = 'Styles';

export const filterVisibleProps = (props: ManifestProp[]): ManifestProp[] =>
  props.filter((prop) => prop.inspector !== 'hidden');

// Groups manifest props into accordion sections by their author-declared `section`,
// defaulting ungrouped props to "Properties" (today's single-section behavior). Section
// order follows first appearance in the manifest, so authors control ordering by prop order.
export interface PropSection {
  title: string;
  props: ManifestProp[];
}

export const groupPropsBySection = (props: ManifestProp[], defaultSection = DEFAULT_PROPS_SECTION): PropSection[] => {
  const order: string[] = [];
  const groups: Record<string, ManifestProp[]> = {};

  for (const prop of props) {
    const title = prop.section ?? defaultSection;
    if (!groups[title]) {
      groups[title] = [];
      order.push(title);
    }
    groups[title].push(prop);
  }

  return order.map((title) => ({ title, props: groups[title] }));
};

export const formatRevisionLabel = (revision: string | undefined): string | undefined => {
  if (revision?.startsWith?.('dev:')) return 'Dev preview';
  return revision;
};

// Static widget-config properties (e.g. visibility) — same section every other widget's
// DefaultComponent.jsx panel groups into "Additional Actions". Kept separate from the
// manifest-driven Properties list so dynamic CCL props never crowd these out.
// disabledState is offered only to a component whose manifest declares controlState: anything else never reads
// it, so the toggle would do nothing. It is listed even when the host config lacks it (the panel then renders
// it from DISABLED_STATE_META, appended last).
export const additionalActionProps = (
  componentMeta: { properties?: Record<string, { section?: string }> },
  controlState = false
): string[] => {
  const keys = Object.entries(componentMeta.properties ?? {})
    .filter(([key, prop]) => prop.section === 'additionalActions' && (controlState || key !== 'disabledState'))
    .map(([key]) => key);
  return controlState && !keys.includes('disabledState') ? [...keys, 'disabledState'] : keys;
};

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
const baseFieldMeta = (prop: ManifestProp): FieldMeta => {
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
      const meta: FieldMeta = { displayName, name: prop.name, type: inspectorFieldType(prop) };
      if (VALIDATABLE_TYPES.has(prop.type)) {
        meta.validation = { schema: { type: prop.type }, ...(defaultValue !== undefined && { defaultValue }) };
      }
      // ToolJet's icon field picks Tabler icons; its show/hide toggle writes an iconVisibility style that a library
      // component never reads, so it is hidden.
      if (meta.type === 'icon') meta.visibility = false;
      return meta;
    }
  }
};

// Inspector hints drawn by the panel's own editors (HintedField): their field meta is the code field, which is what
// the editor's fx mode shows. An unmapped type would crash DynamicFxTypeRenderer.
const EDITOR_HINTS: Record<LibraryEditorHint, string[]> = {
  columns: ['array'],
  options: ['array'],
  icon: ['string'],
};

// The native field types each value type can be drawn with. Any other hint (a typo, a hint for another type) gets
// the code field: DynamicFxTypeRenderer has no element for an unknown type and the field would not render.
const NATIVE_FIELD_TYPES: Record<string, string[]> = {
  string: ['code', 'color', 'boxShadow', 'icon'],
  number: ['code', 'number', 'numberInput', 'slider'],
};

const inspectorFieldType = (prop: ManifestProp): string => {
  const { inspector } = prop;
  if (!inspector || editorHint(prop) || !NATIVE_FIELD_TYPES[prop.type]?.includes(inspector)) return 'code';
  return inspector === 'color' ? 'colorSwatches' : inspector;
};

/** The editor a prop's `inspector` hint asks for, when its type is one that editor writes; else none. An icon prop
 *  gets the panel's lucide picker only when the component draws lucide (iconSet); else ToolJet's Tabler icon field. */
export const editorHint = (prop: ManifestProp): LibraryEditorHint | undefined => {
  const hint = prop.inspector as LibraryEditorHint | undefined;
  if (hint === 'icon' && prop.iconSet !== 'lucide') return undefined;
  return hint && EDITOR_HINTS[hint]?.includes(prop.type) ? hint : undefined;
};

// Spells out declared limits for field types that do not draw them (only the slider reads min/max).
const limitsNote = (min: number | undefined, max: number | undefined): string | undefined => {
  if (min !== undefined && max !== undefined) return `Between ${min} and ${max}.`;
  if (min !== undefined) return `At least ${min}.`;
  if (max !== undefined) return `At most ${max}.`;
  return undefined;
};

// The field meta for one manifest prop: the type mapping above plus the v2 presentation fields. description
// becomes the label tooltip (meta.tip, native's helper channel), min/max go on the meta for the slider and
// into the tooltip for every other field, placeholder rides along for the field's empty state.
export const fieldMeta = (prop: ManifestProp): FieldMeta => {
  const meta = baseFieldMeta(prop);
  const tip = [prop.description, limitsNote(prop.min, prop.max)].filter(Boolean).join(' ');
  return {
    ...meta,
    ...(tip && { tip }),
    ...(prop.placeholder !== undefined && { placeholder: prop.placeholder }),
    ...(prop.min !== undefined && { min: prop.min }),
    ...(prop.max !== undefined && { max: prop.max }),
  };
};

// visibleWhen mirrors native conditionallyRender (Utils.js renderElement), which only runs for an allow-list of
// native component types, so the library inspector applies it itself: the field shows only while the
// instance's resolved value of `key` equals `value` (or is one of `value` when it is an array). `key` is looked
// up in the same definition section first, then in properties, like native's parentObjectKey fallback.
// `resolve` is the store's getResolvedValue, injected so this stays a pure function.
export const isFieldVisible = (
  prop: ManifestProp,
  component: InspectorComponent,
  paramType: 'properties' | 'styles',
  resolve: (value: unknown) => unknown
): boolean => {
  if (!prop.visibleWhen) return true;
  const { key, value } = prop.visibleWhen;
  const definition = component?.component?.definition;
  const stored = definition?.[paramType]?.[key] ?? definition?.properties?.[key];
  const resolved = resolve(stored?.value);
  return Array.isArray(value) ? value.includes(resolved) : resolved === value;
};

// Native TextInput's validation field meta, reused so the library section matches it key for key and the
// values land in definition.validation exactly where native inputs keep them.
const TEXT_VALIDATION_META = textinputConfig.validation as unknown as Record<string, FieldMeta>;
const VALIDATION_KEYS: Record<ManifestValidationKind, string[]> = {
  text: ['mandatory', 'regex', 'minLength', 'maxLength', 'customRule'],
  // A regex or length limit means nothing for a selected option or a date.
  choice: ['mandatory', 'customRule'],
  date: ['mandatory', 'customRule'],
};

// The Validation section's fields for a component that declares `validation`: [] when it declares none.
// Unknown kinds get no section rather than a guess.
export const validationFields = (kind: ManifestComponent['validation']): { name: string; meta: FieldMeta }[] =>
  (kind ? (VALIDATION_KEYS[kind] ?? []) : []).map((name) => ({ name, meta: { ...TEXT_VALIDATION_META[name], name } }));

// renderElement reads componentMeta[paramType][param] before customMeta, so the validation section needs a
// componentMeta that carries the validation meta (the host widget config declares none of its own).
export const withValidationMeta = (
  componentMeta: Record<string, unknown>,
  fields: { name: string; meta: FieldMeta }[]
): Record<string, unknown> => ({
  ...componentMeta,
  validation: Object.fromEntries(fields.map(({ name, meta }) => [name, meta])),
});

// The host's standard disabled toggle, as native inputs declare it. Used when the host widget config does not
// declare disabledState itself, so a controlState component always gets the field.
export const DISABLED_STATE_META: FieldMeta = textinputConfig.properties.disabledState as unknown as FieldMeta;

export const groupStylesBySection = (styles: ManifestProp[]): PropSection[] =>
  groupPropsBySection(styles, DEFAULT_STYLES_SECTION);

// Same mapping as props, except a color style gets the theme-aware swatch picker native widgets use.
export const styleFieldMeta = (style: ManifestProp): FieldMeta => {
  const meta = fieldMeta(style);
  return meta.type === 'color' ? { ...meta, type: 'colorSwatches' } : meta;
};

// Static widget-config styles (e.g. boxShadow) — rendered after the manifest's own styles.
export const hostStyleKeys = (componentMeta: { styles?: Record<string, unknown> }): string[] =>
  Object.keys(componentMeta.styles ?? {});

// EventManager's whole pipeline keys off eventMetaDefinition.events — synthesizing
// it from the manifest reuses creation/storage/execution untouched (fireEvent(name)
// from the shell bridge matches eventId = event.name).
export const buildEventMetaDefinition = (
  componentMeta: Record<string, unknown>,
  events: ManifestEvent[]
): Record<string, unknown> => ({
  ...componentMeta,
  events: Object.fromEntries(events.map((e) => [e.name, { displayName: eventDisplayName(e) }])),
});

// The manifest's own display name, else the handler name in native wording: onClick -> "On click".
export const eventDisplayName = (event: ManifestEvent): string => {
  if (event.displayName) return event.displayName;
  const words = event.name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// An instance stores values only for the props/styles its revision had when it was dropped (or that were
// edited since), so a newer revision's additions have no stored value: the field would show empty (and
// fail validation) while the bundle renders its initialValue. Show those as their manifest default; the
// first edit saves them. Display only: returns the same object when nothing is missing.
export const withManifestDefaults = <C extends InspectorComponent>(
  component: C,
  paramType: 'properties' | 'styles',
  fields: ManifestProp[]
): C => {
  const definition = component?.component?.definition;
  const stored = definition?.[paramType] ?? {};
  const missing = fields.filter((field) => !(field.name in stored));
  if (missing.length === 0) return component;

  const filled = Object.fromEntries(
    missing.map((field) => [field.name, { value: manifestDefaultToDefinitionValue(field) }])
  );
  return {
    ...component,
    component: { ...component.component, definition: { ...definition, [paramType]: { ...stored, ...filled } } },
  };
};

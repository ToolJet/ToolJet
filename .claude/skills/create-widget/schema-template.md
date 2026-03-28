# Widget Schema Template

The generation agent uses this template to produce both schema files.
Replace all {PLACEHOLDER} values using the Phase 2 approved summary.

## JS Template

```js
export const {camelCaseName}Config = {
  name: '{PascalCaseName}',
  displayName: '{Display Name}',
  description: '{description}',
  component: '{PascalCaseName}',
  defaultSize: {
    width: {width},   // grid cells
    height: {height}, // px (each grid cell = 10px height)
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile:  { type: 'toggle', displayName: 'Show on mobile' },
  },
  // ONLY include validation block if the PRD has a Validation section:
  // validation: { ... },
  properties: {
    // Place accordian-grouped fields first, then additionalActions last
    // Standard additionalActions — ALWAYS include all 4:
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: '' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    // eventHandle: { displayName: 'On Event Name' },
  },
  styles: {
    // All color fields MUST use colorSwatches type + var(--cc-*) tokens
    // See docs/widget-schema-field-types.md for all field type patterns
  },
  exposedVariables: {
    isVisible: true,
    isDisabled: false,
    isLoading: false,
    // add extra exposed vars from PRD here
  },
  actions: [
    // Standard 3 CSAs — always include:
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    // add extra CSAs from PRD here
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile:  { value: '{{false}}' },
    },
    properties: {
      // EVERY key in properties MUST have a matching entry here
      // Boolean values:    '{{true}}' or '{{false}}'  (always in double curly braces)
      // String values:     'plain string'              (no curly braces)
      // numberInput values: '6'                        (string of number, no curly braces)
      // Color values:      'var(--cc-primary-brand)'   (plain string, no curly braces)
      loadingState:   { value: '{{false}}' },
      visibility:     { value: '{{true}}' },
      disabledState:  { value: '{{false}}' },
      tooltip:        { value: '' },
    },
    events: [],
    styles: {
      // EVERY key in styles MUST have a matching entry here
      // Special: if icon field exists in styles, ALWAYS add:
      // iconVisibility: { value: false }
    },
    // ONLY include if validation section exists:
    // validation: { ... },
  },
};
```

## Self-Consistency Checklist

Before writing files, verify ALL of these:

1. Every `properties` key has a matching entry in `definition.properties`
2. Every `styles` key has a matching entry in `definition.styles`
3. Every `validation` key has a matching entry in `definition.validation`
4. Every `conditionallyRender.key` references a real key in the correct section
5. Validation fields conditioned on a properties key use `parentObjectKey: 'properties'`
6. All boolean values in definition are wrapped in `{{}}` — e.g. `'{{true}}'`
7. All colors use `var(--cc-*)` tokens (never raw hex except pure white `#FFFFFF`)
8. If `icon` field exists in styles, `definition.styles` has `iconVisibility: { value: false }`
9. `validation` block is present in both schema AND definition only if PRD has validation section
10. Both files (frontend + server) are byte-identical after writing
10b. For any field where FX should be pre-disabled by default, verify `fxActive: false` is explicitly set in the `definition.*` object for that field.

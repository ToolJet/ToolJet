# Widget Schema Field Types Reference

> Source of truth: `FxParamTypeMapping` in `frontend/src/AppBuilder/CodeEditor/utils.js`
> Renderer: `DynamicFxTypeRenderer.jsx` → dispatches to `CodeBuilder/Elements/`

---

## FX System

**FX is not a field type** — it is a toggle that exists on almost every field. When FX is active the field shows a code expression editor instead of its native UI, allowing dynamic values like `{{someQuery.data.name}}`.

- FX is **ON by default** for all fields
- Set `isFxNotRequired: true` to **disable FX** on a specific field (common for style utility fields like `direction`, `slider`, `padding`)
- The current FX state is stored as `fxActive: true/false` in the field's `definition` object
- Style fields that should never have code expressions (e.g. layout toggles, sliders) always carry `isFxNotRequired: true`

---

## All Field Types

### `code`
**UI:** Code expression editor (CodeHinter)
**Use for:** Text strings, arrays, objects, complex expressions — the most general-purpose field
**FX:** Always on
**Schema example:**
```js
label: {
  type: 'code',
  displayName: 'Label',
  validation: { schema: { type: 'string' }, defaultValue: 'Submit' },
  accordian: 'Data',
}
```
**Definition value:** plain string `{ value: 'Submit' }` or expression `{ value: '{{row.name}}' }`

---

### `toggle`
**UI:** Toggle switch (on/off)
**Use for:** Boolean properties (visibility, disabled, loading, feature flags)
**FX:** Supported — when active shows a code editor for dynamic boolean
**Schema example:**
```js
visibility: {
  type: 'toggle',
  displayName: 'Visibility',
  validation: { schema: { type: 'boolean' }, defaultValue: true },
  section: 'additionalActions',
}
```
**Definition value:** `{ value: '{{true}}' }` (always wrap booleans in `{{}}`)

---

### `switch`
**UI:** Segmented control (like a tab bar)
**Use for:** Mutually exclusive options — button type (Primary/Outline), trigger (click/hover), alignment (Side/Top)
**FX:** Supported unless `isFxNotRequired: true`
**Variants:**
- Text labels: standard `options: [{ displayName: 'Label', value: 'value' }]`
- Icon buttons: add `isIcon: true`, `showLabel: false`, and `iconName` on each option

**Schema example (text):**
```js
alignment: {
  type: 'switch',
  displayName: 'Alignment',
  validation: { schema: { type: 'string' }, defaultValue: 'side' },
  options: [
    { displayName: 'Side', value: 'side' },
    { displayName: 'Top', value: 'top' },
  ],
  accordian: 'label',
}
```
**Schema example (icon):**
```js
direction: {
  type: 'switch',
  displayName: '',
  showLabel: false,
  isIcon: true,
  isFxNotRequired: true,
  options: [
    { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
    { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
  ],
  accordian: 'label',
}
```
**Definition value:** `{ value: 'side' }` (plain string, no `{{}}`)

---

### `select`
**UI:** Dropdown select
**Use for:** Single selection from a named list, when there are more options than a switch can show
**FX:** Supported
**Options format:** `{ name: 'Label', value: 'value' }` (note: `name` not `displayName`)
**Schema example:**
```js
parseFileType: {
  type: 'select',
  displayName: 'File type',
  options: [
    { name: 'Autodetect from extension', value: 'auto-detect' },
    { name: 'CSV', value: 'csv' },
  ],
  validation: { schema: { type: 'string' }, defaultValue: 'auto-detect' },
  accordian: 'Data',
}
```
**Definition value:** `{ value: 'auto-detect' }` (plain string)

---

### `colorSwatches`
**UI:** Color picker with CSS variable swatches
**Use for:** ALL color fields in new widgets (replaces deprecated `color` type)
**FX:** Supported
**Default values:** Always use `var(--cc-*)` tokens, never hardcoded hex except for white `#FFFFFF` / black
**Standard `--cc-*` tokens:**

| Token | Use |
|---|---|
| `var(--cc-primary-brand)` | Primary action color, accent |
| `var(--cc-primary-text)` | Main text color |
| `var(--cc-placeholder-text)` | Placeholder / secondary text |
| `var(--cc-surface1-surface)` | Background, surface, loader |
| `var(--cc-default-border)` | Border color |
| `var(--cc-default-icon)` | Icon color |
| `var(--cc-error-systemStatus)` | Error / validation fail color |

**Schema example:**
```js
backgroundColor: {
  type: 'colorSwatches',
  displayName: 'Background',
  validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
  accordian: 'field',
}
```
**Definition value:** `{ value: 'var(--cc-surface1-surface)' }`

> ⚠️ Never use the old `color` type for new widgets.

---

### `numberInput`
**UI:** Number input field with an optional static label appended (defaults to `px`)
**Use for:** Pixel values like `borderRadius`, `borderWidth`
**FX:** Supported
**Note:** Stores a pure number. The FE appends `px` automatically unless `meta.staticText` is set to `''`.
**Schema example:**
```js
borderRadius: {
  type: 'numberInput',
  displayName: 'Border radius',
  validation: {
    schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
    defaultValue: 6,
  },
  accordian: 'field',
}
```
**Definition value:** `{ value: '6' }` (string containing a number)

---

### `boxShadow`
**UI:** Box shadow editor (offset-x, offset-y, blur, spread, color)
**Use for:** `boxShadow` on the widget container
**FX:** Supported
**Schema example:**
```js
boxShadow: {
  type: 'boxShadow',
  displayName: 'Box shadow',
  validation: {
    schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
    defaultValue: '0px 0px 0px 0px #00000040',
  },
  accordian: 'field',
}
```
**Definition value:** `{ value: '0px 0px 0px 0px #00000040' }`

---

### `icon`
**UI:** Icon picker (Tabler icons)
**Use for:** Selecting an icon for display on the widget
**FX:** Supported
**Note:** Almost always paired with `iconColor` (`colorSwatches`) and `iconVisibility` in the definition. The field is typically hidden by default (`visibility: false`) and shown by an iconVisibility toggle.
**Schema example:**
```js
icon: {
  type: 'icon',
  displayName: 'Icon',
  validation: { schema: { type: 'string' }, defaultValue: 'IconHome2' },
  accordian: 'field',
  visibility: false,        // hides in inspector until icon visibility is toggled on
}
```
**Definition value:** `{ value: 'IconHome2' }` + separate `iconVisibility: { value: false }` in definition

---

### `slider`
**UI:** Range slider
**Use for:** `labelWidth` percentage, opacity
**FX:** Almost always `isFxNotRequired: true`
**Note:** No `displayName` when `showLabel: false`
**Schema example:**
```js
labelWidth: {
  type: 'slider',
  showLabel: false,
  isFxNotRequired: true,
  accordian: 'label',
  conditionallyRender: [
    { key: 'alignment', value: 'side' },
    { key: 'auto', value: false },
  ],
}
```
**Definition value:** `{ value: '33' }` (string, represents percentage)

---

### `checkbox`
**UI:** Checkbox
**Use for:** The `auto` (auto-width) field in label sections
**FX:** Can be `isFxNotRequired: true`
**Schema example:**
```js
auto: {
  type: 'checkbox',
  displayName: 'Width',
  validation: { schema: { type: 'boolean' }, defaultValue: true },
  isFxNotRequired: true,
  accordian: 'label',
  conditionallyRender: { key: 'alignment', value: 'side' },
}
```
**Definition value:** `{ value: '{{true}}' }`

---

### `input`
**UI:** Plain text input
**Use for:** Simple string fields that don't need code expressions (rare in new widgets)
**FX:** Supported but often not needed
**Note:** Prefer `code` for most text fields. `input` is for internal/non-user-expression fields.

---

### `number`
**UI:** Number field (no px suffix)
**Use for:** Pure numeric values where no unit is needed
**Note:** Different from `numberInput` — no static text appended

---

### `dropdownMenu`
**UI:** Dropdown menu with configurable options
**Use for:** Complex multi-option selects like the Table `dataSourceSelector`
**Schema example:**
```js
dataSourceSelector: {
  type: 'dropdownMenu',
  displayName: 'Data source',
  options: [{ name: 'Raw JSON', value: 'rawJson' }],
}
```

---

### `sectionSubHeader`
**UI:** Renders a `LabeledDivider` (visual section separator within an accordion group)
**Use for:** Splitting a long accordion section into labeled sub-groups
**FX:** N/A — display only
**Schema example:**
```js
_divider: {
  type: 'sectionSubHeader',
  displayName: 'Advanced options',
  accordian: 'Data',
}
```

---

## Field Modifiers (apply to any type)

| Modifier | Type | Description |
|---|---|---|
| `accordian` | `string` | Groups field under a named accordion in Properties or Styles tab |
| `section` | `'additionalActions'` | Places field in the Additional Actions section (below main accordion) |
| `conditionallyRender` | `{key, value}` or `[{key, value, parentObjectKey?}]` | Hides field unless condition(s) met. Single object = OR. Array = AND. `parentObjectKey` allows cross-section reference (e.g. validation field conditioned on a properties key) |
| `isFxNotRequired` | `boolean` | Disables the FX toggle on this field. Use for style utilities that should never be dynamic |
| `fxActive` (in definition) | `boolean` | Set `fxActive: false` in `definition.properties.{key}` or `definition.validation.{key}` to pre-disable the FX toggle for a specific field at widget creation time. Uncommon — only needed when a field's FX should default to off even though the field type supports FX. |
| `visibility` | `boolean` | When `false`, field is hidden in inspector (used for `icon` / `iconColor`) |
| `showLabel` | `boolean` | When `false`, hides the field label |
| `isIcon` | `boolean` | On `switch` fields: renders icon buttons instead of text buttons |
| `placeholder` | `string` | Placeholder text shown in the field |
| `newLine` | `boolean` | Forces the field to start on a new line in the inspector |

---

## `conditionallyRender` — Cross-Section Pattern

When a field in the `validation` section should conditionally render based on a `properties` key, use `parentObjectKey`:

```js
// In validation section — only shows when properties.enableMultiple is true
minFileCount: {
  type: 'code',
  displayName: 'Min files',
  conditionallyRender: [
    {
      key: 'enableMultiple',
      value: true,
      parentObjectKey: 'properties',   // ← cross-section reference
    },
  ],
}
```

Without `parentObjectKey`, the condition defaults to looking up the key within the **same section** as the field.

Note: The FilePicker widget does not actually implement this pattern in its current schema — the above is an illustrative example. Check any widget that has both a `validation` section AND property flags like `enableMultiple`/`enableAdvanced` for cases where this pattern applies.

---

## Standard Style Sections

Most form-input widgets follow this 3-section style structure:

### `label` accordion
```js
labelColor        // colorSwatches — label text color
alignment         // switch — Side / Top
direction         // switch (isIcon) — left / right align
auto              // checkbox — auto label width (conditional on alignment: side)
labelWidth        // slider — % width (conditional on alignment: side AND auto: false)
widthType         // select — Of Component / Of Field (conditional same as labelWidth)
```

### `field` accordion
```js
icon              // icon picker (visibility: false)
iconColor         // colorSwatches (showLabel: false, visibility: false)
backgroundColor   // colorSwatches
borderColor       // colorSwatches
accentColor       // colorSwatches (for active/focus highlight)
textColor         // colorSwatches
errTextColor      // colorSwatches
borderRadius      // numberInput
boxShadow         // boxShadow
```

### `container` accordion
```js
padding           // switch — Default / None
```

> Not all widgets have all three sections. Use the PRD to determine which apply.

---

## `definition` Block Rules

Every key in `properties`, `styles`, and `validation` MUST have a matching entry in `definition.*`:

```js
definition: {
  properties: {
    label: { value: 'Submit' },              // string → plain value
    visibility: { value: '{{true}}' },        // boolean → wrap in {{}}
    loadingState: { value: '{{false}}' },     // boolean → wrap in {{}}
    options: { value: [/* array */] },        // array → raw JS
  },
  styles: {
    borderRadius: { value: '6' },            // numberInput → string
    boxShadow: { value: '0px 0px 0px 0px #00000040' },
    iconVisibility: { value: false },         // special — not in styles schema
  },
  validation: {
    enableValidation: { value: '{{false}}' },
  }
}
```

**Rules:**
- Boolean values: always `'{{true}}'` or `'{{false}}'` (string with `{{}}`)
- Number values for `numberInput`: plain string `'6'` (no `{{}}`)
- Color values: plain string `'var(--cc-primary-brand)'` (no `{{}}`)
- `iconVisibility` goes in `definition.styles` even though it has no corresponding styles schema entry

```js
// Pre-disable FX for a specific field (rare):
properties: {
  enableMultiple: { value: '{{false}}', fxActive: false },  // FX disabled by default
}
```

---

## Discrepancies / Known Issues

| Issue | Location | Status |
|---|---|---|
| `color` type still used in older widgets | Various legacy schemas | Deprecated — use `colorSwatches` |
| `string` and `text` types both map to `Text` component | `FxParamTypeMapping` | Redundant aliases — use `code` for editable text fields |
| `array` type in schema (e.g., Table `columns`) | table.js | Not in `FxParamTypeMapping` — handled by custom Inspector UI |
| `enableMultiple` definition has `fxActive: false` explicitly | fileinput.js | Intentional — FX pre-disabled for this specific field via definition |
| `iconVisibility` in `definition.styles` has no schema entry in `styles` | Multiple widgets | Convention — always add to definition.styles manually |

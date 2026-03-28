# Design: `tooljet:create-widget` Skill

**Date:** 2026-03-09
**Status:** Approved
**Scope:** Schema generation + auto-registration for new ToolJet widgets from a PRD

---

## Problem

Creating a new ToolJet widget from a PRD requires touching ~15 files across frontend and server. The process is undocumented, inconsistent across widgets (accumulated drift over time), and takes significant engineer time on mechanical boilerplate rather than actual widget logic.

---

## Goal

A Claude skill (`tooljet:create-widget`) that:
1. Reads a PRD (pasted as text)
2. Asks targeted clarifying questions to resolve ambiguities
3. Generates both schema files (frontend + server)
4. Performs all ~11 mechanical registration edits
5. Adds the widget to the import/export service
6. Leaves a clear checklist of what the engineer must do manually (UI, Inspector, icon)

The skill does NOT generate the widget's UI component or custom Inspector — those are handled by a separate UI skill.

---

## Widget Anatomy (Reference)

Every widget has two identical schema files and multiple registration points:

### Schema Structure
```js
export const {name}Config = {
  name: 'ComponentName',       // PascalCase, used in import/export
  displayName: 'Display Name', // shown in component library
  description: '...',
  component: 'ComponentName',  // matches React component name
  defaultSize: { width: N, height: N }, // grid units (height in px, each cell = 10px)
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile:  { type: 'toggle', displayName: 'Show on mobile' },
  },
  validation: { ... },         // optional — for form inputs
  properties: { ... },
  events: { eventName: { displayName: '...' } },
  styles: { ... },
  exposedVariables: { varName: defaultValue },
  actions: [{ handle, displayName, params? }],
  definition: {                // default values for every field
    others: { ... },
    properties: { ... },
    events: [],
    styles: { ... },
    validation: { ... },
  },
};
```

### Standard Fields (every widget)
- **`additionalActions` section in properties:** `loadingState`, `visibility`, `disabledState`, `tooltip`
- **Standard CSAs (actions):** `setDisable`, `setLoading`, `setVisibility`
- **Standard exposed vars:** `isLoading`, `isVisible`, `isDisabled`

### Definition Value Rules
| Field type | Value format |
|---|---|
| Boolean | `'{{true}}'` or `'{{false}}'` |
| String | `'plain string'` |
| numberInput | `'6'` (string of number) |
| Color | `'var(--cc-primary-brand)'` |
| Array | `[{ ... }]` (raw JS) |

---

## All Registration Touchpoints

| # | File | Change |
|---|---|---|
| 1 | `frontend/src/AppBuilder/WidgetManager/widgets/{name}.js` | Create schema |
| 2 | `server/src/modules/apps/services/widget-config/{name}.js` | Create identical schema |
| 3 | `frontend/.../widgets/index.js` | Add named export |
| 4 | `server/.../widget-config/index.js` | Add to `widgets` object |
| 5 | `frontend/.../configs/widgetConfig.js` | Insert into correct comment group |
| 6 | `frontend/.../Inspector/Inspector.jsx` | Add to `NEW_REVAMPED_COMPONENTS` |
| 7 | `frontend/.../AppCanvas/RenderWidget.jsx` | Add to `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY` |
| 8 | `frontend/.../Inspector/Components/DefaultComponent.jsx` | Add to `SHOW_ADDITIONAL_ACTIONS` + `PROPERTIES_VS_ACCORDION_TITLE` |
| 9 | `frontend/.../Inspector/Utils.js` | Add to `renderCustomStyles` + `renderElement` widget lists |
| 10 | `frontend/.../ComponentManagerTab/sectionConfig.js` | Add to section `Set` |
| 11 | `frontend/assets/images/icons/widgets/index.jsx` | Add stub icon export |
| 12 | `frontend/assets/images/icons/widgets/{name}.jsx` | Create stub SVG icon |
| 13 | `restrictedWidgetsConfig.js` | Append widget to parent arrays (only if container-like) |
| 14 | `server/.../app-import-export.service.ts` | Add to `NewRevampedComponents` |
| 15 | `frontend/.../Inspector/Inspector.jsx` GetAccordion | Add `case '{Name}'` |

---

## Inspector Patterns

Two patterns used in practice:

### Pattern A — Fall-through (FileInput model)
Widget reuses an existing Inspector component. In `GetAccordion`:
```js
case 'FileInput':   // fall-through
case 'FilePicker':
  return <FilePicker {...restProps} />;
```
`DefaultComponent.jsx` still needs `SHOW_ADDITIONAL_ACTIONS` + `PROPERTIES_VS_ACCORDION_TITLE` entries.
`DefaultComponent.jsx` `PROPERTIES_VS_ACCORDION_TITLE` maps component → primary accordion title (e.g., `'Data'`).

### Pattern B — Custom Inspector (PopoverMenu model)
Widget has its own Inspector in `Inspector/Components/{Name}/`. In `GetAccordion`:
```js
case 'PopoverMenu':
  return <PopoverMenu {...restProps} />;
```
The custom Inspector follows the `sections[]` pattern:
```js
const sections = [
  { title: 'Menu', type: 'properties', properties: [...] },
  { title: 'Options', custom: () => <OptionsList ... /> },
  { title: 'Events', custom: () => <EventManager ... /> },
  { title: 'Additional Actions', type: 'properties', properties: additionalActions },
  { title: 'Devices', type: 'others', properties: ['showOnDesktop', 'showOnMobile'] },
];
```
**This pattern is a manual TODO** — the skill flags it but does not generate it.

---

## `restrictedWidgetsConfig.js`

Keys are PARENT containers. Values are widget names BLOCKED from being dropped inside.
```js
// Calendar and Kanban cannot be dropped inside a Form:
Form: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Accordion'],
```
Simple leaf widgets (buttons, inputs, display) need NO change here.
Only container-like widgets (that shouldn't be nested) need to be appended to parent arrays.

---

## Style Sections Taxonomy

The skill uses a structured checklist. Engineer confirms which sections apply for their widget:

### `label` accordion (form inputs with labels)
```
labelColor, alignment, direction, auto, labelWidth, widthType
```

### `field` accordion (the interactive part of the widget)
```
icon, iconColor, backgroundColor, borderColor, accentColor,
textColor, errTextColor, borderRadius, boxShadow
```

### `container` accordion (widget outer container)
```
padding  (switch: Default / None)
```

Style sections come from the PRD. If PRD doesn't specify, the skill presents this checklist interactively.

---

## Field Types Reference

Full reference: `docs/widget-schema-field-types.md`

Key types used in new widgets:

| Schema `type` | UI | FX default | Notes |
|---|---|---|---|
| `code` | Code editor | on | General purpose — text, arrays, objects |
| `toggle` | Toggle switch | on | Booleans |
| `switch` | Segmented control | on | Mutually exclusive options |
| `select` | Dropdown | on | Options use `name` (not `displayName`) |
| `colorSwatches` | Color + CSS var swatches | on | ALL colors in new widgets |
| `numberInput` | Number field + `px` | on | Pixel values, stores pure number |
| `boxShadow` | Shadow editor | on | Box shadow compound field |
| `icon` | Icon picker | on | Pair with `iconColor` + `iconVisibility` in definition |
| `slider` | Range slider | off (`isFxNotRequired`) | Label width % |
| `checkbox` | Checkbox | off (`isFxNotRequired`) | Auto-width field |
| `switch` (icon) | Icon buttons | off (`isFxNotRequired`) | Direction alignment |
| `sectionSubHeader` | Divider label | n/a | Visual separator within accordion |

---

## Skill Flow (6 Phases)

### Phase 1 — PARSE (Explore agent)
Spawns an Explore agent with the PRD text + paths to 1-2 reference widgets.
Returns:
- Normalized field list: `[{ key, displayName, type, section, accordian, defaultValue, conditionals }]`
- Events list
- Exposed variables list
- CSA list
- Identified ambiguities
- Suggested sectionConfig category
- Inspector complexity flag (simple vs. likely custom)

### Phase 2 — CLARIFY (main thread, sequential)
One question at a time:

**Q1 — Field list confirmation**
Show extracted field table. Ask engineer to confirm, correct, or add fields.

**Q2 — Inspector type**
> "Does this widget need a fully custom Inspector with non-standard UI (drag-and-drop option editors, complex interactions)?
> A) No — use DefaultComponent (standard accordion)
> B) No — fall-through to existing Inspector: [which widget?]
> C) Yes — custom Inspector needed (flagged as manual TODO)"

**Q3 — Component library section**
> Which section? buttons / data / layouts / textInputs / numberInputs / selectInputs / dateTimeInputs / navigation / media / presentation / custom / miscellaneous

**Q4 — Style properties**
Show checklist of 3 sections (label / field / container). Engineer confirms which apply.
If PRD explicitly lists styles, use those. If vague ("as per designs"), present checklist.

**Q5 — Restricted parent containers** *(only if widget is container-like)*
> "Should this widget be blocked from being dropped inside any parent containers?
> (Default: no. Only needed for complex/container widgets like nested forms.)"

**Q6 — Cross-section conditionals**
Show detected `conditionallyRender` relationships. Confirm or add any missed.

**→ Present final schema summary table for engineer approval before writing anything.**

### Phase 3 — GENERATE (single general-purpose agent)
Writes both schema files. Same agent, sequential:
1. `frontend/src/AppBuilder/WidgetManager/widgets/{name}.js`
2. `server/src/modules/apps/services/widget-config/{name}.js`

### Phase 4 — REGISTER (single general-purpose agent, ordered)
Applies edits in safe dependency order:
1. `widgets/index.js` — named export
2. `widget-config/index.js` — widgets object entry
3. `widgetConfig.js` — insert into correct comment-delimited group
4. `Inspector.jsx` — `NEW_REVAMPED_COMPONENTS` array
5. `Inspector.jsx` — `GetAccordion` case (pattern A or B per Q2)
6. `RenderWidget.jsx` — `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY`
7. `DefaultComponent.jsx` — `SHOW_ADDITIONAL_ACTIONS` + `PROPERTIES_VS_ACCORDION_TITLE`
8. `Utils.js` — widget name in `renderCustomStyles` + `renderElement` lists
9. `sectionConfig.js` — add to section `Set`
10. `assets/images/icons/widgets/index.jsx` — stub export
11. `assets/images/icons/widgets/{name}.jsx` — create stub SVG
12. `restrictedWidgetsConfig.js` — only if Q5 = yes

### Phase 5 — MIGRATIONS (same agent as Phase 4)
`server/src/modules/apps/services/app-import-export.service.ts`:
- Add widget name to `NewRevampedComponents` array

### Phase 6 — SUMMARY
Print two lists + manual checklist:
```
✅ Files created: (list)
✅ Files edited:  (list)

📋 Manual TODOs:
  [ ] Create UI widget:   frontend/src/AppBuilder/Widgets/{Name}/
  [ ] Replace stub icon:  frontend/assets/images/icons/widgets/{name}.jsx
  [ ] Create Inspector:   .../Inspector/Components/{Name}/   ← only if custom Inspector
  [ ] Commit before next run (safety)
```

---

## Safety Rules

- Always check for widget name conflict in `widgets/index.js` before writing anything
- Instructs engineer to commit/branch before Phase 4 begins
- Phases 4+5 are a single agent — if it fails partway, state is inconsistent; engineer can revert via git

---

## Out of Scope (Separate Skill)

- Widget UI component (`Widgets/{Name}/`)
- Custom Inspector component (`Inspector/Components/{Name}/`)
- Final icon SVG design

---

## Reference Files

| Purpose | Path |
|---|---|
| Field types guide | `docs/widget-schema-field-types.md` |
| Reference schema (button-type) | `frontend/.../widgets/popoverMenu.js` |
| Reference schema (form-input) | `frontend/.../widgets/dropdownV2.js` |
| Reference schema (maximum complexity) | `frontend/.../widgets/table.js` |
| Inspector pattern A | `frontend/.../Inspector/Components/FilePicker.jsx` |
| Inspector pattern B | `frontend/.../Inspector/Components/PopoverMenu/PopoverMenu.jsx` |
| Registration touchpoints | `frontend/.../configs/widgetConfig.js` |
| Import/export migration | `server/.../app-import-export.service.ts` |

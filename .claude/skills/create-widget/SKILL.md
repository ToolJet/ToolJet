---
name: create-widget
description: Use when creating a new ToolJet widget from a PRD. Generates both schema config files (frontend + server), performs all registration edits (~14 files), and adds the widget to the import/export service. Leaves UI component and custom Inspector as manual TODOs.
---

# ToolJet Widget Creator

## Overview

This skill creates a complete new ToolJet widget from a PRD. It runs in 6 phases:

1. **PARSE** — Explore agent reads PRD + reference widget schemas
2. **CLARIFY** — Interactive Q&A for ambiguities (one question at a time)
3. **GENERATE** — Writes both schema files (frontend + server)
4. **REGISTER** — Edits ~11 registration files mechanically
5. **MIGRATIONS** — Adds widget to import/export service
6. **SUMMARY** — Lists what was done + manual TODOs

**DO NOT** generate the UI component (`Widgets/{Name}/`) or custom Inspector (`Inspector/Components/{Name}/`). Those are out of scope — flag as manual TODOs.

## When to Use

When an engineer has a widget PRD and wants to scaffold the schema + registration. PRD must include at minimum: widget name, properties list, events, exposed variables, CSAs.

## CRITICAL RULES

- NEVER write any file before Phase 2 is complete and engineer approves the schema summary table
- ALWAYS check for widget name conflict in `widgets/index.js` before writing anything
- ALWAYS instruct engineer to commit/branch before Phase 4 starts
- Phases 4+5 touch ~12 files — if interrupted, engineer must `git checkout .` to reset
- The frontend and server schema files MUST be identical
- NEVER assume style sections — always derive from PRD or ask in Phase 2 Q4

## Phase 1 — PARSE

Announce: "Phase 1: Parsing PRD with Explore agent..."

First, check for a widget name conflict:
```bash
grep -r "{WidgetName}" /Users/nithin/Code/ToolJet/frontend/src/AppBuilder/WidgetManager/widgets/index.js
```
If the name already exists, stop and tell the engineer: "Widget '{Name}' already exists. Choose a different name."

Spawn an **Explore** subagent with this prompt (substitute `{PRD_TEXT}` with the ARGUMENTS passed to this skill):

---
You are analyzing a ToolJet widget PRD to extract a normalized schema definition.

**PRD:**
{PRD_TEXT}

**Read these reference files first:**
- `docs/widget-schema-field-types.md` — canonical field type reference
- `frontend/src/AppBuilder/WidgetManager/widgets/popoverMenu.js` — button-type schema example
- `frontend/src/AppBuilder/WidgetManager/widgets/dropdownV2.js` — form-input schema example

**Then extract and return ALL of the following as structured output:**

**1. Widget identity**
- name: PascalCase (e.g. FileInput)
- displayName: human readable (e.g. "File input")
- description: one sentence
- component: same as name
- defaultSize: { width: N, height: N } — width in grid cells, height in px (each grid cell = 10px height)

Note: All new widgets automatically include `others: { showOnDesktop, showOnMobile }` and matching `definition.others` entries. Do NOT extract these from the PRD — they are injected by the schema template automatically.

**2. Properties table** — one row per property:
| key | displayName | type | section/accordian | defaultValue | conditionallyRender | isFxNotRequired |

PRD type → schema type mapping:
- "FX" or text/string field → `code`
- "Toggle" / boolean → `toggle`
- "Switch" / segmented control → `switch` with options array
- "Dropdown" / select list → `select` with options array
- "Number input" → `numberInput`
- "Boolean" without FX → `toggle` with `isFxNotRequired: true`

Always include these standard `additionalActions` fields (section: 'additionalActions'):
- `loadingState` → toggle, default false
- `visibility` → toggle, default true
- `disabledState` → toggle, default false
- `tooltip` → code, default ''

**3. Validation table** (only if PRD has a Validation section)
Same column format as properties table.
CRITICAL: If a validation field conditionally renders based on a PROPERTIES key (not another validation key), mark it with `parentObjectKey: 'properties'` in the conditionallyRender column.

**4. Events list**
`[{ handle: 'onXxx', displayName: 'On Xxx' }]`

**5. Exposed variables**
`{ varName: defaultValue }` — always include: isVisible, isDisabled, isLoading

**6. Actions (CSAs)**
Always include: setDisable, setLoading, setVisibility. Add any extra CSAs from PRD.
Format: `[{ handle, displayName, params?: [{ handle, displayName, defaultValue, type }] }]`

**7. Styles**
List ONLY what the PRD explicitly names. If PRD says "as per designs" or is vague, return empty list and flag: "STYLES: needs clarification in Phase 2".

**8. Suggested sectionConfig group**
Pick one: buttons / data / layouts / textInputs / numberInputs / selectInputs / dateTimeInputs / navigation / media / presentation / custom / miscellaneous

**9. Inspector complexity**
Simple = DefaultComponent or fall-through to existing widget.
Complex = needs fully custom Inspector with drag-and-drop, option editors, or non-standard UI.

**10. Ambiguities list**
Anything unclear, missing defaults, or needing engineer decision.
---

After the Explore agent returns, present its output to the engineer as a clean formatted summary with all 10 sections clearly labeled.

## Phase 2 — CLARIFY

Ask these questions ONE AT A TIME. Wait for the engineer's full answer before asking the next question. After all questions are answered, present the approval gate table.

---

**Q1 — Field list confirmation**

Present the properties table from Phase 1 output. Ask:
> "Here's the extracted field list from your PRD. Please confirm, correct, or add anything missing:
> [paste properties table]
> Any changes needed?"

Incorporate all corrections before proceeding to Q2.

---

**Q2 — Inspector type**

Ask:
> "Does this widget need a fully custom Inspector panel with non-standard UI (e.g. drag-and-drop option list, custom option editors, complex interactions)?
>
> A) No — use DefaultComponent (standard accordion, works for most widgets)
> B) No — reuse an existing Inspector via fall-through (e.g. FileInput reuses FilePicker). Which widget?
> C) Yes — needs a custom Inspector (this will be flagged as a manual TODO)"

Store answer as `INSPECTOR_TYPE = A | B | C`.
If B, store `INSPECTOR_FALLTHROUGH = '{ExistingWidget}'`.

---

**Q3 — Component library section**

Ask:
> "Which section of the component library should this widget appear in?
>
> buttons / data / layouts / textInputs / numberInputs / selectInputs / dateTimeInputs / navigation / media / presentation / custom / miscellaneous"

Store as `SECTION_GROUP`.

---

**Q4 — Style properties**

If the PRD explicitly listed specific style fields, show them and ask for confirmation.
If the PRD was vague ("as per designs") or empty, show this checklist:

> "Which style sections does this widget need? (confirm all that apply)
>
> **label** — for widgets with a text label above/beside them:
>   labelColor, alignment (Side/Top), direction (left/right), auto-width checkbox, labelWidth slider, widthType
>
> **field** — the main interactive area:
>   icon picker, iconColor, backgroundColor, borderColor, accentColor, textColor, errTextColor, borderRadius, boxShadow
>
> **container:**
>   padding (Default / None switch)
>
> **custom accordion group** — if your widget needs a named style section that doesn't fit the above (e.g. `'button'`, `'header'`):
>   List the group name and which style properties belong in it.
>
> **custom** — list any additional style properties from your PRD that don't fit any group above"

Store confirmed style fields as `STYLE_FIELDS`. For each custom accordion group, store the group name alongside its fields so the GENERATE agent can use the correct `accordian:` key.

---

**Q5 — Restricted parent containers**

Only ask this if Phase 1 flagged the widget as Complex OR the widget is itself a container.
For simple leaf widgets, skip Q5 entirely (set `RESTRICTED_PARENTS = []`).

If asked:
> "Should this widget be blocked from dropping inside certain parent containers?
> (Default: no restrictions — most leaf widgets need none.)
> If yes, which parents? e.g. Form, Listview, Kanban_card, Container, Modal, Tabs"

Store as `RESTRICTED_PARENTS = []` or list of parent names.

---

**Q6 — Cross-section conditionals review**

Show the detected `conditionallyRender` relationships from Phase 1:
> "Here are the conditional field relationships I detected:
> [list: 'Field X only shows when Field Y = value Z' and flag any cross-section ones]
>
> Any missed, incorrect, or additional conditionals?"

Incorporate corrections. Pay special attention to validation fields conditioned on properties keys — these need `parentObjectKey: 'properties'`.

---

**→ APPROVAL GATE**

Present the complete schema summary table before writing any files:

| Section | Key | DisplayName | Type | Default | Conditional |
|---|---|---|---|---|---|
| properties | ... | ... | ... | ... | ... |
| validation | ... | ... | ... | ... | ... |
| styles | ... | ... | ... | ... | ... |
| events | ... | ... | — | — | — |
| exposedVars | ... | ... | — | defaultValue | — |
| CSAs | ... | ... | — | — | — |

Also confirm:
- Inspector type: [A/B/C] [fallthrough widget if B]
- Section group: [group]
- Restricted parents: [list or none]

Ask: **"Does this schema look correct? Reply 'yes' to proceed with file generation, or describe any changes."**

**DO NOT proceed to Phase 3 until the engineer replies 'yes' or equivalent.**

## Phase 3 — GENERATE SCHEMAS

Announce: "Phase 3: Generating schema files..."

Spawn a **general-purpose** agent with this prompt:

---
Generate both ToolJet widget schema files using the approved schema from Phase 2.

Reference files to read first:
- `.claude/skills/create-widget/schema-template.md` — template structure + self-consistency rules
- `docs/widget-schema-field-types.md` — all field type patterns and --cc-* token reference

Approved schema data:
{paste the complete Phase 2 approval gate table here, including INSPECTOR_TYPE, SECTION_GROUP, STYLE_FIELDS, RESTRICTED_PARENTS}

Tasks:
1. Build the complete JS schema object following the template
2. Run ALL 10 self-consistency checks from schema-template.md
3. Fix any inconsistencies found
4. Write the schema to BOTH files with identical content:
   - `frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js`
   - `server/src/modules/apps/services/widget-config/{camelName}.js`
5. Verify they are identical:
   ```bash
   diff frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js \
        server/src/modules/apps/services/widget-config/{camelName}.js
   ```
   If diff shows any output, fix until identical.
6. Report back: show the complete schema and confirm both files written.
---

After the agent completes, verify yourself:
```bash
diff frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js \
     server/src/modules/apps/services/widget-config/{camelName}.js
```
Expected: no output (files are identical).

## Phase 4 — REGISTER

Announce: "Phase 4: Registering widget (13 file edits)..."

First, instruct the engineer to commit and branch before any edits:
```bash
git add -A
git commit -m "chore: generate {Name} widget schema files"
git checkout -b widget/{camelName}-registration
```

Then spawn a **general-purpose** agent with the following prompt. Before dispatching, substitute all six variables in the prompt text:
- `{Name}` → PascalCase name from Phase 2 (e.g. `FileInput`)
- `{camelName}` → camelCase file name from Phase 2 (e.g. `fileInput`)
- `{INSPECTOR_TYPE}` → `A`, `B`, or `C` from Phase 2 Q2
- `{INSPECTOR_FALLTHROUGH}` → the existing Inspector name (only relevant when INSPECTOR_TYPE = B; otherwise substitute `N/A`)
- `{SECTION_GROUP}` → section group from Phase 2 Q3
- `{RESTRICTED_PARENTS}` → list from Phase 2 Q5, or `[]` if none

---

You are performing all widget registration edits for a new ToolJet widget.

**Variables:**
- Name (PascalCase): {Name}
- camelName (camelCase): {camelName}
- INSPECTOR_TYPE: {INSPECTOR_TYPE}   (A = DefaultComponent, B = fall-through, C = custom/TODO)
- INSPECTOR_FALLTHROUGH: {INSPECTOR_FALLTHROUGH}   (only relevant when INSPECTOR_TYPE = B)
- SECTION_GROUP: {SECTION_GROUP}
- RESTRICTED_PARENTS: {RESTRICTED_PARENTS}

**Reference file:** `.claude/skills/create-widget/registration-checklist.md` — read this first. It contains exact file paths, anchor patterns, and code snippets for every edit. Follow it precisely.

Perform all edits in the dependency order listed in the checklist (Edit 11 first, then 1-10, then 12 if needed, then 13):

**Edit 11 — CREATE icon stub** (do this first, no dependencies)
Create `frontend/assets/images/icons/widgets/{camelName}.jsx` with the stub SVG content from the checklist.

**Edit 1 — `frontend/src/AppBuilder/WidgetManager/widgets/index.js`**
Add `import { {camelName}Config } from './{camelName}';` after the last existing import.
Add `{camelName}Config,` before the closing `};` of the export block.

**Edit 2 — `server/src/modules/apps/services/widget-config/index.js`**
Add `import { {camelName}Config } from './{camelName}';` after the last existing import.
Add `{camelName}Config,` before the closing `};` of the `widgets` object.

**Edit 3 — `frontend/src/AppBuilder/WidgetManager/configs/widgetConfig.js`**
Add `{camelName}Config,` to the destructured import from `'../widgets'`.
Insert `{camelName}Config,` into the `widgets` array under the comment group matching `{SECTION_GROUP}`. Do NOT append at the end of the array — insert within the correct group.

**Edit 4 — `frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx` (NEW_REVAMPED_COMPONENTS)**
Append `'{Name}',` before the closing `];` of the `NEW_REVAMPED_COMPONENTS` array (around line 148).

**Edit 5 — `frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx` (GetAccordion)**
Apply based on INSPECTOR_TYPE:
- **A (DefaultComponent):** No edit needed — `default:` branch already returns `<DefaultComponent>`.
- **B (fall-through):** Add a fall-through case before `default:` per the checklist Pattern B. If the target `{INSPECTOR_FALLTHROUGH}` case already exists in the switch, add `case '{Name}':` as an additional fall-through above it.
- **C (custom):** Add a placeholder case with a TODO comment per the checklist Pattern C.

**Edit 6 — `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx` (SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY)**
Append `'{Name}',` before the closing `];` of the array (around line 56).

**Edit 7 — `frontend/src/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent.jsx`**
7A: Append `'{Name}',` before the closing `];` of `SHOW_ADDITIONAL_ACTIONS`.
7B (CONDITIONAL — skip if INSPECTOR_TYPE = C): Add `{Name}: 'Data',` before the closing `};` of `PROPERTIES_VS_ACCORDION_TITLE`. Use `'Data'` unless the PRD specifies a different accordion title for the Properties panel. Custom Inspector widgets do not use DefaultComponent's accordion title mapping.

**Edit 8 — `frontend/src/AppBuilder/RightSideBar/Inspector/Utils.js`**
8A: In `renderCustomStyles` (line 41+), add `componentConfig.component == '{Name}' ||` before the last condition (`ProgressBar`) in the `if` block.
8B (CONDITIONAL): Only apply this edit if the widget has at least one field in `properties` with a `conditionallyRender` key (from Phase 2's confirmed field table). If no properties have `conditionallyRender`, skip 8B entirely. If applicable: In `renderElement` (line 167+), add `componentConfig.component == '{Name}' ||` before the last condition (`ProgressBar`) in the `if` block.

**Edit 9 — `frontend/src/AppBuilder/RightSideBar/ComponentManagerTab/sectionConfig.js`**
Add `'{Name}',` as the last entry in the `valueSet` of the `{SECTION_GROUP}` section object.

**Edit 10 — `frontend/assets/images/icons/widgets/index.jsx`**
10A: Add `import {Name} from './{camelName}.jsx';` after the last existing import (before `const WidgetIcon`).
10B: Add a `case '{camelName}': return <{Name} {...props} />;` before the `default:` case in the switch. The case string key = `{camelName}` converted to all lowercase (e.g. `fileInput` → `'fileinput'`). The case string must be fully lowercased (e.g. `'fileinput'`, not `'FileInput'`).

**Edit 12 — `frontend/src/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig.js`**
SKIP THIS EDIT if `{RESTRICTED_PARENTS}` is `[]` or empty.
If non-empty: for each parent container in `{RESTRICTED_PARENTS}`, append `'{Name}'` to that parent's array in `RESTRICTED_WIDGETS_CONFIG`.

**Edit 13 — `server/src/modules/apps/services/app-import-export.service.ts` (NewRevampedComponents)**
Append `'{Name}',` before the closing `];` of the `NewRevampedComponents` array (around line 143).

**Edit 14 — Inspector stub (ONLY if INSPECTOR_TYPE = C)**
SKIP THIS EDIT if `{INSPECTOR_TYPE}` is `A` or `B`.

If INSPECTOR_TYPE = C, create the stub Inspector file:
`frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx`

Contents:
```jsx
import React from 'react';
import { renderElement } from '../../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';

export const {Name} = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    dataQueries,
    paramUpdated,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    pages,
  } = restProps;

  // Separate properties by section
  let properties = [];
  let additionalActions = [];

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else {
      properties.push(key);
    }
  }

  const createRenderElement = (property, type = 'properties', extraProps = {}) => {
    return renderElement(
      component,
      componentMeta,
      extraProps.paramUpdated || paramUpdated,
      dataQueries,
      property,
      type,
      currentState,
      allComponents,
      extraProps.darkMode || darkMode,
      extraProps.placeholder || ''
    );
  };

  const createAccordionItem = (title, children, isOpen = true) => ({ title, isOpen, children });

  // TODO: Customize sections for {Name} widget
  const sections = [
    {
      title: 'Properties',
      type: 'properties',
      properties: properties,
    },
    {
      title: 'Events',
      custom: () => (
        <EventManager
          sourceId={component?.id}
          eventSourceType="component"
          eventMetaDefinition={componentMeta}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
          pages={pages}
        />
      ),
    },
    {
      title: 'Additional Actions',
      type: 'properties',
      properties: additionalActions,
      extraProps: (property) => ({
        placeholder: componentMeta.properties?.[property]?.placeholder,
      }),
    },
    {
      title: 'Devices',
      type: 'others',
      properties: ['showOnDesktop', 'showOnMobile'],
      extraProps: () => ({ paramUpdated: layoutPropertyChanged }),
    },
  ];

  const items = sections.map((section) => {
    if (section.custom) {
      return createAccordionItem(section.title, section.custom());
    }
    const children = section.properties.map((property) => {
      const extraProps = section.extraProps ? section.extraProps(property) : {};
      return createRenderElement(property, section.type, extraProps);
    });
    return createAccordionItem(section.title, children);
  });

  return <Accordion items={items} />;
};
```

After all edits, report back listing every file you modified or created.

---

After the agent completes, verify the key edits succeeded:
```bash
grep "{Name}" /Users/nithin/Code/ToolJet/frontend/src/AppBuilder/WidgetManager/widgets/index.js
grep "{Name}" /Users/nithin/Code/ToolJet/server/src/modules/apps/services/widget-config/index.js
grep "{Name}" /Users/nithin/Code/ToolJet/frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx
grep "{Name}" /Users/nithin/Code/ToolJet/server/src/modules/apps/services/app-import-export.service.ts
```

All four greps should return at least one match. If any returns nothing, the agent missed that edit — fix manually before proceeding.

## Phase 5 — MIGRATIONS

Phase 5 is handled by the same agent dispatched in Phase 4 — Edit 13 (the `NewRevampedComponents` addition) is included in the Phase 4 agent prompt above.

If for any reason the Phase 4 agent failed to complete Edit 13, run a targeted fix: spawn a **general-purpose** agent with this prompt:

---

Open `server/src/modules/apps/services/app-import-export.service.ts`.

Find the `NewRevampedComponents` array (around line 109). It ends with:
```ts
  'IFrame',
];
```

Append `'{Name}',` before the closing `];` so the array ends:
```ts
  'IFrame',
  '{Name}',
];
```

Save the file and confirm the edit is present.

---

Verify:
```bash
grep "{Name}" /Users/nithin/Code/ToolJet/server/src/modules/apps/services/app-import-export.service.ts
```

Expected: one match on the `NewRevampedComponents` line.

## Phase 6 — SUMMARY

Announce completion:

```
Phase 6: Complete ✅
```

Print the files created list (include the Inspector stub line only if INSPECTOR_TYPE = C):

```
Files created:
  frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js
  server/src/modules/apps/services/widget-config/{camelName}.js
  frontend/assets/images/icons/widgets/{camelName}.jsx  (stub icon)
  [if INSPECTOR_TYPE = C]
  frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx  (stub Inspector)
```

Print the files edited list. Include `restrictedWidgetsConfig.js` only if `RESTRICTED_PARENTS` was non-empty (i.e. Phase 2 collected at least one restricted parent):

```
Files edited:
  frontend/src/AppBuilder/WidgetManager/widgets/index.js
  server/src/modules/apps/services/widget-config/index.js
  frontend/src/AppBuilder/WidgetManager/configs/widgetConfig.js
  frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx
  frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx
  frontend/src/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent.jsx
  frontend/src/AppBuilder/RightSideBar/Inspector/Utils.js
  frontend/src/AppBuilder/RightSideBar/ComponentManagerTab/sectionConfig.js
  frontend/assets/images/icons/widgets/index.jsx
  server/src/modules/apps/services/app-import-export.service.ts
  [if RESTRICTED_PARENTS non-empty]
  frontend/src/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig.js
```

Print the manual TODOs checklist:

```
📋 Manual TODOs (not automated by this skill):

[ ] Create UI widget component:
    frontend/src/AppBuilder/Widgets/{Name}/index.jsx

[ ] Replace stub icon with final SVG:
    frontend/assets/images/icons/widgets/{camelName}.jsx

[ ] (Only if INSPECTOR_TYPE = C) Fill in the stub Inspector component:
    frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx
    The stub is created with a generic 'Properties' section. Customize the sections[]
    array to match your widget's Inspector panels (rename/split sections, add custom
    option editors, etc). See PopoverMenu as reference:
    frontend/src/AppBuilder/RightSideBar/Inspector/Components/PopoverMenu/PopoverMenu.jsx

[ ] Commit all changes before running the next skill:
    git add -A && git commit -m "feat: add {Name} widget scaffold"
```

Print the next-steps reminder:

```
Run `tooljet:create-widget-ui` (when available) to generate the UI component and custom Inspector.
```

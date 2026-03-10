---
name: create-widget-ui
description: Use after create-widget to generate the UI stub for a new ToolJet widget. Reads the existing schema file and produces a wired-up Widgets/{Name}/{Name}.jsx with all state hooks, exposed variables, CSAs, and event handlers. Leaves JSX layout as a manual TODO.
---

# ToolJet Widget UI Generator

## Overview

Companion to `create-widget`. Reads `widgets/{camelName}.js` and generates:
- `frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx` — wired stub
- `frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss` — empty stub
- Updates `Inspector/Components/{Name}/{Name}.jsx` sections[] if it exists (Type C only)

## When to Use

After `create-widget` has run successfully. Invoke with the PascalCase widget name:
```
/create-widget-ui MyWidget
```

## CRITICAL RULES

- NEVER modify schema files (`widgets/*.js`, `widget-config/*.js`)
- STOP if `Widgets/{Name}/` already exists — do not overwrite
- STOP if `widgets/{camelName}.js` not found — `create-widget` must run first
- camelName is derived from the PascalCase Name argument: first letter lowercased (e.g. `MyWidget` → `myWidget`, `DropdownV2` → `dropdownV2`)

## Phase 1 — READ SCHEMA

Announce: "Phase 1: Reading schema for {Name}..."

First, derive `camelName` from the ARGUMENTS: lowercase the first character of the PascalCase name.
Examples: `MyWidget` → `myWidget`, `PopoverMenu` → `popoverMenu`, `DropdownV2` → `dropdownV2`.

**Safety checks (run before spawning any agent):**

Check 1 — schema exists:
```bash
ls frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js
```
If not found: STOP. Print: "Schema not found at `widgets/{camelName}.js`. Run `create-widget` first."

Check 2 — UI directory does not exist yet:
```bash
ls frontend/src/AppBuilder/Widgets/{Name}/ 2>/dev/null
```
If directory exists: STOP. Print: "Widget UI already exists at `Widgets/{Name}/`. Delete it first if you want to regenerate."

**Spawn an Explore agent** with this prompt (substitute `{Name}` and `{camelName}` before dispatching):

---
Read the file `frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js` in full.

Extract and return ALL of the following as structured output:

**1. Events**
List all keys in the `events:` object.
Format: `[{ handle: 'onSelect', displayName: 'On select' }, ...]`

**2. Actions (CSAs)**
List all entries in the `actions:` array.
Format: `[{ handle: 'selectOption', displayName: 'Select option', params: [{ handle: 'select', displayName: 'Select' }] }, ...]`
For each action, mark whether it is standard (setDisable / setLoading / setVisibility) or extra.

**3. Exposed variables**
List all keys and default values from `exposedVariables:`.
Format: `{ searchText: '', label: 'Select', isLoading: false, ... }`
Note the JS type of each default value (string, boolean, number, array, null).

**4. Accordion groups**
List all unique `accordian:` values found in the `properties:` block **only** (ignore `styles:` — style accordion groups are rendered separately and not needed here).
For each group, list the property keys that belong to it.
Format: `{ 'Data': ['label', 'placeholder'], 'Options': ['advanced', 'schema', 'sort'] }`
Also list any properties with NO `accordian:` key separately.

**5. Additional actions properties**
List all property keys where `section: 'additionalActions'` is set.
Expected standard set: loadingState, visibility, disabledState, tooltip. Note any extras or missing ones.

**6. Inspector stub check**
Check whether this file exists:
`frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx`
Return: Inspector stub exists: true OR false.

Return all six sections clearly labeled. Do not summarize — list every item.
---

After the Explore agent returns, print a clean summary of the 6 sections. Then proceed to Phase 2.

## Phase 2 — GENERATE

Announce: "Phase 2: Generating UI stub for {Name}..."

Spawn a **general-purpose** agent with the prompt below. Before dispatching, substitute:
- `{Name}` → PascalCase name from ARGUMENTS
- `{camelName}` → camelCase derived in Phase 1
- Replace `{PHASE_1_DATA}` with the full Phase 1 extracted data (all 6 sections)

---
You are generating the UI stub files for a new ToolJet widget.

**Widget name:** {Name}
**camelName:** {camelName}

**Reference files to read first:**
- `.claude/skills/create-widget-ui/ui-stub-template.md` — template + token substitution rules
- `frontend/src/AppBuilder/Widgets/Button.jsx` — simple widget reference for state wiring pattern

**Extracted schema data (from Phase 1):**
{PHASE_1_DATA}

**Task A — Generate `{Name}/{Name}.jsx`**

Using the template in `ui-stub-template.md`:
1. Substitute all tokens with the Phase 1 data
2. `{exposedVarEntries}`: one line per exposed variable — skip isVisible, isLoading, isDisabled (they are in the state block)
3. `{extraCsaEntries}`: one block per CSA that is NOT setDisable/setLoading/setVisibility
4. `{eventHandlerEntries}`: one `const handle{PascalEventName}` per event
5. Run the 6-item self-consistency checklist from `ui-stub-template.md` before writing
6. Write the complete file to: `frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx`

**Task B — Generate `{Name}/{Name}.scss`**

Write this content to `frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss`:
```
.{camelName}-widget {
  // TODO: styles for {Name} widget
}
```

**Task C — Update Inspector stub** *(only if Phase 1 reported "Inspector stub exists: true")*

Read the existing file:
`frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx`

**Guard — check before modifying:**
Scan the existing `sections[]` array (or accordion `items` array) in that file.

- If the file contains **only a single generic `'Properties'` section** (i.e. the `create-widget` stub with no custom sections) → proceed to replace it.
- If the file already has **named sections** (e.g. `title: 'Menu'`, `title: 'Options'`) OR any section with a **`custom:` render function** → the Inspector has been hand-authored. **DO NOT modify the file.** Instead output this TODO:

  ```
  ⚠️  Inspector/Components/{Name}/{Name}.jsx already has custom sections.
      Task C skipped — update sections[] manually.
  ```

**When proceeding (plain stub only):**
Replace the generic `'Properties'` section with one section per accordion group from Phase 1 data:
```js
{
  title: '{AccordionGroupName}',
  type: 'properties',
  properties: ['{key1}', '{key2}'],
},
```
- Only include keys from the `properties:` block of the schema (not `styles:`)
- Properties with no `accordian:` key → place in a catch-all `'Properties'` section
- Leave Events, Additional Actions, and Devices sections unchanged
- Never replace a `custom:` section with a `type: 'properties'` section

After all tasks, report every file written or modified.
---

After the agent completes, verify:
```bash
ls frontend/src/AppBuilder/Widgets/{Name}/
grep "setExposedVariables" frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx
grep "fireEvent" frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx
```
Expected: directory lists `{Name}.jsx` and `{Name}.scss`; both greps return at least one match.

## Summary

Print this on completion (substitute variables):

```
✅ create-widget-ui complete

Files created:
  frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx
  frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss
  [if Type C] Inspector/Components/{Name}/{Name}.jsx — sections[] updated

📋 Manual TODOs:
  [ ] Implement widget JSX in {Name}.jsx (search for "TODO: implement")
  [ ] Add styles in {Name}.scss
  [ ] Register component — add an import to frontend/src/AppBuilder/_helpers/editorHelpers.js:
      import { {Name} } from '@/AppBuilder/Widgets/{Name}/{Name}';
  [ ] Commit: git add -A && git commit -m "feat: add {Name} widget UI stub"
```

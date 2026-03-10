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
List all unique `accordian:` values found in the `properties:` block.
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

(to be filled in)

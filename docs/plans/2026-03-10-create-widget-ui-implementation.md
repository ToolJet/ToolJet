# `create-widget-ui` Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the `tooljet:create-widget-ui` Claude skill that reads an existing widget schema and generates a wired-up React UI stub with all boilerplate (state, exposed variables, CSAs, event handlers).

**Architecture:** Single skill SKILL.md at `.claude/skills/create-widget-ui/` plus a `ui-stub-template.md` reference file. The skill runs two phases: an Explore agent parses the schema, then a general-purpose agent writes the output files. No code compilation or tests required — this is a prompt/markdown artifact.

**Tech Stack:** Claude skill system (markdown), ToolJet widget conventions (React, useState/useEffect, setExposedVariables pattern)

---

### Task 1: Create skill directory and stub SKILL.md

**Files:**
- Create: `.claude/skills/create-widget-ui/SKILL.md`

**Step 1:** Create the directory and stub file with frontmatter + empty phase stubs.

```markdown
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
- camelName is derived from the PascalCase Name argument: first letter lowercased (e.g. `MyWidget` → `myWidget`)

## Phase 1 — READ SCHEMA

## Phase 2 — GENERATE
```

**Step 2:** Verify file created:
```bash
ls .claude/skills/create-widget-ui/
```
Expected: `SKILL.md`

**Step 3:** Commit:
```bash
git add .claude/skills/create-widget-ui/
git commit -m "feat(create-widget-ui): scaffold skill directory and stub"
```

---

### Task 2: Create `ui-stub-template.md`

**Files:**
- Create: `.claude/skills/create-widget-ui/ui-stub-template.md`

**Step 1:** Write the template file. This is the reference the Phase 2 agent uses to generate the JSX stub. Use exact placeholder tokens `{Name}`, `{camelName}`, `{exposedVarEntries}`, `{extraCsaEntries}`, `{eventHandlerEntries}` that the agent substitutes.

```markdown
# Widget UI Stub Template

Use this template to generate `frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx`.

Substitute all `{placeholder}` tokens before writing the file.

## Token Reference

| Token | Value |
|---|---|
| `{Name}` | PascalCase widget name (e.g. `MyWidget`) |
| `{camelName}` | camelCase file name (e.g. `myWidget`) |
| `{exposedVarEntries}` | One line per exposed variable: `varName: defaultValue,` |
| `{extraCsaEntries}` | One block per non-standard CSA (all except setDisable/setLoading/setVisibility) |
| `{eventHandlerEntries}` | One const per event: `const handle{EventName} = () => fireEvent('{eventName}');` |

## Exposed Variable Entries

For each key in `exposedVariables` in the schema:
- String default: `varName: '',`
- Number default: `varName: 0,`
- Boolean default: `varName: false,`
- Array default: `varName: [],`
- null default: `varName: null,`

Do NOT include isVisible, isLoading, isDisabled here — they are handled by the standard state block below.

## Extra CSA Entries

For each action in `actions[]` that is NOT `setDisable`, `setLoading`, or `setVisibility`:

```js
{handle}: async ({paramHandles}) => {
  // TODO: implement {displayName}
  setExposedVariable('{handle}', {paramHandles});
},
```

If the action has no params, use:
```js
{handle}: async () => {
  // TODO: implement {displayName}
},
```

## Event Handler Entries

For each key in `events` in the schema:
```js
const handle{PascalEventName} = () => fireEvent('{eventHandle}');
```

Example: event key `onSelect` → `const handleOnSelect = () => fireEvent('onSelect');`

## Full JSX Template

```jsx
import React, { useState, useEffect } from 'react';
import Loader from '@/_ui/Loader';

export const {Name} = ({
  height,
  width,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
  id,
}) => {
  const { loadingState, visibility, disabledState } = properties;

  const [isVisible, setIsVisible] = useState(visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  // Expose variables and CSA methods on mount
  useEffect(() => {
    setExposedVariables({
      // exposed variables
      {exposedVarEntries}
      // standard CSA methods
      setVisibility: async (value) => { setIsVisible(value); setExposedVariable('isVisible', value); },
      setLoading:    async (value) => { setIsLoading(value);  setExposedVariable('isLoading', value); },
      setDisable:    async (value) => { setIsDisabled(value); setExposedVariable('isDisabled', value); },
      // extra CSA methods
      {extraCsaEntries}
    });
  }, []);

  // Sync props → state + exposed variables
  useEffect(() => { setIsLoading(loadingState);   setExposedVariable('isLoading', loadingState);   }, [loadingState]);
  useEffect(() => { setIsVisible(visibility);     setExposedVariable('isVisible', visibility);     }, [visibility]);
  useEffect(() => { setIsDisabled(disabledState); setExposedVariable('isDisabled', disabledState); }, [disabledState]);

  // Event handlers
  {eventHandlerEntries}

  if (!isVisible) return null;

  return (
    <div
      className="{camelName}-widget"
      style={{ height, width }}
      data-cy={dataCy}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div
          style={{
            opacity: isDisabled ? 0.5 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
            height: '100%',
          }}
        >
          {/* TODO: implement {Name} widget UI */}
        </div>
      )}
    </div>
  );
};
```

## SCSS Stub

Create `frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss`:

```scss
.{camelName}-widget {
  // TODO: styles for {Name} widget
}
```
```

**Step 2:** Commit:
```bash
git add .claude/skills/create-widget-ui/ui-stub-template.md
git commit -m "feat(create-widget-ui): add ui-stub-template.md"
```

---

### Task 3: Write Phase 1 — READ SCHEMA in SKILL.md

**Files:**
- Modify: `.claude/skills/create-widget-ui/SKILL.md` (Phase 1 stub → full content)

**Step 1:** Replace the `## Phase 1 — READ SCHEMA` stub with:

```markdown
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

**Spawn an Explore agent** with this prompt:

---
Read the file `frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js` in full.

Extract and return ALL of the following as structured output:

**1. Events**
List all keys in the `events:` object.
Format: `[{ handle: 'onSelect', displayName: 'On select' }, ...]`

**2. Actions (CSAs)**
List all entries in the `actions:` array.
Format: `[{ handle: 'selectOption', displayName: 'Select option', params: [{ handle: 'select', displayName: 'Select' }] }, ...]`
Mark which are standard (setDisable / setLoading / setVisibility) vs extra.

**3. Exposed variables**
List all keys and default values in `exposedVariables:`.
Format: `{ searchText: '', label: 'Select', isLoading: false, ... }`
Note the JS type of each default value (string, boolean, number, array, null).

**4. Accordion groups**
List all unique `accordian:` values found in the `properties:` block.
For each group, list the property keys that belong to it.
Format: `{ 'Data': ['label', 'placeholder'], 'Options': ['advanced', 'schema', 'sort'] }`
Also list any properties with NO `accordian:` key.

**5. Additional actions properties**
List all property keys where `section: 'additionalActions'`.
Expected: loadingState, visibility, disabledState, tooltip (confirm all four present).

**6. Inspector stub check**
Check if this file exists: `frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx`
Return: exists (true/false).

Return ALL six sections clearly labeled.
---

After the Explore agent returns, print a clean summary of the 6 sections to confirm extraction before proceeding to Phase 2.
```

**Step 2:** Verify SKILL.md looks correct — Phase 1 section is filled in, no empty stub remains.

**Step 3:** Commit:
```bash
git add .claude/skills/create-widget-ui/SKILL.md
git commit -m "feat(create-widget-ui): write Phase 1 READ SCHEMA"
```

---

### Task 4: Write Phase 2 — GENERATE in SKILL.md

**Files:**
- Modify: `.claude/skills/create-widget-ui/SKILL.md` (Phase 2 stub → full content)

**Step 1:** Replace the `## Phase 2 — GENERATE` stub with:

```markdown
## Phase 2 — GENERATE

Announce: "Phase 2: Generating UI stub for {Name}..."

Spawn a **general-purpose** agent with this prompt. Before dispatching, substitute all variables:
- `{Name}` → PascalCase name
- `{camelName}` → camelCase name
- Paste the full Phase 1 extracted data inline

---
You are generating the UI stub files for a new ToolJet widget.

**Widget name:** {Name}
**camelName:** {camelName}

**Reference files to read first:**
- `.claude/skills/create-widget-ui/ui-stub-template.md` — the template + token substitution rules
- `frontend/src/AppBuilder/Widgets/Button.jsx` — simple widget reference (state wiring pattern)

**Extracted schema data from Phase 1:**
{paste Phase 1 output here}

**Tasks:**

**Task A — Generate `{Name}/{Name}.jsx`**

Using the template in `ui-stub-template.md`:
1. Substitute all tokens with the extracted data above
2. `{exposedVarEntries}` → one line per exposed variable (skip isVisible, isLoading, isDisabled — those are in the state block)
3. `{extraCsaEntries}` → one block per CSA that is NOT setDisable/setLoading/setVisibility
4. `{eventHandlerEntries}` → one `const handle{PascalEventName}` per event
5. Write the complete file to: `frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx`

**Task B — Generate `{Name}/{Name}.scss`**

Write:
```scss
.{camelName}-widget {
  // TODO: styles for {Name} widget
}
```
to: `frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss`

**Task C — Update Inspector stub (ONLY if Phase 1 reported Inspector stub exists = true)**

Read the existing `frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx`.

Replace the generic `'Properties'` section in `sections[]` with one section per accordion group from Phase 1 data:

```js
{
  title: '{AccordionGroupName}',  // e.g. 'Data', 'Options'
  type: 'properties',
  properties: ['{key1}', '{key2}'],  // keys belonging to this group
},
```

Properties with no `accordian:` key (if any) go into a catch-all `'Properties'` section.
Leave the Events, Additional Actions, and Devices sections unchanged.

After all tasks, report: list every file written or modified.
---

After the agent completes, verify:
```bash
ls frontend/src/AppBuilder/Widgets/{Name}/
```
Expected: `{Name}.jsx` and `{Name}.scss` present.

Also verify the JSX contains the expected wiring:
```bash
grep "setExposedVariables" frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx
grep "fireEvent" frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx
```
Both should return at least one match.

## Summary

Announce completion:
```
✅ create-widget-ui complete

Files created:
  frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx
  frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss
  [if Type C] Inspector/Components/{Name}/{Name}.jsx — sections[] updated

📋 Manual TODOs:
  [ ] Implement widget JSX in {Name}.jsx (search for "TODO: implement")
  [ ] Add styles in {Name}.scss
  [ ] Register component export in frontend/src/AppBuilder/Widgets/index.js
      Add: export { {Name} } from './{Name}/{Name}';
  [ ] Commit: git add -A && git commit -m "feat: add {Name} widget UI stub"
```
```

**Step 2:** Commit:
```bash
git add .claude/skills/create-widget-ui/SKILL.md
git commit -m "feat(create-widget-ui): write Phase 2 GENERATE + summary"
```

---

### Task 5: Validate against PopoverMenu (Type C, complex widget)

No file writes — dry-run validation only.

**Step 1:** Read the actual PopoverMenu schema:
```bash
head -50 frontend/src/AppBuilder/WidgetManager/widgets/popoverMenu.js
```

**Step 2:** Mentally walk through Phase 1 extraction. Verify:
- Events list: `onSelect`, `onTrigger`
- CSAs: `open`, `close`, `setVisibility`, `setLoading`, `setDisable`
- Exposed vars: `label`, `options`, `lastClickedOption`, `isDisabled`, `isVisible`, `isLoading`
- Accordion groups from properties: check what `accordian:` values appear
- Inspector stub: `Inspector/Components/PopoverMenu/PopoverMenu.jsx` exists → true

**Step 3:** Check the generated stub would have correct wiring. Specifically:
- `setExposedVariables` call includes `label`, `options`, `lastClickedOption` (not isDisabled/isVisible/isLoading — those are in state block)
- Extra CSAs: `open` and `close` (not setVisibility/setLoading/setDisable)
- Event handlers: `handleOnSelect`, `handleOnTrigger`

**Step 4:** Note any gaps. If gaps found, fix SKILL.md or template before proceeding.

**Step 5:** Commit fix if any:
```bash
git add .claude/skills/create-widget-ui/
git commit -m "fix(create-widget-ui): validation fixes from PopoverMenu dry-run"
```
If no gaps: no commit needed.

---

### Task 6: Check `Widgets/index.js` — add export note

**Files:**
- Read: `frontend/src/AppBuilder/Widgets/index.js`

**Step 1:** Read `frontend/src/AppBuilder/Widgets/index.js` to understand the export pattern.

**Step 2:** The Summary section in Phase 2 already tells the engineer to add an export. Verify the export format matches what `index.js` actually uses (named export vs default export, path format).

**Step 3:** Update the TODO in Phase 2 Summary if the export format needs correction. For example, if `index.js` uses `export * from` syntax vs `export { Name } from`:

```bash
head -30 frontend/src/AppBuilder/Widgets/index.js
```

Fix SKILL.md if needed. Commit:
```bash
git add .claude/skills/create-widget-ui/SKILL.md
git commit -m "fix(create-widget-ui): correct Widgets/index.js export format in TODO"
```

---

### Task 7: Copy to user-level skills and final commit

**Files:**
- Copy: `.claude/skills/create-widget-ui/` → `~/.claude/skills/create-widget-ui/`

**Step 1:** Copy all skill files to the user-level directory so `/create-widget-ui` works as a slash command:
```bash
cp -r /Users/nithin/Code/ToolJet/.claude/skills/create-widget-ui ~/.claude/skills/create-widget-ui
```

**Step 2:** Verify:
```bash
ls ~/.claude/skills/create-widget-ui/
```
Expected: `SKILL.md`, `ui-stub-template.md`

**Step 3:** Final commit of all skill files:
```bash
git add .claude/skills/create-widget-ui/
git commit -m "feat: add tooljet:create-widget-ui skill

Generates wired-up UI stub for new widgets from existing schema file.
Reads widgets/{camelName}.js, produces Widgets/{Name}/{Name}.jsx with
all state hooks, exposed variables, CSAs, event handlers wired up.
Also generates .scss stub and updates Inspector sections[] for Type C.
"
```

**Step 4:** Run `/reload-plugins` in Claude Code to activate the skill.

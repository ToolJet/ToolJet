# `tooljet:create-widget` Skill — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a Claude skill that takes a widget PRD and generates all schema files + performs all ~14 registration edits, leaving only the UI component as a manual TODO.

**Architecture:** A single `SKILL.md` file at `.claude/skills/create-widget/SKILL.md`. The skill orchestrates 6 phases using an Explore agent (Phase 1), interactive main-thread Q&A (Phase 2), a general-purpose agent (Phase 3 — schema generation), and a general-purpose agent (Phase 4+5 — registration + migration). No code is written except the skill markdown and its supporting reference files.

**Tech Stack:** Claude skill system (markdown), Explore agent, general-purpose agent, Bash tool for file edits. Reference: `docs/widget-schema-field-types.md`, `docs/plans/2026-03-09-create-widget-skill-design.md`.

---

## Pre-flight Check

Before starting: make sure you've read the design doc:
`docs/plans/2026-03-09-create-widget-skill-design.md`

And the field types reference:
`docs/widget-schema-field-types.md`

These are the source of truth for all schema patterns embedded in the skill.

---

### Task 1: Create skill directory and stub

**Files:**
- Create: `.claude/skills/create-widget/SKILL.md`
- Create: `.claude/skills/create-widget/schema-template.md`
- Create: `.claude/skills/create-widget/registration-checklist.md`

**Step 1: Create the skill directory**
```bash
mkdir -p /Users/nithin/Code/ToolJet/.claude/skills/create-widget
```

**Step 2: Create the SKILL.md stub**

Create `.claude/skills/create-widget/SKILL.md` with this exact frontmatter and empty sections:

```markdown
---
name: create-widget
description: Use when creating a new ToolJet widget from a PRD. Generates both schema config files (frontend + server), performs all registration edits (~14 files), and adds the widget to the import/export service. Leaves UI component and custom Inspector as manual TODOs.
---

# ToolJet Widget Creator

## Overview
## When to Use
## ARGUMENTS (PRD text)
## Phase 1 — PARSE
## Phase 2 — CLARIFY
## Phase 3 — GENERATE SCHEMAS
## Phase 4 — REGISTER
## Phase 5 — MIGRATIONS
## Phase 6 — SUMMARY
```

**Step 3: Verify directory**
```bash
ls .claude/skills/create-widget/
```
Expected: `SKILL.md`

---

### Task 2: Write the SKILL header, overview, and when-to-use sections

**Files:**
- Modify: `.claude/skills/create-widget/SKILL.md`

**Step 1: Write Overview + When to Use**

Replace the stub `## Overview` and `## When to Use` sections with:

```markdown
## Overview

This skill creates a complete new ToolJet widget from a PRD. It runs in 6 phases:

1. **PARSE** — Explore agent reads PRD + reference widget schemas
2. **CLARIFY** — Interactive Q&A for ambiguities (one question at a time)
3. **GENERATE** — Writes both schema files (frontend + server)
4. **REGISTER** — Edits ~11 registration files mechanically
5. **MIGRATIONS** — Adds widget to import/export service
6. **SUMMARY** — Lists what was done + manual TODOs

**DO NOT** generate the UI component (`Widgets/{Name}/`) or custom Inspector
(`Inspector/Components/{Name}/`). Those are out of scope — flag as manual TODOs.

## When to Use

When an engineer has a widget PRD and wants to scaffold the schema + registration.
PRD must include at minimum: widget name, properties list, events, exposed variables, CSAs.

## CRITICAL RULES

- NEVER write any file before Phase 2 is complete and engineer approves the schema summary table
- ALWAYS check for widget name conflict in `widgets/index.js` before writing anything
- ALWAYS instruct engineer to commit/branch before Phase 4 starts
- Phases 4+5 touch ~12 files — if interrupted, engineer must `git checkout .` to reset
- The frontend and server schema files MUST be identical
- NEVER assume style sections — always derive from PRD or ask in Phase 2 Q4
```

**Step 2: Verify it reads cleanly**
```bash
head -60 .claude/skills/create-widget/SKILL.md
```

---

### Task 3: Write Phase 1 — PARSE (Explore agent prompt)

**Files:**
- Modify: `.claude/skills/create-widget/SKILL.md`

**Step 1: Write the Phase 1 section**

The Phase 1 section tells Claude to spawn an Explore agent with a specific prompt. Add to SKILL.md:

```markdown
## Phase 1 — PARSE

Announce: "Phase 1: Parsing PRD with Explore agent..."

Spawn an **Explore** subagent with this prompt (fill in `{PRD_TEXT}` with the arguments):

> You are analyzing a ToolJet widget PRD to extract a normalized schema definition.
>
> **PRD:**
> {PRD_TEXT}
>
> **Your task — read these files for context, then extract the schema:**
>
> Reference files to read:
> - `docs/widget-schema-field-types.md` — canonical field type reference
> - `frontend/src/AppBuilder/WidgetManager/widgets/popoverMenu.js` — button-type schema example
> - `frontend/src/AppBuilder/WidgetManager/widgets/dropdownV2.js` — form-input schema example
>
> **Extract and return as structured output:**
>
> 1. **Widget identity:** name (PascalCase), displayName, description, component (same as name), suggested defaultSize (width, height in grid units — height in px, each cell=10px)
>
> 2. **Properties table** — one row per property:
>    | key | displayName | type | section/accordian | defaultValue | conditionallyRender | isFxNotRequired |
>    Include ALL standard additionalActions fields: loadingState, visibility, disabledState, tooltip
>    PRD type → schema type mapping:
>    - "FX" or text field → `code`
>    - "Toggle" or boolean → `toggle`
>    - "Switch" / segmented → `switch` (list options)
>    - "Dropdown" / select → `select` (list options)
>    - "Number input" → `numberInput`
>    - "Boolean" non-FX → `toggle` with `isFxNotRequired: true`
>
> 3. **Validation table** (if PRD has a Validation section) — same format as properties
>    Note any validation fields that conditionally render based on a PROPERTY key
>    (these need `parentObjectKey: 'properties'` in their `conditionallyRender`)
>
> 4. **Events list:** `[{ handle: 'onXxx', displayName: 'On Xxx' }]`
>
> 5. **Exposed variables:** `{ varName: defaultValue }` object
>
> 6. **Actions (CSAs):** `[{ handle, displayName, params? }]`
>    Always include: setDisable, setLoading, setVisibility
>
> 7. **Styles list:** List ONLY what the PRD explicitly mentions. If PRD says "as per designs" or is vague, return empty list and flag as "needs clarification".
>
> 8. **Suggested sectionConfig group:** buttons / data / layouts / textInputs / numberInputs / selectInputs / dateTimeInputs / navigation / media / presentation / custom / miscellaneous
>
> 9. **Inspector complexity:** Simple (DefaultComponent/fall-through) or Complex (likely needs custom Inspector with special UI)?
>
> 10. **Ambiguities list:** Anything unclear, missing, or needing engineer decision
>
> Check `frontend/src/AppBuilder/WidgetManager/widgets/index.js` to verify the widget name does NOT already exist. If it does, flag as CONFLICT and halt.

After Explore agent returns, present its output to the engineer in a clean formatted summary.
If CONFLICT detected, stop and tell engineer: "Widget '{Name}' already exists. Choose a different name."
```

---

### Task 4: Write Phase 2 — CLARIFY (interactive Q&A)

**Files:**
- Modify: `.claude/skills/create-widget/SKILL.md`

**Step 1: Write the Phase 2 section**

This is the most critical phase — ask exactly one question at a time, wait for answer before next.

```markdown
## Phase 2 — CLARIFY

Ask these questions ONE AT A TIME. Wait for engineer's answer before proceeding to next.
After all questions, present the final schema summary table and wait for explicit approval.

---

**Q1 — Field list confirmation**

Present the properties table from Phase 1. Ask:
> "Here's the extracted field list. Please confirm, correct, or add anything:
> [table]
> Any changes?"

Incorporate corrections before Q2.

---

**Q2 — Inspector type**

Ask:
> "Does this widget need a fully custom Inspector panel with non-standard UI
> (e.g. drag-and-drop option list, custom option editors, complex interactions)?
>
> A) No — use DefaultComponent (standard accordion, no custom code needed)
> B) No — reuse existing Inspector (fall-through): which widget? e.g. FilePicker
> C) Yes — needs custom Inspector (will be flagged as manual TODO)"

Store answer as `INSPECTOR_TYPE = A | B | C`.
If B, store `INSPECTOR_FALLTHROUGH = '{ExistingWidget}'`.

---

**Q3 — Component library section**

Ask:
> "Which section of the component library should this widget appear in?
> buttons / data / layouts / textInputs / numberInputs / selectInputs /
> dateTimeInputs / navigation / media / presentation / custom / miscellaneous"

Store as `SECTION_GROUP`.

---

**Q4 — Style properties**

If PRD explicitly listed style fields, show them and ask for confirmation.
If PRD was vague, show this checklist and ask which apply:

> "Which style sections does this widget need? Check all that apply:
>
> **label section** (for widgets with a text label above/beside them)
>   labelColor, alignment (Side/Top), direction (left/right icon), auto width, labelWidth slider, widthType
>
> **field section** (the main interactive area)
>   icon picker, iconColor, backgroundColor, borderColor, accentColor,
>   textColor, errTextColor, borderRadius, boxShadow
>
> **container section**
>   padding (Default / None switch)
>
> **custom** — list any additional style properties from the PRD"

Store confirmed style fields as `STYLE_FIELDS`.

---

**Q5 — Restricted parents** *(only ask if widget is container-like or complex)*

If Inspector complexity from Phase 1 flagged as Complex, or widget is a container, ask:
> "Should this widget be blocked from being dropped inside any parent containers?
> (Default: no restrictions needed for leaf widgets.)
> If yes, which parents should block it? e.g. Form, Listview, Kanban_card"

Store as `RESTRICTED_PARENTS = []` or list.

---

**Q6 — Cross-section conditionals review**

Present the detected `conditionallyRender` relationships:
> "Here are the conditional field relationships I detected:
> [list each: 'Field X shows when Field Y = value Z (cross-section: yes/no)']
> Any missed or incorrect?"

Incorporate corrections.

---

**→ APPROVAL GATE**

Present the complete schema summary table:

| Section | Key | DisplayName | Type | Default | Conditional |
|---|---|---|---|---|---|
| properties | ... | ... | ... | ... | ... |
| validation | ... | ... | ... | ... | ... |
| styles | ... | ... | ... | ... | ... |
| events | ... | ... | — | — | — |
| exposedVars | ... | ... | — | default | — |
| actions (CSAs) | ... | ... | — | — | — |

Ask: **"Does this schema look correct? Reply 'yes' to proceed with file generation, or describe any changes."**

DO NOT proceed to Phase 3 until engineer replies 'yes' (or equivalent confirmation).
```

---

### Task 5: Write Phase 3 — GENERATE SCHEMAS

**Files:**
- Modify: `.claude/skills/create-widget/SKILL.md`
- Create: `.claude/skills/create-widget/schema-template.md`

**Step 1: Write the schema template file**

Create `.claude/skills/create-widget/schema-template.md` containing the full JS schema template with placeholder comments. This is what the generation agent fills in:

```markdown
# Widget Schema Template

The generation agent must produce this exact structure for both files.
Replace all `{PLACEHOLDER}` markers with values from Phase 2 output.

\`\`\`js
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
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  // validation: { ... }  ← include only if widget has a Validation section
  properties: {
    // {accordian_group_1} fields first, then additionalActions fields last
    // Standard additionalActions — ALWAYS include these 4:
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
    // { eventHandle: { displayName: 'On Event' } }
  },
  styles: {
    // All color fields use colorSwatches + var(--cc-*) tokens
    // See docs/widget-schema-field-types.md for full reference
  },
  exposedVariables: {
    isVisible: true,
    isDisabled: false,
    isLoading: false,
    // ... additional vars from PRD
  },
  actions: [
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
    // ... additional CSAs from PRD
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      // Every key in properties MUST have a matching entry here
      // Booleans: '{{true}}' / '{{false}}'
      // Strings: 'plain value'
      // Numbers (for numberInput): '6'
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      // Every key in styles MUST have a matching entry here
      // Also add: iconVisibility: { value: false } if icon field exists
    },
    // validation: { ... } ← include only if validation section exists
  },
};
\`\`\`

## Self-Consistency Rules (verify before writing)

1. Every `properties` key → matching `definition.properties` entry
2. Every `styles` key → matching `definition.styles` entry
3. Every `validation` key → matching `definition.validation` entry
4. Every `conditionallyRender.key` → references a real key in the named section
5. All booleans in definition wrapped in `{{}}`
6. All colors use `var(--cc-*)` tokens (never raw hex except `#FFFFFF`)
7. `iconVisibility` added to `definition.styles` whenever `icon` field exists in styles
```

**Step 2: Write the Phase 3 section in SKILL.md**

```markdown
## Phase 3 — GENERATE SCHEMAS

Announce: "Phase 3: Generating schema files..."

Spawn a **general-purpose** agent with this prompt:

> Using the approved schema from Phase 2, generate both widget schema files.
> Reference template: `.claude/skills/create-widget/schema-template.md`
> Reference field types: `docs/widget-schema-field-types.md`
>
> **Widget data:**
> {paste complete Phase 2 approved schema summary}
>
> **Tasks:**
> 1. Generate the complete JS schema object
> 2. Run self-consistency checks (all definition keys match schema keys, etc.)
> 3. Write IDENTICAL content to both:
>    - `frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js`
>    - `server/src/modules/apps/services/widget-config/{camelName}.js`
> 4. Confirm both files are byte-identical with: `diff frontend/src/.../widgets/{name}.js server/src/.../widget-config/{name}.js`
>
> If diff shows any difference, fix until identical.

After agent completes, verify:
```bash
diff frontend/src/AppBuilder/WidgetManager/widgets/{name}.js \
     server/src/modules/apps/services/widget-config/{name}.js
```
Expected: no output (identical).
```

---

### Task 6: Write Phase 4 — REGISTER

**Files:**
- Modify: `.claude/skills/create-widget/SKILL.md`
- Create: `.claude/skills/create-widget/registration-checklist.md`

**Step 1: Write the registration reference file**

Create `.claude/skills/create-widget/registration-checklist.md`:

```markdown
# Widget Registration Checklist

All file paths and exact change patterns for registering a new widget.
Variables: {Name} = PascalCase, {camelName} = camelCase, {displayName} = display name

## 1. frontend/src/AppBuilder/WidgetManager/widgets/index.js
Add near other exports (alphabetically by camelName):
\`\`\`js
import { {camelName}Config } from './{camelName}';
// ... in export block:
{camelName}Config,
\`\`\`

## 2. server/src/modules/apps/services/widget-config/index.js
Add import + add to widgets object:
\`\`\`js
import { {camelName}Config } from './{camelName}';
// ... in widgets object:
{camelName}Config,
\`\`\`

## 3. frontend/src/AppBuilder/WidgetManager/configs/widgetConfig.js
Add import at top, then insert config into the correct comment group:
\`\`\`js
import { {camelName}Config } from '../widgets';
// ... in widgets array, inside the correct // {Category} comment group:
{camelName}Config,
\`\`\`

## 4. frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx
Add to NEW_REVAMPED_COMPONENTS array:
\`\`\`js
'{Name}',
\`\`\`
Add GetAccordion case (choose A, B, or C based on INSPECTOR_TYPE):
- A (DefaultComponent): no case needed — falls to default
- B (fall-through): `case '{Name}':` above existing case `case '{FallThroughWidget}':`
- C (custom): `case '{Name}': return <{Name} {...restProps} />;` + add import at top

## 5. frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx
Add to SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY array:
\`\`\`js
'{Name}',
\`\`\`

## 6. frontend/src/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent.jsx
Add to SHOW_ADDITIONAL_ACTIONS array:
\`\`\`js
'{Name}',
\`\`\`
If INSPECTOR_TYPE = A (DefaultComponent), also add to PROPERTIES_VS_ACCORDION_TITLE:
\`\`\`js
{Name}: '{Primary Accordion Title}',
\`\`\`

## 7. frontend/src/AppBuilder/RightSideBar/Inspector/Utils.js
Add '{Name}' to the widget list in renderCustomStyles() (the long || chain).
Add '{Name}' to the widget list in renderElement() (separate || chain, smaller list).

## 8. frontend/src/AppBuilder/RightSideBar/ComponentManagerTab/sectionConfig.js
Add '{Name}' to the correct section's valueSet:
\`\`\`js
{sectionGroup}: {
  valueSet: new Set([..., '{Name}']),
},
\`\`\`

## 9. frontend/assets/images/icons/widgets/index.jsx
Add export:
\`\`\`js
export { ReactComponent as {Name}Icon } from './{camelName}.jsx';
// (or match the existing export pattern in this file)
\`\`\`

## 10. frontend/assets/images/icons/widgets/{camelName}.jsx
Create stub icon file (replace with real SVG later):
\`\`\`jsx
import React from 'react';
const {Name}Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
  </svg>
);
export default {Name}Icon;
\`\`\`

## 11. frontend/src/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig.js
(ONLY if widget is container-like and RESTRICTED_PARENTS is non-empty)
For each parent in RESTRICTED_PARENTS, append '{Name}' to its array:
\`\`\`js
{ParentName}: [...existing, '{Name}'],
\`\`\`

## 12. server/src/modules/apps/services/app-import-export.service.ts
Add '{Name}' to NewRevampedComponents array (around line 120-165):
\`\`\`ts
'{Name}',
\`\`\`
```

**Step 2: Write the Phase 4 section in SKILL.md**

```markdown
## Phase 4 — REGISTER

Announce: "Phase 4: Registering widget in all required files..."
Tell engineer: "⚠️ About to edit ~12 files. Make sure you have a clean git state (commit or stash any WIP) before proceeding."

Wait for engineer confirmation, then spawn a **general-purpose** agent:

> Register the new widget '{Name}' across all required files.
> Reference guide: `.claude/skills/create-widget/registration-checklist.md`
>
> Widget details:
> - Name (PascalCase): {Name}
> - camelCase: {camelName}
> - INSPECTOR_TYPE: {A|B|C}
> - INSPECTOR_FALLTHROUGH: {ExistingWidget} (if B)
> - SECTION_GROUP: {group}
> - Primary accordion title (for PROPERTIES_VS_ACCORDION_TITLE): {title}
> - RESTRICTED_PARENTS: {list or empty}
>
> Execute ALL steps in the checklist in ORDER (1 → 11).
> After completing all steps, run:
> ```bash
> grep -r '{Name}' frontend/src/AppBuilder/WidgetManager/widgets/index.js
> grep -r '{Name}' frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx
> grep -r '{Name}' server/src/modules/apps/services/widget-config/index.js
> ```
> All three should return matches. Report any that don't.
```

## Phase 5 — MIGRATIONS

The same agent from Phase 4 (or a new one) adds the widget to the import/export service.

> Add '{Name}' to the `NewRevampedComponents` array in:
> `server/src/modules/apps/services/app-import-export.service.ts`
>
> Find the array (search for `NewRevampedComponents`), add '{Name}' to the list.
> Verify with:
> ```bash
> grep '{Name}' server/src/modules/apps/services/app-import-export.service.ts
> ```
> Expected: one match in the NewRevampedComponents array.
```

---

### Task 7: Write Phase 6 — SUMMARY

**Files:**
- Modify: `.claude/skills/create-widget/SKILL.md`

**Step 1: Write the Phase 6 section**

```markdown
## Phase 6 — SUMMARY

Print a final report:

---
✅ **Widget '{Name}' scaffolded successfully.**

**Files created:**
- `frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js`
- `server/src/modules/apps/services/widget-config/{camelName}.js`
- `frontend/assets/images/icons/widgets/{camelName}.jsx` (stub — replace with real icon)

**Files edited:**
- `frontend/.../widgets/index.js`
- `server/.../widget-config/index.js`
- `frontend/.../configs/widgetConfig.js`
- `frontend/.../Inspector/Inspector.jsx`
- `frontend/.../AppCanvas/RenderWidget.jsx`
- `frontend/.../Inspector/Components/DefaultComponent.jsx`
- `frontend/.../Inspector/Utils.js`
- `frontend/.../ComponentManagerTab/sectionConfig.js`
- `frontend/assets/images/icons/widgets/index.jsx`
- `server/.../app-import-export.service.ts`
{if restricted: `- frontend/.../WidgetManager/configs/restrictedWidgetsConfig.js`}

📋 **Manual TODOs (in order):**
  [ ] 1. Create UI widget component:
         `frontend/src/AppBuilder/Widgets/{Name}/`
         Minimum: `{Name}.jsx` + `index.js` + styles file
{if custom inspector:
  [ ] 2. Create custom Inspector component:
         `frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/`
         Follow PopoverMenu pattern: sections[] config, createRenderElement helper
}
  [ ] {N}. Replace stub icon SVG:
         `frontend/assets/images/icons/widgets/{camelName}.jsx`

  [ ] {N+1}. Test widget in app builder:
         - Drag widget onto canvas
         - Open inspector — verify all properties render
         - Check styles tab
         - Test events fire
         - Test CSAs work
         - Export + reimport app — verify widget survives round-trip

  [ ] {N+2}. Commit all changes:
         `git add -p` (review each file) then commit

---
```

---

### Task 8: Validate skill with the FileInput PRD (dry-run)

This is the "test" — paste the FileInput PRD (from `docs/plans/2026-03-09-create-widget-skill-design.md`) and run the skill against it mentally, verifying it would produce the correct output.

**Step 1: Invoke skill in a new conversation**

Open a fresh Claude Code session in the ToolJet project directory and run:
```
/create-widget
```
Then paste the FileInput PRD text.

**Step 2: Verify Phase 1 output matches known implementation**

Check that the Explore agent extracts:
- `name: 'FileInput'`, `component: 'FileInput'`
- `enableMultiple` → type: `toggle`, accordian: `Data`
- `parseFileType` → type: `select`, conditionallyRender on `parseContent: true`
- `minFileCount` / `maxFileCount` in validation with `parentObjectKey: 'properties'` (cross-section)
- Events: `onFileSelected`, `onFileLoaded`
- Inspector complexity: **Simple** (falls through to FilePicker)
- sectionConfig group: `selectInputs`

**Step 3: Verify Phase 2 questions are appropriate**

Q2 answer: B (fall-through to FilePicker)
Q3 answer: selectInputs
Q4 answer: label section + field section + container section

**Step 4: Verify schema summary matches actual `fileinput.js`**

Compare the skill's proposed summary table against the real file:
`frontend/src/AppBuilder/WidgetManager/widgets/fileinput.js`

If there are discrepancies, update the skill's Phase 1 agent prompt or type mapping rules.

**Step 5: Fix any discovered issues in SKILL.md**

Common issues to watch for:
- Missing `parentObjectKey` instruction in the Explore agent prompt
- Wrong type mapping (e.g. "Dropdown" being mapped to `select` vs `switch`)
- Missing cross-section conditional detection
- `definition` block rules not being followed (booleans not wrapped in `{{}}`)

---

### Task 9: Validate skill with a simpler widget (dry-run)

Test with a widget simpler than FileInput to verify the skill handles the minimal case cleanly.

**Step 1: Use the Button widget as reference**

Read `frontend/src/AppBuilder/WidgetManager/widgets/button.js` and verify the skill would produce equivalent output if given a button-like PRD.

**Step 2: Specifically verify:**
- No validation section → definition has no `validation` key
- INSPECTOR_TYPE = A (DefaultComponent) → no GetAccordion case added
- Standard CSAs (setDisable, setLoading, setVisibility) always present
- `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY` always gets the widget name

---

### Task 10: Commit

**Step 1: Stage the skill files**
```bash
git add .claude/skills/create-widget/
git add docs/plans/2026-03-09-create-widget-skill-design.md
git add docs/plans/2026-03-09-create-widget-skill-implementation.md
git add docs/widget-schema-field-types.md
```

**Step 2: Commit**
```bash
git commit -m "feat: add create-widget skill + widget schema field types reference

Adds .claude/skills/create-widget/ — a 6-phase interactive skill that:
- Parses widget PRDs via Explore agent
- Resolves ambiguities through Q&A (inspector type, styles, sections)
- Generates frontend + server schema files
- Performs all ~12 registration edits
- Adds to import/export service

Also adds docs/widget-schema-field-types.md as canonical field type reference.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Execution Notes

- Tasks 1–7 are writing the skill file. Do them in order — each builds on the previous.
- Tasks 8–9 are validation dry-runs. These are critical — the skill is only useful if it produces correct schemas.
- Task 10 commits everything.
- **No code changes to ToolJet itself** — this plan only creates skill + docs files.
- When the skill is later invoked by an engineer, THAT run will be what actually modifies widget/registration files.

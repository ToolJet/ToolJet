# Flow-Aware Test Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `/generate-tests` and `/generate-spec` into a single flow-aware entry point. Add a component flow that derives test surface from config files + docs (not DOM), chunks large components into per-chunk specs via a living plan doc, and enforces anti-hallucination quality gates. Validate end-to-end on 3 flat components (Button, TextInput, Checkbox) + 1 large component (Table).

**Architecture:** Flow registry declares (per flow) which reader agents to run, which sample spec to use, how to chunk. `test-architect` orchestrates: runs flow-specific readers → builds a surface model from their YAML outputs → classifies size (heuristic + registry) → emits a plan doc with per-chunk context manifests → dispatches scout/coder/runner per chunk with ONLY the context the chunk needs. Two new quality gate agents (`coverage-verifier`, `citation-lint`) validate outputs. `/generate-spec` becomes a thin alias.

**Tech Stack:** Claude Code agents/commands (markdown), existing Chrome DevTools MCP / Figma MCP / ClickUp MCP / GitHub MCP, existing Cypress pipeline (scout/coder/runner), new JSON config files in `cypress-tests/cypress/config/`.

**Reference spec:** `docs/superpowers/specs/2026-04-19-flow-aware-test-pipeline-design.md`

**Prerequisites for validation tasks (17–20):**
- ToolJet dev server running locally (see `docs/development.md`)
- Logged in as `dev@tooljet.io` / `password`
- Ability to create/delete test apps via the UI or API

---

## File Structure

| # | Action | Path | Responsibility |
|---|--------|------|---------------|
| 1 | Create | `cypress-tests/cypress/config/test-flow-registry.json` | Flow declarations: readers, sample spec, output paths |
| 2 | Create | `cypress-tests/cypress/config/component-test-matrix.json` | Size override registry (large/small per component) |
| 3 | Create | `docs/test-cases/components/.gitkeep` | Plan doc folder |
| 4 | Create | `docs/test-cases/features/.gitkeep` | Plan doc folder |
| 5 | Create | `docs/test-cases/deployed-apps/.gitkeep` | Plan doc folder |
| 6 | Create | `.claude/agents/component-config-reader.md` | Extracts surface (props/styles/events/defaults) from `widgets/{name}.js` with citations |
| 7 | Create | `.claude/agents/component-docs-reader.md` | Extracts CSA, exposed variables, data-binding from `docs/widgets/{name}.md` with citations |
| 8 | Create | `.claude/agents/coverage-verifier.md` | Diffs generated spec covered-surface vs plan surface; reports gaps |
| 9 | Create | `.claude/agents/citation-lint.md` | Validates every non-`fake.*` literal in a spec cites a source |
| 10 | Modify | `.claude/agents/test-architect.md` | Flow-aware dispatch, surface model, chunking, manifest emission, quality-gate invocation |
| 11 | Modify | `.claude/commands/generate-tests.md` | Flow detection, registry load, bypass flags (`--fast`, `--yes`, `--spec-only`, `--flow=`) |
| 12 | Modify | `.claude/commands/generate-spec.md` | Rewrite as thin alias to `/generate-tests` |
| 13 | Modify | `.claude/agents/memory-updater.md` | Capture component-flow learnings (heuristic overrides, citation failures, new constants) |

**Task dependencies (by task number, not file number):**
- Tasks 1–3 (foundation: 2 JSON configs + folders) — independent; can run in parallel.
- Tasks 4–5 (component readers) — independent of each other; depend on Task 1 for registry-declared paths.
- Task 6 (reader smoke test) — depends on Tasks 4, 5.
- Tasks 7–8 (quality gate agents) — independent of each other; no dependencies.
- Tasks 9–14 (test-architect modifications) — must run in order (9 → 10 → 11 → 12 → 13 → 14); each depends on Tasks 1, 2, 4, 5, 7, 8.
- Task 15 (`/generate-tests` skill edits) — depends on Task 14.
- Task 16 (`/generate-spec` alias) — depends on Task 15.
- Tasks 17–20 (validation on real components) — depend on Task 16; run sequentially (Button → TextInput → Checkbox → Table).
- Task 21 (memory-updater hook) — independent of validation; can run anytime after Task 14.

---

## Milestone A: Foundation (config files + folders)

### Task 1: Create `test-flow-registry.json`

**Files:**
- Create: `cypress-tests/cypress/config/test-flow-registry.json`

- [ ] **Step 1: Create the registry file**

Write the complete content:

```json
{
  "schema_version": 1,
  "flows": {
    "component": {
      "triggers": {
        "url_contains": ["/apps/", "/app-builder/"]
      },
      "readers": ["component-config-reader", "component-docs-reader", "scout"],
      "sample_spec": ".claude/context/spec-samples/appbuilder-component.cy.js",
      "output_path": "cypress-tests/cypress/e2e/happyPath/appbuilder/commonTestcases/components/{name}/",
      "plan_doc_path": "docs/test-cases/components/{name}.md",
      "size_heuristic": "component",
      "size_overrides_file": "cypress-tests/cypress/config/component-test-matrix.json"
    },
    "feature": {
      "triggers": {
        "url_contains": ["/users", "/groups", "/workspace-settings", "/profile-settings"]
      },
      "readers": ["figma-reader", "clickup-reader", "github-reader", "scout"],
      "sample_spec": ".claude/context/spec-samples/platform-feature.cy.js",
      "output_path": "cypress-tests/cypress/e2e/happyPath/platform/commonTestcases/",
      "plan_doc_path": "docs/test-cases/features/{name}.md",
      "size_heuristic": "feature",
      "size_overrides_file": null
    },
    "deployed-app": {
      "triggers": {
        "url_contains": ["/applications/"]
      },
      "readers": ["scout"],
      "sample_spec": ".claude/context/spec-samples/deployed-app.cy.js",
      "output_path": "cypress-tests/cypress/e2e/happyPath/deployedApp/",
      "plan_doc_path": "docs/test-cases/deployed-apps/{name}.md",
      "size_heuristic": "deployed-app",
      "size_overrides_file": null
    },
    "plugin": {
      "status": "delegated",
      "delegates_to_skill": "fix-plugin-spec"
    },
    "marketplace": {
      "status": "reserved"
    },
    "workflow": {
      "status": "reserved"
    }
  }
}
```

- [ ] **Step 2: Validate JSON parses**

Run: `python3 -c "import json; json.load(open('cypress-tests/cypress/config/test-flow-registry.json'))"`
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add cypress-tests/cypress/config/test-flow-registry.json
git commit -m "test: add flow registry for /generate-tests flow-aware routing"
```

---

### Task 2: Create `component-test-matrix.json` (size overrides)

**Files:**
- Create: `cypress-tests/cypress/config/component-test-matrix.json`

- [ ] **Step 1: Create the matrix file**

```json
{
  "schema_version": 1,
  "size": {
    "table": "large",
    "form": "large",
    "kanban": "large",
    "listview": "large",
    "container": "large",
    "modal": "large",
    "tabs": "large",
    "steps": "large",
    "button": "small",
    "text": "small",
    "textInput": "small",
    "checkbox": "small",
    "dropdown": "small",
    "radioButton": "small"
  },
  "notes": "Registry overrides heuristic. Unlisted components fall back to heuristic defined in test-architect."
}
```

- [ ] **Step 2: Validate JSON**

Run: `python3 -c "import json; json.load(open('cypress-tests/cypress/config/component-test-matrix.json'))"`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add cypress-tests/cypress/config/component-test-matrix.json
git commit -m "test: add component size override registry"
```

---

### Task 3: Create plan doc folders

**Files:**
- Create: `docs/test-cases/components/.gitkeep`
- Create: `docs/test-cases/features/.gitkeep`
- Create: `docs/test-cases/deployed-apps/.gitkeep`

- [ ] **Step 1: Create folders with .gitkeep**

```bash
mkdir -p docs/test-cases/components docs/test-cases/features docs/test-cases/deployed-apps
touch docs/test-cases/components/.gitkeep docs/test-cases/features/.gitkeep docs/test-cases/deployed-apps/.gitkeep
```

- [ ] **Step 2: Verify**

Run: `ls docs/test-cases/`
Expected: lists `components  deployed-apps  features`.

- [ ] **Step 3: Commit**

```bash
git add docs/test-cases/
git commit -m "docs: scaffold test-cases folder for per-flow plan docs"
```

---

## Milestone B: Component Readers

### Task 4: Create `component-config-reader` agent

**Files:**
- Create: `.claude/agents/component-config-reader.md`

- [ ] **Step 1: Write the agent definition**

Full content:

````markdown
---
name: component-config-reader
description: Extracts the test surface (properties, styles, events, defaults, nested variants) from a ToolJet app-builder component's config file at `frontend/src/AppBuilder/WidgetManager/widgets/{name}.js`. Emits YAML with source file:line citations. Never reads docs files or live DOM — scope is config only.
tools:
  - Read
  - Grep
  - Glob
---

# Component Config Reader Agent

You extract the authoritative test surface of a ToolJet app-builder component from its config file. Your output is consumed by `test-architect` to build the surface model.

## Mission

Given a component name (e.g., `button`, `table`, `textInput`):
1. Locate the config file
2. Parse the exported `*Config` object
3. Emit a YAML surface model with **every** property, style, event, default value, and nested-variant enum — each with a source citation (`file:line`)

## Process

### Step 1: Locate the config file

Try paths in order:
1. `frontend/src/AppBuilder/WidgetManager/widgets/{name}.js`
2. `frontend/src/AppBuilder/WidgetManager/widgets/{name}.jsx`
3. Search the central manifest `frontend/src/AppBuilder/WidgetManager/configs/widgetConfig.js` for the import path

If not found, emit:
```yaml
component: {name}
error: config_not_found
searched: [paths tried]
```
Stop.

### Step 2: Parse the config export

Read the file. Find the exported `*Config` object (conventionally `{name}Config`). Extract these top-level keys (use Grep to find their line numbers):

- `properties` — array or map of property declarations
- `styles` — array or map of style declarations
- `events` — array of event declarations
- `defaultSize`, `defaultValue`, `defaultChildren` — literal defaults
- Any nested-array property like `columns`, `children`, `tabs`, `cards`, `slides` — capture the enum of allowed `type` values (for Table, that's `columns[].type` enum)

For each entry, capture:
- name (key)
- type (string, toggle, select, color, etc. — from `type` field in the declaration)
- default value (from `default`, `value`, or inline)
- displayName (from `displayName` if present)
- source: `<file>:<line>` where the entry is declared

### Step 3: Detect nested variants

If config has a property whose `type` is `array` with a nested schema (e.g., `columns[].type` is a select with N enum values), capture each enum value as a potential nested variant:

```yaml
nested_variants:
  - parent: columns
    discriminator: type
    values: [string, number, text, dropdown, multiselect, badge, tag, date, boolean, image, select, link, toggleSwitch, radio]
    source: frontend/src/AppBuilder/WidgetManager/widgets/table.js:{line}
```

If none, emit `nested_variants: []`.

### Step 4: Emit YAML

Output to the final message (no file write). Full shape:

```yaml
component: <name>
config_path: frontend/src/AppBuilder/WidgetManager/widgets/<name>.js
surface:
  properties:
    - name: <property_name>
      type: <property_type>
      default: <default_value_or_null>
      displayName: <displayName_or_null>
      source: <file>:<line>
  styles:
    - name: <style_name>
      default: <default_value_or_null>
      source: <file>:<line>
  events:
    - name: <event_name>
      source: <file>:<line>
  defaults:
    size: { w: <int>, h: <int> }   # from defaultSize
    value: <defaultValue_or_null>
  nested_variants: [ ... ]  # see Step 3
```

## Constraints

- **Config ONLY.** Never read `docs/docs/widgets/*.md`, never read spec samples, never navigate DOM. Your mandate is the config file.
- **No invention.** If a field is not in the config file, omit it — do not guess a default, a type, or an event name.
- **Every surface item MUST cite source.** `file:line` is required. Use `Grep` with `-n` to find line numbers.
- **No filtering.** Emit every property/style/event even if it seems "internal" — test-architect decides what's coverable.
- **Never assert**. You do not produce test cases, only the surface.

## Failure modes

- Config file missing: emit `{component, error: config_not_found, searched: [...]}`
- Config parse fails (e.g., dynamic imports): emit `{component, error: config_parse_failed, reason: <short>}`. test-architect will fall back to heuristics.
- Line numbers uncertain: cite the nearest matching line with a `±approximate` suffix, e.g., `source: file:45 ±approximate`.
````

- [ ] **Step 2: Verify frontmatter parses**

Run: `head -10 .claude/agents/component-config-reader.md`
Expected: YAML frontmatter with `name:`, `description:`, `tools:` fields visible.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/component-config-reader.md
git commit -m "test: add component-config-reader agent for surface extraction"
```

---

### Task 5: Create `component-docs-reader` agent

**Files:**
- Create: `.claude/agents/component-docs-reader.md`

- [ ] **Step 1: Write the agent definition**

````markdown
---
name: component-docs-reader
description: Extracts CSA (component-specific actions), exposed variables, data-binding contracts, and worked examples from a ToolJet component's documentation markdown at `docs/docs/widgets/{name}.md`. Emits YAML additions to the surface model with source citations (file#anchor). Never reads config, never reads DOM.
tools:
  - Read
  - Grep
  - Glob
---

# Component Docs Reader Agent

You extract surface dimensions that live in the **docs**, not the config: CSA, exposed variables, examples, and data-binding contracts. Your output is merged with `component-config-reader`'s output by `test-architect`.

## Mission

Given a component name (e.g., `button`, `table`):
1. Locate the docs markdown
2. Parse sections: Properties, Events, Component Specific Actions, Exposed Variables, Examples
3. Emit YAML surface additions with source citations (`file#anchor` or `file:line`)

## Process

### Step 1: Locate the docs file

Try paths in order:
1. `docs/docs/widgets/{name}.md`
2. `docs/docs/widgets/{kebab-name}.md` (e.g., `text-input.md` for `textInput`)

If not found, emit:
```yaml
component: {name}
error: docs_not_found
searched: [paths tried]
```
Stop. **Do not stop the pipeline** — test-architect will handle missing docs by partial-surface.

### Step 2: Parse sections

Read the docs file. Look for these section headers (in any order):
- `## Properties` or `### Properties`
- `## Events` or `### Events`
- `## Component Specific Actions` or `## Component-Specific Actions` or `## CSA`
- `## Exposed Variables`
- `## Examples` or `## Example Usage`

For each section, extract structured rows (markdown tables or bulleted lists).

### Step 3: Extract CSA

For each row in the CSA section, capture:
- `name` — the action name (e.g., `click`, `setText`, `setPage`)
- `params` — parameter list with types, if declared. If "No parameters" or similar, emit `params: []`.
- `description` — short description
- `source: docs/docs/widgets/{name}.md#component-specific-actions`

```yaml
csa:
  - name: click
    params: []
    description: Triggers the onClick event of the button.
    source: docs/docs/widgets/button.md#component-specific-actions
  - name: setText
    params: [{ name: text, type: string }]
    description: Sets the button text.
    source: docs/docs/widgets/button.md#component-specific-actions
```

### Step 4: Extract exposed variables

```yaml
exposed_variables:
  - name: isVisible
    type: boolean
    description: Whether the button is visible.
    source: docs/docs/widgets/button.md#exposed-variables
  - name: isLoading
    type: boolean
    description: Whether the button is in loading state.
    source: docs/docs/widgets/button.md#exposed-variables
```

### Step 5: Extract examples (optional)

If the docs have worked examples (e.g., "Open modal on click"), capture them as hints for scout — they indicate real-world usage patterns. Keep the raw markdown.

```yaml
examples:
  - title: Open modal on click
    raw: |
      On click, trigger the modal's open CSA.
    source: docs/docs/widgets/button.md#examples
```

### Step 6: Emit YAML

Combine all sections:

```yaml
component: <name>
docs_path: docs/docs/widgets/<name>.md
surface_additions:
  csa: [ ... ]
  exposed_variables: [ ... ]
  examples: [ ... ]
  notes: <any data-binding caveats from docs body, raw markdown>
```

## Constraints

- **Docs ONLY.** Never read the config file (`config-reader` owns that), never read DOM, never read spec samples.
- **No invention.** If the docs don't document an exposed variable, do not infer one.
- **Every item cites source.** `file#anchor` is preferred (reproducible), `file:line` acceptable if no anchor.
- **Never assert**. You do not produce test cases.

## Failure modes

- Docs file missing: emit `{component, error: docs_not_found, searched: [...]}`. Pipeline continues with partial surface.
- Section missing (e.g., no CSA): emit empty array for that key.
- Ambiguous parse: note in `notes` field; emit what can be parsed.
````

- [ ] **Step 2: Verify frontmatter**

Run: `head -10 .claude/agents/component-docs-reader.md`
Expected: YAML frontmatter visible.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/component-docs-reader.md
git commit -m "test: add component-docs-reader agent for CSA/exposed-vars extraction"
```

---

### Task 6: Smoke-test both readers on Button

**Files:**
- None to create. Manual validation.

- [ ] **Step 1: Dispatch `component-config-reader` on Button**

In a Claude Code session, use the Agent tool:
```
subagent_type: component-config-reader
prompt: "Extract the test surface for the Button component. Component name: button."
```

Expected output: YAML with at minimum `component: button`, `config_path: frontend/src/AppBuilder/WidgetManager/widgets/button.js`, non-empty `surface.properties` and `surface.events`, and `nested_variants: []`.

- [ ] **Step 2: Dispatch `component-docs-reader` on Button**

```
subagent_type: component-docs-reader
prompt: "Extract CSA and exposed variables for the Button component. Component name: button."
```

Expected output: YAML with `surface_additions.csa` containing at minimum a `click` entry, `surface_additions.exposed_variables` non-empty.

- [ ] **Step 3: Verify citations**

Check that every surface item has a `source:` field pointing to a real file line. Pick 3 random citations and Grep the file to confirm the line contains the claimed content.

- [ ] **Step 4: If any item lacks a citation or cites a wrong line: refine the agent prompt**

If either reader returned unattributed items or bad citations:
- Open `.claude/agents/component-config-reader.md` or `.claude/agents/component-docs-reader.md`
- Tighten the Step 2–4 instructions emphasizing citation-or-omit
- Re-dispatch and verify
- Commit the refinement

```bash
git add .claude/agents/component-config-reader.md .claude/agents/component-docs-reader.md
git commit -m "test: tighten reader citation requirements per smoke test"
```

- [ ] **Step 5: No further commit if readers passed on first run**

If everything passed, skip the commit. Note "smoke test passed" in a comment in the plan doc for Task 6.

---

## Milestone C: Quality Gate Agents

### Task 7: Create `coverage-verifier` agent

**Files:**
- Create: `.claude/agents/coverage-verifier.md`

- [ ] **Step 1: Write the agent definition**

````markdown
---
name: coverage-verifier
description: Given a plan doc (surface model + chunks) and a list of generated spec file paths, reports which surface items are covered by which spec, and lists gaps. Emits a coverage report in markdown.
tools:
  - Read
  - Grep
  - Bash
---

# Coverage Verifier Agent

You verify that the specs generated from a plan doc actually cover every surface item declared in the plan. Output is a coverage report consumed by `test-architect` as gate G1.

## Mission

Given:
- Path to a plan doc (e.g., `docs/test-cases/components/button.md`)
- List of generated spec file paths

Produce:
- Per-chunk: list of covered surface items, list of gaps
- Overall: total coverage %, list of surface items not asserted anywhere, list of assertions in specs that don't trace back to any surface item (drift)

## Process

### Step 1: Parse the plan doc

Read the plan doc. Extract:
- Surface model (properties, styles, events, exposed, CSA, nested variants) from the surface model header
- Per-chunk: `surface covered` section listing the items that chunk is meant to cover

### Step 2: For each spec file, extract covered items

Read each spec file. Use Grep to find assertions. Heuristic coverage detectors:
- Property covered: spec contains a Grep match for the property's `displayName` or its selector constant name
- Style covered: spec contains `verifyStyles` or `stylePicker(<name>)` referencing the style
- Event covered: spec contains `addDefaultEventHandler` or event name referenced
- Exposed covered: spec contains `verifyComponentFromInspector` or Inspector reference + the variable name
- CSA covered: spec contains a call to the CSA (component method call like `components.{name}.{action}`) or via another widget's event running the action

### Step 3: Compare

For each surface item in the plan, mark it `covered` or `gap`:
- `covered` — at least one spec has evidence of asserting it
- `gap` — no spec mentions it
- `not-automatable` — plan doc explicitly marked this with `not-automatable: true`; treat as intentionally covered, record reason

For each spec, identify assertions that don't trace back to ANY surface item: `drift`.

### Step 4: Emit report

Output markdown:

```markdown
## Coverage Report: <component>

### Summary
- Surface items total: 47
- Covered: 42 (89%)
- Gaps: 3
- Not-automatable: 2
- Drift (assertions outside surface): 0

### Per-chunk

#### chunk 1: button-basic
- Covered (18): text, background_color, onClick, ...
- Gaps (1): ignored_property (source: button.js:88)
- Not-automatable (0):

#### chunk 2: ...

### Gaps (action required)
1. `ignored_property` — declared in config but not asserted. Source: button.js:88
2. ...

### Drift (manual review)
(none)

### Verdict
PASS with gaps: 3 items uncovered. Re-dispatch coder with missing items OR update plan to mark as not-automatable.
```

## Constraints

- Read-only. Never modify specs or plan.
- Heuristic coverage only — if a surface item's displayName matches text in a spec, assume covered. False positives are acceptable; false negatives (missing real gap) are the failure mode.
- Every gap reported MUST include the surface item's source citation.
- Output markdown only. No state mutations.

## Verdict rules

- PASS: coverage ≥ 95% OR all gaps are marked `not-automatable`.
- FAIL: any unaccounted gap OR any drift item.
- test-architect decides action (re-dispatch coder / update plan / abort) based on verdict.
````

- [ ] **Step 2: Verify frontmatter**

Run: `head -10 .claude/agents/coverage-verifier.md`
Expected: valid YAML frontmatter.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/coverage-verifier.md
git commit -m "test: add coverage-verifier agent for quality gate G1"
```

---

### Task 8: Create `citation-lint` agent

**Files:**
- Create: `.claude/agents/citation-lint.md`

- [ ] **Step 1: Write the agent definition**

````markdown
---
name: citation-lint
description: Validates that every non-`fake.*` literal value in a Cypress spec is accompanied by a source citation comment. Reports violations. Emits PASS/FAIL + violation list.
tools:
  - Read
  - Grep
---

# Citation Lint Agent

You enforce gate G2: every assertion literal in a generated spec must trace to a source file. This is the anti-hallucination core guarantee.

## Mission

Given a spec file path, report every assertion literal that:
- Is NOT dynamic (not from `fake.*`, not a variable reference)
- Is NOT accompanied by a `// source:` comment on the same or preceding line
- Is used in an `expect(...)`, `.should(...)`, `.contains(...)`, or assignment to a `data.*` object

## Process

### Step 1: Read the spec file

Read the full spec file.

### Step 2: Identify assertion-literal candidates

Scan for patterns:
- `data.<something> = "<literal>"` or `data.<something> = <number>`
- `.should("contain", "<literal>")` or `.should("have.text", "<literal>")`
- `.should("have.css", "<prop>", "<literal>")`
- `.contains("<literal>")`
- Inline literals inside `expect(...)` or `cy.get(...).should(...)`

Exclude:
- `fake.*` references
- Variable references (e.g., `data.widgetName`)
- Selector constants (handled by reuse lint, not citation lint)
- Text constants (e.g., `buttonText.defaultLabel`) — they're cited in the texts file, not the spec

### Step 3: Check for citation

For each assertion literal, look at the same line and the line immediately above for:
- `// source: <file>:<line>` (config citation)
- `// source: <file>#<anchor>` (docs citation)
- `// dynamic: fake.*` or `// dynamic: <reason>` (dynamic value escape hatch)

If neither is present: VIOLATION.

### Step 4: Emit report

```markdown
## Citation Lint: <spec_path>

### Summary
- Assertion literals scanned: 23
- With citations: 20
- Violations: 3

### Violations

1. Line 45: `.should("have.css", "background-color", "rgb(67, 104, 227)")` — no source comment
   Suggested fix: add `// source: button.js:45` if this value comes from config defaults

2. Line 67: `data.defaultText = "Button"` — no source comment
   Suggested fix: add `// source: button.js:14` above the line

3. Line 89: `.contains("Click me")` — no source comment
   Suggested fix: if dynamic, replace with `fake.*`; if from constants, import from texts file

### Verdict
FAIL — 3 violations. Send to coder for re-cite.
```

## Constraints

- Read-only.
- False positives acceptable (stricter than needed); false negatives (missed violations) are the failure mode.
- Trust `// dynamic: fake.*` comment as sufficient for dynamic values.
- Trust imported constants (`buttonText.foo`) as cited in their constants file — not this agent's scope.
- Strings that are ONLY Cypress matchers (`"have.css"`, `"contain"`) are not literal values being asserted — skip.

## Verdict

- PASS: zero violations.
- FAIL: any violations. test-architect re-dispatches coder with the violation list.
````

- [ ] **Step 2: Verify frontmatter**

Run: `head -10 .claude/agents/citation-lint.md`
Expected: valid YAML frontmatter.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/citation-lint.md
git commit -m "test: add citation-lint agent for quality gate G2"
```

---

## Milestone D: Enhance `test-architect`

### Task 9: Add flow detection + registry load to `test-architect`

**Files:**
- Modify: `.claude/agents/test-architect.md`

- [ ] **Step 1: Read existing test-architect**

Run: `head -80 .claude/agents/test-architect.md`
Note current structure (instructions, phases).

- [ ] **Step 2: Add flow detection section**

Insert a new section after the existing mission statement and before the first phase. Add this content:

````markdown

---

## Flow-Aware Routing (v2 addition)

Before dispatching readers, determine the flow:

### Step A: Flow detection

1. If caller passed `--flow=<name>`, use that flow directly. Go to Step B.
2. Otherwise, load `cypress-tests/cypress/config/test-flow-registry.json`.
3. For each flow entry with a `triggers.url_contains` list, check if the provided URL (or feature name) contains any trigger substring.
4. First match wins.
5. If no match: ask the user "Flow could not be detected. Available: component, feature, deployed-app. Which flow?" and wait.

### Step B: Registry lookup

Use the selected flow's entry to get:
- `readers` — list of reader agent names to dispatch
- `sample_spec` — which sample spec the coder should consult
- `output_path` — where specs land
- `plan_doc_path` — where the plan doc is written
- `size_overrides_file` — if present, consult it during classification

If the flow status is `"delegated"`, print a message routing the user to the delegated skill and stop. Example:
> "Plugin/marketplace flows are handled by `/fix-plugin-spec`. Please use that skill instead."

If the flow status is `"reserved"`, print:
> "Flow `{name}` is reserved but not implemented. Falling back to `feature` flow." and continue with `feature` as the selected flow.

### Step C: Invocation shape

Pass the selected flow's entry to subsequent phases as `flow_config`. All reader dispatches must use `flow_config.readers` — do NOT dispatch readers not listed.
````

- [ ] **Step 3: Verify edit applied**

Run: `grep -n "Flow-Aware Routing" .claude/agents/test-architect.md`
Expected: one line match.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/test-architect.md
git commit -m "test: add flow detection + registry load to test-architect"
```

---

### Task 10: Add surface model build in `test-architect`

**Files:**
- Modify: `.claude/agents/test-architect.md`

- [ ] **Step 1: Insert surface model phase**

Add this section after "Flow-Aware Routing" and before the existing "Phase 1" header (or equivalent first phase):

````markdown

---

## Phase 0: Build Surface Model (component flow only)

When `flow_config.name == "component"`:

### Step 1: Dispatch component readers in parallel

In a single message, use Agent tool with both:
- `component-config-reader` — input: `{component_name}`
- `component-docs-reader` — input: `{component_name}`

Collect both YAML outputs.

### Step 2: Merge into surface model

```yaml
component: {name}
flow: component
surface_version:
  config_hash: <sha256 of config file content>
  docs_hash: <sha256 of docs file content>
surface:
  properties: [ ... from config-reader ... ]
  styles: [ ... from config-reader ... ]
  events: [ ... from config-reader ... ]
  defaults: { ... from config-reader ... }
  nested_variants: [ ... from config-reader ... ]
  csa: [ ... from docs-reader ... ]
  exposed_variables: [ ... from docs-reader ... ]
  examples: [ ... from docs-reader ... ]
```

Compute content hashes with: `sha256sum frontend/src/AppBuilder/WidgetManager/widgets/{name}.js | cut -c1-8` (short-8 prefix for plan doc header).

### Step 3: Handle reader errors

- If config-reader emits `error: config_not_found`: STOP the pipeline, report to user "Component config not found. Cannot proceed."
- If docs-reader emits `error: docs_not_found`: continue with empty `csa`, `exposed_variables`, `examples`. Emit a warning in the plan doc: "⚠ docs not found — CSA and exposed variables not available."
- If either emits `error: parse_failed`: continue with whatever partial surface was returned; flag in plan doc.

### Step 4: Pass surface model to next phase

The merged surface model is the input to classification + plan doc generation.

## Phase 0 (feature / deployed-app flows)

For these flows, skip Phase 0. The existing Phase 1 (parallel context gathering via figma/clickup/github/scout readers) handles surface construction.
````

- [ ] **Step 2: Verify**

Run: `grep -n "Phase 0: Build Surface Model" .claude/agents/test-architect.md`
Expected: one line match.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/test-architect.md
git commit -m "test: add Phase 0 surface-model build for component flow"
```

---

### Task 11: Add size classification + confirmation gate

**Files:**
- Modify: `.claude/agents/test-architect.md`

- [ ] **Step 1: Insert classification phase**

Add after "Phase 0" section:

````markdown

---

## Phase 0.5: Size Classification + Confirmation (component flow)

### Step 1: Load size override registry

If `flow_config.size_overrides_file` is set, read the JSON file. Look up `size[{component_name}]`.

- If present: use the value (`"large"` or `"small"`). Skip to Step 3.
- If absent: proceed to heuristic.

### Step 2: Apply heuristic

Classify as `large` if ANY:
- `surface.nested_variants` is non-empty
- `len(surface.events)` > 2
- Any entry in `surface.csa` has non-empty `params` (CSA with parameters, not just no-arg actions)
- `len(surface.properties)` > 15

Otherwise: `small`.

### Step 3: Generate chunk proposal

If `small`:
```yaml
chunks:
  - id: {name}-basic
    spec_file: {name}HappyPath.cy.js
    surface_covered: [all properties, styles, events, exposed, csa]
```

If `large`:
```yaml
chunks:
  - id: {name}-basic
    spec_file: {name}BasicHappyPath.cy.js
    surface_covered: [core properties, core styles, non-variant events, non-parameterized csa]
  - id: {name}-exposed
    spec_file: {name}ExposedHappyPath.cy.js
    surface_covered: [exposed_variables]
  - id: {name}-csa
    spec_file: {name}CsaHappyPath.cy.js
    surface_covered: [csa with params]
  # plus one chunk per nested_variant value:
  - id: {name}-variant-{value}
    spec_file: {name}Variant{Value}HappyPath.cy.js
    surface_covered: [properties/styles specific to this variant]
```

For Table specifically: add chunks for pagination, server-side-pagination, row-selection, column-management IF the surface contains those categories.

### Step 4: Confirmation gate (skippable with --yes)

Unless `--yes` flag is set, print to user:

```
Classified {name} as {SMALL|LARGE}
Reason: {heuristic match or registry override}
Proposed chunks ({count}):
  1. {chunk_id_1} → {spec_file_1}
  2. {chunk_id_2} → {spec_file_2}
  ...

Proceed, edit, or change classification? [enter / edit / small / large / abort]
```

Handle responses:
- `enter` / `yes` / empty: proceed
- `edit`: ask "Describe edits (add/remove/rename chunks):" and apply to the chunk list
- `small` / `large`: override classification and regenerate chunks
- `abort`: stop

### Step 5: Final chunks list

Pass the approved chunk list to Phase 1.
````

- [ ] **Step 2: Verify**

Run: `grep -n "Phase 0.5" .claude/agents/test-architect.md`
Expected: one line match.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/test-architect.md
git commit -m "test: add size classification + confirmation gate to test-architect"
```

---

### Task 12: Add plan doc emission with per-chunk manifests

**Files:**
- Modify: `.claude/agents/test-architect.md`

- [ ] **Step 1: Insert plan doc writing phase**

Add after "Phase 0.5":

````markdown

---

## Phase 1: Plan Doc Emission

### Step 1: Build per-chunk context manifest

For each chunk, compile a manifest (what each agent will see when that chunk dispatches):

```yaml
chunk_id: {name}-basic
agents:
  scout:
    url: {deployed_url_or_app_builder_url}
    focus: "Base {name} widget with default config. Surface: {list of surface items from chunk}"
    fixture: null  # component flow does not need a pre-built test fixture
  coder:
    sample: {flow_config.sample_spec}
    conventions: .claude/context/cypress-conventions.md
    config_slice: |
      <YAML slice of surface relevant to this chunk>
    docs_slice: |
      <markdown slice of docs sections relevant to this chunk>
    grep_scope:
      selectors: [{list of probable selector names from config property names}]
      texts: [{component name}]
      utils: [verifyAndModifyParameter, verifyLayout, openEditorSidebar, ...]
    related_specs: [{first existing spec in output_path if any, else null}]
  runner:
    config: cypress-tests/cypress.config.js
    retry_budget: 2
source_citations_required:
  - "{every surface item in this chunk must appear in the spec with its source}"
acceptance:
  - "All listed surface items asserted OR marked not-automatable"
  - "All assertions cite source file:line OR use fake.*"
  - "Spec passes in ≤ 2 runner iterations"
```

Surface slicing rules:
- A chunk's `config_slice` contains ONLY the `properties`, `styles`, `events` relevant to that chunk's `surface_covered`.
- A chunk's `docs_slice` contains ONLY the markdown sections for CSA and exposed variables that this chunk covers. Use section-level extraction, not full-file copy.

### Step 2: Write plan doc

Write to `{flow_config.plan_doc_path}` (substituting `{name}`). Format:

```markdown
# Test Plan: {Name}

**Flow:** component
**Classification:** {small|large} ({reason})
**Generated:** {YYYY-MM-DD}
**Surface version:** config:{hash_short} docs:{hash_short}

## Chunk Index

- [ ] 1. {chunk_id_1} → {spec_file_1}
- [ ] 2. {chunk_id_2} → {spec_file_2}
...

---

## Surface Model (readonly snapshot)

<paste the merged surface model from Phase 0>

---

## Chunks

### Chunk 1: {chunk_id_1}

<paste chunk manifest from Step 1>

### Chunk 2: {chunk_id_2}

<paste chunk manifest>
```

### Step 3: Plan review gate (skippable with --yes or gate_mode=fast)

Unless bypassed, print:
> "Plan written to `{path}`. Review it and reply `proceed` / `edit` / `abort`."

Handle:
- `proceed`: go to Phase 2
- `edit`: ask "Open the plan doc, make edits, save, then reply `done`." Wait, then re-read the file and use the edited version.
- `abort`: stop

### Step 4: Commit the plan doc

```bash
git add {plan_doc_path}
git commit -m "test({name}): add plan doc for component test generation"
```

(The test-architect agent does this via a Bash call.)
````

- [ ] **Step 2: Verify**

Run: `grep -n "Phase 1: Plan Doc Emission" .claude/agents/test-architect.md`
Expected: one line match.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/test-architect.md
git commit -m "test: add plan-doc emission with per-chunk manifests"
```

---

### Task 13: Add per-chunk dispatch loop

**Files:**
- Modify: `.claude/agents/test-architect.md`

- [ ] **Step 1: Insert per-chunk dispatch phase**

Add after "Phase 1":

````markdown

---

## Phase 2: Per-Chunk Spec Generation

For each chunk in the approved chunk list, sequentially (not in parallel):

### Step 1: Dispatch scout

Use Agent tool with:
- `subagent_type: scout`
- `prompt: "Inspect {url}. Focus: {chunk.agents.scout.focus}. Extract data-cy elements scoped to the chunk surface only."`

Scout returns element inventory.

### Step 2: Dispatch coder

Use Agent tool with:
- `subagent_type: coder`
- `prompt: <build from chunk manifest — see below>`

Build coder prompt:
```
Generate a Cypress spec for chunk: {chunk_id}.

## Chunk manifest
<paste chunk.agents.coder section from plan>

## Scout output
<paste scout result>

## Instructions
1. Read {sample} for structural template (ONLY this sample, no others).
2. Read {conventions} for rules.
3. Using ONLY the config_slice and docs_slice provided, generate test cases.
4. EVERY assertion literal MUST have a `// source:` comment OR use `fake.*` with a `// dynamic:` comment.
5. Grep {grep_scope.selectors} in cypress-tests/cypress/constants/selectors/ for existing constants BEFORE creating new ones.
6. Grep {grep_scope.texts} in cypress-tests/cypress/constants/texts/ for existing texts BEFORE creating new ones.
7. Grep {grep_scope.utils} in cypress-tests/cypress/support/utils/ for existing utilities BEFORE writing custom helpers.
8. Output spec to: {flow_config.output_path}/{chunk.spec_file}
```

Collect coder output (file path).

### Step 3: Dispatch runner

Use Agent tool with:
- `subagent_type: runner`
- `prompt: "Run spec: {spec_path}. Config: cypress-tests/cypress.config.js. Retry budget: 2."`

Runner loops:
- Iteration 1: run, if pass → done
- Iteration 2 (if fail): dispatch coder with failure report, re-run
- After iteration 2 fail: report partial; continue to next chunk (don't abort whole pipeline)

### Step 4: Quality gate lints (per chunk)

After runner passes for a chunk:

**G2 — citation-lint:**
- Dispatch `citation-lint` on the spec file
- If FAIL: re-dispatch coder with violation list to add citations; re-run runner; recheck.
- Max 1 re-cite iteration per chunk. If still failing: mark chunk "needs manual citation review" in final report.

**G3 — selector/text reuse check:**
Inline Bash check after the spec file is written:
```bash
# Get newly-added selector/text exports in this run's diff
NEW_SELECTORS=$(git diff --cached -- cypress-tests/cypress/constants/selectors/ | grep "^+export" | wc -l)
NEW_TEXTS=$(git diff --cached -- cypress-tests/cypress/constants/texts/ | grep "^+export" | wc -l)
```
- If `NEW_SELECTORS > 0` or `NEW_TEXTS > 0`, for each new export: Grep the existing constants files for a near-duplicate (case-insensitive fuzzy match on the key). If a duplicate is found, re-dispatch coder with "use existing `<name>` instead of creating `<new_name>`". Max 1 iteration.
- If no re-dispatch fires, G3 passes.

**G5 — sample conformance (lightweight):**
Regex check that the spec contains:
- `describe(` opening
- `beforeEach(` block (API-first setup)
- `cy.apiDeleteApp(` cleanup (or equivalent for non-app flows)
- Import from the expected sample path's header block

If any check fails, re-dispatch coder with "restructure to match sample template". Max 1 iteration. Full AST check deferred — see Open Issues.

### Step 5: Record per-chunk status

Maintain a status map:
```yaml
{chunk_id}:
  spec_file: {path}
  runner: pass | partial | fail
  citation_lint: pass | fail
  iterations: {int}
```

### Step 6: Loop to next chunk

Continue until all chunks processed.
````

- [ ] **Step 2: Verify**

Run: `grep -n "Phase 2: Per-Chunk Spec Generation" .claude/agents/test-architect.md`
Expected: one line match.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/test-architect.md
git commit -m "test: add per-chunk sequential dispatch in test-architect"
```

---

### Task 14: Add coverage verification + final report

**Files:**
- Modify: `.claude/agents/test-architect.md`

- [ ] **Step 1: Insert coverage + report phase**

Add after "Phase 2":

````markdown

---

## Phase 3: Coverage Verification + Final Report

### Step 0: G4 — Plan↔spec 1:1 trace

Before dispatching coverage-verifier, enforce trace:
- For each chunk in the plan's `chunks` list, assert exactly one spec file exists at the expected path (`{flow_config.output_path}/{chunk.spec_file}`).
- For each spec file in the output folder, assert it corresponds to exactly one chunk in the plan.
- Drift (extra/missing files) → halt pipeline, report drift to user. Do not continue to coverage verification until resolved.

### Step 1: Dispatch coverage-verifier

Use Agent tool:
- `subagent_type: coverage-verifier`
- `prompt: "Plan doc: {plan_doc_path}. Spec files: [list of spec paths from Phase 2]. Report coverage per chunk."`

Collect coverage report.

### Step 2: Decide on gaps

If report verdict is FAIL:
- If gaps exist: list each gap with its source citation and ask user: "3 gaps detected. Options: (a) re-dispatch coder to cover gaps, (b) mark as not-automatable with reason, (c) accept partial. Choose:"
- If drift exists: flag for manual review, do not block.

If PASS: continue.

### Step 3: Update plan doc checkboxes

For each chunk in the chunk index:
- `[x]` if runner passed + citation lint passed + coverage passed
- `[~]` if partial (runner or citation had issues, logged for review)
- `[ ]` if failed (should rarely happen — indicates a bug)

Rewrite the `## Chunk Index` section with updated checkboxes.

### Step 4: Emit final report

```markdown
## Test Generation Complete

**Component:** {name}
**Flow:** component
**Classification:** {small|large}
**Plan:** {plan_doc_path}

### Chunks ({X}/{total} passing)

- ✅ {chunk_id_1} — {spec_path_1}
- ✅ {chunk_id_2} — {spec_path_2}
- ⚠ {chunk_id_3} — {spec_path_3} (needs manual citation review)
- ❌ {chunk_id_4} — {spec_path_4} (runner failed after 2 iterations)

### Coverage
- Surface items: {covered}/{total} ({percent}%)
- Gaps: {list}
- Not-automatable: {list with reasons}

### Citation lint
- {X} specs pass
- {Y} specs need manual review

### Next steps
{actionable suggestions}
```

### Step 5: Commit specs + updated plan

```bash
git add {all_spec_paths} {plan_doc_path}
git commit -m "test({name}): generate chunked specs via flow-aware pipeline"
```

### Step 6: Return report to user
````

- [ ] **Step 2: Verify**

Run: `grep -n "Phase 3: Coverage Verification" .claude/agents/test-architect.md`
Expected: one line match.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/test-architect.md
git commit -m "test: add coverage verification + final-report phase"
```

---

## Milestone E: Skill Entry Points

### Task 15: Update `/generate-tests` skill with flow detection + bypass flags

**Files:**
- Modify: `.claude/commands/generate-tests.md`

- [ ] **Step 1: Read existing file**

Run: `wc -l .claude/commands/generate-tests.md`
Expected: ~170 lines (current v1).

- [ ] **Step 2: Add flag parsing at top (after frontmatter, before STEP 1)**

Insert this section:

````markdown

---

## STEP 0: Parse flags

Parse these flags from `$ARGUMENTS`:
- `--flow=<name>` — override flow detection (component|feature|deployed-app)
- `--yes` — skip all confirmation gates (classification, plan review); fast autonomous mode
- `--fast` — equivalent to `--yes` for backwards compatibility
- `--spec-only` — emit spec(s) without writing a plan doc (used by `/generate-spec` alias)
- `--hint="<text>"` — free-form hint passed to scout/coder as extra context

Remove these tokens from `$ARGUMENTS` before source auto-detection.

Store parsed flags in: `flags.flow`, `flags.yes`, `flags.spec_only`, `flags.hint`.

---
````

- [ ] **Step 3: Insert flow detection before gate-mode step**

Find the existing section "STEP 4: Ask Gate Mode" (or nearest equivalent). INSERT before it:

````markdown

---

## STEP 3.5: Flow Detection

Load `cypress-tests/cypress/config/test-flow-registry.json`.

### Route:

1. If `flags.flow` is set, use that flow. Skip to component name derivation.
2. Otherwise, check the deployed_url against each flow's `triggers.url_contains`. First match wins.
3. If nothing matches and only non-URL sources are present, default to `feature` flow.
4. If ambiguous: ask user:
   > "Flow could not be auto-detected. Available: component, feature, deployed-app. Choose:"

### Component name derivation (component flow only)

If flow is `component`:
- If URL contains `?widget=<name>` or path segment matches a component, extract.
- Else ask: "Which component are we testing? (e.g. button, table, textInput)"

Pass both `flow` and `component_name` to test-architect in STEP 6.

### Delegate flows

If matched flow status is `delegated` (e.g., plugin), print:
> "This flow is delegated to `/fix-plugin-spec`. Please use that skill instead: `/fix-plugin-spec <name>`"
Stop.

---
````

- [ ] **Step 4: Update STEP 6 (test-architect dispatch) to pass flow + flags**

Find the existing Step 6 test-architect dispatch. REPLACE the prompt block with:

```
Generate manual test cases and automation outlines for this feature.

## Inputs
- feature_name: <feature_name>
- flow: <flow>
- component_name: <component_name or "none">
- figma_url: <figma_url or "none">
- clickup_task: <clickup_task or "none">
- github_issue: <github_issue or "none">
- deployed_url: <deployed_url or "none">
- gate_mode: <gate_mode>
- flags:
    yes: <true|false>
    spec_only: <true|false>
    hint: <text or "none">

## Instructions
Follow the test-architect v2 flow (see `.claude/agents/test-architect.md`):

- If `flow == "component"`: run Phase 0 (surface model build) → Phase 0.5 (classification + confirm) → Phase 1 (plan doc) → Phase 2 (per-chunk dispatch) → Phase 3 (coverage + report).
- If `flow == "feature"` or `"deployed-app"`: run the v1 flow (existing parallel readers → synthesize → scout → coder/runner).
- Honor `flags.yes` to skip all gates.
- Honor `flags.spec_only` by skipping plan-doc commit (still write it locally as a tempfile for manifest construction, but don't commit it).
```

- [ ] **Step 5: Verify edits**

Run:
```bash
grep -n "STEP 0: Parse flags" .claude/commands/generate-tests.md
grep -n "STEP 3.5: Flow Detection" .claude/commands/generate-tests.md
grep -n "flow: <flow>" .claude/commands/generate-tests.md
```
Expected: each grep finds one match.

- [ ] **Step 6: Commit**

```bash
git add .claude/commands/generate-tests.md
git commit -m "test: add flow detection + bypass flags to /generate-tests"
```

---

### Task 16: Rewrite `/generate-spec` as alias

**Files:**
- Modify: `.claude/commands/generate-spec.md`

- [ ] **Step 1: Replace entire file**

Write the new content to `.claude/commands/generate-spec.md`:

````markdown
---
description: Fast single-spec generation from a live ToolJet URL. Thin alias for `/generate-tests --fast --spec-only`. For multi-source test generation, use `/generate-tests` directly.
argument-hint: "<url> [optional description]"
---

# /generate-spec (alias)

You are orchestrating a fast single-spec generation via `/generate-tests`.

The user has provided: `$ARGUMENTS`

## STEP 1: Parse arguments

- First positional token ending with a URL → `url`
- Remaining text → `hint`

## STEP 2: Invoke `/generate-tests`

Call the `/generate-tests` skill with:
- `<url>` as the only source
- `--fast` flag (skip all gates)
- `--spec-only` flag (do not write or commit a plan doc)
- `--hint="<hint>"` if non-empty

Effective command:
```
/generate-tests <url> --fast --spec-only --hint="<hint>"
```

## STEP 3: Report

Report the final spec path and pass/fail to the user.

## Notes

- Flow auto-detected from URL; use `/generate-tests <url> --flow=<name>` if you need to override.
- For large components (Table, Form, etc.), this alias still works but chunks into multiple specs. To pre-plan, use `/generate-tests <url>` without `--fast`.
- Existing skills that chain into `/generate-spec` (`/unit-test-spec`, `/fix-plugin-spec`) are unaffected; they see the same behavior.
````

- [ ] **Step 2: Verify**

Run: `wc -l .claude/commands/generate-spec.md`
Expected: <30 lines. Current file was ~143 lines — alias should be much smaller.

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/generate-spec.md
git commit -m "test: rewrite /generate-spec as thin alias to /generate-tests --fast --spec-only"
```

---

## Milestone F: End-to-End Validation

**NOTE:** Tasks 17–20 require a local ToolJet dev server (start with `pnpm dev` or equivalent) and a working login for `dev@tooljet.io` / `password`.

**Auto-provisioning:** Since the v2 pipeline includes an auto-provisioner (test-architect Phase D Step 0 dispatches `manual-tester` to create a throwaway app + drag the component + return a URL), you do NOT need to hand-create apps. Just pass `--component=<name>`:

```
/generate-tests --component=button
/generate-tests --component=table
```

The pipeline provisions `autotest-<component>-<timestamp>`, uses it for scout, generates specs, then deletes the app in Phase E Step 6. On cleanup failure, orphan apps are flagged by name so you can bulk-purge later.

### Task 17: Validate on Button (flat component)

**Files:**
- None (validation run only)

- [ ] **Step 1: Run `/generate-tests` with auto-provisioning**

```
/generate-tests --component=button
```

The pipeline will auto-provision `autotest-button-<timestamp>` via `manual-tester`, drag a Button widget, and use that URL for the rest of the flow. No manual app creation needed.

- [ ] **Step 2: (skipped — merged into Step 1)**

The previous manual-URL step is obsolete with auto-provisioning. If you want to test against a specific existing app, pass its URL as a positional argument: `/generate-tests http://localhost:8082/apps/<id> --component=button`.

- [ ] **Step 3: Verify classification**

Expected:
> "Classified button as SMALL (registry override)"
> "Proposed chunks (1): 1. button-basic → buttonHappyPath.cy.js"

Confirm with `enter`.

- [ ] **Step 4: Verify plan doc**

Expected files:
- `docs/test-cases/components/button.md` exists
- Contains: Flow: component; Classification: small; one chunk entry

Run: `cat docs/test-cases/components/button.md`
Verify structure matches the format from spec §5.5.

- [ ] **Step 5: Verify spec generated + passes**

Expected file:
- `cypress-tests/cypress/e2e/happyPath/appbuilder/commonTestcases/components/button/buttonHappyPath.cy.js`

Runner output: all tests pass in ≤ 2 iterations.

- [ ] **Step 6: Verify citation lint**

Dispatch `citation-lint` on the spec:
```
subagent_type: citation-lint
prompt: "Validate citations in cypress-tests/cypress/e2e/happyPath/appbuilder/commonTestcases/components/button/buttonHappyPath.cy.js"
```
Expected verdict: PASS.

- [ ] **Step 7: Verify coverage**

Dispatch `coverage-verifier`:
```
subagent_type: coverage-verifier
prompt: "Plan doc: docs/test-cases/components/button.md. Spec files: [cypress-tests/.../buttonHappyPath.cy.js]"
```
Expected: coverage ≥ 95%.

- [ ] **Step 8: Commit if all green**

If everything passed:
```bash
git add docs/test-cases/components/button.md cypress-tests/cypress/e2e/happyPath/appbuilder/commonTestcases/components/button/
git commit -m "test: generate button component spec via flow-aware pipeline"
```

If NOT green: iterate — identify which gate failed, refine the failing agent prompt, re-run. Document each iteration in commit history.

---

### Task 18: Validate on TextInput (flat, different surface)

**Files:**
- None (validation run only)

- [ ] **Step 1: Run pipeline with auto-provisioning**

```
/generate-tests --component=textInput
```

- [ ] **Step 3: Verify surface includes validation properties**

TextInput has validation (minLength, maxLength, regex, required). Expected in plan doc surface model:
- properties include `minLength`, `maxLength`, `regex`, `required`
- events include `onChange`, `onFocus`, `onBlur`

Verify by reading `docs/test-cases/components/textInput.md`.

- [ ] **Step 4–7: Same as Task 17 steps 5–8**

Verify spec passes, citation lint PASS, coverage ≥ 95%, commit.

---

### Task 19: Validate on Checkbox (toggle-heavy surface)

**Files:**
- None (validation run only)

- [ ] **Step 1: Run pipeline with auto-provisioning**

```
/generate-tests --component=checkbox
```

- [ ] **Step 3: Verify**

- Expected exposed variables include `value` (boolean), `isDisabled`, `isVisible`.
- Expected CSA: `setChecked`, `toggle`.
- Plan doc shows 1 chunk (small).

- [ ] **Step 4–7: Same as Task 17**

---

### Task 20: Validate on Table (LARGE — chunked)

**Files:**
- None (validation run only)

- [ ] **Step 1: Run pipeline with auto-provisioning**

```
/generate-tests --component=table
```

The auto-provisioner will create a Table app with default columns. If you want to test with specific column configurations, pre-create the app and pass its URL (see Task 17 Step 2 for the syntax).

- [ ] **Step 3: Verify classification is LARGE**

Expected:
> "Classified table as LARGE (registry override)"
> "Proposed chunks (N): [list of ~15 chunks covering basic, column variants, csa, exposed, pagination]"

If the chunk count feels wrong (too many / too few), reply `edit` and adjust. Document the adjustment — this feeds heuristic refinement.

- [ ] **Step 4: Confirm and run**

Proceed with approved chunk list. Note which chunks run vs fail.

- [ ] **Step 5: Verify plan doc**

`docs/test-cases/components/table.md` exists. Has one section per chunk with a full manifest.

- [ ] **Step 6: Verify per-chunk specs**

For each chunk:
- Spec file exists at `cypress-tests/cypress/e2e/happyPath/appbuilder/commonTestcases/components/table/<chunk>.cy.js`
- Runner reports pass / partial / fail
- Citation lint per file

Accept partial failures for this first Table run (Table is the hardest case; 80%+ chunks passing is success). Document failures for retro.

- [ ] **Step 7: Commit what passed; file follow-ups for what didn't**

```bash
git add docs/test-cases/components/table.md cypress-tests/cypress/e2e/happyPath/appbuilder/commonTestcases/components/table/
git commit -m "test: generate Table component chunked specs (partial; see plan doc)"
```

If specific chunks need refinement, create follow-up issues or notes in the plan doc.

---

### Task 21: Memory-updater hook (preparation only)

**Files:**
- Modify: `.claude/agents/memory-updater.md`

- [ ] **Step 1: Read existing memory-updater**

Run: `wc -l .claude/agents/memory-updater.md`
Note current structure.

- [ ] **Step 2: Add a "component test generation" section**

Append (or insert under a section listing "After successful runs, record"):

````markdown

---

## After `/generate-tests` component-flow runs

When a component flow completes, capture these specific learnings:

### 1. Heuristic accuracy

If the user OVERRODE the automatic size classification (chose `small` when heuristic said `large`, or vice-versa), record:
- Component name
- Heuristic verdict
- User override
- Reasoning (if given)

Recommendation: after N overrides in one direction, propose adjusting the heuristic in `test-architect.md` or adding a registry entry.

### 2. New constants created

Grep the diff for any NEW exports in `cypress-tests/cypress/constants/selectors/` or `cypress-tests/cypress/constants/texts/`. Record:
- Component tested
- New constants (names)
- Did the agent grep first? (Check coder output for grep mentions.)

Health metric: new-constants-per-run should trend DOWN as the constants library matures. Rising trend → reuse lint needs tightening.

### 3. Citation failures

If citation-lint reported violations on a first pass that required a re-cite round, record:
- Component
- Number of violations
- Common violation pattern (e.g., "default colors not cited")

Recommendation: if the same pattern appears 3+ times, tighten the coder prompt to call out that pattern explicitly.

### 4. Coverage gaps marked not-automatable

If chunks had surface items marked `not-automatable`, record:
- Component
- Item name
- Reason given
- Proposal: if the same item shows up across multiple components, consider adding automation primitives (new utility, new selector) rather than letting it stay not-automatable.
````

- [ ] **Step 3: Verify**

Run: `grep -n "After \`/generate-tests\` component-flow runs" .claude/agents/memory-updater.md`
Expected: one line match.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/memory-updater.md
git commit -m "test: extend memory-updater with component-flow learnings"
```

---

## Self-Review Checklist

Before handing off, verify:

- [ ] All 13 files in the File Structure table are created or modified.
- [ ] Each of the 4 new agents has valid YAML frontmatter (`name`, `description`, `tools`) and passes `head -10 <file>`.
- [ ] Both JSON config files parse (`python3 -c "import json; json.load(open(...))"`).
- [ ] `test-architect.md` has sections for: Flow-Aware Routing, Phase 0, Phase 0.5, Phase 1, Phase 2, Phase 3 — in this order.
- [ ] `/generate-tests` has STEP 0 (flags), STEP 3.5 (flow detection), and updated STEP 6 passing flow+flags to test-architect.
- [ ] `/generate-spec` is <30 lines and references `/generate-tests --fast --spec-only`.
- [ ] At least Task 17 (Button) passed end-to-end. Task 20 (Table) had at least partial success documented.
- [ ] No unattributed literals in generated specs (citation-lint PASS on all validated specs).

---

## Open Issues / Follow-ups

Expect these to surface during Task 17–20 validation — track in the plan doc or commit messages:

1. **Heuristic tuning.** First 3–4 flat components may need threshold adjustments (the `>15 properties` rule is a guess).
2. **Surface slicing precision.** Chunk `config_slice` may include too much or too little context — refine based on observed coder hallucination patterns.
3. **Runner retry budget.** 2 iterations may be insufficient for Table chunks; consider per-chunk override (plan doc field).
4. **Scout's role in component flow.** Currently scout still runs per chunk for data-cy discovery. If config/docs prove sufficient for selector prediction, scout could be skipped for flat components → performance win. Evaluate after Task 17.
5. **Plan doc diff-on-rerun.** Current design regenerates chunks whose surface_version hash changed. First re-run of an unchanged component should report "no regeneration needed" — verify this path works (not explicitly tested in Tasks 17–20).
6. **G5 full AST sample conformance.** Task 13 implements G5 as a lightweight regex check (presence of `describe(`, `beforeEach(`, cleanup). A proper AST-based structural check (e.g., using `@babel/parser`) is deferred to Phase 2 — the regex version catches 80% of sample-drift cases and is cheap.
7. **Concurrent runs of `/generate-tests` on the same component.** Two concurrent runs would race on the plan doc and spec files. V1 assumption: single-user-at-a-time. If concurrency becomes real, add a file-lock in `docs/test-cases/{flow}/{name}.md.lock`.
8. **Agent prompt refinements (surfaced during Task 6 smoke test).** The initial prompts in Tasks 4/5 miss important ToolJet config fields — the actual Button config has `others` (layout toggles), `exposedVariables` as a first-class config key with defaults, `actions` as the CSA definition (not just in docs), and default values living in `definition.properties.*.value` / `definition.styles.*.value` / `definition.others.*.value` (NOT inline in property declarations). The live agent files at `.claude/agents/component-config-reader.md` and `.claude/agents/component-docs-reader.md` have been refined to handle this. The docs-reader role was also clarified: config is authoritative for names/structure; docs enrich with descriptions, "how to access" syntax, and drift detection. If the plan's inline prompts are re-read, consider them superseded by the live files.

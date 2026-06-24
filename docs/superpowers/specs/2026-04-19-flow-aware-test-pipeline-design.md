# Design Spec: Flow-Aware Test Pipeline — `/generate-tests` v2

**Date:** 2026-04-19
**Author:** midhun@tooljet.com + Claude
**Status:** Draft
**Supersedes (extends):** `2026-04-18-generate-tests-design.md`

---

## 1. Problem

The v1 `/generate-tests` pipeline treats every input the same: fan out readers (Figma, ClickUp, GitHub), synthesize, inspect the page with scout, write a test case doc, optionally generate one Cypress spec. This works for **feature-style** flows but breaks down for ToolJet **app-builder components**:

1. **Incomplete coverage.** Scout only "sees" what's rendered. It misses properties behind closed accordions, CSA, exposed variables (Inspector-only), and events the user never triggered. The resulting spec covers a fraction of the component's real surface.
2. **Guessed assertions.** Default colors, labels, placeholder text, exposed variable names are guessed from DOM observation, not pulled from the authoritative config or docs. Tests flake on rename.
3. **Monolithic output.** A Table spec with basic rows + 8 column types + pagination + CSA actions + exposed variables in one file is too big to generate reliably, too big to debug, and doesn't map to how chunks actually fail.
4. **Parallel tool sprawl.** Separate skills (`/generate-spec`, `/generate-tests`, `/unit-test-spec`, `/fix-plugin-spec`) overlap in purpose. Teammates ask "which one do I use?" and the component-aware work being prototyped would become a fifth.
5. **Hallucination risk on minimal models.** Agents receive ambient prompts ("here's the codebase, generate a spec") and literal values drift from source-of-truth. A smaller model amplifies this.

## 2. Solution

Make `/generate-tests` the canonical, **flow-aware** entry point for all test generation. Flows (component, feature, deployed-app) are first-class profiles that declare their own authoritative sources, surface shape, chunking rules, and sample templates. Large components decompose into independently-generable chunks via a **living plan doc**. Every agent invocation receives a narrow, explicit **per-chunk context manifest** — no ambient context. Every non-dynamic assertion **cites a source**. Coverage, citation, and reuse are **enforced quality gates**, not suggestions.

`/generate-spec` stays as a thin alias for the fast single-URL case.

## 3. Goals

1. Single entry point for all test generation in the ToolJet monorepo.
2. Exhaustive, non-guessing component test coverage: every config property / style / event / CSA / exposed variable is asserted or surfaced as a gap.
3. Large components (Table, Form, Kanban, Listview, Modal, Container, Tabs) decompose into chunks; each chunk is an independently-runnable spec file.
4. Plan doc lives in repo as the contract of "what is tested for component X", survives component changes, supports diff-update.
5. Anti-hallucination: per-chunk context manifests, source-cited assertions, lint-enforced reuse.
6. Extensible: adding a new flow (plugin, workflow, marketplace) later requires only a flow-registry entry + one reader agent + one sample spec — no orchestrator edits.
7. Backwards-compatible: `/generate-spec <url>` still works.

## 4. Non-Goals (V1)

- **Plugin / marketplace flows** — already owned by `/fix-plugin-spec` and `tj-plugin-generator`. We add a registration slot only; wiring deferred.
- **Workflow flow** — future hook.
- **Deprecating `/generate-spec`** — stays as an alias; no forced migration.
- **Schema-first spec generation** (Approach 3 from brainstorm) — keep scout as selector discoverer; don't rewrite.
- **Auto-generating tests for entirely undocumented components** — if config has no properties/events and docs file missing, pipeline reports "no surface derivable" and stops cleanly.
- **Supporting multiple test runners** — Cypress only.

## 5. Architecture

### 5.1 Flow-aware entry flow

```
/generate-tests [sources...] [--flow=...] [--fast] [--yes] [--spec-only]
      |
      v
STEP 1. Parse args + source auto-detect (existing v1 logic)
      |
      v
STEP 2. Flow detection
        - URL contains /apps/ or /app-builder/  -> component
        - URL contains /users|/groups|/workspace-settings -> feature
        - URL contains /applications/{slug}      -> deployed-app
        - ClickUp/GitHub references marketplace/plugin -> plugin (delegate)
        - Ambiguous / none                       -> ask user
        - --flow=X override always wins
      |
      v
STEP 3. Flow-specific source expansion
        Each flow declares required readers in flow-registry.json.
        Readers run in parallel (existing v1 fan-out pattern).
      |
      v
STEP 4. test-architect synthesizes
        (a) Build surface model from readers' output
        (b) Classify size (heuristic + registry override + user confirm)
        (c) Emit plan doc with per-chunk context manifests
        (d) GATE: user reviews plan (skippable via --yes)
      |
      v
STEP 5. Per-chunk spec generation (sequential, quality-gated)
        For each chunk:
          (a) scout  (with chunk-scoped manifest)
          (b) coder  (with chunk-scoped manifest + sample + grep results)
          (c) runner (with N fix iterations, then fail loudly)
          (d) per-chunk citation + reuse lint
      |
      v
STEP 6. Coverage diff
        Compare generated specs' covered surface against surface model.
        Report gaps per chunk. Exit 1 on unexpected gaps.
      |
      v
STEP 7. Commit plan + specs, emit final report
```

### 5.2 Flow registry

`cypress-tests/cypress/config/test-flow-registry.json`

```json
{
  "flows": {
    "component": {
      "triggers": {
        "url_contains": ["/apps/", "/app-builder/"],
        "manifest_path": null
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
  },
  "schema_version": 1
}
```

**Extension contract:** to add a flow later, append an entry + add one reader agent file + add one sample spec. No orchestrator code changes.

### 5.3 Surface model (component flow)

Derived from config + docs, not DOM:

```yaml
component: Button
surface:
  properties:
    - { name: text,     type: string,   default: "Button", source: button.js:14 }
    - { name: loading,  type: toggle,   default: false,    source: button.js:21 }
    - ...
  styles:
    - { name: background_color, default: "#4368E3", source: button.js:45 }
    - ...
  events:
    - { name: onClick, source: button.js:62, doc: button.md#events }
    - { name: onHover, source: button.js:68, doc: button.md#events }
  exposed_variables:
    - { name: isVisible,  source: button.md#exposed-variables }
    - { name: isLoading,  source: button.md#exposed-variables }
  csa:
    - { name: click,  params: [], source: button.md#component-specific-actions }
    - { name: setText, params: ["text:string"], source: button.md#component-specific-actions }
  nested_variants: []   # empty for flat components
```

For Table, `nested_variants` is populated from the `columns[].type` enum in config (string, number, text, dropdown, multiselect, badge, tag, date, boolean, image, select, link, toggleSwitch, radio) — each variant becomes a potential chunk.

### 5.4 Size classification (component flow only for v1)

**Heuristic:** a component is `large` if ANY of:
- Config has a nested-array property (`columns`, `children`, `tabs`, `cards`, `slides`)
- `>2` distinct DOM-triggered events
- `>1` CSA with parameters (not just no-arg `click()`)
- `>15` properties total

**Registry override:** `cypress-tests/cypress/config/component-test-matrix.json`

```json
{
  "size": {
    "table": "large",
    "form":  "large",
    "kanban": "large",
    "listview": "large",
    "container": "large",
    "modal": "large",
    "tabs": "large",
    "button": "small"
  }
}
```

Registry entries override heuristic. Unlisted components fall back to heuristic.

**Up-front confirmation** (unless `--yes`):
```
Classified Table as LARGE (heuristic: columns[].type enum has 14 values)
Proposed chunks:
  1. table-basic        (core props, styles, pagination, layout)
  2. table-column-string
  3. table-column-number
  4. table-column-dropdown
  ...
  14. table-csa
  15. table-exposed-variables
Proceed, edit, or change classification? [enter / edit / small / abort]
```

### 5.5 Plan doc format (per-chunk context manifest)

`docs/test-cases/components/{name}.md`

```markdown
# Test Plan: Table

**Flow:** component
**Classification:** large (registry override)
**Generated:** 2026-04-19
**Surface version:** config:abc123 docs:def456   <!-- content hashes for diff-on-rerun -->

## Chunk Index
- [ ] 1. table-basic              → tableBasicHappyPath.cy.js
- [ ] 2. table-column-string      → tableColumnStringHappyPath.cy.js
- [ ] 3. table-column-dropdown    → tableColumnDropdownHappyPath.cy.js
...

---

## Chunk 1: table-basic

**Surface covered:**
- properties: pagination_mode, rows_per_page, show_download_button, ...
- styles:     table_type, cell_size, row_height, ...
- events:     onRowClicked, onPageChanged
- exposed:    currentPageData, selectedRow
- csa:        setPage, discardChanges

**Agent context manifest:**
```yaml
scout:
  url: http://localhost:8082/apps/<id>
  focus: "Base table widget with default config, no nested columns"
coder:
  sample:       .claude/context/spec-samples/appbuilder-component.cy.js
  conventions:  .claude/context/cypress-conventions.md
  config_slice: <extracted yaml from button.js surface above>
  docs_slice:   <extracted markdown from table.md sections [properties, events, exposed, csa]>
  grep_scope:
    selectors:  ["table", "pagination", "rows-per-page"]
    texts:      ["table"]
    utils:      ["verifyAndModifyParameter", "verifyLayout"]
  related_specs: [buttonHappyPath.cy.js]  # structural reference only
runner:
  config: cypress.config.js
  retry_budget: 2
```

**Source citations required for:**
- default rows per page value  → source: table.js:{line}
- column type enum             → source: table.js:{line}
- exposed variable names       → source: table.md#exposed-variables

**Acceptance:**
- All listed surface items asserted OR explicitly marked "not-automatable" with reason
- All assertions cite source file + line (or `fake.*`)
- Spec passes in <= 2 runner iterations

---

## Chunk 2: table-column-string
...
```

**Key properties of the plan doc:**
- Committed to git, lives under `docs/test-cases/`
- Re-running `/generate-tests` against an existing plan: diff surface hash, only regenerate chunks whose surface changed
- Editable by humans before approval (add chunks, mark "not-automatable", adjust manifests)
- 1:1 mapping: plan chunk ↔ spec file. Trace-lint rejects drift.

### 5.6 New agents

| Agent | Purpose | Tools | Input | Output |
|---|---|---|---|---|
| `component-config-reader` | Extract surface from `widgets/{name}.js` | Read, Grep, Glob | component name | YAML surface: properties, styles, events, defaults |
| `component-docs-reader` | Extract CSA, exposed variables, data-binding from `docs/widgets/{name}.md` | Read, Grep | component name | YAML surface additions |
| `coverage-verifier` | Diff generated spec covered-surface vs plan surface | Read, Grep, Bash | plan doc + spec paths | gap report |
| `citation-lint` | Verify every non-`fake.*` literal in spec cites a source | Read, Grep | spec path | pass/fail + violations |

Existing agents (scout, coder, runner, test-architect, figma-reader, clickup-reader, github-reader) stay as-is. `test-architect` gains flow-awareness logic.

### 5.7 Quality gates (enforced, not advisory)

| Gate | What | Where enforced | Failure mode |
|---|---|---|---|
| **G1. Coverage diff** | Every surface item in plan is asserted or explicitly marked "not-automatable" | `coverage-verifier` agent, post spec generation | Report gaps in final output; exit 1 on unexpected gaps |
| **G2. Source citation** | Every non-`fake.*` literal traces to a source file line or docs section | `citation-lint` agent, post spec generation | Reject spec; send to coder for re-cite |
| **G3. Selector/text/util reuse** | No duplicate constants; coder must grep existing first | Lint step in coder pre-output + post-file-write check | Reject; coder regenerates using existing |
| **G4. Plan ↔ spec 1:1 trace** | Every plan chunk produces exactly one spec file, named per convention | `test-architect` post-dispatch | Report drift; stop before commit |
| **G5. Sample conformance** | Generated spec matches flow's sample template (describe block, beforeEach shape, cleanup presence) | Regex/AST check pre-runner | Reject; coder regenerates |
| **G6. Runner retry budget** | Max 2 fix iterations, then explicit failure | Existing fix-loop (ported from `/generate-spec`) | Partial report; no silent success |

### 5.8 Anti-hallucination architecture

Per-chunk manifest (see 5.5) is the core defense. Additional rules:

1. **Coder never sees more than one flow's sample.** Ever. No ambient "here are all spec samples".
2. **Coder never sees the full constants directory.** Only grep results for symbols the chunk actually uses.
3. **Scout never sees the config or docs.** Its job is selector discovery; bringing in docs biases toward text values it shouldn't assert.
4. **Scout DOES see Figma / testcase context when the chunk's manifest declares it** (e.g., feature-flow signup journey). The manifest, not a blanket rule, decides.
5. **Planner never sees live DOM.** Config + docs only.
6. **Runner never sees anything beyond spec path + cypress config path.**
7. **Every assertion literal must be traceable.** Inline comment `// source: button.js:28` or `// source: button.md#events` or `// dynamic: fake.randomSentence`. Unattributed literal = G2 failure.

The model is never given a prompt bigger than the chunk requires. A smaller (Haiku-class) model can still succeed because the hallucination surface is tiny.

## 5.9 Auto-Provisioning (added during implementation)

The component flow supports running without a pre-existing URL. If the caller passes only `--component=<name>`, `test-architect` Phase D Step 0 dispatches `manual-tester` to:
1. Log in with `dev@tooljet.io`
2. Create a throwaway app named `autotest-<component>-<timestamp>`
3. Drag the target widget onto the canvas
4. Return the app URL for scout to consume

Phase E Step 6 dispatches `manual-tester` again to delete the provisioned app on success. Cleanup failures log the orphan app name but do not fail the pipeline — the naming convention enables bulk purge.

This reduces end-user flow from "create app manually, then run pipeline" to a single command:

```
/generate-tests --component=button
```

Caller-provided URLs still work and bypass provisioning — existing `/generate-spec <url>` behavior is unaffected.

---

## 6. Backwards-compatible entry: `/generate-spec`

Rewrite `.claude/commands/generate-spec.md` as a thin wrapper:

```
Parse: <url> [description]
Invoke: /generate-tests <url> --fast --spec-only [--hint="<description>"]
```

Behavior: auto-detects flow from URL, runs fast path (skip plan review gate unless `--review`), emits one spec. Existing `/unit-test-spec`, `/fix-plugin-spec` chains unaffected.

## 7. Files to Create / Edit

| Action | File | Purpose |
|---|---|---|
| Edit | `.claude/commands/generate-tests.md` | Add flow detection (step 2), flow registry load, gate logic |
| Edit | `.claude/commands/generate-spec.md` | Rewrite as alias to `/generate-tests --fast --spec-only` |
| Edit | `.claude/agents/test-architect.md` | Flow-aware dispatch, surface model build, chunking, manifest emission |
| Create | `.claude/agents/component-config-reader.md` | New reader agent |
| Create | `.claude/agents/component-docs-reader.md` | New reader agent |
| Create | `.claude/agents/coverage-verifier.md` | New quality gate agent |
| Create | `.claude/agents/citation-lint.md` | New quality gate agent |
| Create | `cypress-tests/cypress/config/test-flow-registry.json` | Flow registry (see 5.2) |
| Create | `cypress-tests/cypress/config/component-test-matrix.json` | Size overrides (see 5.4) |
| Create | `docs/test-cases/components/.gitkeep` | Plan doc folder |
| Create | `docs/test-cases/features/.gitkeep` | Plan doc folder |
| Create | `docs/test-cases/deployed-apps/.gitkeep` | Plan doc folder |

Spec sample files (`appbuilder-component.cy.js`, `platform-feature.cy.js`, `deployed-app.cy.js`) already exist under `.claude/context/spec-samples/` — reused as-is.

## 8. Open Questions / Deferred

1. **Chunk parallelization.** V1 runs chunks sequentially (simpler, predictable output). If CI time becomes a pain, add `--parallel` later. Low risk to defer.
2. **Plan doc location — `docs/` or `cypress-tests/docs/`?** Proposed `docs/test-cases/` to match existing `docs/superpowers/specs/` convention and keep test plans out of cypress-tests noise. Reconsider if teams prefer co-location.
3. **Plan diff on re-run.** Surface hash in plan doc header lets us detect config/docs changes. V1 behavior on surface-hash mismatch: regenerate only changed chunks. Edge cases (chunk renamed, chunk split) — deferred, punt to "abort + regenerate full plan".
4. **Coverage "not-automatable" escape hatch.** Some surface items (complex visual checks, data-binding) genuinely cannot be automated by scout+coder. Plan doc supports `not-automatable: true` + reason; coverage-verifier accepts these as covered. Risk: becomes a dumping ground. Mitigation: CI check that `not-automatable %` doesn't increase per component over time.
5. **Who authors the heuristic / registry initially?** First ~10 large components (Table, Form, Kanban, etc.) seeded by a one-time migration script from existing spec patterns. Unlisted defaults to heuristic.
6. **Flow = `workflow` or `workflows`?** Bikeshed — decide at implementation time.

## 9. Rollout

**Phase 1 (v1 — this design):** Component flow end-to-end on ~3 flat components (Button, TextInput, Checkbox) + 1 large component (Table). Prove plan doc, chunking, manifest, quality gates.

**Phase 2:** Expand to remaining flat components (bulk migration). Expand to remaining large components (Form, Kanban, Listview, Modal, Container, Tabs).

**Phase 3:** Feature flow wiring (mostly already-existing behavior, just register in flow registry). Deployed-app flow stays as-is with registry entry.

**Phase 4 (future):** Plugin flow integration (delegate → native reader). Workflow flow.

## 10. Success Criteria

1. `/generate-tests http://localhost:8082/apps/<buttonApp>` produces: plan doc (1 chunk) + `buttonHappyPath.cy.js` passing, coverage 100%, zero unattributed literals, uses existing selectors/texts/utils where they exist.
2. `/generate-tests http://localhost:8082/apps/<tableApp>` produces: plan doc (N chunks) after classification confirmation, `tableBasicHappyPath.cy.js` + per-column-type spec files, each passing, each with coverage report.
3. `/generate-spec http://localhost:8082/apps/<buttonApp>` behaves identically to today's fast path (scout → coder → runner, one spec) — backwards-compatible.
4. Re-running on unchanged surface hash: pipeline reports "no regeneration needed" in seconds.
5. Running with Haiku-class model (or equivalent): success rate on flat component ≥ 95%, no hallucinated assertions (verified by citation lint).

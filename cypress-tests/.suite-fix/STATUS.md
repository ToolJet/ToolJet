# AppBuilder Cypress Suite — Overnight Fix Status

Started: 2026-06-19 (overnight run)
Branch: `test/cypress-real-dnd-drag-fix`
Server: http://localhost:8082 (must stay up)

## Guardrails
- Never weaken/gut assertions to force green.
- Legitimate fixes only: selectors, waits, changed flows, drag command.
- Real product regression or correctly-failing assertion → QUARANTINE (`.skip` + `// QUARANTINED: reason`) and report.
- Serial runs only (one shared DB).
- Max 3 fix attempts per spec, then quarantine.

## Legend
⬜ todo · 🔄 in progress · ✅ pass · 🟡 partial · ⛔ quarantined · ❌ blocked

## Spec Status (21 active)
| # | Spec | Status | Notes |
|---|------|--------|-------|
| 1 | components/buttonHappyPath | 🟡 | 1/7 pass (deletion ✓ via config-handle fix). Remaining drift: widget-accordion-general, #inspector-tab-styles, add-event-handler, yes-button, positional assert (674 vs 100). Big old spec — needs dedicated pass. |
| 2 | components/componentDuplicationHappypath | ⬜ | |
| 3 | components/componentsBasicHappypath | ⬜ | |
| 4 | components/csa | ⬜ | |
| 5 | components/datePickerHappyPath | ⬜ | |
| 6 | components/listViewHappyPath | ⬜ | |
| 7 | components/modalHappyPath | ⬜ | |
| 8 | components/numberInputHappyPath | ⬜ | |
| 9 | components/passwordInputHappyPath | ⬜ | |
| 10 | components/tableRegression | ⬜ | |
| 11 | components/textHappyPath | ⬜ | |
| 12 | multipage/multipageHappypath | ⬜ | |
| 13 | newSuits/appTitle | ⬜ | |
| 14 | newSuits/componentsBasics/button | ✅ | 2 pass / 1 pending (CSA .skip). Stable over 3 runs. Inspector + events fixes below |
| 15 | newSuits/componentsBasics/checkbox | ✅ | 1 pass / 2 pending (events+CSA pre-existing .skip). Only needed testIsolation:false + cy.hideTooltip() |
| 16 | newSuits/componentsBasics/numberInput | ✅ | 1 pass / 2 pending (events+CSA pre-existing .skip). Only needed testIsolation:false + cy.hideTooltip() |
| 17 | newSuits/componentsBasics/textInput | ✅ | 1 pass / 2 pending (events+CSA pre-existing .skip). Only needed testIsolation:false + cy.hideTooltip() |
| 18 | newSuits/globalSetingsHappyPath | ⬜ | |
| 19 | newSuits/inspectorHappypath | ⬜ | |
| 20 | newSuits/queries/chainingOfQueries | ⬜ | |
| 21 | component-new/image | ⬜ | |

## CRITICAL root cause — drag command itself (fixed)
The real-dnd drag was creating NO component (probe: `draggable-widget-button1: no`).
Chain of causes, all now handled in `commands.js dragAndDropWidget`:
1. Canvas drop position comes from `useGridStore.getGhostDragPosition()` (appCanvasUtils), NOT react-dnd coords. `useGridStore` is NOT on `window`, so the old (and my first) manual ghost injection was a silent no-op.
2. The FIRST real-drag of a spec run silently loses its CDP intercept (cypress-real-dnd arms `Input.setInterceptDrags` lazily) → react-dnd fires but no component. Warms up after first attempt.
3. The components panel button is a TOGGLE, and the drag's `isDragging` effect (DragLayer.jsx) async-flips the sidebar — racing any panel open/close.
FIX: retry full open→search→drag until a new `[data-cy^=draggable-widget-]` appears (max 3); self-healing `ensureComponentsPanelOpen` (presence-based, re-click until search box rendered); 1200ms settle. VALIDATED: 1st drag now creates the widget. ✅

## SHARED FIXES APPLIED (knowledge base for remaining specs)
1. **Drag command** (`commands.js dragAndDropWidget`) — FULLY REWORKED. cypress-real-dnd + (a) self-healing `ensureComponentsPanelOpen` (presence of `widget-search-box-search-bar` = panel open; re-click toggle until open), (b) source selector requires `.draggable-box[draggable="true"]:has(widget-list-box-X)` + assert exists (react-dnd connector timing), (c) `cy.realDragInit()` before drag (arms CDP intercept; else "No dragIntercepted" throw), (d) retry full open→search→drag up to 3× until a new `[data-cy^=draggable-widget-]` appears (cold-intercept first-drag silent miss), (e) 1200ms settle. Position comes from `useGridStore.getGhostDragPosition()` which is NOT on window — don't try to inject it.
2. **events.js** — popover model: `add-event-handler` (popover trigger) → `add-event-menu` → `event-trigger-option-<value>` (pick by visible label, case-insensitive) → `event-handler-card` → `popover-card` → `action-selection` is a RocketSelect (`role=option` items). Intercept changed from `PUT "events"` → `cy.intercept(/\/events(\/|\?|$)/)` (real API is POST `/events` + PATCH `/events/:id`). `chooseRocketOption` helper added. NOTE: `changeEventType` still uses OLD `event-handler`/`event-selection` — fix when a spec needs it.
3. **Tooltip** — replace raw `cy.get(".tooltip-inner").invoke("hide")` with `cy.hideTooltip()` (guarded). 13 files have the raw pattern.
4. **inspector.js** `openNode` timeout 1000→15000ms. Tree node types: queries/components/globals/variables/page/constants. `inspector-<type>-expand-button` exists at level 1.
5. **LEFT INSPECTOR OPEN — ROOT CAUSE FOUND & FIXED.** `commonWidgetSelector.sidebarinspector` was `[data-cy='left-sidebar-inspector']`, which is on the OUTER sidebar wrapper div (LeftSidebar.jsx:236), NOT the clickable Inspector button. The button is a `SidebarItem` whose data-cy is generated from its tip: `left-sidebar-${generateCypressDataCy("Inspector")}-button` = `left-sidebar-inspector-button` (SidebarItem.jsx:49). Clicking the wrapper div is a no-op, so the panel never opened and `inspector-components-expand-button` was never found. FIX: `sidebarinspector` now points at `[data-cy='left-sidebar-inspector-button']` (constants/selectors/common.js:400). Shared — used by ~15 specs; the change is strictly more correct (clicks the real button). button.cy.js test1 now passes.
6. **CONFIG HANDLE selectors changed.** `widgetConfigHandle` (`-config-handle`) is STALE. Current canvas config handle (ConfigHandle.jsx) exposes per-component buttons: `<name>-inspect-button` (opens LEFT state inspector for that component), `<name>-properties-styles-button` (opens RIGHT Inspector: `setRightSidebarOpen(true)` + CONFIGURATION tab, ConfigHandle.jsx:277-288), `<name>-delete-component-button`. To open a component's right Events/Properties panel: hover `draggable-widget-<name>` then click `<name>-properties-styles-button`. The drag leaves the widget selected but the RIGHT inspector can be collapsed — relying on it is flaky, open it explicitly.
7. **events.js selectEvent — two more fixes** (after the popover rewrite): (a) `event-handler-card` is the Radix popover trigger; gate the "open the popover" re-click on `data-state !== "open"` and FORCE the click (open Radix popover sets `body{pointer-events:none}` scroll-lock, which blocks a normal click). (b) A new handler is created with `actionId:'show-alert'` already set (EventManager.jsx:441), so re-picking "Show Alert" fires NO PATCH /events — the post-action `cy.wait("@events")` must be skipped for the default action or it hangs 30s. Now skipped when action matches /^show alert$/i. (c) `addSupportCSAData` now ensures the popover-card is open (reopen last `event-handler-card` if the `<field>-input-field` is absent) before typing — RocketSelect action pick can momentarily re-render/close the popover.

## Useful run command
`npx cypress run --browser chrome --headless --spec "<path>" --config baseUrl=http://localhost:8082`
Backend API is on :3000, UI on :8082. 409 on POST /api/apps = duplicate app name (test data pollution) → just re-run.

## Root-cause findings (shared utils)
- ✅ FIXED `events.js` `selectEvent`/`addMultiEventsWithAlert`: event flow rewritten to popover model. Old `event-handler` row + `event-selection` dropdown → new `add-event-handler` (popover trigger) → `event-trigger-option-<value>` → `event-handler-card` → `action-selection`. Blast radius: 12 specs. Validating via button.cy.js.
- 🔄 INVESTIGATING `inspector.js` `openNode`/`openAndVerifyNode`/`verifyNodeData`: button.cy.js "exposed values on inspector" test failing (attempts 1-2). Uses `[data-cy="inspector-<node>-expand-button/-label/-value"]`. Blast radius: 8 specs. Need exact failure from run.
- NOTE: `changeEventType` (events.js) still uses old `[data-cy="event-handler"]` — fix pending validation of selectEvent hypothesis.

## Run log
- baseline button.cy.js: 0 pass / 2 fail / 1 pending, 3m40s. Drag worked; failed at event handler step.

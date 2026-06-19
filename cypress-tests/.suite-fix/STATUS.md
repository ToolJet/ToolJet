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
| 8 | components/numberInputHappyPath | ⛔ | exit 0, 4 pending. All 4 quarantined (CSA + preview were/are .skip; properties + styles QUARANTINED by me after deep progress). Shared fixes landed (benefit ~15 specs): Styles tab `#inspector .nav-link:eq(1)`; accordion data-cy space→hyphen; `inspector-close-button`; color-picker "Color picker" ToggleGroup (`togglr-button-color`) + dismiss-between-swatches. Properties blocker: helper `value.match is not a function` deep in old validation flow. Styles blocker: `make-this-field-mandatory-toggle-button` is in Properties tab-pane (hidden while Styles active). Both are large legacy tests needing dedicated per-test rewrites vs the 2-tab inspector — same class as buttonHappyPath. |
| 9 | components/passwordInputHappyPath | ⛔ | exit 0, 4 pending. STRUCTURALLY IDENTICAL to numberInputHappyPath (same shared helpers). All 4 quarantined (preview was .skip; properties/styles/CSA QUARANTINED by me). Same blockers + same shared fixes benefit it (color picker carried styles deep). properties: `value.match` in old validation flow. styles: `make-this-field-mandatory-toggle-button` hidden in Properties tab-pane. CSA: 7-drag post-popover flakiness. Spec-local lowercase-rename applied. |
| 10 | components/tableRegression | ⬜ | |
| 11 | components/textHappyPath | 🟡 | exposed-values ✅ (1 pass, exit 0). Rewrote it to working openAndVerifyNode/verifyNodes/verifyNodeData (spec imported nonexistent verifyValue/verifyfunctions). text default = "Hello The👋" (dev user firstName="The", text.js:305). CSA ⛔ QUARANTINED: wiring fully fixed (selectEvent opens right Inspector via config handle; selectCSA rewritten for OptionCombobox popover — see SHARED FIX 8; "Set visibility" label vs stale "Visibility") but 2nd in-test drag flakes "No dragIntercepted" after popover even with cy.realDragInit(). Same reason all other CSA tests are .skip. |
| 12 | multipage/multipageHappypath | ⬜ | |
| 13 | newSuits/appTitle | 🟡 | Title asserts FIXED (dashboard/editor/preview), verified vs whiteLabelling.js+useAppData.js. Fixes: `releaseApp` is exported fn not cy cmd (import+call); workspace slug≠workspaceId UUID → assert `not.include /apps/`; preview of UNRELEASED app has NO "Preview - " prefix (useAppData passes no `preview` flag) → `${appName} | ToolJet`. ⛔ release tail QUARANTINED: EE multi-env appPromote/releaseApp utils target OLD promote UI; new VersionManagerDropdown needs PUBLISHED+selected version — needs dedicated EE-release util rewrite. |
| 14 | newSuits/componentsBasics/button | ✅ | 2 pass / 1 pending (CSA .skip). Stable over 3 runs. Inspector + events fixes below |
| 15 | newSuits/componentsBasics/checkbox | ✅ | 1 pass / 2 pending (events+CSA pre-existing .skip). Only needed testIsolation:false + cy.hideTooltip() |
| 16 | newSuits/componentsBasics/numberInput | ✅ | 1 pass / 2 pending (events+CSA pre-existing .skip). Only needed testIsolation:false + cy.hideTooltip() |
| 17 | newSuits/componentsBasics/textInput | ✅ | 1 pass / 2 pending (events+CSA pre-existing .skip). Only needed testIsolation:false + cy.hideTooltip() |
| 18 | newSuits/globalSetingsHappyPath | ⬜ | |
| 19 | newSuits/inspectorHappypath | ⛔ | All 3 tests QUARANTINED (were already .skip). Spec targets the OLD flat inspector; current inspector is 2-layer tree+detail (Node.jsx tree `inspector-<type>-expand-button`/`-subnode-label`; only level!==1 subnodes open a JSONViewer detail with `inspector-<key>-label`/`-value` per Row.jsx). openAndVerifyNode/verifyNodeData + deleteComponentFromInspector helpers no longer map (Delete Component is enableInspectorTreeView:false). Applied structural fixes: testIsolation:false + cy.hideTooltip(). Needs full inspector.js helper rewrite + live DOM. |
| 20 | newSuits/queries/chainingOfQueries | ⬜ | |
| 21 | component-new/image | ⛔ | All 3 tests QUARANTINED. Spec is hard-wired to a REMOTE fixture app (appbuilder-v3-lts-eetestsystem.tooljet.com/applications/image-app-automation) that no longer exists → redirects to /error/invalid-link (404 app-authentication-config + 403 session). Blocked by missing EXTERNAL test data, not selector drift. Also removed `{baseUrl:null}` (broke the @cypress/code-coverage after-all hook). Spec now clean: 3 pending, exit 0. |

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
9. **Styles tab selector** (`buttonStylesEditorSideBar` common.js) — `#inspector-tab-styles` (react-bootstrap id) is STALE. Inspector tabs are now custom ToolJetUI `<Tabs id="inspector">` (Tabs.jsx) — each tab a `button[role="tab"]` with only a `.tab-label`, no id/data-cy. Two tabs (Properties, Styles — Inspector.jsx:594-599); Styles is `#inspector .nav-link:eq(1)`.
10. **Accordion data-cy** (`accordion()` common.js) — AccordionItem.js:38 builds `widget-accordion-${title.toLowerCase().replace(/\s+/g,'-')}`; multi-word titles need spaces→hyphens (e.g. "Additional actions" → `widget-accordion-additional-actions`). Helper now replaces spaces.
11. **Inspector close button** (`buttonCloseEditorSideBar` common.js) — `inspector-close-icon` → `inspector-close-button` (Inspector.jsx:707). NOTE side effect: `editAndVerifyWidgetName` (commonWidget.js:103) now actually CLOSES the right inspector — callers must reopen it (openEditorSidebar) before touching accordions.
12. **Style colour picker** (`selectColourFromColourPicker` commonWidget.js) — popover now opens on a Theme/Color-picker `ToggleGroup` (ee ColorSwatches.jsx:99-118). Default may be "Theme" swatches (no react-color SketchPicker → no `rc-editable-input`). FIX: after opening the swatch, click `[data-cy="togglr-button-color"]` (ToggleGroupItem.jsx:13, `togglr-button-${value}`) to reveal the editable hex/rgba inputs. ALSO the large SketchPicker popover overlaps the NEXT swatch — dismiss it (click canvas topRight) at the end of each call or the following swatch click is "covered".
13. **Component name → data-cy casing** — component names are saved verbatim (Inspector.jsx:237, no lowercasing) and the canvas widget data-cy is `draggable-widget-${component.name}` (RenderWidget.jsx:95,308). `draggableWidget()` lowercases via cyParamName, so specs renaming to a capitalized `fake.widgetName` (e.g. "Jamey") never match `draggable-widget-jamey`. Rename to a lowercased name.
8. **events.js selectCSA — REWRITTEN for OptionCombobox.** The CSA Component/Action fields (`action-options-component-selection-field`, `action-options-action-selection-field`) now wrap a Rocket `Combobox` (shared.jsx `OptionCombobox` → ComboboxInput + portalled `role="option"` listbox), NOT a react-select with one typeable input. Old `.find("input").type(...)` threw `cy.type() can only be called on a single element` (InputGroup nests >1 input). New `pickComboboxOption(fieldSelector,label)` helper: click field → type into `.first():visible` input to filter → click exact `role="option"`. Also: CSA action display names come from the widget config `actions[].displayName` (e.g. Text = "Set visibility"/"Set text"/"Clear"/"Set loading"/"Set disable") — specs carrying old bare labels like "Visibility" must use the real label.
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
- appTitle.cy.js: title asserts (dashboard/editor/preview) FIXED & verified; release tail quarantined (EE multi-env flow drift). Final: 1 pending, exit 0.
- inspectorHappypath.cy.js: 3 tests quarantined — spec targets OLD flat inspector; current is 2-layer tree+detail (helpers no longer map). Applied testIsolation:false + hideTooltip. Final: 3 pending, exit 0.
- image.cy.js: 3 tests quarantined — remote fixture app (image-app-automation) gone → /error/invalid-link. Removed {baseUrl:null} (broke code-coverage after-all hook). Final: 3 pending, exit 0.

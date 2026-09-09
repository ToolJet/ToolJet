---
component_type: MultiselectV2
baseline: lts-3.16
contract_status: verified
development_type: existing-widget
product_approval: "User approved 2026-09-04 in this Codex thread. Re-approved the same day after answering D-01 through D-14."
test_design_approval: "User approved SEL-001, LIMIT-001, OPT-001, and ACT-001 on 2026-09-04; SRCH-001..SRCH-004, PLH-001, CLR-001, STATE-001, OPT-002, EXP-001, and FORM-001 in later passes the same day; and the complete remaining set (FORM-002, ALL-001..003, OPT-004, LOAD-002, VAL-002, VAL-003, EVT-002, ICON-001, STATE-006, STATE-007, BRW-003, plus the STATE-001 and ACT-001 splits) on 2026-09-04 with the D-01..D-14 answers."
research_context7: "ToolJet official documentation, docs/widgets/multiselect.md, retrieved 2026-09-04 via Context7 /tooljet/tooljet: On select, selected values/options, clear(), selectOptions(array), deselectOptions() with no arguments to clear all selections, and visibility/loading/disabled actions."
research_git_history: "git log --since='2 years ago' --all over MultiselectV2 runtime/config/docs: 813a3bf7e469 max selection limit (2026-04-30); 6594e76b1f51 boolean labels (2026-03-06); d4dd17e6575 value-container ResizeObserver/mobile interaction (2025-12-24); 2d9d9ec2a858 client/server search (2026-06-24); 180f3a9672b controlled-widget migration (2026-07-06); 32f782ea6dd docs changed deselectOptions to the no-argument clear-all contract (2024-12-17)."
prd_source:
sibling_contracts: src/test/app-builder/widgets/DropdownV2/TESTING.md, src/test/app-builder/widgets/RadioButtonV2/TESTING.md
---

# MultiselectV2 testing contract

## Research findings

| Finding | Source | Disposition |
| --- | --- | --- |
| Configured options are filtered for visibility and may carry captions and disabled state | ToolJet Multiselect docs; runtime option mapping | covered:MultiselectV2-SEL-001,MultiselectV2-OPT-001 |
| Multi-selection is published as `values` plus semantic `selectedOptions` | ToolJet Multiselect docs; `MultiselectV2.jsx:396-404` | covered:MultiselectV2-SEL-001,MultiselectV2-ACT-001 |
| Docs changed `deselectOptions` to a no-argument clear-all in 2024 while the runtime kept only the array path | `32f782ea6dd`; Context7 docs vs. runtime | covered:MultiselectV2-ACT-002 |
| Max selection limit added with a saved-app migration | `813a3bf7e469` (2026-04-30) | covered:MultiselectV2-LIMIT-001 |
| Boolean option labels crashed or rendered unreadably | `6594e76b1f51` (2026-03-06) | covered:MultiselectV2-OPT-002 |
| Value-container ResizeObserver and mobile interaction changes | `d4dd17e6575` (2025-12-24) | qa:MultiselectV2-BRW-003 |
| Client/server search mode added across definition, runtime, and server config | `2d9d9ec2a858` (2026-06-24) | covered:MultiselectV2-SRCH-001,MultiselectV2-SRCH-002,MultiselectV2-SRCH-003,MultiselectV2-SRCH-004 |
| Controlled-widget migration | `180f3a9672b` (2026-07-06) | covered:MultiselectV2-SEL-001 |
| The properties schema declares `value`, while the definition and the runtime both use `values` | Registered definition (`properties.value`, `definition.properties.values`); `MultiselectV2.jsx:218-282` | none:dead-config |
| `option` is a PARAM handle of the `selectOptions` action, not an action of its own | Registered definition | none:param-handle |
| The widget consumes both Form signals: `useShowValidationOnFormSubmit` and `useFormClear` | `MultiselectV2.jsx:92`, `:409` | covered:MultiselectV2-FORM-001,MultiselectV2-FORM-002 |
| `clear()` empties the selection through `setInputValue([])`, the same path the Form clear signal uses | `MultiselectV2.jsx:277`, `:409` | covered:MultiselectV2-ACT-003,MultiselectV2-FORM-001 |
| The clear indicator has no accessible name, so a test can only locate it by the first-party `clear-indicator` class | Measured 2026-09-04; D-04 assigns naming to the shared DropdownV2 `CustomClearIndicator` | covered:MultiselectV2-CLR-001 |
| react-select renders no clear indicator for an EMPTY control whatever `showClearBtn` says | Found by a fault that failed to fail on 2026-09-04 | covered:MultiselectV2-CLR-001 |
| The widget publishes `undefined` for `isLoading`/`isDisabled` when a definition omits those properties | Found while writing `EXP-001` on 2026-09-04 | none:seeding-artifact |

## Registered-surface disposition

| Registered key | Kind | Disposition |
| --- | --- | --- |
| `label` | property | covered:MultiselectV2-SEL-001,MultiselectV2-OPT-001 |
| `options` | property (definition) | covered:MultiselectV2-SEL-001,MultiselectV2-OPT-001,MultiselectV2-LIMIT-001 |
| `advanced`, `schema` | property | covered:MultiselectV2-OPT-001 |
| `maxLimit` | property | covered:MultiselectV2-LIMIT-001 |
| `value` | property (schema-only) | none:dead-config |
| `values` | property (definition) | covered:MultiselectV2-OPT-001 |
| `placeholder` | property | covered:MultiselectV2-PLH-001 |
| `showAllOption` | property | covered:MultiselectV2-ALL-001,MultiselectV2-ALL-003 |
| `showAllSelectedLabel` | property | covered:MultiselectV2-ALL-002 |
| `sort` | property | covered:MultiselectV2-OPT-004 |
| `showClearBtn` | property | covered:MultiselectV2-CLR-001 |
| `showSearchInput` | property | covered:MultiselectV2-SRCH-001,MultiselectV2-SRCH-002 |
| `serverSideSearch` | property | covered:MultiselectV2-SRCH-003 |
| `optionsLoadingState` | property | covered:MultiselectV2-LOAD-002 |
| `loadingState` | property | covered:MultiselectV2-STATE-001 |
| `visibility` | property | covered:MultiselectV2-STATE-001 |
| `disabledState` | property | covered:MultiselectV2-STATE-001 |
| `collapseWhenHidden` | property | qa:MultiselectV2-BRW-001 |
| `tooltip`, `tooltipFormat` | property | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| `validation.mandatory` | validation | covered:MultiselectV2-VAL-001 |
| `validation.customRule` | validation | covered:MultiselectV2-VAL-002 |
| `minSelection`, `maxSelection` | validation (store-side only) | shared:src/AppBuilder/_stores/slices/__tests__/integration/validateWidget.spec.js#MultiselectV2-VAL-003 |
| `onSelect` | event | covered:MultiselectV2-SEL-001 |
| `onSearchTextChanged` | event | covered:MultiselectV2-SRCH-004 |
| `onFocus`, `onBlur` | event | covered:MultiselectV2-EVT-002 |
| `selectOptions` | action | covered:MultiselectV2-ACT-001,MultiselectV2-LIMIT-001 |
| `deselectOptions` | action | covered:MultiselectV2-ACT-002 |
| `clear` | action | covered:MultiselectV2-ACT-003 |
| `setVisibility`, `setLoading`, `setDisable` | action | covered:MultiselectV2-STATE-001,MultiselectV2-STATE-006,MultiselectV2-STATE-007 |
| `searchText` | exposed variable (declared) | covered:MultiselectV2-SRCH-002,MultiselectV2-SRCH-003,MultiselectV2-EXP-001 |
| `values`, `selectedOptions`, `options`, `label`, `isValid`, `isMandatory`, `isLoading`, `isVisible`, `isDisabled` | exposed variable (runtime, `MultiselectV2.jsx:282-313`) | covered:MultiselectV2-EXP-001 |
| `showOnDesktop`, `showOnMobile` | other | qa:MultiselectV2-BRW-002 |
| `labelColor`, `labelFontSize`, `alignment`, `direction`, `auto`, `labelWidth`, `widthType` | style | none:computed-css |
| `fieldBackgroundColor`, `fieldBorderColor`, `accentColor`, `selectedTextColor`, `errTextColor`, `iconColor`, `fieldBorderRadius`, `boxShadow`, `padding` | style | none:computed-css |
| `icon` | style | covered:MultiselectV2-ICON-001 |
| `iconVisibility` | style (definition only) | covered:MultiselectV2-ICON-001 |

## Production-behavior inventory

| Dimension | Status | Disposition |
| --- | --- | --- |
| Initial/default value and rendering | `MultiselectV2-OPT-001` verifies configured schema defaults resolve to matching visible options. | covered:MultiselectV2-OPT-001 |
| User interactions and keyboard behavior | `MultiselectV2-SEL-001` covers accessible menu selection; keyboard opening/closing is a separate browser/layout-adjacent concern pending product priority. | covered:MultiselectV2-SEL-001 |
| Dynamic bindings and property changes | `MultiselectV2-OPT-001` covers resolved dynamic schema options and their selected defaults. | covered:MultiselectV2-OPT-001 |
| Exposed variables, actions, and events | `EXP-001`, `SEL-001`, `ACT-001`..`ACT-003`, and `EVT-002` cover the published surface, selection actions, and focus/blur. | covered:MultiselectV2-EXP-001,MultiselectV2-SEL-001,MultiselectV2-ACT-001,MultiselectV2-EVT-002 |
| Validation and Form lifecycle | `VAL-001`/`VAL-003` at the store seam; `VAL-002` surfaces custom-rule; `FORM-001`/`FORM-002` cover Form clear and submit. | covered:MultiselectV2-FORM-001,MultiselectV2-FORM-002,MultiselectV2-VAL-002 |
| Loading, disabled, and visibility states | `STATE-001` covers the three CSAs against DOM and flags; `LOAD-002` covers the options-only spinner. | covered:MultiselectV2-STATE-001,MultiselectV2-LOAD-002 |
| Empty, falsy, invalid, and boundary values | `SEL-001` includes empty selection; `OPT-002` covers false/0/empty-string values and boolean labels. | covered:MultiselectV2-SEL-001,MultiselectV2-OPT-002 |
| Editor/Viewer consistency | No independent issue or release contract identifies a viewer-specific risk. | none:platform-owned |
| Saved-app compatibility | `LIMIT-001` protects the import-compatible maxLimit behavior introduced with migration `813a3bf7e469`. | covered:MultiselectV2-LIMIT-001 |
| Accessibility | `SEL-001` uses roles and selected state as the semantic observable; full keyboard/browser accessibility is QA-owned when prioritized. | covered:MultiselectV2-SEL-001 |
| State precedence (CSA versus property) | `STATE-006` (unrelated property) and `STATE-007` (no-op rewrite of the paired property) over setDisable/disabledState, setVisibility/visibility, setLoading/loadingState. | covered:MultiselectV2-STATE-006,MultiselectV2-STATE-007 |
| Browser-only layout/geometry | ResizeObserver overflow chips, mobile touch, and menu placement at the viewport edge. | qa:MultiselectV2-BRW-003 |

## Existing-test audit

| Existing case | Disposition | Evidence and required change |
| --- | --- | --- |
| `validateWidget.spec.js`: mandatory `[]` and custom-rule cases for `MultiselectV2` | Keep | Generic validation is already protected at the real store-contract seam; do not duplicate it in widget RTL. |
| `validateWidget.spec.js`: minSelection/maxSelection | Keep | Retagged 2026-09-04 as `MultiselectV2-VAL-003`; the both-bounds valid case was added in the same change. |
| MultiselectV2 rendering, event, or action integration coverage | New | Co-located at `Widgets/MultiselectV2/__tests__/integration/MultiselectV2.spec.jsx`. |

## Combination matrix

| Combination | Why it can break | Disposition |
| --- | --- | --- |
| `maxLimit` x Select all | Select all is disabled when the limit is below the option count; a click that ignored that would exceed the limit. | covered:MultiselectV2-ALL-001 |
| `maxLimit` x `selectOptions` | The imperative path has its own slice; a menu-only limit would let a CSA exceed it. | covered:MultiselectV2-LIMIT-001 |
| Client search filter x Select all | Select-all writes `selectOptions` (the unfiltered list), so a filtered menu still selects everything. | covered:MultiselectV2-ALL-003 |
| `serverSideSearch` x client filter | Server mode must skip the client `filterOption` so query-returned rows stay visible. | covered:MultiselectV2-SRCH-003 |
| Form `clearForm` x a non-default selection | The clear signal must empty values the user chose, not restore schema defaults. | covered:MultiselectV2-FORM-001 |
| Form submit x `validation.mandatory` | Submit must reveal the mandatory message with no prior interaction. | covered:MultiselectV2-FORM-002 |
| `setDisable` x `disabledState` | CSA-versus-property: the action must survive an unrelated re-resolve and a no-op rewrite of its pair. | covered:MultiselectV2-STATE-006,MultiselectV2-STATE-007 |
| `setVisibility` x `visibility` | Same precedence class as disable, different local state and DOM. | covered:MultiselectV2-STATE-006,MultiselectV2-STATE-007 |
| `setLoading` x `loadingState` | Same precedence class as disable, different local state and DOM. | covered:MultiselectV2-STATE-006,MultiselectV2-STATE-007 |
| Falsy `[false]` x `validation.mandatory` | An array holding only `false` is a filled field; `[]` is empty. | covered:MultiselectV2-VAL-001 |
| `showClearBtn` x an empty control | react-select renders no clear indicator for an empty control whatever the config says. | covered:MultiselectV2-CLR-001 |
| `optionsLoadingState` x `advanced` | The runtime only forwards the spinner flag when dynamic options are on. | covered:MultiselectV2-LOAD-002 |
| `optionsLoadingState` x `loadingState` | Only `loadingState` may reach `aria-busy` / `isLoading`. | none:duplicate-of:MultiselectV2-LOAD-002 |
| `showAllOption` x `showAllSelectedLabel` | A full selection must show the all-selected label rather than joined option text. | covered:MultiselectV2-ALL-002 |
| `validation.customRule` x first interaction | The message is gated on `userInteracted`; a failing rule is silent until then. | covered:MultiselectV2-VAL-002 |
| `icon` x `iconVisibility` | The icon renders only when both the icon is set and visibility is on. | covered:MultiselectV2-ICON-001 |
| `onFocus` x `onBlur` (toggle vs click-outside) | Two distinct close paths must each fire `onBlur` once. | covered:MultiselectV2-EVT-002 |
| `sort` x option source order | `none` must preserve source order rather than collapsing onto `asc`. | covered:MultiselectV2-OPT-004 |
| A state CSA x an unrelated property re-resolve | Same as the three action-vs-property rows. | none:duplicate-of:MultiselectV2-STATE-006 |
| A state CSA x a no-op rewrite of its own paired property | Same as the three action-vs-property rows. | none:duplicate-of:MultiselectV2-STATE-007 |
| `visibility` x `collapseWhenHidden` | Implemented one layer up in `RenderWidget`; real layout collapse. | qa:MultiselectV2-BRW-001 |
| `tooltip`/`tooltipFormat` x the canvas wrapper | Shared `RenderWidget` tooltip spec. | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| `others.showOnDesktop`/`showOnMobile` x `currentLayout` | Real viewport behavior. | qa:MultiselectV2-BRW-002 |

## Decisions

Every ambiguity ends here with an `Answer`. A decision without one blocks `spec-complete`.

### D-01 Is there a browser contract for the value-container ResizeObserver, mobile interaction, and menu placement?

- Raised by: the `d4dd17e6575` finding and the Browser-only layout/geometry dimension
- Recommendation: record a `qa:` browser scenario — QA debt with no written scenario disappears
- Answer: Write the Browser/QA scenario section with acceptance criteria: value-container overflow shows `+N` chips via ResizeObserver, mobile touch opens the menu, menu placement flips at viewport edge (regression `d4dd17e6575`) (user, 2026-09-04).
- Unblocks: MultiselectV2-BRW-003

### D-02 The properties schema declares `value` while the definition and runtime use `values` — cleanup or declare?

- Raised by: the `value` surface row
- Recommendation: remove the dead `value` key; nothing reads it under that name
- Answer: Keep it as dead configuration; no schema edit (user, 2026-09-04).
- Unblocks: none:dead-config

### D-03 Should `useShowValidationOnFormSubmit` (validation revealed on Form submit) have a scenario for this widget?

- Raised by: the Form-signals finding
- Recommendation: yes — the widget consumes the signal; `FORM-001` only covers Form clear
- Answer: Yes (user, 2026-09-04) — mandatory + nothing selected inside a real Form via `widget.renderInsideForm`, submit, error message renders and `isValid` false without prior interaction.
- Unblocks: MultiselectV2-FORM-002

### D-04 Should the clear indicator carry an accessible name?

- Raised by: the clear-indicator finding — a test can locate it only by the first-party `clear-indicator` class
- Recommendation: yes, name the affordance; then `CLR-001` can query it semantically
- Answer: Yes (user, 2026-09-04). Production is owned by the DropdownV2 agent adding `aria-label="Clear selection"` to the shared `CustomClearIndicator`. No new Multiselect scenario.
- Unblocks: covered:MultiselectV2-CLR-001

### D-05 Is the select-all family (`showAllOption`, `showAllSelectedLabel`) in scope, and does the harness stop pinning `showAllOption` to `false`?

- Raised by: two surface rows
- Recommendation: in scope — select-all changes what every other selection scenario means
- Answer: Yes (user, 2026-09-04) — Select-all toggles every visible enabled option and respects `maxLimit`; `showAllSelectedLabel` shows the all-selected label; select-all under an active client search is characterised.
- Unblocks: MultiselectV2-ALL-001, MultiselectV2-ALL-002, MultiselectV2-ALL-003

### D-06 Does `sort` need a scenario?

- Raised by: the `sort` surface row
- Recommendation: yes — option order is user-visible and `DropdownV2-OPT-004` already protects the sibling
- Answer: Yes (user, 2026-09-04) — `asc`/`desc` order options by label; `none` preserves source order.
- Unblocks: MultiselectV2-OPT-004

### D-07 Is the options-only spinner (`optionsLoadingState`) a product behavior to protect separately from `loadingState`?

- Raised by: the `optionsLoadingState` surface row
- Recommendation: yes — independently configurable and independently observable
- Answer: Yes (user, 2026-09-04) — menu shows a loading indicator and no options while true; options after false; the control is not `aria-busy`.
- Unblocks: MultiselectV2-LOAD-002

### D-08 Who writes the shared-layer tests for `collapseWhenHidden`, `tooltip`/`tooltipFormat`, and `showOnDesktop`/`showOnMobile`?

- Raised by: three surface rows whose behavior lives in `RenderWidget` and `WidgetWrapper`
- Recommendation: one shared spec at that layer, referenced by `shared:` from every widget contract
- Answer: Split by where the behavior is observable (user, 2026-09-04, answered once on RadioButtonV2 `D-02` for all three contracts). `tooltip`/`tooltipFormat` is plain DOM, so Engineering owns one shared spec at the `RenderWidget` layer — written on 2026-09-04 as `src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx` — and every widget contract points at it with `shared:`. `collapseWhenHidden` and `showOnDesktop`/`showOnMobile` are real layout collapse and viewport behavior, so both are QA-owned browser scenarios in each widget contract.
- Unblocks: the tooltip row becomes `shared:`; `collapseWhenHidden` becomes qa:MultiselectV2-BRW-001 and `showOnDesktop`/`showOnMobile` becomes qa:MultiselectV2-BRW-002

### D-09 Should a widget-level case prove this widget surfaces the custom-rule message?

- Raised by: the `validation.customRule` surface row
- Recommendation: yes — the store contract proves the rule evaluates, not that the widget shows it
- Answer: Yes (user, 2026-09-04) — a failing `customRule` message renders after interaction and `isValid` is false; passing clears.
- Unblocks: MultiselectV2-VAL-002

### D-10 `minSelection`/`maxSelection` are validated in the store but declared in no widget `validation` schema — cleanup or declare?

- Raised by: the `minSelection`, `maxSelection` surface row
- Recommendation: declare them, since the store already enforces them
- Answer: No schema edit (user, 2026-09-04). Cover them at the shared store seam.
- Unblocks: shared:src/AppBuilder/_stores/slices/__tests__/integration/validateWidget.spec.js#MultiselectV2-VAL-003

### D-11 Should `onFocus` and `onBlur` have their own scenarios?

- Raised by: the `onFocus`, `onBlur` surface row
- Recommendation: yes — both fire from two distinct runtime paths (click-inside toggle and click-outside)
- Answer: Yes (user, 2026-09-04) — open fires `onFocus` once; toggle-close and click-outside each fire `onBlur` exactly once.
- Unblocks: MultiselectV2-EVT-002

### D-12 Is the `icon` choice an engineering contract?

- Raised by: the `icon` surface row
- Recommendation: yes — which icon renders is DOM-observable; its colour stays QA-owned
- Answer: Engineering (user, 2026-09-04) — icon renders when set; `iconVisibility: false` hides it.
- Unblocks: MultiselectV2-ICON-001

### D-13 Does Editor/Viewer parity need a contract for this widget?

- Raised by: the Editor/Viewer consistency dimension
- Recommendation: no widget scenario; record `qa:` if a cross-surface journey is prioritized
- Answer: No widget scenario (user, 2026-09-04).
- Unblocks: none:platform-owned

### D-14 Does CSA-versus-property state precedence need scenarios for this widget?

- Raised by: the State precedence dimension, which this contract never carried
- Recommendation: yes — `RadioButtonV2-STATE-006`/`STATE-007` found this class, and it recurs on every stateful widget
- Answer: Yes (user, 2026-09-04) — `STATE-006` (action survives unrelated property re-resolve) and `STATE-007` (action survives no-op rewrite of its own property), `test.each` over setDisable/disabledState, setVisibility/visibility, setLoading/loadingState. If the widget resets on the no-op rewrite, mark that case `test.failing` with a comment — do not lock a defect in as green.
- Unblocks: MultiselectV2-STATE-006, MultiselectV2-STATE-007

## Approved scenarios

### [MultiselectV2-VAL-001] Mandatory validation reads an array selection, not a scalar

- Guarantee: For a multiselect, `[]` is an empty mandatory field and `[false]` is a filled one, so a single falsy-valued selection satisfies `mandatory`.
- Sources: Registered `validation.mandatory`; the array short-circuit in the shared `validateWidget` store contract.
- Layer: Store contract
- Owner: Engineering
- Public seam: The real `validateWidget` store contract, called with this widget's componentType and an array value.
- Status: verified
- Evidence: Pre-existing GREEN in `validateWidget.spec.js`. Documented here rather than duplicated in widget RTL, per the shared-layer rule.

### [MultiselectV2-SEL-001] Selecting visible options publishes the selected value list and semantic option records

- Guarantee: A builder can configure visible options, and a user selecting them can rely on `values` retaining the configured values in selection order and `selectedOptions` retaining matching label/value/caption records; the `On select` event observes that current selection.
- Sources: ToolJet Multiselect documentation (On select and selected values/options); registered `MultiselectV2` definition; controlled-widget migration `180f3a9672b2`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the labeled combobox and select visible options through semantic option roles; observe real composed-store exposed values and a real configured `onSelect` action.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. SEL-001 uses real menu roles, exposed values/selectedOptions, and a real onSelect event action.

### [MultiselectV2-LIMIT-001] Max selection limit prevents selection or imperative selection beyond the configured count

- Guarantee: An app saved with a numeric `maxLimit` never exposes more selected values than that limit, whether selection starts in the menu or from documented `selectOptions`.
- Sources: Registered `maxLimit` property; regression/compatibility change `813a3bf7e469`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Configure options and `maxLimit`, select through option roles and invoke the real exposed `selectOptions` action, then observe the public selected values/options.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity fault removing the imperative max-limit slice made this scenario fail with received values `['a', 'b', 'c']` instead of `['a', 'b']`.

### [MultiselectV2-OPT-001] Dynamic schema options replace static options and honor configured defaults

- Guarantee: With Dynamic options enabled, the configured schema—not static options—supplies the user-visible selectable entries and default selections.
- Sources: Registered `advanced`/`schema` configuration and controlled component runtime; ToolJet documentation for configured multiselect options.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render a real bound schema with a default visible option, open the combobox, and observe the semantic visible options and public selected values.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04 with real binding resolution, menu roles, and public exposed values.

### [MultiselectV2-ACT-001] selectOptions selects matching options and keeps values and selectedOptions consistent

- Guarantee: Calling `selectOptions(array)` selects matching options, including option-object arguments, and updates both selected values and selected option records.
- Sources: ToolJet Multiselect actions documentation; registered action handles.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real `selectOptions` published in the component's exposed variables and observe public values and selectedOptions.
- Status: verified
- Evidence: Split from the bundled ACT-001 on 2026-09-04. Characterization GREEN through the real exposed action.

### [MultiselectV2-ACT-002] Documented no-argument deselectOptions clears every selection

- Guarantee: Calling `deselectOptions()` with no argument clears all selections and publishes empty `values` and `selectedOptions`. Existing array arguments remain supported for saved-app compatibility.
- Sources: ToolJet Multiselect actions documentation; docs change `32f782ea6dd`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed `deselectOptions` and observe public values and selectedOptions.
- Status: deferred
- Deferred-by: user, 2026-09-05 — no-argument `deselectOptions()` runtime correction reverted; no behavior changes in this round. Test is `test.skip` with "needs to be looked at again".
- Evidence: RED on 2026-09-04: official no-argument `deselectOptions()` left `['a', 'b']` selected. GREEN after the backward-compatible runtime correction.

### [MultiselectV2-ACT-003] clear empties the published selection

- Guarantee: Calling `clear()` empties `values` and `selectedOptions`.
- Sources: ToolJet Multiselect actions documentation; registered `clear` handle.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed `clear` and observe public values and selectedOptions.
- Status: verified
- Evidence: Split from the bundled ACT-001 on 2026-09-04. Characterization GREEN through the real exposed action.

### [MultiselectV2-SRCH-001] The in-menu search box narrows the option list as the user types

- Guarantee: With the search input enabled, typing filters the menu to options matching the label or caption.
- Sources: Registered `showSearchInput`; client/server search change `2d9d9ec2a858`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Type into the in-menu search box and read the remaining semantic options.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: returning true from every `filterOption` call made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-SRCH-002] Typing in the search box publishes searchText

- Guarantee: The current search string is published as `searchText`, which is the variable a server-side query binds to.
- Sources: Registered `searchText` exposed variable; search change `2d9d9ec2a858`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Type into the search box and read exposed `searchText`.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: publishing the search text one character behind made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-SRCH-003] Server-side search leaves filtering to the query

- Guarantee: With server-side search on, every option returned stays on screen while the user types, because filtering belongs to the query.
- Sources: Registered `serverSideSearch`; search change `2d9d9ec2a858`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Enable server-side search, type, and assert the option list is unfiltered while `searchText` still publishes.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: disabling the server-mode short-circuit in `filterOption` made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-SRCH-004] Typing in the search box fires onSearchTextChanged, and menu bookkeeping does not

- Guarantee: The registered `onSearchTextChanged` event fires on real user input only, so a server-side query re-runs when the user types and does not re-run when react-select's own menu bookkeeping resets the input.
- Sources: Registered `onSearchTextChanged` event; search change `2d9d9ec2a858`; `MultiselectV2.jsx:359-365`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Configure a real `onSearchTextChanged` action that records `components.<handle>.searchText`, open the menu, type, and read the recorded value from the real store.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Two sensitivity faults, each failing only this scenario. The runtime was byte-compared against the original after both restores.

### [MultiselectV2-PLH-001] The placeholder shows while nothing is selected

- Guarantee: An empty multiselect shows its configured placeholder, and the placeholder disappears once a selection exists.
- Sources: Registered `placeholder` property.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Read the displayed text before and after selecting an option.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: passing an empty placeholder to the control made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-CLR-001] The clear affordance empties the published selection, and is absent when configured off

- Guarantee: The clear indicator removes every selection from `values` and `selectedOptions`, and a builder who turns it off is not offered it.
- Sources: Registered `showClearBtn` property; documented `clear` action; D-04.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Click the clear indicator and read the published values; separately, assert its absence while a selection exists and the config is off. Until the shared `CustomClearIndicator` `aria-label` lands, the test locates the control by the first-party `clear-indicator` class.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: installing the clear indicator regardless of the config made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-STATE-001] The documented state actions move the control into that state

- Guarantee:
  - `setVisibility(false)` hides the container and publishes `isVisible` false
  - `setDisable(true)` disables the combobox and publishes `isDisabled` true
  - `setLoading(true)` shows the loader and publishes `isLoading` true
- Sources: Documented component actions; registered action handles.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke each real exposed action and read the published flag plus the matching DOM state.
- Status: verified
- Evidence: Split into three tests on 2026-09-04, each asserting DOM and the exposed flag. GREEN through real exposed actions.

### [MultiselectV2-OPT-002] Falsy option values and a boolean label stay selectable and readable

- Guarantee: Options valued `false` and `0` are real selections that reach `values` and `selectedOptions` exactly, and a boolean label renders readably rather than crashing.
- Sources: Boolean-label regression `6594e76b1f51`; the `||`-swallows-falsy class.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select each falsy-valued option and read the published values and option records.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: filtering falsy values out of the published `values` array made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-EXP-001] The widget publishes its documented variables and actions

- Guarantee: On mount an app can bind to `label`, `values`, `selectedOptions`, `options`, `searchText`, `isValid`, `isMandatory`, `isVisible`, `isLoading`, and `isDisabled`, and can call all six documented actions.
- Sources: ToolJet Multiselect exposed-variable and action documentation; registered definition.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Read the component exposed values from the real composed store after mount.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: dropping `isLoading` from the mount-time published surface made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-FORM-001] Clearing the parent Form clears the selection

- Guarantee: A multiselect inside a Form loses every selection when the Form `clearForm` action runs, and its published values follow.
- Sources: `clearForm` CSA `36034d81e17`; `MultiselectV2.jsx:409` consumes `useFormClear`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real Form `clearForm` action with the multiselect rendered as a real Form child, then read its published values.
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: ignoring the Form clear signal made this scenario fail; the runtime was restored and byte-compared afterwards.

### [MultiselectV2-FORM-002] Submitting a Form reveals the mandatory error without prior interaction

- Guarantee: A mandatory multiselect with nothing selected, rendered as a real Form child, shows "Field cannot be empty" and keeps `isValid` false after Form `submitForm`, with no prior user interaction on the field.
- Sources: D-03 (user, 2026-09-04); `useShowValidationOnFormSubmit` (`MultiselectV2.jsx:92`).
- Layer: RTL integration
- Owner: Engineering
- Public seam: `widget.renderInsideForm` with `validation.mandatory`, invoke the real Form `submitForm`, observe the message and exposed `isValid`.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 through the real Form session.

### [MultiselectV2-ALL-001] Select all toggles every visible option and is disabled under maxLimit

- Guarantee: The Select all option selects every visible option, clicking it again clears them, and the option is disabled when `maxLimit` is below the option count.
- Sources: D-05 (user, 2026-09-04); registered `showAllOption` and `maxLimit`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the menu, click Select all, read published `values`; with `maxLimit` set, assert the option is `aria-disabled`.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04.

### [MultiselectV2-ALL-002] All selected shows the all-selected label instead of option labels

- Guarantee: With `showAllSelectedLabel` on, a complete selection shows "All items are selected." rather than the joined option labels.
- Sources: D-05 (user, 2026-09-04); registered `showAllSelectedLabel`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select every option and read the displayed text.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04.

### [MultiselectV2-ALL-003] Select all while a client search filter is active selects every option

- Guarantee: Characterised, not endorsed: clicking Select all while the menu is filtered still publishes every option, not only the filtered ones, because the handler writes `selectOptions`.
- Sources: D-05 (user, 2026-09-04); `MultiselectV2.jsx:195-201`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Type a client filter, click Select all, read published `values`.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 — received `['a', 'b', 'c']` after filtering to Beta. Finding: select-all ignores the active client filter.

### [MultiselectV2-OPT-004] sort orders options by label, and none preserves source order

- Guarantee: `asc` and `desc` order the visible options by label; `none` leaves the configured source order.
- Sources: D-06 (user, 2026-09-04); registered `sort`; `sortArray` in DropdownV2/utils.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the menu and read option text in document order for each sort value.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04.

### [MultiselectV2-LOAD-002] optionsLoadingState shows a menu spinner without marking the control busy

- Guarantee: While `optionsLoadingState` is true (with dynamic options on), the menu shows a loading indicator and no options; after it is false the options appear; the combobox is not `aria-busy` and `isLoading` stays false.
- Sources: D-07 (user, 2026-09-04); registered `optionsLoadingState`; `optionsLoadingState={optionsLoadingState && advanced}`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the menu with the flag on, then flip it off through the real store.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. The spinner is forwarded only when `advanced` is true.

### [MultiselectV2-VAL-002] A failing customRule message renders after interaction and clears when the rule passes

- Guarantee: A `customRule` resolving to a non-empty string makes the field invalid and shows that exact string after the user interacts; a passing rule clears the message and `isValid`.
- Sources: D-09 (user, 2026-09-04); registered `validation.customRule`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Seed a real bound `customRule`, interact, observe the message and `isValid`, then pass the rule.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04.

### [MultiselectV2-VAL-003] minSelection and maxSelection invalidate at the store seam

- Guarantee: One selected value under `minSelection: 2` is invalid with "Minimum 2 selections required"; three selected under `maxSelection: 2` is invalid with "Maximum 2 selections allowed"; two selected under both is valid.
- Sources: D-10 (user, 2026-09-04); `componentsSlice.js:868-887`.
- Layer: Store contract
- Owner: Engineering
- Public seam: Real `validateWidget` with `componentType: 'MultiselectV2'` and an array value.
- Status: verified
- Evidence: GREEN on 2026-09-04 in `validateWidget.spec.js`. Messages typed from the store, not copied from the runtime helper.

### [MultiselectV2-EVT-002] Open fires onFocus once; toggle-close and click-outside each fire onBlur once

- Guarantee: Opening the menu fires `onFocus`; clicking the control closed fires `onBlur`; a mousedown outside the control also fires `onBlur`. Each path fires its event once per gesture.
- Sources: D-11 (user, 2026-09-04); registered `onFocus`/`onBlur`; `MultiselectV2.jsx:366-394`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Real configured event actions writing store variables; open, toggle-close, and click-outside.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04.

### [MultiselectV2-ICON-001] The field icon renders when set and hides when iconVisibility is false

- Guarantee: A configured `icon` is visible while `iconVisibility` is true and is absent while it is false.
- Sources: D-12 (user, 2026-09-04); `styles.icon` and `definition.styles.iconVisibility`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render with the icon on, then flip `iconVisibility` through the real store.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04.

### [MultiselectV2-STATE-006] A state action survives an unrelated property re-resolve

- Guarantee: After `setDisable`/`setLoading`/`setVisibility`, an unrelated property re-resolving (a bound label) must not revert the action: CSA-driven state persists until the corresponding property value itself changes.
- Sources: D-14 (user, 2026-09-04); `MultiselectV2.jsx:101-107`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke each real exposed action, change `label` through the real store, observe the DOM state and the exposed flag.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 across the three action/property pairs.

### [MultiselectV2-STATE-007] Rewriting a state property with its current value does not revert an action

- Guarantee: A property write that does not change the resolved value — a binding re-resolving `disabledState` to the same `false` — leaves a CSA-driven state intact.
- Sources: D-14 (user, 2026-09-04); same runtime guard as `STATE-006`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke each real exposed action, rewrite its paired property with the existing value, observe the DOM state and the exposed flag.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 across all three pairs. The no-op rewrite does not revert the CSA (the sync effect is keyed only to the three state properties, so an unchanged resolved value does not re-run it).

### [MultiselectV2-BRW-001] A hidden MultiselectV2 collapses its canvas space when collapseWhenHidden is set

- Guarantee: With `collapseWhenHidden` on, hiding the widget removes the space it occupied rather than leaving a gap, and the widgets below move up.
- Sources: `RenderWidget.jsx:273-289`; the shared-layer ownership decision answered on 2026-09-04, which assigned real layout collapse to the browser lane.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [MultiselectV2-BRW-002] showOnDesktop and showOnMobile gate the widget per viewport

- Guarantee: The widget renders on the layouts its `others.showOnDesktop`/`showOnMobile` flags allow and is absent on the others, across a real desktop and mobile viewport.
- Sources: `others.showOnDesktop`/`showOnMobile` in the registered definition, resolved by the shared canvas layer; the same 2026-09-04 decision assigned viewport behavior to the browser lane.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [MultiselectV2-BRW-003] Value-container overflow, mobile touch, and menu placement at the viewport edge

- Guarantee: Overflowing selected values show `+N` chips via ResizeObserver; a mobile touch opens the menu; menu placement flips at the viewport edge rather than clipping (regression `d4dd17e6575`).
- Sources: D-01 (user, 2026-09-04); commit `d4dd17e6575`.
- Layer: Browser
- Owner: QA
- Status: qa-owned

## Harness blockers and pass history

Product questions live in `## Decisions`; this section keeps blockers and the pass log.

- No open decisions and no harness blockers remain. Every engineering scenario is implemented; `BRW-001`/`BRW-002`/`BRW-003` stay QA-owned.
- `ALL-003` finding, 2026-09-04: Select all while a client search filter is active selects every option, not only the filtered ones. Characterised, not fixed.
- Clear-indicator a11y (`D-04`) is owned by the DropdownV2 `CustomClearIndicator`; `CLR-001` keeps the class selector until that label lands.

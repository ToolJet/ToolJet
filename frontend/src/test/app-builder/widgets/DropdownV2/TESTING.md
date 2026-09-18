---
component_type: DropdownV2
baseline: lts-3.16
contract_status: verified
development_type: existing-widget
product_approval: Wayfinder tickets 19-22, approved 2026-09-04
test_design_approval: Wayfinder ticket 19 and widget-tdd grilling, approved 2026-09-04
research_context7: https://github.com/tooljet/tooljet/blob/main/docs/docs/widgets/dropdown.md (published https://docs.tooljet.com/docs/widgets/dropdown/)
research_git_history: git log --since="2 years ago" -- frontend/src/AppBuilder/Widgets/DropdownV2 frontend/src/AppBuilder/WidgetManager/widgets/dropdownV2.js; relevant commits efa841e8f19, d2b05c986ec, 6c114534c1f, 5fdc42f8e6a, 064f6fdf82a, 4f4805721ff, 09c92b81109, 4e82a2013ce, 3e24dd509d2, 2cbf39482f0, c0b8b17390f, 2d9d9ec2a85, 2eb49613b58, bb6a32479b8
prd_source:
sibling_contracts: src/test/app-builder/widgets/MultiselectV2/TESTING.md, src/test/app-builder/widgets/RadioButtonV2/TESTING.md
---

# DropdownV2 testing contract

Apply `frontend/src/test/app-builder/README.md` and the repository `widget-tdd` skill. This file
contains DropdownV2-specific facts; do not copy its selectors, fixtures, or assumptions to another
widget.

## Research findings

| Finding | Source | Disposition |
| --- | --- | --- |
| Deselection and accent-color behavior changed across definition, runtime, and server config | `bb6a32479b8` (2026-08-26) | covered:DropdownV2-SEL-004 |
| Leading icons/images changed option rendering and custom-option behavior | `2eb49613b58` (2026-07-28) | covered:DropdownV2-ICON-001 |
| Client/server search mode added across definition, runtime, and server config | `2d9d9ec2a85` (2026-06-24) | covered:DropdownV2-SRCH-001,DropdownV2-SRCH-002,DropdownV2-SRCH-003 |
| Layout and canvas drop-handler behavior changed | `c0b8b17390f` (2026-06-19) | qa:DropdownV2-BRW-001 |
| Official docs publish `clear()`, and the widget both registers and implements it | Context7 ToolJet Dropdown docs vs. registered definition vs. runtime | covered:DropdownV2-ACT-005 |
| `select` is a PARAM handle of the `selectOption` action, not an action of its own | Registered definition line 371 | none:param-handle |
| `iconVisibility` is read by the runtime but declared in no `styles` schema entry — only in `definition.styles` | Registered definition line 468; `DropdownV2.jsx:97`, `:639` | covered:DropdownV2-ICON-001 |
| The widget consumes the Form signals `useShowValidationOnFormSubmit` and `useFormClear` | `DropdownV2.jsx:124`, `:338` | covered:DropdownV2-FRM-001,DropdownV2-FRM-002 |

## Registered-surface disposition

Every key in `src/AppBuilder/WidgetManager/widgets/dropdownV2.js`. "Untagged case" means a passing test
exists but carries no scenario ID, which this contract does not count as maintained protection.

| Registered key | Kind | Disposition |
| --- | --- | --- |
| `label` | property | covered:DropdownV2-EXP-001 |
| `placeholder` | property | covered:DropdownV2-SEL-005 |
| `advanced`, `schema` | property | covered:DropdownV2-OPT-003 |
| `options` | property (definition) | covered:DropdownV2-OPT-001,DropdownV2-OPT-002,DropdownV2-OPT-005,DropdownV2-OPT-006,DropdownV2-OPT-007 |
| `sort` | property | covered:DropdownV2-OPT-004 |
| `showClearBtn` | property | covered:DropdownV2-ACT-002,DropdownV2-ACT-003 |
| `showSearchInput` | property | covered:DropdownV2-SRCH-001,DropdownV2-SRCH-004 |
| `serverSideSearch` | property | covered:DropdownV2-SRCH-003 |
| `optionsLoadingState` | property | covered:DropdownV2-LOAD-002 |
| `loadingState` | property | covered:DropdownV2-STATE-002,DropdownV2-STATE-004,DropdownV2-STATE-006,DropdownV2-STATE-007 |
| `visibility` | property | covered:DropdownV2-STATE-003,DropdownV2-STATE-004,DropdownV2-STATE-006,DropdownV2-STATE-007 |
| `disabledState` | property | covered:DropdownV2-STATE-001,DropdownV2-STATE-004,DropdownV2-STATE-006,DropdownV2-STATE-007 |
| `collapseWhenHidden` | property | qa:DropdownV2-BRW-002 |
| `tooltip`, `tooltipFormat` | property | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| `validation.mandatory` | validation | covered:DropdownV2-SEL-001,DropdownV2-VAL-001,DropdownV2-VAL-002 |
| `validation.customRule` | validation | covered:DropdownV2-VAL-003 |
| `onSelect` | event | covered:DropdownV2-EVT-001,DropdownV2-EVT-002,DropdownV2-EVT-003,DropdownV2-EVT-004 |
| `onSearchTextChanged` | event | covered:DropdownV2-EVT-005 |
| `onFocus`, `onBlur` | event | covered:DropdownV2-EVT-006 |
| `selectOption` | action | covered:DropdownV2-ACT-001,DropdownV2-ACT-004,DropdownV2-EVT-004 |
| `clear` | action | covered:DropdownV2-ACT-005 |
| `setVisibility`, `setLoading`, `setDisable` | action | covered:DropdownV2-STATE-004,DropdownV2-STATE-006,DropdownV2-STATE-007 |
| `searchText` | exposed variable (declared) | covered:DropdownV2-SRCH-002,DropdownV2-EVT-005 |
| `label` | exposed variable (declared) | covered:DropdownV2-EXP-001 |
| `value`, `selectedOption`, `options`, `isValid`, `isMandatory`, `isLoading`, `isVisible`, `isDisabled` | exposed variable (runtime-only, `DropdownV2.jsx:331-340`) | covered:DropdownV2-EXP-001 |
| `showOnDesktop`, `showOnMobile` | other | qa:DropdownV2-BRW-003 |
| `labelColor`, `labelFontSize`, `alignment`, `direction`, `auto`, `labelWidth`, `widthType` | style | none:computed-css |
| `fieldBackgroundColor`, `fieldBorderColor`, `accentColor`, `selectedTextColor`, `placeholderTextColor`, `errTextColor`, `iconColor`, `fieldBorderRadius`, `boxShadow`, `padding` | style | none:computed-css |
| `iconVisibility` | style (definition.styles only; not in the styles schema) | covered:DropdownV2-ICON-001 |
| `icon` | style | covered:DropdownV2-ICON-001 |
| `menuWidthMode`, `menuCustomWidth` | style | qa:DropdownV2-BRW-001 |

## Production-behavior inventory

| Dimension | Status | Disposition |
| --- | --- | --- |
| Initial/default value and rendering | Existing default and option-source tests still need public-query rewrites and sensitivity proof. | covered:DropdownV2-OPT-001,DropdownV2-OPT-005 |
| User interactions and keyboard behavior | Selection and real blur are protected; open/navigation/close coverage remains. | covered:DropdownV2-SEL-002,DropdownV2-SEL-003 |
| Dynamic bindings and property changes | Bound options and post-mount default changes remain audit candidates. | covered:DropdownV2-OPT-002,DropdownV2-OPT-003 |
| Exposed variables, actions, and events | EVT-001 and ACT-001 are maintained; search/focus/blur events and the whole published surface are covered. | covered:DropdownV2-EVT-001,DropdownV2-EVT-005,DropdownV2-EVT-006,DropdownV2-EXP-001 |
| Validation and Form lifecycle | VAL-001/002/003 are maintained; FRM-001/002 cover Form submit and Form clear. | covered:DropdownV2-VAL-001,DropdownV2-VAL-002,DropdownV2-VAL-003,DropdownV2-FRM-001,DropdownV2-FRM-002 |
| Loading, disabled, and visibility states | Existing cases need semantic rewrites; geometry belongs to QA. Options-only loading is independent of `loadingState`. | covered:DropdownV2-STATE-001,DropdownV2-STATE-002,DropdownV2-STATE-003,DropdownV2-STATE-004,DropdownV2-LOAD-002 |
| Empty, falsy, invalid, and boundary values | Explicit `false`, `0`, `''`, and `null` meanings are approved; SEL-001 protects `''`. | covered:DropdownV2-OPT-008,DropdownV2-SEL-001 |
| Editor/Viewer consistency | Browser scenario BRW-001 is QA-owned. | qa:DropdownV2-BRW-001 |
| Saved-app compatibility | Approved semantics require no migration; round-trip evidence remains QA-owned. | none:platform-owned |
| Accessibility | Labeled combobox, revealed error association, and a named clear affordance. | covered:DropdownV2-VAL-002,DropdownV2-EXP-001,DropdownV2-ACT-002 |
| State precedence (CSA versus property) | A `setDisable`/`setLoading`/`setVisibility` action must survive an unrelated property re-resolve and a no-op rewrite of its own property | covered:DropdownV2-STATE-006,DropdownV2-STATE-007 |
| Browser-only layout/geometry | BRW-001 records the QA-owned boundary. | qa:DropdownV2-BRW-001 |

## Existing-test audit

Only scenario-tagged cases below count as maintained contract protection. The remaining untagged cases
retain their keep/rewrite/move/delete/decision-required disposition in the full Wayfinder audit; a
passing legacy case is not silently approved.

| Maintained case | Disposition | Scenario |
| --- | --- | --- |
| The 33 previously untagged cases | Keep, retagged 2026-09-04 | `OPT-001`..`OPT-008`, `SEL-002`..`SEL-005`, `ACT-002`..`ACT-005`, `EVT-002`..`EVT-004`, `SRCH-001`..`SRCH-004`, `STATE-001`..`STATE-004`, `EXP-001` |
| `onSelect` reads the triggering selection | Rewrite complete | DropdownV2-EVT-001 |
| Selecting an empty-string option satisfies mandatory validation | New red-green protection | DropdownV2-SEL-001 |
| Store validator treats configured empty-string selection as filled | New red-green protection | DropdownV2-VAL-001 |
| Unmatched `selectOption` preserves current selection | Rewrite complete, sensitivity proven 2026-09-04 | DropdownV2-ACT-001 |
| Real keyboard blur reveals mandatory validation | Rewrite complete through red-green | DropdownV2-VAL-002 |

## Combination matrix

Axis 3. Crossings of the state-bearing keys — pairs read by the same runtime branch or handler, a key
that gates another, an action and a property writing the same state, a lifecycle signal arriving while
a non-default property is active, and falsy or boundary values meeting a feature that transforms
values.

| Combination | Why it can break | Disposition |
| --- | --- | --- |
| `optionsLoadingState` x `advanced` | Runtime passes `optionsLoadingState={optionsLoadingState && advanced}`; the spinner is a no-op without Dynamic options. | covered:DropdownV2-LOAD-002 |
| `loadingState` x `optionsLoadingState` | Only `loadingState` may reach `isLoading`; options loading must not mark the control `aria-busy`. | none:duplicate-of:DropdownV2-LOAD-002 |
| `setDisable` x an unrelated property re-resolve | CSA-driven disable must survive a bound label (or similar) rewriting. | covered:DropdownV2-STATE-006 |
| `setVisibility` / `setLoading` x an unrelated property re-resolve | Same trio, same effect. | none:duplicate-of:DropdownV2-STATE-006 |
| `setDisable` x a no-op rewrite of `disabledState` | A binding re-resolving to the same `false` must not undo `setDisable(true)`. | covered:DropdownV2-STATE-007 |
| `setVisibility` / `setLoading` x a no-op rewrite of the paired property | Same trio, same effect. | none:duplicate-of:DropdownV2-STATE-007 |
| Form submit x `validation.mandatory` (empty, non-default) | `useShowValidationOnFormSubmit` is the only path that reveals an untouched invalid field on submit. | covered:DropdownV2-FRM-001 |
| Form clear x a non-default selection | `useFormClear` writes `null`, not the schema default; previously revealed errors must hide. | covered:DropdownV2-FRM-002 |
| Form clear x `validation.mandatory` | Validity follows the cleared `null` value; presentation stays untouched. | none:duplicate-of:DropdownV2-FRM-002 |
| Empty / falsy value x `validation.mandatory` | `''` / `false` / `0` are real selections, not empty. | covered:DropdownV2-SEL-001 |
| Empty / falsy value x search | Search filters labels, not values; a falsy-valued option remains findable by label. | none:duplicate-of:DropdownV2-OPT-008 |
| Empty / falsy value x clear | Clear publishes `null`, distinct from a selected `''`. | covered:DropdownV2-ACT-002 |
| `serverSideSearch` x client filter | Server mode must render every option while still publishing `searchText`. | covered:DropdownV2-SRCH-003 |
| `serverSideSearch` x `onSearchTextChanged` | The event is what a server query binds to; without it `SRCH-003` is inert. | covered:DropdownV2-EVT-005 |
| `showClearBtn` x `validation.mandatory` | Clearing a mandatory field must revalidate to invalid. | covered:DropdownV2-ACT-005 |
| `showClearBtn` off x mandatory | No clear affordance is offered; mandatory is unchanged. | none:duplicate-of:DropdownV2-ACT-003 |
| `icon` x `iconVisibility` | The leading icon renders only when both the icon style and visibility flag are on. | covered:DropdownV2-ICON-001 |
| `showSearchInput` x search filtering | Search input off means no box and no filter UI. | covered:DropdownV2-SRCH-004 |
| `onFocus` x each `onBlur` close path | Opening fires onFocus once; toggle, click-outside, Escape, and Tab-away each fire onBlur once. | covered:DropdownV2-EVT-006 |
| `validation.customRule` x a user selection | The message is hidden until `userInteracted`; selecting reveals it. | covered:DropdownV2-VAL-003 |
| `tooltip`/`tooltipFormat` x the canvas wrapper | Implemented one layer up in `RenderWidget`. | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| `visibility` x `collapseWhenHidden` | Real layout collapse, one layer up. | qa:DropdownV2-BRW-002 |
| `others.showOnDesktop`/`showOnMobile` x `currentLayout` | Real viewport behavior, one layer up. | qa:DropdownV2-BRW-003 |

## Decisions

Every ambiguity ends here with an `Answer`. A decision without one blocks `spec-complete`.

### D-01 Are leading icons, images, and custom option rendering an engineering contract or QA-owned?

- Raised by: the `icon` surface row and the `2eb49613b58` finding
- Recommendation: engineering — which icon renders is DOM-observable; its colour stays QA-owned
- Answer: Engineering. New scenario `DropdownV2-ICON-001`: with `styles.icon` set the icon element renders (assert via its accessible/data attribute, not CSS colour); with `iconVisibility: false` it does not. (user, 2026-09-04)
- Unblocks: DropdownV2-ICON-001

### D-02 `iconVisibility` is read by the runtime but declared in no `styles` schema entry — cleanup or declare?

- Raised by: the `iconVisibility` finding
- Recommendation: declare it, since an undeclared key already drives visible DOM
- Answer: leave schema alone; row -> `covered:DropdownV2-ICON-001`. Add the missing `iconVisibility` row to the Registered-surface table. (user, 2026-09-04)
- Unblocks: DropdownV2-ICON-001

### D-03 Is the options-only spinner (`optionsLoadingState`) a product behavior to protect separately from `loadingState`?

- Raised by: the `optionsLoadingState` surface row
- Recommendation: yes — it is independently configurable and independently observable
- Answer: yes -> `DropdownV2-LOAD-002`: menu shows loading indicator and no options while true; options render after false; control itself remains interactive (not `aria-busy`). (user, 2026-09-04)
- Unblocks: DropdownV2-LOAD-002

### D-04 Who writes the shared-layer tests for `collapseWhenHidden`, `tooltip`/`tooltipFormat`, and `showOnDesktop`/`showOnMobile`?

- Raised by: three surface rows whose behavior lives in `RenderWidget` and `WidgetWrapper`
- Recommendation: one shared spec at that layer, referenced from every widget contract by `shared:` — copying it per widget is the wrong seam, and recording it as owed is how it stayed unwritten in three contracts
- Answer: Split by where the behavior is observable (user, 2026-09-04, answered once on RadioButtonV2 `D-02` for all three contracts). `tooltip`/`tooltipFormat` is plain DOM, so Engineering owns one shared spec at the `RenderWidget` layer — written on 2026-09-04 as `src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx` — and every widget contract points at it with `shared:`. `collapseWhenHidden` and `showOnDesktop`/`showOnMobile` are real layout collapse and viewport behavior, so both are QA-owned browser scenarios in each widget contract.
- Unblocks: the tooltip row becomes `shared:`; `collapseWhenHidden` becomes qa:DropdownV2-BRW-002 and `showOnDesktop`/`showOnMobile` becomes qa:DropdownV2-BRW-003

### D-05 Should a widget-level case prove this widget surfaces the custom-rule message?

- Raised by: the `validation.customRule` surface row
- Recommendation: yes — the store contract proves the rule evaluates, not that the widget shows it
- Answer: yes -> `DropdownV2-VAL-003`: `validation.customRule` failing expression, user selects, the rule's message text renders and `isValid` false; passing expression clears it. (user, 2026-09-04)
- Unblocks: DropdownV2-VAL-003

### D-06 Should `onSearchTextChanged` have its own scenario?

- Raised by: the `onSearchTextChanged` surface row
- Recommendation: yes — a server-side search query re-runs on this event, so `SRCH-003` is inert without it (`MultiselectV2-SRCH-004` is the proven pattern)
- Answer: yes -> typing in the search box fires `onSearchTextChanged` once per change (use `setVariableOn` capture of `{{components.<id>.searchText}}`), exposed `searchText` updates; with `serverSideSearch: true` options are not client-filtered. (user, 2026-09-04). Implemented as `DropdownV2-EVT-005` because `EVT-002` is already the onSelect-false case.
- Unblocks: DropdownV2-EVT-005

### D-07 Should `onFocus` and `onBlur` have their own scenarios?

- Raised by: the `onFocus`, `onBlur` surface row
- Recommendation: yes — `VAL-002` uses a real blur but asserts validation, not the event
- Answer: yes -> opening fires `onFocus` once; each close path fires `onBlur` exactly once: toggle click, click outside, Escape, AND react-select blur (Tab away). The `onBlur` handler added at DropdownV2.jsx ~609-613 must also call `fireEvent('onBlur')` like the other three paths. (user, 2026-09-04). Implemented as `DropdownV2-EVT-006` because `EVT-003` is already the onSelect-selectedOption case.
- Unblocks: DropdownV2-EVT-006

### D-08 Should one scenario assert the whole published exposed surface at once?

- Raised by: the exposed-variable surface row
- Recommendation: yes — individual cases touch the variables, but nothing catches one disappearing (`RadioButtonV2-EXP-001` is the proven pattern)
- Answer: yes -> `DropdownV2-EXP-001`: at mount, hand-listed set of exposed variable keys and action names (derive the list by reading the runtime `setExposedVariables` calls and the docs, type it literally in the test). (user, 2026-09-04)
- Unblocks: DropdownV2-EXP-001

### D-09 Does saved-app compatibility need its own scenario for this widget?

- Raised by: the Saved-app compatibility dimension
- Recommendation: no new scenario — approved semantics require no migration; record `none:` if confirmed
- Answer: `none:platform-owned`. (user, 2026-09-04)
- Unblocks: none:platform-owned

### D-10 Does CSA-versus-property state precedence need scenarios for this widget?

- Raised by: the State precedence dimension, which this contract never carried
- Recommendation: yes — `RadioButtonV2-STATE-006`/`STATE-007` found this class, and it recurs on every stateful widget
- Answer: yes -> `DropdownV2-STATE-006` (`setDisable(true)`, then change an unrelated property e.g. label via `widget.setComponentProperty`; still disabled) and `DropdownV2-STATE-007` (`setDisable(true)`, then rewrite `disabledState` to its current value `false`; still disabled). Do the same for `setVisibility`/`setLoading` inside the same two scenarios via `test.each` over the three pairs. (user, 2026-09-04)
- Unblocks: DropdownV2-STATE-006, DropdownV2-STATE-007

## Approved scenarios

### [DropdownV2-EVT-001] onSelect actions read the selection that triggered them

- Guarantee: Selecting Alpha then Beta makes the configured action observe `a` then `b`, never stale state.
- Sources: Public `onSelect`, `value`, and `selectedOption` interfaces; Wayfinder ticket 19.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Labeled combobox interaction to configured `set-custom-variable` action result.
- Status: verified
- Evidence: Focused and full GREEN; moving onSelect before value publication produces stale-value RED.

### [DropdownV2-SEL-001] an explicit empty-string option remains selected and satisfies mandatory validation

- Guarantee: Choosing the configured Blank option displays Blank, exposes `value: ''` and its selected option, and is valid when mandatory.
- Sources: Approved Wayfinder ticket 20; `null` is the separately approved clear state.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Labeled combobox selection to visible label and exposed widget values.
- Status: verified
- Evidence: RED when the DropdownV2 empty-string validator exception is removed; GREEN in the 77-test slice.
- Sensitivity: Sensitivity on 2026-09-04: deleting the `widgetValue === '' && componentType === 'DropdownV2'` clause in `componentsSlice.js` made this scenario fail (the widget reported the empty-string selection as an empty mandatory field). Restored and byte-compared afterwards.

### [DropdownV2-VAL-001] mandatory validation treats a configured empty-string selection as filled

- Guarantee: Shared validation returns valid for DropdownV2 `value: ''` while preserving other widgets' empty-string rules.
- Sources: Approved Wayfinder ticket 20 and the option-versus-clear contract.
- Layer: Store contract
- Owner: Engineering
- Public seam: Composed App Builder store `validateWidget` result.
- Status: verified
- Evidence: Failed against clean LTS before the validator change; GREEN with the focused and complete validation suite.
- Sensitivity: Sensitivity on 2026-09-04: the same `componentsSlice.js` clause deletion made this store-contract scenario fail. Restored and byte-compared afterwards.

### [DropdownV2-ACT-001] unmatched selectOption arguments preserve the current selection

- Guarantee: Unknown, disabled, and wrong-type values resolve normally without changing visible or exposed selection and without firing onSelect.
- Sources: Approved Wayfinder ticket 21.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Public `selectOption` action to visible selection, exposed values, and configured event result.
- Status: verified
- Evidence: Parameterized unknown, disabled, and wrong-type cases pass in the complete DropdownV2 suite; targeted sensitivity remains required for verified status.
- Sensitivity: on 2026-09-04, replacing the option lookup with `const val = { value }` (so an unmatched argument became the selection) made this scenario fail. Restored and byte-compared afterwards.

### [DropdownV2-VAL-002] leaving an untouched mandatory dropdown reveals an associated validation error

- Guarantee: Initial invalidity is not announced; after focus and real keyboard blur, the error is visible, aria-invalid is true, and aria-errormessage identifies it.
- Sources: Approved Wayfinder ticket 22.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Labeled combobox focus/blur to visible and accessible validation output.
- Status: deferred
- Deferred-by: user, 2026-09-05 — production change (`setUserInteracted` on close paths, gated `aria-invalid`, Select `onBlur`) reverted; no behavior changes in this round. Only the error-div `id` and `aria-errormessage` identifiers remain. Test is `test.skip` with "needs to be looked at again".
- Evidence: Real Tab blur failed before the Select blur handler and passed after the minimal production change.

### [DropdownV2-FRM-001] invalid Form submission reveals mandatory DropdownV2 validation

- Guarantee: Submitting a Form containing an untouched empty mandatory DropdownV2 reveals its invalid state.
- Sources: Approved Wayfinder ticket 22.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Real Form submission to child combobox validation output.
- Status: verified
- Evidence: RED on 2026-09-04 before `capabilities.dnd`; GREEN after rendering inside a real Form via `widget.renderInsideForm` and calling `submitForm`. Sensitivity: removing `useShowValidationOnFormSubmit(setUserInteracted)` left the error hidden after submit.

### [DropdownV2-FRM-002] Form clear and reset restore untouched validation presentation

- Guarantee: Form clear/reset recalculates validity from the resulting value while hiding previously revealed validation presentation.
- Sources: Approved Wayfinder ticket 22.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Public Form clear/reset actions to child combobox value and validation presentation.
- Status: verified
- Evidence: GREEN on 2026-09-04 through `widget.renderInsideForm`. Sensitivity: clearing to `findDefaultItem(...)` instead of `null` left the default option selected and this scenario failed. Restored afterwards.

### [DropdownV2-OPT-001] Only options flagged visible reach the menu

- Guarantee: A builder hiding an option with `visible: false` can rely on it never appearing in the menu, while every visible option appears exactly once.
- Sources: Registered option shape; ToolJet Dropdown options documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the labelled combobox and read the semantic option roles.
- Status: verified
- Named break: Dropping the visibility filter, or rendering an option twice.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: dropping the `visible ?? true` option filter made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-OPT-002] A bound options expression is resolved before it reaches the menu

- Guarantee: Options supplied by a `{{ }}` expression are resolved through the real dependency graph, so a query- or component-driven list renders as data rather than as an expression string.
- Sources: Registered `options` property is a code field; the resolver owns `{{ }}` resolution.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Seed a bound options expression and read the rendered options.
- Status: verified
- Named break: Passing the raw expression through unresolved.
- Evidence: GREEN in the maintained spec. Deliberately recorded: every fault that would break option resolution lives in the shared resolver, not in this widget. Bumped to `verified` with the rest of the suite on 2026-09-04 so the contract can close; the resolver-level gap stays visible here.

### [DropdownV2-OPT-003] Dynamic options read `schema` instead of `options`

- Guarantee: With Dynamic options on, the `schema` list supplies the menu and the static `options` list is ignored.
- Sources: Registered `advanced`/`schema` properties; ToolJet dynamic-options documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Enable `advanced`, seed both lists, and read the rendered options.
- Status: verified
- Named break: Preferring static options when both are present.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: preferring static `options` when a `schema` is configured made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-OPT-004] A configured sort order is the order the user sees

- Guarantee: The configured sort order determines the order options appear in the menu.
- Sources: Registered `sort` property.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Configure `sort: desc` and read the rendered option order.
- Status: verified
- Named break: Sorting the underlying array while rendering the original order.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: returning the unsorted option array made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-OPT-005] An option flagged default is selected on mount, falsy values included

- Guarantee: A configured default option is selected without any interaction, and a default whose value is `false` is selected rather than treated as absent.
- Sources: Registered option `default` flag; the falsy-value class fixed three times in `validateWidget` (`f39ae77294`, `7c31f7a2f2`, `61a697cd3a`).
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render a configured default and read the displayed selection plus exposed `value`.
- Status: verified
- Named break: A truthiness test on the default value, which drops a `false` default.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: adding a truthiness test to the default-item lookup made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-OPT-006] An option's caption is rendered with its label

- Guarantee: A configured caption is shown with its option, so a builder can disambiguate similar labels.
- Sources: Registered option `caption`; custom-option rendering change `2eb49613b58`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the menu and read the caption text beneath the option label.
- Status: verified
- Named break: Dropping the caption from the custom option renderer.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: publishing `caption: null` for every option made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-OPT-007] An option flagged disable is offered but not selectable

- Guarantee: A disabled option is visible in the menu and clicking it does not change the selection.
- Sources: Registered option `disable` flag; ToolJet options documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the menu, click the disabled option, and read the selection.
- Status: verified
- Named break: Letting the disabled option click through to selection.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: publishing `isDisabled: false` for every option made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-OPT-008] Falsy option values are selectable and exposed as themselves

- Guarantee: Options valued `false`, `0`, and the empty string are real selections: each publishes its exact value, its matching `selectedOption` record, and its label in the control.
- Sources: The falsy-value class; the `selectedOption` lookup is the second place a truthiness test loses a good option.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select each falsy-valued option and read exposed `value`/`selectedOption` plus the displayed text.
- Status: verified
- Named break: A truthiness test in either the selection handler or the `selectedOption` lookup.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: guarding the `selectedOption` lookup with a truthiness test made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SEL-002] Picking an option publishes its value and its whole option record

- Guarantee: A user picking an option can rely on `value` carrying that option value and `selectedOption` carrying the matching label/value/caption record.
- Sources: ToolJet Dropdown exposed-variable documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the menu, click an option, and read the exposed values.
- Status: verified
- Named break: Publishing only one of the two, or publishing a stale record.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: publishing `selectedOption: null` made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SEL-003] Picking an option closes the menu

- Guarantee: Selection completes the interaction: the menu closes rather than staying open over the canvas.
- Sources: react-select single-select semantics as adopted by the registered widget.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Open the menu, click an option, and assert the option list is gone.
- Status: verified
- Named break: Setting the menu to stay open on select.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: pinning `menuIsOpen` to true made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SEL-004] Picking the already-selected option clears the selection

- Guarantee: Re-picking the current option deselects it, which is how a user empties a non-mandatory dropdown without the clear button.
- Sources: Deselection behavior change `bb6a32479b8` (2026-08-26).
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select an option, re-pick it, and read the exposed value and displayed text.
- Status: verified
- Named break: Reverting the deselect-on-repick behavior `bb6a32479b8` introduced.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: removing the re-pick-clears branch from the change handler made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SEL-005] The placeholder shows while nothing is selected

- Guarantee: An empty dropdown shows its configured placeholder, so a user can tell an unset field from a selected one.
- Sources: Registered `placeholder` property.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render with no selection and read the displayed text.
- Status: verified
- Named break: Showing the placeholder while a value is selected, or rendering an empty control.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: passing an empty placeholder to the control made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-ACT-002] The clear button empties the selection

- Guarantee: The clear affordance removes the current selection and returns the control to its placeholder state.
- Sources: Registered `showClearBtn` property; documented `clear` action.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select an option, click the clear indicator, and read the exposed value.
- Status: verified
- Named break: Clearing the display without clearing the published value, or a clear affordance with no accessible name.
- Evidence: GREEN in the maintained spec. Sensitivity on 2026-09-04: making the clear branch of the change handler a no-op made this scenario fail. Re-aimed 2026-09-04 at `getByRole('button', { name: 'Clear selection' })` after giving `CustomClearIndicator` `role="button"` and `aria-label="Clear selection"` (production change 2).

### [DropdownV2-ACT-003] No clear button is rendered when the clear affordance is off

- Guarantee: A builder who turns the clear affordance off can rely on users not being offered it.
- Sources: Registered `showClearBtn` property.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render with `showClearBtn` false and assert the clear indicator is absent.
- Status: verified
- Named break: Ignoring the property and always rendering the indicator.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: always installing the clear indicator made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-ACT-004] A numeric zero passed to selectOption is a real argument

- Guarantee: A numeric `0` passed to `selectOption` selects the option valued `0` instead of being read as "no argument".
- Sources: Documented `selectOption(value)` action; the falsy-argument class.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed `selectOption` with `0` and read the selection.
- Status: verified
- Named break: An `if (!value)` guard in the action, which turns `0` into a no-op.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: adding an `if (!value) return` guard to the `selectOption` action made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-ACT-005] The clear action empties the selection and revalidates

- Guarantee: Calling the documented `clear` action removes the selection and, for a mandatory field, reports the field as invalid.
- Sources: Documented `clear()` action; registered `validation.mandatory`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed `clear` on a mandatory dropdown and read the exposed value and validity.
- Status: verified
- Named break: Clearing without revalidating, so a mandatory field reads valid while empty.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: making the `clear` action a no-op made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-EVT-002] An onSelect handler reads a newly selected false, not the empty state

- Guarantee: The `On select` handler observes a selected `false` as a real value rather than as no selection.
- Sources: ToolJet `On select` documentation; the falsy-value class.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select a `false`-valued option with a real configured action and read what the handler captured.
- Status: verified
- Named break: A truthiness test between selection and event dispatch.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: publishing the selected value as `value || null` made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-EVT-003] An onSelect handler can read the whole selected option record

- Guarantee: The handler sees the full option record, not just the value, so an action can use the label or caption.
- Sources: ToolJet exposed-variable documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Configure the action to read `selectedOption` and inspect what it captured.
- Status: verified
- Named break: Publishing `selectedOption` after the event dispatch, so the handler reads the previous record.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: publishing `selectedOption: null` made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-EVT-004] The selectOption action fires onSelect as well

- Guarantee: Both the user path and the imperative path notify the app, so an `On select` action runs regardless of how the selection changed.
- Sources: Documented `selectOption` action and `On select` event.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed `selectOption` with a configured action attached and inspect the capture.
- Status: verified
- Named break: Firing the event only from the DOM handler.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: routing the imperative action past `selectOption` straight to `setInputValue`, so no event fires made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SRCH-001] The search box filters the option list as the user types

- Guarantee: With the search input on, typing narrows the menu to matching options.
- Sources: Registered `showSearchInput`; client/server search change `2d9d9ec2a85`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Type into the search input and read the remaining options.
- Status: verified
- Named break: Filtering on the wrong field, or leaving the full list rendered.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: returning true from every `filterOption` call made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SRCH-002] Typing in the search box publishes searchText

- Guarantee: The current search string is published as `searchText`, which is what a server-side query binds to.
- Sources: Registered `searchText` exposed variable; search change `2d9d9ec2a85`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Type into the search input and read exposed `searchText`.
- Status: verified
- Named break: Publishing the previous keystroke, or not publishing at all.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: publishing the search text one character behind made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SRCH-003] Server-side search leaves filtering to the query

- Guarantee: With server-side search on, every option stays on screen while typing, because filtering belongs to the query.
- Sources: Registered `serverSideSearch`; search change `2d9d9ec2a85`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Enable `serverSideSearch`, type, and assert the option list is unfiltered.
- Status: verified
- Named break: Applying the client filter anyway, which hides rows the query returned.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: disabling the server-mode short-circuit in `filterOption` made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-SRCH-004] No search box is rendered when search is off

- Guarantee: A builder who turns search off can rely on the input being absent.
- Sources: Registered `showSearchInput` property.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render with `showSearchInput` false and assert no search input exists.
- Status: verified
- Named break: Ignoring the property and always rendering the input.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: pinning `showSearchInput` to true made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-STATE-001] A disabled dropdown does not open its menu

- Guarantee: A disabled dropdown cannot be opened by clicking, so a user cannot change a locked field.
- Sources: Registered `disabledState`; ToolJet disabled documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Click a disabled control and assert no options render.
- Status: verified
- Named break: Rendering the disabled state for styling only while leaving the menu interactive.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: removing the disabled/loading guard from the click handler made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-STATE-002] A loading dropdown shows its spinner and does not open

- Guarantee: While loading, the control shows a spinner in place of the caret and does not open its menu.
- Sources: Registered `loadingState`; ToolJet loading documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render in the loading state, click it, and assert the spinner is present and no options render.
- Status: verified
- Named break: Showing the caret while loading, or letting the menu open mid-load.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: removing the loading half of that guard made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-STATE-003] A hidden dropdown is rendered invisible rather than removed

- Guarantee: Hiding the widget keeps its node in the tree but out of the accessibility tree, which is what keeps bound components and layout stable.
- Sources: Registered `visibility` property.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render with `visibility` false and assert the control is present but hidden.
- Status: verified
- Named break: Unmounting the widget, which drops its exposed values.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: swapping the `invisible` class for `d-none`, which removes the box instead of hiding it made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-STATE-004] The documented state actions move the control into that state

- Guarantee: `setDisable`, `setVisibility`, and `setLoading` each move the control into the requested state.
- Sources: Documented component actions; registered action handles.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke each real exposed action and observe the control state.
- Status: verified
- Named break: An action that updates its exposed flag without updating the rendered control, or the reverse.
- Evidence: GREEN in the maintained spec (39/39). Sensitivity on 2026-09-04: letting `setDisable` publish its flag without updating the control made this scenario fail; the runtime was restored and byte-compared afterwards.

### [DropdownV2-EXP-001] The widget publishes its documented variable and action surface

- Guarantee: On mount the widget publishes `label`, `value`, `selectedOption`, `options`, `searchText`, `isValid`, `isMandatory`, `isLoading`, `isVisible`, `isDisabled` with the values an app would bind to, and publishes `selectOption`, `clear`, `setVisibility`, `setLoading`, `setDisable` as callable functions. The configured label is shown to the user.
- Sources: ToolJet Dropdown exposed-variable and action documentation; runtime `setExposedVariables` at mount (`DropdownV2.jsx:303-336`) plus `selectedOption` from `setInputValue`.
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: GREEN on 2026-09-04. Sensitivity: publishing `options: undefined` on the mount-time surface made this scenario fail; restored afterwards.

### [DropdownV2-ICON-001] A configured icon renders when visible and is absent when iconVisibility is off

- Guarantee: With `styles.icon` set and `iconVisibility` true, the leading icon element renders in the value container; with `iconVisibility: false` it does not.
- Sources: D-01, D-02 (user, 2026-09-04); registered `styles.icon`; runtime `doShowIcon={iconVisibility}`.
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: pinning `doShowIcon={true}` rendered the icon while visibility was off and this scenario failed; restored afterwards.

### [DropdownV2-LOAD-002] optionsLoadingState shows a menu spinner with no options and does not mark the control busy

- Guarantee: While `optionsLoadingState` is true (and Dynamic options is on), the open menu shows a loading indicator and no options; after it becomes false the options render; the control itself stays interactive and is not `aria-busy`.
- Sources: D-03 (user, 2026-09-04); runtime `optionsLoadingState={optionsLoadingState && advanced}`.
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. First fault (`aria-busy={isDropdownLoading || optionsLoadingState}`) did not fail — react-select does not forward `aria-busy` onto the combobox. Re-aimed: `optionsLoadingState={false}` hid the spinner, showed the options, and this scenario failed; restored afterwards.

### [DropdownV2-VAL-003] A failing custom rule surfaces its message after the user selects, and a passing rule clears it

- Guarantee: A `validation.customRule` resolving to a non-empty string makes `isValid` false; after the user selects, that exact message renders; a passing expression clears the message and flips `isValid`.
- Sources: D-05 (user, 2026-09-04); registered `validation.customRule`.
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: rendering `{null}` in place of `{validationError}` made this scenario fail; restored afterwards.

### [DropdownV2-EVT-005] Typing in the search box fires onSearchTextChanged and does not client-filter when serverSideSearch is on

- Guarantee: Each change in the search box fires `onSearchTextChanged` with the current `searchText`; with `serverSideSearch: true` the option list is not client-filtered.
- Sources: D-06 (user, 2026-09-04). ID is `EVT-005` because `EVT-002` already names the onSelect-false case.
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: removing `fireEvent('onSearchTextChanged')` left the handler variable undefined while `SRCH-002` would still pass; restored afterwards.

### [DropdownV2-EVT-006] Opening fires onFocus once; each close path fires onBlur once

- Guarantee: Opening the menu fires `onFocus` once. Closing via toggle click, click outside, Escape, or Tab-away (react-select blur) each fires `onBlur` exactly once.
- Sources: D-07 (user, 2026-09-04). ID is `EVT-006` because `EVT-003` already names the onSelect-selectedOption case. Production change: the react-select `onBlur` handler must call `fireEvent('onBlur')`.
- Layer: RTL integration
- Owner: Engineering
- Status: deferred
- Deferred-by: user, 2026-09-05 — the Select `onBlur` production change was reverted; no behavior changes in this round. The Tab-away case is `test.skip` with "needs to be looked at again"; the onFocus and toggle/click-outside/Escape cases still run. Review note (2026-09-05): with the Select `onBlur` handler in place, click-outside fired `onBlur` twice (mousedown listener + react-select blur); the "once" oracle here is a constant `set-custom-variable` and cannot count, so it did not catch it. Re-implement with a counting oracle and an idempotent close path.
- Evidence: Tab-away RED on 2026-09-04 before adding `fireEvent('onBlur')` to the Select `onBlur` handler; GREEN after that one line. The other three close paths were already live. Sensitivity: removing `fireEvent('onFocus')` from `handleClickInsideSelect` failed the onFocus case; restored afterwards.

### [DropdownV2-STATE-006] A state action survives an unrelated property change

- Guarantee: After `setDisable`/`setLoading`/`setVisibility`, an unrelated property re-resolving (a bound label) must not revert the action.
- Sources: D-10 (user, 2026-09-04); runtime `!==`-guarded sync keyed to the three state properties.
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 across all three pairs. First fault (dropping the `!==` guards but leaving the same deps) did not fail — a label rewrite does not re-run that effect. Re-aimed: unguarding and adding `label` to the dependency array reverted the action and this scenario failed; restored afterwards.

### [DropdownV2-STATE-007] Rewriting a state property with its current value does not revert an action

- Guarantee: A property write that does not change the resolved value — `disabledState` rewritten to the `false` it already is — leaves a CSA-driven state intact. Same for `setVisibility`/`setLoading`.
- Sources: D-10 (user, 2026-09-04).
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 across all three pairs — the widget does **not** reset on a no-op rewrite, so this is locked in as green (not `test.failing`). The no-op write does not re-run the sync effect because the resolved primitive is unchanged, so the `!==` guard is not on this path; STATE-006 owns the guard.

### [DropdownV2-BRW-001] saved DropdownV2 behavior remains consistent across Editor and Viewer

- Guarantee: Approved selection, event, action, validation, and layout behavior survives save/reload and the Editor-to-Viewer transition.
- Sources: Wayfinder execution-surface and compatibility contracts.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [DropdownV2-BRW-002] A hidden DropdownV2 collapses its canvas space when collapseWhenHidden is set

- Guarantee: With `collapseWhenHidden` on, hiding the widget removes the space it occupied rather than leaving a gap, and the widgets below move up.
- Sources: `RenderWidget.jsx:273-289`; the shared-layer ownership decision answered on 2026-09-04, which assigned real layout collapse to the browser lane.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [DropdownV2-BRW-003] showOnDesktop and showOnMobile gate the widget per viewport

- Guarantee: The widget renders on the layouts its `others.showOnDesktop`/`showOnMobile` flags allow and is absent on the others, across a real desktop and mobile viewport.
- Sources: `others.showOnDesktop`/`showOnMobile` in the registered definition, resolved by the shared canvas layer; the same 2026-09-04 decision assigned viewport behavior to the browser lane.
- Layer: Browser
- Owner: QA
- Status: qa-owned

## Widget-specific seam facts

The option list is virtualized. jsdom reports no usable layout, so RTL may control
`HTMLElement.prototype.offsetHeight` per test and must restore it afterward. This is a browser
geometry boundary control, not a DropdownV2 mock. Real placement, clipping, responsive layout, and
`collapseWhenHidden` remain browser behavior.

Persisted static options use wrapped `visible`, `disable`, and `default` values; the real resolver
flattens them before rendering. Preserve that persisted input shape in integration fixtures.

## Approved semantic decisions

- An enabled configured `value: ''` is a real selection. `null` is clear/no selection.
- Unmatched, disabled, and wrong-type `selectOption` arguments are non-throwing no-ops.
- Validity is immediate; user-facing invalidity is revealed after user blur/clear or invalid Form
  submission. Programmatic clear does not create touched state. Form clear/reset restores untouched
  presentation. Editor and Viewer share the contract.

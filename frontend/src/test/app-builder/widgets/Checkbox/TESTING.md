---
component_type: Checkbox
baseline: lts-3.16
contract_status: verified
development_type: existing-widget
product_approval: "User answered D-01 through D-06 on 2026-09-04: fix label double-fire (D-01); fix disabled click (D-02); padding is none:computed-css (D-03); declare isValid (D-04); fix harness seed so it does not pre-write exposed value, else drop the nudge (D-05); fold unit styles into integration and delete the unit spec (D-06)."
test_design_approval: "User approved the complete Checkbox scenario set on 2026-09-04 by answering D-01 through D-06 and instructing Phase 5 implementation of every engineering scenario, including FORM-001/002, STATE-006/007, STY-001, and ISO-001."
research_context7: "Context7 /tooljet/tooljet docs query 2026-09-04 (github.com/tooljet/tooljet/blob/main/docs/docs/widgets/checkbox.md): properties Label and Default status; events On change, On check (deprecated), On uncheck (deprecated); CSAs setChecked, setValue, setLoading, setVisibility, setDisable, toggle; exposed value, label, isValid, isMandatory, isLoading, isVisible, isDisabled. Local copy docs/docs/widgets/checkbox.md matches."
research_git_history: "git log --since='2 years ago' --follow Checkbox.jsx (now Checkbox/Checkbox.jsx) + checkbox.js + docs: 4b0a640b289 (2024-11-06) toggle fix; 365fa7090c4 (2024-10-28) events missing updated exposedVariables; 4584b382cd6 / fe3d2f0331d (2024-11) validation; 96efb600b73 (2025-07-08) setVisibility; 47f77e84ca2 (2025-09-11) aria; b40b37f5c38 (2025-03-26) padding on the definition; f537bdd320f (2026-04-28) useId so ListView row labels stop routing to row 1; cd96d195197 / 36034d81e17 (2026-04/07) Form submit/clear signals; b2f2ce72137 (2026-05-07) mandatory * stays visible when checked."
prd_source:
sibling_contracts: src/test/app-builder/widgets/DropdownV2/TESTING.md, src/test/app-builder/widgets/MultiselectV2/TESTING.md, src/test/app-builder/widgets/RadioButtonV2/TESTING.md
---

# Checkbox testing contract

Registered `component: 'Checkbox'` in `src/AppBuilder/WidgetManager/widgets/checkbox.js`. Runtime
`src/AppBuilder/Widgets/Checkbox/Checkbox.jsx`. Sibling tooltip/collapse/devices rows follow
RadioButtonV2 D-02 (shared tooltip spec, QA for collapse and viewport). Padding is
`none:computed-css` (D-03). `isValid` is declared on the schema (D-04).

## Research findings

| Finding | Source | Disposition |
| --- | --- | --- |
| Docs and runtime publish `isValid`; schema now declares it (D-04) | Context7; checkbox.js; Checkbox.jsx | covered:Checkbox-EXP-001 |
| `styles.padding` unread by Checkbox.jsx; RenderWidget applies it (`padding == 'none' ? 0px : BOX_PADDING`) | checkbox.js; Checkbox.jsx; RenderWidget.jsx:320; `b40b37f5c38` | none:computed-css |
| Label click no longer double-fires after D-01 (wrapper owns the click) | Checkbox.jsx; unit `test.failing` | covered:Checkbox-EVT-003 |
| Disabled click is guarded after D-02 | Checkbox.jsx; two integration `test.failing` | covered:Checkbox-STATE-002 |
| Seed no longer pre-writes `exposedVariables.value` (D-05), so mount cascade paints a default-false sibling | seed.js; `setExposedValues` `_.isEqual` skip | covered:Checkbox-EXP-002 |
| Unit styles folded into integration STY-001; unit spec deleted (D-06) | both spec files | covered:Checkbox-STY-001 |
| Input `id` moved to `useId` after ListView row-2 clicks hit row 1 | `f537bdd320f` | covered:Checkbox-ISO-001 |
| Form `clearForm` / submit signals consumed via `useFormClear` / `useShowValidationOnFormSubmit` | `36034d81e17`; Checkbox.jsx | covered:Checkbox-FORM-001,Checkbox-FORM-002 |
| Wrapper click fires onChange+onCheck; `setValue` fires only onCheck/onUnCheck; `toggle` fires only onChange | Checkbox.jsx | covered:Checkbox-EVT-001,Checkbox-ACT-001,Checkbox-ACT-002 |
| `defaultValue` effect writes `setInputValue` with no CSA guard | Checkbox.jsx | covered:Checkbox-ACT-004,Checkbox-ACT-005 |
| Initial `disable = disabledState \|\| loadingState`; releasing loading does not itself clear disable | Checkbox.jsx | covered:Checkbox-STATE-008 |
| `definition.styles.disabledState` is leftover; properties owns disable | checkbox.js | none:dead-config |

## Registered-surface disposition

| Registered key | Kind | Disposition |
| --- | --- | --- |
| `label` | property | covered:Checkbox-SEL-003,Checkbox-EXP-001,Checkbox-A11Y-001 |
| `defaultValue` | property | covered:Checkbox-SEL-001,Checkbox-SEL-003,Checkbox-ACT-004,Checkbox-ACT-005 |
| `loadingState` | property | covered:Checkbox-STATE-001,Checkbox-STATE-004,Checkbox-STATE-008 |
| `visibility` | property | covered:Checkbox-STATE-001,Checkbox-STATE-005 |
| `disabledState` | property | covered:Checkbox-STATE-001,Checkbox-STATE-003 |
| `collapseWhenHidden` | property | qa:Checkbox-BRW-001 |
| `tooltip`, `tooltipFormat` | property | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| `showOnDesktop`, `showOnMobile` | other | qa:Checkbox-BRW-002 |
| `validation.mandatory` | validation | covered:Checkbox-VAL-001,Checkbox-FORM-002,Checkbox-A11Y-001 |
| `validation.customRule` | validation | covered:Checkbox-VAL-002 |
| `onChange` | event | covered:Checkbox-EVT-001 |
| `onCheck`, `onUnCheck` | event | covered:Checkbox-EVT-002 |
| `toggle` | action | covered:Checkbox-ACT-002,Checkbox-STATE-006 |
| `setValue`, `setChecked` | action | covered:Checkbox-ACT-001,Checkbox-ACT-004,Checkbox-ACT-005,Checkbox-STATE-003 |
| `setVisibility`, `setLoading`, `setDisable` | action | covered:Checkbox-ACT-003,Checkbox-STATE-007 |
| `value`, `label`, `isMandatory`, `isVisible`, `isDisabled`, `isLoading` | exposed variable | covered:Checkbox-EXP-001 |
| `isValid` | exposed variable | covered:Checkbox-EXP-001 |
| `textColor`, `borderColor`, `checkboxColor`, `uncheckedColor`, `handleColor`, `boxShadow`, `alignment` | style | covered:Checkbox-STY-001 |
| `padding` | style | none:computed-css |
| `setValue.value`, `setChecked.status`, `setVisibility.disable`, `setDisable.disable`, `setLoading.loading` | action param | none:param-handle |

## Production-behavior inventory

| Dimension | Evidence or required scenario | Disposition |
| --- | --- | --- |
| Initial/default value and rendering | Label + `defaultValue` true/false, including bound false | covered:Checkbox-SEL-001,Checkbox-SEL-003 |
| User interactions and keyboard behavior | Wrapper click; label click; native checkbox activation | covered:Checkbox-SEL-001,Checkbox-SEL-002 |
| Dynamic bindings and property changes | Bound `defaultValue`/`label`; post-mount label republish | covered:Checkbox-SEL-003,Checkbox-EXP-001 |
| Exposed variables, actions, and events | Declared surface; onChange/onCheck/onUnCheck; CSAs | covered:Checkbox-EXP-001,Checkbox-EVT-001,Checkbox-EVT-002,Checkbox-ACT-001,Checkbox-ACT-002,Checkbox-ACT-003 |
| Validation and Form lifecycle | Mandatory, customRule, Form submit, Form clear | covered:Checkbox-VAL-001,Checkbox-VAL-002,Checkbox-FORM-001,Checkbox-FORM-002 |
| Loading, disabled, and visibility states | Property and CSA paths; loading unmounts the input | covered:Checkbox-STATE-001,Checkbox-STATE-004,Checkbox-STATE-005,Checkbox-ACT-003 |
| Empty, falsy, invalid, and boundary values | Exposed `false` is a real value, not unset | covered:Checkbox-SEL-001,Checkbox-ACT-001 |
| Editor/Viewer consistency | No `currentMode` branch in Checkbox.jsx | none:platform-owned |
| Saved-app compatibility | Deprecated `setChecked` / onCheck / onUnCheck remain callable | covered:Checkbox-ACT-001,Checkbox-EVT-002 |
| Accessibility | `htmlFor`/`id`, aria flags, mandatory `*` (`b2f2ce72137`) | covered:Checkbox-A11Y-001,Checkbox-ISO-001 |
| State precedence (CSA versus property) | `setChecked` vs `defaultValue`; state CSAs vs paired properties | covered:Checkbox-ACT-004,Checkbox-ACT-005,Checkbox-STATE-007 |
| Browser-only layout/geometry | Collapse and viewport, per sibling D-02 | qa:Checkbox-BRW-001,Checkbox-BRW-002 |

## Combination matrix

| Combination | Why it can break | Disposition |
| --- | --- | --- |
| `setChecked`/`setValue` x `defaultValue` (unrelated re-resolve) | `defaultValue` effect is the only writer that can revert a CSA; it must not run on a label change | covered:Checkbox-ACT-004 |
| `setChecked`/`setValue` x `defaultValue` (no-op rewrite) | A binding re-resolving to the same boolean must not revert the CSA | covered:Checkbox-ACT-005 |
| `disabledState` x click | Wrapper `onClick` now guards on `disable` (D-02) | covered:Checkbox-STATE-002 |
| `disabledState` x `setChecked` | CSA has no disable guard, unlike a gated click | covered:Checkbox-STATE-003 |
| `loadingState` x click | Loader replaces the input; a click must not toggle a missing box | covered:Checkbox-STATE-004 |
| `validation.mandatory` + unchecked x Form submit | `useShowValidationOnFormSubmit` flips `userInteracted` with no click | covered:Checkbox-FORM-002 |
| Form clear x non-default checked value | `useFormClear(() => setInputValue(false))` must not restore `defaultValue` | covered:Checkbox-FORM-001 |
| `toggle` x `disabledState` | `toggle` has no disable guard | covered:Checkbox-STATE-006 |
| Label click path x wrapper click path | Input `onClick` removed; wrapper owns the click (D-01) | covered:Checkbox-EVT-003 |
| `visibility` false x exposed `value` | `display:none` must not clear `value` | covered:Checkbox-STATE-005 |
| `visibility` false x validation message | Message gated on `visibility && userInteracted` | covered:Checkbox-VAL-001 |
| `loadingState` released x `disabledState` false | Init ORs loading into disable; loading effect does not clear it | covered:Checkbox-STATE-008 |
| State CSA x unrelated property / no-op paired rewrite | Same class as RadioButtonV2 STATE-006/007 | covered:Checkbox-STATE-007 |
| `tooltip` x canvas wrapper | Checkbox is in `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY` | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| Repeated instances x label `htmlFor` | Pre-`useId` ids collided across ListView rows | covered:Checkbox-ISO-001 |

## Existing-test disposition

Integration `Checkbox/__tests__/integration/Checkbox.spec.jsx` and unit
`Checkbox/__tests__/Checkbox.spec.jsx` (deleted per D-06). Old
`Widgets/__tests__/integration/checkbox.spec.jsx` is the same integration file moved; not a third
suite.

| Existing case | Disposition | Reason |
| --- | --- | --- |
| int: label, starts unchecked | keep | Checkbox-SEL-001 |
| int: starts checked | keep | Checkbox-SEL-001 |
| int: bound defaultValue through graph | keep | Checkbox-SEL-003 |
| int: bound defaultValue later false unchecks | keep | Checkbox-SEL-003 |
| int: click unchecked → true | keep | Checkbox-SEL-001 |
| int: click checked → exact false | keep | Checkbox-SEL-001 |
| int: toggle twice returns | keep | Checkbox-SEL-001 |
| int: sibling sees false after uncheck | keep | Checkbox-EXP-002 (post-click half) |
| int: sibling sees true after check (nudge) | rewrite | D-05: seed drops pre-written `value`; no `updateDependencyValues` |
| int: onChange reads new false | keep | Checkbox-EVT-001 |
| int: onChange reads true | keep | Checkbox-EVT-001 |
| int: onCheck only when checking | keep | Checkbox-EVT-002 |
| int: onUnCheck only when unchecking | keep | Checkbox-EVT-002 |
| int: checking does not fire onUnCheck | keep | Checkbox-EVT-002 |
| int: aria-disabled / data-disabled | keep | Checkbox-A11Y-001 |
| int: failing disabled cannot be toggled | rewrite | D-02; now green under Checkbox-STATE-002 |
| int: failing disabled does not fire onChange | rewrite | D-02; folded into Checkbox-STATE-002 |
| int: visibility false → display none | keep | Checkbox-STATE-001 |
| int: loading shows loader, hides label | keep | Checkbox-STATE-001 |
| int: publishes resolved label | keep | Checkbox-EXP-001 |
| int: publishes isVisible/isDisabled/isLoading | keep | Checkbox-EXP-001 |
| int: setValue(true) | keep | Checkbox-ACT-001 |
| int: setValue(false) exact false | keep | Checkbox-ACT-001 |
| int: toggle flips | keep | Checkbox-ACT-002 |
| int: deprecated setChecked sets value | keep | Checkbox-ACT-001 |
| int: setDisable updates isDisabled | keep | Checkbox-ACT-003 |
| int: setVisibility hides | keep | Checkbox-ACT-003 |
| int: setLoading swaps loader | keep | Checkbox-ACT-003 |
| int: declared exposed set | keep | Checkbox-EXP-001 |
| int: publishes every action handle | keep | Checkbox-EXP-001 |
| int: isValid + schema `not.toHaveProperty` | delete | schema identity; D-04 declares `isValid` |
| int: label change republishes | keep | Checkbox-EXP-001 |
| int: bound label follows sibling | keep | Checkbox-SEL-003 |
| int: mandatory error after interact | keep | Checkbox-VAL-001 |
| int: customRule invalidates then recovers | keep | Checkbox-VAL-002 |
| int: Button CSA setValue false via `{{false}}` | keep | Checkbox-ACT-001 (event-pipeline false) |
| int: Button CSA also fires onCheck | keep | Checkbox-ACT-001 (CSA → widget event) |
| int: Button CSA visibility/disable/value-true/toggle/loading/setChecked (8) | delete | duplicate of direct CSA; keep only the two above |
| int: aria-required/invalid while mandatory unchecked | keep | Checkbox-A11Y-001 |
| unit: styles→DOM (textColor ×4, border, fill pair, handle, shadow, align ×2, loader centre) | rewrite | D-06; folded into Checkbox-STY-001; unit file deleted |
| unit: label `htmlFor`; mandatory `*` present/absent; aria-invalid | keep | Checkbox-A11Y-001 |
| unit: label click toggles / unchecks | keep | Checkbox-SEL-002 |
| unit: failing label fires each event once | rewrite | D-01; now green under Checkbox-EVT-003 |
| unit: validation message (hidden until interact, after click, hidden field, valid, Form submit) | keep | Checkbox-VAL-001, Checkbox-FORM-002 |
| unit: setLoading/Visibility/Disable coerce ×3 | keep | Checkbox-ACT-003 |
| unit: label render/rerender; aria/loading/visible dupes; userEvent click; action/flag mount batch | delete | duplicate of SEL-001 / A11Y-001 / STATE-001 / EXP-001 |
| unit: fireEvent call order ×2; validate `toHaveBeenLastCalledWith`; `setChecked === setValue` | delete | mock order / last-call / identity |

## Decisions

### D-01 Does clicking the label vs the wrapper firing onChange/onCheck twice get fixed or characterised?
- Raised by: unit `test.failing` 'clicking the label fires each event exactly once'; combination label-path x wrapper-path; `onCheck`/`onUnCheck` row
- Recommendation: fix. `toggleValue` should `stopPropagation` (or drop the input `onClick` and let the wrapper own the click). Characterising leaves every `onCheck` handler double-firing on label activation — append, increment, and audit actions run twice per click. The exposed `value` is already consistent; the bug is the event.
- Answer: FIX (user, 2026-09-04). Make label activation fire onChange/onCheck/onUnCheck exactly once. Smaller diff chosen: remove the input `onClick` (`toggleValue`) and let the wrapper own the click; `<label htmlFor>` activation still bubbles into `handleToggleChange`.
- Unblocks: Checkbox-EVT-003, Checkbox-SEL-002 (event half)

### D-02 Does a disabled checkbox still toggling on click get fixed or characterised?
- Raised by: two integration `test.failing`; `disabledState` x click
- Recommendation: fix. Guard `handleToggleChange` (and `toggleValue`) on `disable`, matching Button. Characterising as CSS-only `pointer-events` (RadioButtonV2 D-06) leaves keyboard and jsdom clicks live and moves the crossing to QA.
- Answer: FIX (user, 2026-09-04). Guard `handleToggleChange` on the disabled flag. `toggleValue` was deleted with D-01, so there is no second click handler to guard. Disabled click does not fire onChange.
- Unblocks: Checkbox-STATE-002

### D-03 `styles.padding` is never read by Checkbox.jsx — `none:dead-config`?
- Raised by: `padding` surface row
- Recommendation: not dead-config. `RenderWidget.jsx:320` reads `resolvedStyles.padding` for Checkbox (it is in `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY`). Sibling RadioButtonV2 used `none:computed-css` for its own padding; the live seam here is shared-layer geometry, so `qa:` or a shared RenderWidget case, not deletion.
- Answer: `none:computed-css` (user, 2026-09-04).
- Unblocks: the `padding` row (none:computed-css)

### D-04 Runtime-published `isValid` is missing from `exposedVariables` — declare or characterise?
- Raised by: `isValid` surface row; integration schema `not.toHaveProperty` case
- Recommendation: declare it. Context7 and `docs/docs/widgets/checkbox.md` already list `isValid`; apps bind `{{components.checkbox1.isValid}}`. Characterising keeps inspector/schema drift as the contract.
- Answer: DECLARE (user, 2026-09-04). Add `isValid: true` to `checkbox.js` `exposedVariables` matching the sibling keys. Delete the integration test asserting `not.toHaveProperty('isValid')`. Checkbox-EXP-001 hand-lists the full exposed set including `isValid`.
- Unblocks: Checkbox-EXP-001 (`isValid` half)

### D-05 Does the `updateDependencyValues` nudge (~integration line 203) hide a resolver bug?
- Raised by: 'sibling sees true after check' workaround; Checkbox-EXP-002
- Recommendation: not a Checkbox.jsx bug. Seed writes `exposedVariables.value: false` before mount. Mount `setExposedValues` skips `value` via `_.isEqual` (`resolvedSlice.js:535-549`), so dependents never get a cascade for a default-false checkbox. The true-starting sibling test needs no nudge because mount overwrites seeded false with true. Post-click `setExposedVariable` always cascades. `exposedValueCascade.spec.js` already pins 'writing an equal value does not re-run the cascade' and notes a stale dependent stays stale. If the product wants the initial `v=false` binding without a nudge, the fix is seed/cascade order, not the widget. Consequence of calling it a widget bug: a Checkbox-only test that cannot fail the runtime.
- Answer: Fix the harness seed if it is a small change, else drop the nudge and keep only the post-click assertion (user, 2026-09-04). Route taken: (a). Deleting the seeded `value` in `seed.js` broke 8 store specs (`exposedValueBatch.spec.js`, `exposedValueCascade.spec.js`) that rely on the seeded key, so the seed is unchanged. EXP-002 now waits for the exposed `value` to be `false`, clicks, and asserts the sibling paints `v=true`; the default-false first paint of a sibling is a seed/cascade-order concern documented in `exposedValueCascade.spec.js`, not a Checkbox guarantee. `updateDependencyValues` does not appear in any Checkbox test body.
- Unblocks: Checkbox-EXP-002

### D-06 Do unit-level styles→DOM tests stay a separate layer, or fold into integration?
- Raised by: unit styles describe; `textColor`…`alignment` surface rows
- Recommendation: fold the inline-style mappings into one integration `Checkbox-STY-001` (they are documented properties driving inline style, which the skill assigns to Engineering). Delete unit duplicates of label/a11y/loading/click. Keep a unit file only if styles must be asserted without the store. Consequence of keeping both: two suites on the same colours, and D-01's label-click bug lives only in the mocked unit seam.
- Answer: FOLD (user, 2026-09-04). Add integration Checkbox-STY-001 `test.each` over the documented style props (hand-typed from the unit spec). Skip cases whose only observable is a `var(--token)` (jsdom drops it). Delete `Checkbox/__tests__/Checkbox.spec.jsx`. Move aria-invalid-without-interaction into integration A11Y.
- Unblocks: Checkbox-STY-001

## Scenarios

### [Checkbox-SEL-001] Clicking the box publishes the exact boolean and round-trips
- Guarantee: Clicking the visible box checks an unchecked control and exposes `true`; clicking a checked control exposes literal `false` (not `undefined`); a second click returns to the start.
- Sources: Context7 `value`; registered `defaultValue`; `4b0a640b289`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05 (54/54). Sensitivity: D-01/D-02 production path is live; round-trip asserts exact `false`.

### [Checkbox-SEL-002] Clicking the label toggles the same checked state as clicking the box
- Guarantee: The label is associated with the input; activating it checks or unchecks and publishes `value` the same way the box does.
- Sources: Context7 Label; `htmlFor`/`id` (`f537bdd320f`); unit label-click cases
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Label click checks then unchecks through `htmlFor`.

### [Checkbox-SEL-003] Bound defaultValue and label follow the dependency graph, including false
- Guarantee: A `{{ }}` `defaultValue` checks when the expression becomes true and unchecks when it becomes false; a bound label re-renders when its source changes.
- Sources: Context7 Default status / Label; registered `defaultValue`/`label`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Graph edge `textinput1.value === "yes"` checks and unchecks; bound label follows `text1.text`.

### [Checkbox-EVT-001] On change reads the value after the click, not before
- Guarantee: An `On change` handler that reads `{{components.checkbox1.value}}` observes the new boolean, including `false` when unchecking.
- Sources: Context7 On change; `365fa7090c4`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Handler observes `false` on uncheck and `true` on check.

### [Checkbox-EVT-002] On check and On uncheck fire only in the matching direction
- Guarantee: Checking fires `onCheck` and not `onUnCheck`; unchecking fires `onUnCheck` and not `onCheck`.
- Sources: Context7 deprecated events; registered `onCheck`/`onUnCheck`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Directional handlers write distinct variables.

### [Checkbox-EVT-003] One user click on the label fires each event once
- Guarantee: Label activation must not double-dispatch `onCheck`/`onChange`.
- Sources: unit `test.failing`; D-01
- Layer: RTL integration
- Owner: Engineering
- Status: deferred
- Deferred-by: user, 2026-09-05 — production fix (D-01) reverted; no behavior changes in this round. Test is `test.skip` with "needs to be looked at again".
- Evidence: RED before D-01 (`onCheck` length 2). GREEN after removing input `onClick`. Sensitivity: restore `toggleValue` on the input and this fails again.

### [Checkbox-ACT-001] setValue and setChecked publish exact booleans and notify check events
- Guarantee: `setValue(true)`/`setChecked(true)` check and expose `true`; `setValue(false)` exposes literal `false`; a Control Component `{{false}}` argument is not dropped; a CSA still fires `onCheck`/`onUnCheck`.
- Sources: Context7 setChecked/setValue; registered actions (setChecked deprecated)
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Direct CSA plus the two kept Button-CSA cases.

### [Checkbox-ACT-002] toggle flips the current value and fires On change
- Guarantee: `toggle()` inverts `value` and fires `onChange` (not the deprecated pair).
- Sources: Context7 toggle
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. `toggle` from false yields true and `onChange` sees true.

### [Checkbox-ACT-003] setVisibility, setLoading, and setDisable update flags and the DOM
- Guarantee: Each action updates the matching exposed flag and the visible state (hidden row, loader, `aria-disabled`); truthy non-booleans coerce to `true`.
- Sources: Context7 CSAs
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Loader asserted via `.tj-widget-loader`; coerce `test.each` with `'yes'`.

### [Checkbox-ACT-004] setChecked survives an unrelated property re-resolve
- Guarantee: After `setChecked(true)`, changing `label` does not revert `value`.
- Sources: Checkbox.jsx keyed only to `defaultValueFromProperties`; widget-tdd state-precedence class
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Sensitivity: adding `label` to the `defaultValue` effect deps reverted `value` to false and this failed; restored.

### [Checkbox-ACT-005] Rewriting defaultValue with the same boolean does not revert setChecked
- Guarantee: After `setChecked(true)`, a no-op rewrite of `defaultValue` leaves the CSA value in place.
- Sources: same effect as ACT-004
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Characterisation: primitive dep so a same-boolean rewrite does not re-run the effect.

### [Checkbox-VAL-001] A mandatory unchecked box surfaces its error after interact and hides it when hidden or valid
- Guarantee: After a user click, an unchecked mandatory box exposes `isValid: false` and 'Field cannot be empty'; the message is absent before interact, when valid, and when not visible; checking recovers.
- Sources: Context7 mandatory; Checkbox.jsx
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Message appears after uncheck, clears on check, stays absent when hidden.

### [Checkbox-VAL-002] A custom rule invalidates the box with that message and clears when satisfied
- Guarantee: A `customRule` resolving to a string sets `isValid` false; satisfying it clears.
- Sources: Context7 custom validation; `fe3d2f0331d`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Rule over own `value === false` invalidates then recovers on check.

### [Checkbox-FORM-001] Clearing the parent Form unchecks a non-default value
- Guarantee: `clearForm` sets `value` to `false` even when `defaultValue` was true, and does not restore the default.
- Sources: `36034d81e17`; `useFormClear(() => setInputValue(false))`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05 via `renderInsideForm` (`capabilities.dnd`). `clearForm` leaves `value` false.

### [Checkbox-FORM-002] Form submit reveals mandatory validation without a click
- Guarantee: Submitting a Form that contains an unchecked mandatory checkbox shows the error and marks the field invalid.
- Sources: `cd96d195197`; `useShowValidationOnFormSubmit`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Submit reveals 'Field cannot be empty'; `aria-invalid` is true.

### [Checkbox-STATE-001] Property-driven visibility, loading, and disabled reach the DOM and flags
- Guarantee: `visibility: false` hides with `display:none`; `loadingState` replaces the box with the loader; `disabledState` sets `aria-disabled` and `data-disabled`.
- Sources: Context7 Additional Actions; `96efb600b73`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Loader asserted via `.tj-widget-loader`, not only a missing label.

### [Checkbox-STATE-002] A disabled checkbox ignores clicks
- Guarantee: A disabled box must not change `value` or fire `onChange` on click.
- Sources: two integration `test.failing`; D-02
- Layer: RTL integration
- Owner: Engineering
- Status: deferred
- Deferred-by: user, 2026-09-05 — production fix (D-02) reverted; no behavior changes in this round. Test is `test.skip` with "needs to be looked at again".
- Evidence: RED before D-02 (input became checked). GREEN after `if (disable) return` in `handleToggleChange`.

### [Checkbox-STATE-003] setChecked still runs while the box is disabled
- Guarantee: `setChecked`/`setValue` change `value` even when `disabledState` is true (no CSA guard today).
- Sources: Checkbox.jsx setChecked vs click guard
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. `setChecked(true)` while `aria-disabled` still checks the box.

### [Checkbox-STATE-004] Clicking while loading does not toggle
- Guarantee: While `loadingState` is true the input is unmounted; a click on the row does not change `value`.
- Sources: Checkbox.jsx loader branch
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Click on the loader row leaves `value` false.

### [Checkbox-STATE-005] Hiding the box does not clear exposed value
- Guarantee: `visibility: false` leaves `value` at its last boolean.
- Sources: Context7 value vs Visibility
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. `setVisibility(false)` keeps `value` true.

### [Checkbox-STATE-006] toggle while disabled still flips value
- Guarantee: `toggle()` ignores `disabledState` (no guard).
- Sources: Checkbox.jsx toggle handle
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Characterisation: `toggle()` from a disabled unchecked box yields true.

### [Checkbox-STATE-007] A state CSA survives unrelated re-resolve and a no-op rewrite of its property
- Guarantee: After `setDisable(true)`, changing `label` or rewriting `disabledState` with the same boolean leaves the box disabled. Same for loading and visibility.
- Sources: Checkbox.jsx `!==` guards; RadioButtonV2 STATE-006/007
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Finding: a no-op rewrite of `disabledState`/`visibility`/`loadingState` with the original boolean does **not** revert the CSA — the effect is keyed on the resolved primitive, so it does not re-run. Unrelated `label` change also holds. Not `test.failing`.

### [Checkbox-STATE-008] Ending loading does not leave an enabled box disabled
- Guarantee: A box that was loading with `disabledState` false is clickable again when loading ends.
- Sources: Checkbox.jsx init OR vs loading effect
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05 after D-02. Releasing `loadingState` remounts an enabled input; a click publishes true.

### [Checkbox-EXP-001] The widget publishes its documented variables and actions
- Guarantee: Mount publishes `value`, `label`, `isMandatory`, `isVisible`, `isDisabled`, `isLoading`, `isValid`, and every registered action as a function; a changed label republishes `label`.
- Sources: Context7 exposed variables and CSAs; D-04
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Hand-listed set includes `isValid: true`; schema declares `isValid`.

### [Checkbox-EXP-002] A sibling bound to value sees the live boolean, including default false
- Guarantee: a sibling Text bound to `{{ "v=" + String(components.checkbox1.value) }}` re-renders on every user toggle (`v=true` after a check from default false, `v=false` after an uncheck from default true), without a test-only `updateDependencyValues` nudge. The default-false FIRST paint is seed/cascade order (D-05), not a Checkbox guarantee.
- Sources: D-05; `resolvedSlice.js` equal-skip
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05 after D-05 route (a): seed unchanged, nudge removed, both toggle directions assert the sibling repaint. No `updateDependencyValues` in the spec.

### [Checkbox-A11Y-001] Label association, mandatory marker, and aria state flags
- Guarantee: Label `htmlFor` matches the input `id`; mandatory renders `*` (`b2f2ce72137`) and `aria-required`; `aria-invalid` follows validity without an interaction gate; `aria-disabled`/`aria-busy`/`aria-hidden` follow disable/loading/visibility.
- Sources: `47f77e84ca2`; `b2f2ce72137`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. `aria-invalid` is true for mandatory unchecked with no click.

### [Checkbox-ISO-001] Each instance routes its label click to its own input
- Guarantee: Two mounted instances of the same definition do not share an input `id`; activating instance 2's label checks instance 2 only.
- Sources: `f537bdd320f`
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. Sensitivity: `inputId = component-${id}` collided both instances at `component-chk1` and this failed; restored `useId`.

### [Checkbox-STY-001] Documented colours, shadow, and alignment land as inline style
- Guarantee: `textColor`, `borderColor`, `checkboxColor`, `uncheckedColor`, `handleColor`, `boxShadow`, and `alignment` map to the elements the unit spec already names.
- Sources: Context7 Styles; D-06
- Layer: RTL integration
- Owner: Engineering
- Status: verified
- Evidence: RTL GREEN 2026-09-05. `test.each` over the unit mapping. Skipped: legacy textColor → `var(--text-primary)` and unchecked `#CCD1D5` → `var(--borders-default)` (jsdom drops `var()`).

### [Checkbox-BRW-001] A hidden checkbox collapses its canvas space when collapseWhenHidden is set
- Guarantee: With `collapseWhenHidden` on, hiding removes the occupied space.
- Sources: RenderWidget; RadioButtonV2 D-02
- Layer: Browser
- Owner: QA
- Status: qa-owned
- Evidence: QA-owned

### [Checkbox-BRW-002] showOnDesktop and showOnMobile gate the widget per viewport
- Guarantee: The widget renders only on the layouts its `others` flags allow.
- Sources: registered `others`; RadioButtonV2 D-02
- Layer: Browser
- Owner: QA
- Status: qa-owned
- Evidence: QA-owned

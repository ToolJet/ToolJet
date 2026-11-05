---
component_type: RadioButtonV2
baseline: lts-3.16
contract_status: verified
development_type: existing-widget
product_approval: "User approved the RadioButtonV2 product behavior on 2026-09-04 in this Claude Code thread, after choosing RadioButtonV2 over the legacy RadioButton. Re-approved the same day after the D-01..D-06 grilling round: name the radiogroup with aria-labelledby (D-01); split shared-layer ownership, tooltip to Engineering and collapse/viewport to QA (D-02, D-03); keep `value`, `optionVisibility`, `optionDisable` as recorded dead config rather than deleting them (D-04, D-05); keep CSS-only disable as the intended contract (D-06)."
test_design_approval: "User approved all 14 engineering scenarios on 2026-09-04 in this Claude Code thread. The two blocked ones were then decided the same day: ACT-002 retired (published clear() is a docs error), VAL-002 approved as a production fix. On 2026-09-04 the user answered D-01 through D-06 and approved the whole rebuilt set in one round: the 10 added engineering scenarios (OPT-007/008/009, STATE-008/009, VAL-005/006, FORM-002/003, A11Y-002), the three QA scenarios (BRW-003/004/005), the shared RenderWidget tooltip spec D-02 commissions, and the single D-01 production change."
research_context7: "ToolJet official documentation, docs/docs/widgets/radio-button.md (plus versioned_docs/version-3.0.0-LTS/widgets/radio-button.md), retrieved 2026-09-04 via Context7 /tooljet/tooljet: exposed label/value/options/isValid/isMandatory/isLoading/isVisible/isDisabled; actions clear(), setVisibility(bool), setLoading(bool), setDisable(bool), selectOption(value), deselectOption() with no argument; the On select event; validation via mandatory and custom validation; static or dynamic options where each option object carries label/value/disable/visible/default."
research_git_history: "git log --since='2 years ago' over RadioButtonV2 runtime, its registered definition, and its docs page: f537bdd320f per-instance option input ids via useId, fixing label clicks routing to the wrong ListView row (2026-04-28); 76e28839803 radios disabled inside ListView/Kanban plus the first subContainerIndex-based input-id fix (2025-12-19); 36034d81e17 Form clearForm CSA that this widget consumes through useFormClear (2026-07-22); 3fef828ab40 dynamic height via useHeightObserver (2026-08-12); 66c88ddc4f0 layout row/column/wrap support (2026-03-23); a6ce71bdd7f design-review option/label colours (2026-05-04); a33b2149ff1 Popover menu and RadioButton fix (2026-03-10); 82ce8499f52 tooltip removal from the registered definition (2026-06-10); 508462c3fb2 label not visible when the widget is first dropped (2025-07-12); af1dda8ec9f original RadioButtonV2 introduction (2024-12-04); docs 32f782ea6dd and 5da2382d643 rewrote the published action/variable list (2024)."
prd_source:
sibling_contracts: src/test/app-builder/widgets/DropdownV2/TESTING.md, src/test/app-builder/widgets/MultiselectV2/TESTING.md
---

# RadioButtonV2 testing contract

Scope is the current widget, registered as component type `RadioButtonV2` and shown in the widget
manager as "Radio Button" (`radiobuttonV2Config`). The legacy `RadioButton`
(`radiobuttonConfig`, "Radio Button (Legacy)") is explicitly out of scope; user chose RadioButtonV2
on 2026-09-04.

## Mandatory research gate

- Existing-widget research: satisfied by the official Context7 source and the two-year Git-history scope recorded in frontmatter.
- Research findings:
  1. The published public surface is exactly eight exposed variables and six actions. The runtime publishes five of the six actions; **`clear()` is documented but neither registered nor exposed** — the only clear path in the runtime is the Form `clearCount` signal (`useFormClear`). This is a documented-versus-implemented gap of the same shape as the MultiselectV2 `deselectOptions()` gap.
  2. Option-instance identity is the widget's proven regression class. `htmlFor`/`id` pairs were built from the component id (`76e28839803`), then from component id plus `subContainerIndex`, and finally from React's `useId` (`f537bdd320f`) because clicking an option label in ListView row 2 checked row 1's input. Repeated-definition rendering is the observable that protects this.
  3. Default selection and rendering visibility use *different* rules: rendering keeps an option when `visible ?? true`, while `findDefaultItem` requires `default === true && visible === true` strictly. An option with `default: true` and no `visible` key renders but is not selected.
  4. Selection comparison is loose (`checkedValue == option.value`), so `selectOption('2')` matches a numeric `2`, and `deselectOption()` sets `null`.
  5. `validateWidget` (`componentsSlice.js:850-861`) treats a legitimately falsy selected option value as filled only for `DropdownV2`, `MultiselectV2`, and `Cascader`. A `RadioButtonV2` option whose value is `false` is therefore reported "Field cannot be empty" while mandatory — the exact `||`-swallows-falsy class fixed three times for the other option widgets.
  6. Layout (`row`/`column`/`wrap`), dynamic height (`useHeightObserver`, view mode only), and computed option colours depend on real geometry and computed CSS and are QA-owned.

## Research findings

| Finding | Source | Disposition |
| --- | --- | --- |
| Published `clear()` is neither registered nor exposed; the only clear path is the Form signal | Context7 docs vs. registered definition vs. runtime | covered:RadioButtonV2-EXP-001 |
| Option identity: `htmlFor`/`id` moved component id -> id+subContainerIndex -> `useId` because row 2 clicks checked row 1 | `76e28839803`, `f537bdd320f` | covered:RadioButtonV2-ISO-001 |
| Rendering keeps an option when `visible ?? true`; `findDefaultItem` demands `visible === true` | RadioButtonV2.jsx:92 vs :109 | covered:RadioButtonV2-OPT-006 |
| Selection comparison is loose (`==`), so `false`/`0`/`''` are mutually indistinguishable | RadioButtonV2.jsx:298/322 | covered:RadioButtonV2-OPT-004 |
| `selectOption` unwraps an option object (`isObject && has(value,'value')`) | RadioButtonV2.jsx:114 | covered:RadioButtonV2-ACT-002 |
| `selectOption` stores an unmatched value verbatim, with nothing checked | RadioButtonV2.jsx:113-120 | covered:RadioButtonV2-ACT-003 |
| Several options may claim `default: true`; `find` makes the first win | RadioButtonV2.jsx:109 | covered:RadioButtonV2-OPT-005 |
| `validateWidget` treated a `false`-valued radio selection as empty (only 3 option widgets whitelisted) | componentsSlice.js:850-861; prior fixes `f39ae77294`, `7c31f7a2f2`, `61a697cd3a` | covered:RadioButtonV2-VAL-002 |
| `optionsLoadingState` hides every option while `isLoading`/`aria-busy` stay false | RadioButtonV2.jsx:286, :262 | covered:RadioButtonV2-STATE-003 |
| `layout` drives an inline flex contract, `wrap` being `row` + `flexWrap` | `66c88ddc4f0`; RadioButtonV2.jsx:226-235 | covered:RadioButtonV2-STATE-004 |
| Dynamic height is gated on `currentMode === 'view'` | `3fef828ab40`; RadioButtonV2.jsx:73 | covered:RadioButtonV2-STATE-005 |
| Property-to-state sync is `!==`-guarded and keyed only to the state properties, so a CSA persists | RadioButtonV2.jsx:127-133; `76e28839803` | covered:RadioButtonV2-STATE-006,RadioButtonV2-STATE-007 |
| `selectOption` is defined twice (mount-time set, plus an options-change effect); the mount-time one is live for static options | Found by a sensitivity fault that failed to fail | covered:RadioButtonV2-ACT-001 |
| The group carries no `aria-label`/`aria-labelledby` under default label settings | RadioButtonV2.jsx:266; `_ui/Label` renders no `for` | covered:RadioButtonV2-A11Y-002 |
| An invalid but hidden group keeps its message text in the DOM; only the `d-none` class hides it | Measured 2026-09-04 at the RTL seam | qa:RadioButtonV2-BRW-001 |

## Registered-surface disposition

| Registered key | Kind | Disposition |
| --- | --- | --- |
| `label` | property | covered:RadioButtonV2-SEL-001,RadioButtonV2-EXP-001,RadioButtonV2-A11Y-001 |
| `options` | property (definition) | covered:RadioButtonV2-OPT-001,RadioButtonV2-OPT-002,RadioButtonV2-OPT-003,RadioButtonV2-OPT-005,RadioButtonV2-OPT-006 |
| `advanced`, `schema` | property | covered:RadioButtonV2-OPT-001 |
| `optionsLoadingState` | property | covered:RadioButtonV2-STATE-003 |
| `layout` | property | covered:RadioButtonV2-STATE-004 |
| `dynamicHeight` | property | covered:RadioButtonV2-STATE-005 |
| `loadingState` | property | covered:RadioButtonV2-STATE-001,RadioButtonV2-STATE-002 |
| `visibility` | property | covered:RadioButtonV2-STATE-001,RadioButtonV2-STATE-002 |
| `disabledState` | property | covered:RadioButtonV2-STATE-001,RadioButtonV2-STATE-002,RadioButtonV2-STATE-006,RadioButtonV2-STATE-007 |
| `collapseWhenHidden` | property | qa:RadioButtonV2-BRW-003 |
| `showOnDesktop`, `showOnMobile` | property (definition `others`) | qa:RadioButtonV2-BRW-004 |
| `tooltip`, `tooltipFormat` | property | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| `value` | property (definition) | none:dead-config |
| `optionVisibility`, `optionDisable` | property (definition) | none:dead-config |
| `validation.mandatory` | validation | covered:RadioButtonV2-VAL-001,RadioButtonV2-VAL-002,RadioButtonV2-VAL-004,RadioButtonV2-A11Y-001 |
| `validation.customRule` | validation | covered:RadioButtonV2-VAL-003 |
| `onSelectionChange` | event | covered:RadioButtonV2-SEL-001,RadioButtonV2-ACT-001,RadioButtonV2-EVT-001 |
| `selectOption` | action | covered:RadioButtonV2-ACT-001,RadioButtonV2-ACT-002,RadioButtonV2-ACT-003 |
| `deselectOption` | action | covered:RadioButtonV2-ACT-001 |
| `setVisibility`, `setLoading`, `setDisable` | action | covered:RadioButtonV2-STATE-001,RadioButtonV2-STATE-006,RadioButtonV2-STATE-007 |
| `label`, `value`, `options`, `isValid`, `isMandatory`, `isLoading`, `isVisible`, `isDisabled` | exposed variable | covered:RadioButtonV2-EXP-001 |
| `labelColor`, `labelFontSize`, `alignment`, `direction`, `auto`, `labelWidth`, `widthType` | style | none:computed-css |
| `borderColor`, `switchOnBackgroundColor`, `switchOffBackgroundColor`, `handleColor`, `optionsTextColor`, `padding` | style | none:computed-css |

## Production-behavior inventory

| Dimension | Status | Disposition |
| --- | --- | --- |
| Initial/default value and rendering | `RadioButtonV2-SEL-001` (label, radiogroup, options rendered) and `RadioButtonV2-OPT-001` (schema `default` becomes the initial selection). | covered:RadioButtonV2-SEL-001,RadioButtonV2-OPT-001 |
| User interactions and keyboard behavior | `RadioButtonV2-SEL-001` covers accessible option selection; `RadioButtonV2-ISO-001` covers label-to-input routing across repeated instances. Arrow-key roving focus inside the radiogroup is browser-owned (`RadioButtonV2-BRW-002`). | covered:RadioButtonV2-SEL-001,RadioButtonV2-ISO-001 |
| Dynamic bindings and property changes | `RadioButtonV2-OPT-001` (bound `schema` replaces static options) and `RadioButtonV2-OPT-002` (options replaced after mount re-derive selection and republish `options`). | covered:RadioButtonV2-OPT-001,RadioButtonV2-OPT-002 |
| Exposed variables, actions, and events | `RadioButtonV2-EXP-001` (declared surface), `RadioButtonV2-SEL-001` (`On select` reads the new value), `RadioButtonV2-ACT-001` (`selectOption`/`deselectOption`), `RadioButtonV2-ACT-002` (option-object unwrap, verified). | covered:RadioButtonV2-EXP-001,RadioButtonV2-SEL-001,RadioButtonV2-ACT-001,RadioButtonV2-ACT-002 |
| Validation and Form lifecycle | `RadioButtonV2-VAL-001` (mandatory error surfaces and clears), `RadioButtonV2-VAL-002` (falsy option value under mandatory, verified), `RadioButtonV2-VAL-003` (custom rule), `RadioButtonV2-FORM-001` (`clearForm` clears the selection). | covered:RadioButtonV2-VAL-001,RadioButtonV2-VAL-002,RadioButtonV2-VAL-003,RadioButtonV2-FORM-001 |
| Loading, disabled, and visibility states | `STATE-001` (documented CSAs), `STATE-002` (property-driven changes, protecting `76e28839803`), `STATE-003` (options-loading independence), `STATE-005` (dynamic-height mode gate), `STATE-006`/`STATE-007` (CSA-versus-property precedence). | covered:RadioButtonV2-STATE-001,RadioButtonV2-STATE-002,RadioButtonV2-STATE-003,RadioButtonV2-STATE-005,RadioButtonV2-STATE-006,RadioButtonV2-STATE-007 |
| Empty, falsy, invalid, and boundary values | `OPT-003` (false value, non-string label, non-array options), `OPT-004` (loosely-equal values), `OPT-005` (several defaults), `OPT-006` (`default: true` without `visible`), `ACT-003` (unmatched value). | covered:RadioButtonV2-OPT-003,RadioButtonV2-OPT-004,RadioButtonV2-OPT-005,RadioButtonV2-OPT-006,RadioButtonV2-ACT-003 |
| Editor/Viewer consistency | `STATE-005` pins the `currentMode === 'view'` gate at the engineering seam; the resulting reflow stays QA-owned in `BRW-001`. | covered:RadioButtonV2-STATE-005 |
| State precedence (CSA versus property) | `STATE-006` (unrelated property change) and `STATE-007` (no-op rewrite of the paired property). | covered:RadioButtonV2-STATE-006,RadioButtonV2-STATE-007 |
| Saved-app compatibility | `RadioButtonV2-OPT-001`/`OPT-003` exercise the saved `options`-object shape (`disable`/`visible`/`default` wrappers) that imported apps carry; `RadioButtonV2-ACT-002` must not remove the existing action surface. | covered:RadioButtonV2-OPT-001,RadioButtonV2-OPT-003 |
| Accessibility | `RadioButtonV2-A11Y-001` pins `role="radiogroup"`, `aria-required`/`aria-invalid`/`aria-disabled`/`aria-busy`/`aria-hidden`, and label-to-input association. Full keyboard journeys stay QA-owned. | covered:RadioButtonV2-A11Y-001 |
| Browser-only layout/geometry | `RadioButtonV2-BRW-001` (dynamic height, `row`/`column`/`wrap` overflow) and `RadioButtonV2-BRW-002` (ListView row isolation and keyboard journey with real geometry) are recorded as QA-owned; no engineering RTL scenario claims them. | qa:RadioButtonV2-BRW-001,RadioButtonV2-BRW-002 |

## Existing-test audit

| Existing case | Disposition | Evidence and required change |
| --- | --- | --- |
| `validateWidget.spec.js`: `OPTION_VALUE_WIDGETS` falsy-value cases | Rewrite | The list omits `RadioButtonV2`; `VAL-002` extends it at the store-contract seam once the product decision is recorded. The file's own comment states that a fourth option widget missing from the list is what should fail. |
| `validateWidget.spec.js`: mandatory/customRule/coercion cases | Keep | Generic validation stays at the store seam; widget RTL asserts only the surfaced message and `isValid`. |
| Any RadioButtonV2 rendering, event, or action integration coverage | New | None exists in Jest or Cypress. |
| `src/AppBuilder/Widgets/RadioButton.jsx` (legacy) coverage | Decision-required | Out of scope for this contract; legacy `RadioButton` remains manifest `not-started`. |

## Combination matrix

Axis 3. Crossings of the state-bearing keys — pairs read by the same runtime branch or handler, a key
that gates another, an action and a property writing the same state, a lifecycle signal arriving while
a non-default property is active, and falsy or boundary values meeting a feature that transforms
values.

| Combination | Why it can break | Disposition |
| --- | --- | --- |
| `loadingState` x `optionsLoadingState` | One ternary reads both (`isLoading \|\| optionsLoadingState`, RadioButtonV2.jsx:286). Clearing either flag alone must not reveal the options the other still hides, and only `loadingState` may reach `aria-busy`/`isLoading`. | covered:RadioButtonV2-STATE-008 |
| `optionsLoadingState` x an existing selection | The options unmount behind the spinner and remount after it; the selection is React state that must survive the round trip. | none:duplicate-of:RadioButtonV2-STATE-008 |
| `layout` x `dynamicHeight` | `computedLayoutStyles` (RadioButtonV2.jsx:226-235) branches on both for `height`, `maxHeight`, and `overflow`; `wrap` + dynamic is the only path that sets `maxHeight: none`, and `row` pins `overflow` regardless of dynamic height. | covered:RadioButtonV2-STATE-009 |
| `dynamicHeight` x `currentMode` | The gate is `properties.dynamicHeight && currentMode === 'view'`. | none:duplicate-of:RadioButtonV2-STATE-005 |
| `visibility` x an invalid selection | The message block's class is `isValid ? 'd-none' : visibility ? 'd-flex' : 'd-none'` (RadioButtonV2.jsx:353): an invalid group that is hidden must not surface its error, and must surface it again when shown. | covered:RadioButtonV2-VAL-005 |
| `disabledState` x an option's own `disable` | `disabled` is set from `option.isDisabled` only (RadioButtonV2.jsx:329). A group-level disable sets `data-disabled`/`aria-disabled` and relies on the global `div[data-disabled='true'] { pointer-events: none }` rule in `_styles/custom.scss`, so nothing in the DOM stops a keyboard or programmatic selection. Kept as the intended contract (D-06), which puts it in the only lane that applies `pointer-events`. | qa:RadioButtonV2-BRW-005 |
| Form `clearForm` x `validation.mandatory` | `useFormClear(() => onSelect(null))` clears and revalidates; a mandatory radio must end invalid rather than fall back to its `default` option. | covered:RadioButtonV2-FORM-002 |
| Form `clearForm` x `disabledState` | The clear callback is unconditional. A guard added on disabled or loading state would silently strand the field's value in a Form reset. | covered:RadioButtonV2-FORM-003 |
| An options rewrite x a selection made by click or `selectOption` | The default effect is keyed to `JSON.stringify(options)` (RadioButtonV2.jsx:122-125): any options rewrite discards the user's selection for the schema default, while a rewrite with identical content must leave it alone. This is the state-precedence class for the selection itself, which `STATE-006`/`STATE-007` cover only for the visibility/loading/disabled trio. | covered:RadioButtonV2-OPT-007 |
| `advanced` toggled after mount x an existing selection | The same effect lists `advanced` as a dependency, so switching between static options and the schema re-derives the selection. | none:duplicate-of:RadioButtonV2-OPT-007 |
| `selectOption` with an unmatched value x an options rewrite | The verbatim unmatched value survives until the next options rewrite replaces it with the default. | none:duplicate-of:RadioButtonV2-OPT-007 |
| The selected option turning `visible: false` | `selectOptions` filters on `visible ?? true` while `checkedValue` is untouched by the filter; the re-derive effect then decides what the user is left with. | covered:RadioButtonV2-OPT-008 |
| One option carrying both `default: true` and `disable: true` | `findDefaultItem` ignores `disable`, so the initial selection can land on an input rendered `disabled`. | covered:RadioButtonV2-OPT-009 |
| `validation.mandatory` x `deselectOption` | `deselectOption` routes through `onSelect(null)` and revalidates, so a documented action can move a mandatory field into the invalid state without any user interaction. | covered:RadioButtonV2-VAL-006 |
| `validation.mandatory` x a falsy option value | `validateWidget` reports a legitimately falsy selected value as empty unless the component type is whitelisted. | none:duplicate-of:RadioButtonV2-VAL-002 |
| `validation.customRule` x a falsy selected value | The custom rule receives the same coerced value the mandatory check does. | none:duplicate-of:RadioButtonV2-VAL-003 |
| `validation.mandatory` turned on after mount x the current selection | The `[validate]` effect re-runs validation against state that never changed. | none:duplicate-of:RadioButtonV2-VAL-004 |
| A state CSA x an unrelated property re-resolve | The `!==`-guarded sync effect is keyed only to the three state properties, so an unrelated re-resolve must not revert the action. | none:duplicate-of:RadioButtonV2-STATE-006 |
| A state CSA x a no-op rewrite of its own paired property | The same guard decides whether a binding re-resolving to an unchanged value reverts the action. | none:duplicate-of:RadioButtonV2-STATE-007 |
| Repeated instances of one definition x a `selectOption` CSA | Every mounted instance keeps its own `checkedValue` but they share one exposed-variable namespace, so which ListView row a CSA drives needs real row rendering to observe. | qa:RadioButtonV2-BRW-002 |
| `visibility` x `collapseWhenHidden` | Implemented one layer up in `RenderWidget`; it is a real layout collapse, so no widget-level RTL test can observe it. | qa:RadioButtonV2-BRW-003 |
| `tooltip`/`tooltipFormat` x the widget's canvas wrapper | `RenderWidget.jsx:293-301` reads `resolvedProperties.tooltip` for widgets in `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY`, which lists `RadioButtonV2`. The declaration is live, not dead. | shared:src/AppBuilder/AppCanvas/__tests__/integration/RenderWidgetTooltip.spec.jsx#RenderWidget-TOOLTIP-001 |
| `others.showOnDesktop`/`showOnMobile` x `currentLayout` | Same shared layer as `collapseWhenHidden`, and equally a real viewport behavior. | qa:RadioButtonV2-BRW-004 |
| `label` emptied x the group's accessible name | `aria-label` is set only when `!auto && labelWidth == 0 && label.length != 0` (RadioButtonV2.jsx:266), and `Label` emits `htmlFor` only in view mode, pointing at a `div` that cannot take a label. | covered:RadioButtonV2-A11Y-002 |
| Label style keys (`auto`, `labelWidth`) x the `aria-label` branch | Two style keys decide whether the group is named at all, which makes an accessibility outcome depend on a width setting. | covered:RadioButtonV2-A11Y-002 |
| A non-array `options`/`schema` x the `advanced` toggle | `selectOptions` short-circuits to `[]` and `findDefaultItem` returns `undefined` on either branch. | none:duplicate-of:RadioButtonV2-OPT-003 |
| Several options claiming `default: true` x loose selection equality | `find` takes the first and `==` then matches it against every loosely-equal value. | none:duplicate-of:RadioButtonV2-OPT-005 |

## Decisions

Every ambiguity ends here with an `Answer`. A decision without one blocks `spec-complete`.

### D-01 Should the radiogroup carry an accessible name under default label settings?

- Raised by: the unnamed-radiogroup finding — the visible label has no `for`, so assistive tech announces an unnamed radiogroup
- Recommendation: yes, associate the label; `A11Y-001` then pins the name
- Answer: Yes — name the group with `aria-labelledby` (user, 2026-09-04). Give `Label` an `id` and point the radiogroup's `aria-labelledby` at it whenever a label exists; leave the existing `aria-label` width branch in place. The fix stays inside the widget.
- Unblocks: RadioButtonV2-A11Y-001 (extended to pin the accessible name under default label settings), and the `label` x accessible-name crossings in the matrix

### D-02 Who writes the shared-layer test for the declarations `RenderWidget`/`WidgetWrapper` implement?

- Raised by: the `collapseWhenHidden` surface row, the `others.showOnDesktop`/`showOnMobile` row, and (via D-03) the `tooltip`/`tooltipFormat` row
- Scope: `collapseWhenHidden` (`RenderWidget.jsx:273-289`), `tooltip`/`tooltipFormat` (`RenderWidget.jsx:293-301` into `WidgetTooltip`), and `others.showOnDesktop`/`showOnMobile`. All three are declared by the widget and implemented one layer up, and all three are raised identically by DropdownV2 `D-04` and MultiselectV2 `D-08`. Answering here answers all three contracts.
- Recommendation: one shared spec at that layer, referenced by `shared:` from every widget contract — recording it as owed left it unwritten in three contracts
- Answer: Split by where the behavior is observable (user, 2026-09-04). `tooltip`/`tooltipFormat` is plain DOM, so Engineering writes one shared `RenderWidget` spec and every widget contract points at it with `shared:`. `collapseWhenHidden` and `others.showOnDesktop`/`showOnMobile` are real layout collapse and viewport behavior, so both become QA-owned browser scenarios in each widget contract.
- Unblocks: the `tooltip`, `tooltipFormat` row becomes `shared:` once the shared spec exists; `collapseWhenHidden` becomes qa:RadioButtonV2-BRW-003 and `others.showOnDesktop`/`showOnMobile` becomes qa:RadioButtonV2-BRW-004

### D-03 `tooltip`/`tooltipFormat` turn out to be live at the shared layer — keep them and cover them there?

- Raised by: the `tooltip`, `tooltipFormat` surface row and the tooltip crossing in the matrix
- Research correction: the earlier reading of `82ce8499f52` ("removed tooltip from radiobutton and map") was wrong for the current baseline. The declaration is back in both `WidgetManager/widgets/radioButtonV2.js` and the server copy, and `RenderWidget.jsx:293-301` renders it: `RadioButtonV2` is listed in `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY`, so the tooltip is read from `resolvedProperties.tooltip` and passed to `WidgetTooltip` with the `plainText`/`markdown`/`html` format. It is implemented, one layer up — not dead configuration.
- Recommendation: keep the declaration and let the shared-layer test D-02 names cover it, so this row becomes `shared:` rather than a per-widget copy of the same tooltip test
- Answer: Keep it, and cover it in the shared `RenderWidget` tooltip spec — settled by the D-02 answer (user, 2026-09-04), which assigned tooltip to Engineering at the shared layer. Nothing is removed from the widget definition.
- Unblocks: the `tooltip`, `tooltipFormat` row becomes `shared:` against the spec D-02 commissions

### D-04 `definition.properties.value` is dead configuration — remove it?

- Raised by: the `value` surface row; the runtime derives the selection only from an option's `default`
- Recommendation: remove it; no test can name a break while it stays
- Answer: Keep it (user, 2026-09-04). The recommendation is rejected: no production change, and the key is recorded as dead configuration rather than deleted, so saved apps and any server-side consumer stay untouched.
- Unblocks: none:dead-config

### D-05 `optionVisibility` and `optionDisable` are read by nothing — remove them?

- Raised by: the `optionVisibility`, `optionDisable` surface row
- Recommendation: remove both
- Answer: Keep both (user, 2026-09-04), on the same reasoning as D-04. No production change; both are recorded as dead configuration.
- Unblocks: none:dead-config

### D-06 A disabled radio group never disables its inputs — should it?

- Raised by: the `disabledState` x option `disable` crossing in the matrix
- Facts: the runtime sets `disabled` on an input only from that option's own `disable` flag (RadioButtonV2.jsx:329). A group-level disable produces `data-disabled="true"` plus `aria-disabled`, and the only thing that actually blocks a click is the global rule `div[data-disabled='true'] { pointer-events: none }` in `src/_styles/custom.scss`. `pointer-events` does not stop keyboard activation, and it is a computed-CSS effect no RTL test can assert. So today a keyboard user, or any CSA, can change the selection of a "disabled" radio group.
- Recommendation: pass the group's disabled state down to each `input` (`disabled={option.isDisabled || isDisabled}`), which makes the contract real at the DOM instead of only in CSS, and makes it assertable at the engineering seam
- Answer: No (user, 2026-09-04). CSS-only disable is the intended contract; the recommendation is rejected and no production change is made. The crossing moves to the browser lane, because only a real browser applies `pointer-events`.
- Unblocks: qa:RadioButtonV2-BRW-005

## Approved scenarios

### [RadioButtonV2-SEL-001] Selecting an option publishes its value and the On select handler reads the new selection

- Guarantee: A user selecting a rendered option can rely on that option becoming the checked one, on `value` exposing exactly the configured option value, on `isValid` being republished for it, and on the `On select` event handler observing the new value rather than the previous one.
- Sources: ToolJet Radio Button documentation (`On select`, `value`); registered `onSelectionChange` event and `options` property; controlled-selection runtime path.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Click an option through its accessible label/radio role inside the labeled `radiogroup`; observe real composed-store exposed `value` and a real configured `onSelectionChange` action.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04 (15/15 in the spec). Sensitivity: firing `onSelectionChange` before `onSelect` made the handler observe `'b'` instead of `'a'` and this scenario failed; restored before the final run.

### [RadioButtonV2-ISO-001] Each rendered instance of the same radio definition routes its own label clicks to its own option

- Guarantee: When the same radio definition is rendered more than once on a page (ListView/Kanban rows, repeated containers), clicking an option label in one instance checks that instance's option and leaves the other instances unchanged.
- Sources: Reproduced regressions `f537bdd320f` ("input clicks route to wrong listview row") and `76e28839803` ("clicking radio options other than row 1 still updates row 1").
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render the definition twice, click the second instance's option label, and observe per-instance checked state through accessible option queries.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: rebuilding option ids as `${id}-option-${index}` (the pre-`f537bdd320f` shape) made the second instance's label click check the FIRST instance's input and this scenario failed; restored before the final run.

### [RadioButtonV2-OPT-001] Dynamic options replace static options and apply the schema's visibility, disable, and default flags

- Guarantee: With Dynamic options enabled, the resolved `schema` supplies the selectable entries instead of the static options; `visible: false` options are not rendered, `disable: true` options are not selectable, `default: true` supplies the initial selection, and exposed `options` lists the rendered label/value records.
- Sources: ToolJet Radio Button options documentation (option object shape and dynamic-options examples); registered `advanced`/`schema` properties.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render a real bound schema, then observe rendered options, checked state, the disabled option's interaction result, and exposed `value`/`options`.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04 through real binding resolution. Sensitivity: forcing `_options = options` made the group render `Static option` and this scenario failed; restored before the final run.

### [RadioButtonV2-OPT-002] Replacing the options after mount re-derives the selection and republishes the option list

- Guarantee: When a builder or query changes the options while the app is running, the widget stops exposing a value that no longer exists, adopts the new configuration's default, and republishes exposed `options`.
- Sources: Registered `options`/`schema` properties and the documented dynamic-options query example that maps live query rows; runtime re-derivation on option change.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Change the options property through the real store after mount and observe rendered options plus exposed `value`/`options`.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: emptying the options-change effect left the removed value `'b'` published and this scenario failed; restored before the final run.

### [RadioButtonV2-OPT-003] Falsy option values and non-string labels stay selectable and readable

- Guarantee: Configured option values `false`, `0`, and `''` are real selections whose exact value reaches exposed `value`; a boolean or numeric label renders readably; a non-array options value renders an empty radiogroup instead of crashing; and an option marked `default: true` follows the documented option shape.
- Sources: ToolJet option-object documentation; the `||`-swallows-falsy bug class recorded in `validateWidget.spec.js` (`f39ae77294`, `7c31f7a2f2`, `61a697cd3a`); runtime `getSafeRenderableValue` usage.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select each configured option by accessible role/text and observe its exact exposed value and rendered label.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04 for a `false` option value, a numeric label, and a non-array options value. Sensitivity: publishing `_value || undefined` turned the selected `false` into `undefined` and this scenario failed; restored before the final run. Scope note: `0` and `''` are NOT covered here — see `OPT-004`, opened because loose `==` comparison makes `false`, `0`, and `''` indistinguishable.

### [RadioButtonV2-OPT-004] Distinct falsy option values are individually selectable

- Guarantee: Configuring several loosely-equal falsy option values is unsupported; the runtime treats them as one selection.
- Sources: Discovered on 2026-09-04 while implementing `OPT-003`. The runtime compares with loose equality (`checkedValue == option.value`, RadioButtonV2.jsx:298/322), so `false`, `0`, and `''` all match each other: all three render as checked at once, and clicking an already-checked input fires no change, so the selection cannot move between them. The documented option shape places no constraint on option values, and the documented `selectOption(2)` example depends on that same loose comparison matching a string-valued `'2'` option.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Configure `false`/`0`/`''` options, observe the checked options, click between them, and read exposed `value`.
- Status: verified
- Decision recorded: user decided on 2026-09-04 that mixing loosely-equal option values is unsupported, so this is a characterization test and not a production fix. Strict comparison was rejected because the documented `selectOption(2)` example relies on loose matching against a string-valued `'2'` option. The radio-button docs should state the constraint; that docs work is owned outside this workflow.
- Evidence: characterization GREEN on 2026-09-04 — with `false`/`0`/`''` options all three inputs report checked and clicking `0` leaves the published value `false`. Sensitivity: switching the option `checked` prop to `===` made this scenario fail; restored before the final run. Note the runtime compares loosely in two places (RadioButtonV2.jsx:298 for the checkmark styling, :322 for the input's `checked`); only :322 is user-observable.

### [RadioButtonV2-ACT-001] Documented selectOption and no-argument deselectOption keep public selection state consistent

- Guarantee: `selectOption(value)` selects the matching option, checks it in the DOM, and fires `On select`; `deselectOption()` called with no argument clears the selection and fires `On select`; both keep exposed `value` and `isValid` consistent.
- Sources: ToolJet Radio Button actions documentation (`selectOption(2)`, `deselectOption()`); registered action handles.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real functions published in the component's exposed variables; observe public `value`, checked DOM state, and the real event handler's observed value.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: dropping `fireEvent` from the mount-time `selectOption` and returning `undefined` from `deselectOption` made this scenario fail; restored before the final run. Note: `selectOption` is defined twice in the runtime (mount-time `setExposedVariables` and an options-change effect); the mount-time definition is the one an app calls with static options.

### [RadioButtonV2-VAL-001] A mandatory radio with nothing selected surfaces its validation error and recovers on selection

- Guarantee: A mandatory radio group with no selection exposes `isValid: false`, `isMandatory: true`, marks itself invalid to assistive tech, and displays the "Field cannot be empty" message; selecting any option clears the message and flips `isValid`.
- Sources: ToolJet Radio Button validation documentation (mandatory shows an error when no option is selected); registered `validation.mandatory`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Seed `validation.mandatory` through the real store, observe the rendered message text and `aria-invalid`, then select an option and observe both clear.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: rendering `{null}` in place of the validation message made this scenario fail; restored before the final run.

### [RadioButtonV2-VAL-002] A selected option whose value is falsy counts as a filled mandatory field

- Guarantee: Selecting an option whose configured value is `false` (or `''`) satisfies a mandatory radio group, because the user did make a selection.
- Sources: `componentsSlice.js:850-861` limits legitimate falsy option values to `DropdownV2`, `MultiselectV2`, and `Cascader`; the same distinction was fixed three times for those widgets (`f39ae77294`, `7c31f7a2f2`, `61a697cd3a`); the documented radio option shape permits any value.
- Layer: Store contract
- Owner: Engineering
- Public seam: Real `state().validateWidget` with `componentType: 'RadioButtonV2'`, plus the widget-level surfaced message.
- Status: verified
- Decision recorded: user confirmed on 2026-09-04 that a `false`-valued radio selection is a FILLED field. This is a production fix — add `RadioButtonV2` to `optionValueWidgets` in `componentsSlice.js` — proved by a RED store-contract case before the change.
- Evidence: RED on 2026-09-04 at both seams — `validateWidget({componentType: 'RadioButtonV2', widgetValue: false, mandatory: true})` returned `{isValid: false, validationError: 'Field cannot be empty'}`, and the widget rendered that message after the user selected the `false` option. GREEN after the one-line production fix adding `'RadioButtonV2'` to `optionValueWidgets` (`componentsSlice.js`): store suite 41/41 and radio spec 15/15 pass. `OPTION_VALUE_WIDGETS` in `validateWidget.spec.js` was extended in the same change, so the shared `false`/`0` table now covers this widget too.

### [RadioButtonV2-VAL-003] A custom validation rule invalidates the radio and surfaces its message

- Guarantee: A `customRule` resolving to a non-empty string makes the radio invalid, surfaces that exact string to the user, and republishes `isValid`; a falsy rule leaves it valid.
- Sources: ToolJet Radio Button validation documentation (custom validation with user-defined messages); registered `validation.customRule`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Seed a real bound `customRule`, observe the rendered message and exposed `isValid`.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: covered by the same validation-message fault, which made this scenario fail; restored before the final run.

### [RadioButtonV2-STATE-001] Documented visibility, loading, and disabled actions update public flags and interaction availability

- Guarantee: `setVisibility(false)` hides the group and updates `isVisible`; `setLoading(true)` replaces the options with the loader and updates `isLoading`; `setDisable(true)` marks the group disabled and updates `isDisabled`; each is reversible.
- Sources: ToolJet Radio Button actions documentation (`setVisibility`, `setLoading`, `setDisable`) and exposed `isVisible`/`isLoading`/`isDisabled`; registered action handles.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed actions; observe the exposed flags and the semantic availability of the group.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: dropping `setExposedVariable('isLoading', ...)` from `setLoading` made this scenario fail; restored before the final run.

### [RadioButtonV2-STATE-002] Property-driven visibility, loading, and disabled changes after mount reach the DOM and the exposed flags

- Guarantee: Changing `visibility`, `loadingState`, `disabledState`, or `optionsLoadingState` after mount — including through a binding that a container or another component drives — updates both the rendered group and the corresponding exposed flag; a radio placed in a sub-container is not left disabled.
- Sources: Reproduced regression `76e28839803` (radios disabled when dropped inside ListView/Kanban); registered `visibility`/`loadingState`/`disabledState`/`optionsLoadingState` properties and their exposed counterparts.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Change the properties through the real store after mount and observe rendered state plus exposed flags.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: removing the property-to-state sync effect made this scenario fail; restored before the final run.

### [RadioButtonV2-EXP-001] The widget publishes exactly its documented variable and action surface

- Guarantee: On mount the widget publishes `label`, `value`, `options`, `isValid`, `isMandatory`, `isLoading`, `isVisible`, `isDisabled` with the values an app would bind to, and publishes every documented action as a callable function; a changed `label` republishes `label`.
- Sources: ToolJet Radio Button exposed-variable and action documentation; registered `exposedVariables` and `actions`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Read the component's exposed values from the real composed store after mount and after a label change.
- Status: verified
- Note: the surface is exactly the five registered actions. Decision of 2026-09-04: the published `clear()` is a documentation error, so EXP-001 characterizes `clear` as absent rather than asserting it.
- Evidence: Focused RTL GREEN on 2026-09-04 across two cases (published surface, label republish). Sensitivity: renaming `options` in the mount-time exposed set made this scenario fail; restored before the final run. Confirmed the runtime publishes the eight documented variables plus store-added `id`, the five registered actions, and no `clear`.

### [RadioButtonV2-FORM-001] Clearing the parent Form clears the radio selection

- Guarantee: A radio inside a Form loses its selection when the Form's `clearForm` action runs, and its exposed `value` and validity follow.
- Sources: `clearForm` CSA `36034d81e17`; `Widgets/Form/FormSignalContext` `useFormClear`, which the radio runtime consumes; ToolJet Form documentation.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real Form `clearForm` exposed action with the radio rendered as a Form child, and observe the radio's public value and checked DOM state.
- Status: verified
- Evidence: first attempt on 2026-09-04 was `harness-blocked` — `Container`/`SubContainer` threw `Invariant Violation: Expected drag drop context`. User approved adding the harness capability the same day, so three real blockers were cleared instead of downgrading the test: (1) `capabilities.dnd` now mounts the real react-dnd `DndProvider` that `AppBuilder.jsx:96` supplies in production; (2) the seeded child needs a resolved `others.showOnDesktop`, because `WidgetWrapper.jsx:125-128` renders nothing without it — the shared harness never hit that guard since it mounts `RenderWidget` directly; (3) `@mdxeditor/editor` is now stubbed in `jest.config.js`, since the EE AiBuilder doc previewer sits on the import chain that sub-container rendering walks and the package is ESM-only. GREEN afterwards: the radio is mounted by the real Form through the real `SubContainer`, and `clearForm()` clears the selection. Sensitivity: replacing `useFormClear(() => onSelect(null))` with `useFormClear(undefined)` made this scenario fail; restored before the final run.

### [RadioButtonV2-A11Y-001] The group exposes accessible radiogroup semantics for its label, requirement, and state

- Guarantee: The widget renders a `radiogroup` associated with its label, marks itself required when mandatory, invalid when validation fails, disabled when disabled, busy while loading, and hidden when not visible; each option's label is programmatically associated with its own input.
- Sources: ToolJet Radio Button documentation (label, mandatory, loading, visibility, disabled behavior); the label/input association fixes `f537bdd320f` and `76e28839803`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Accessible role/name/state queries against the rendered group and its options.
- Status: verified
- Evidence: Focused RTL GREEN on 2026-09-04. Sensitivity: replacing `aria-required` with `data-required` made this scenario fail; restored before the final run.

### [RadioButtonV2-BRW-001] Layout and dynamic height produce a usable group in a real browser

- Guarantee: `row`, `column`, and `wrap` layouts lay the options out in the configured direction, overflow scrolls rather than clipping, and dynamic height grows the component to fit wrapped or stacked options in the Viewer.
- Sources: Layout support `66c88ddc4f0`; dynamic height `3fef828ab40`; label visibility fix `508462c3fb2`.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [RadioButtonV2-BRW-002] ListView rows and keyboard journeys behave correctly with real geometry and focus

- Guarantee: In a real browser, each ListView/Kanban row's radio responds only to its own clicks and keyboard focus, and arrow-key navigation moves the selection within a single group.
- Sources: Reproduced regressions `f537bdd320f` and `76e28839803`; native radiogroup keyboard semantics.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [RadioButtonV2-OPT-005] The first option claiming `default: true` supplies the initial selection

- Guarantee: When several options are marked `default: true`, the group opens on the first of them, deterministically.
- Sources: Registered option `default` flag and the documented dynamic-options examples; `findDefaultItem` is the only default path.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Configure two defaulted options; observe the checked option and exposed `value`.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: reversing the scan into last-wins made this scenario fail (`'b'` instead of `'a'`); restored before the final run.

### [RadioButtonV2-OPT-006] A default option must declare `visible: true` rather than omit it

- Guarantee: An option carrying `default: true` without a `visible` key is rendered but is NOT selected, because rendering treats `visible` as optional while default selection requires it explicitly.
- Sources: Discovered 2026-09-04 while auditing coverage; render uses `visible ?? true` (RadioButtonV2.jsx:92) and `findDefaultItem` requires `visible === true` (RadioButtonV2.jsx:109). User decided on 2026-09-04 to characterize this rather than fix it, so the docs should state that a default needs an explicit `visible: true`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Configure an option with `default: true` and no `visible` key; observe that it renders and that nothing is selected.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: loosening `findDefaultItem` to `(item?.visible ?? true) === true` selected the option and made this scenario fail; restored before the final run.

### [RadioButtonV2-ACT-002] selectOption accepts a whole option object and stores its value

- Guarantee: Passing an option object (`{ label, value }`) to `selectOption` selects the option carrying that value, so app code may forward an option record straight from `options`.
- Sources: Runtime unwrap `isObject(value) && has(value, 'value')` (RadioButtonV2.jsx:114); MultiselectV2 documents the same object-or-scalar argument shape.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed `selectOption` with an option object; observe exposed `value` and the checked option.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: removing the unwrap published the object itself and made this scenario fail; restored before the final run.

### [RadioButtonV2-ACT-003] selectOption with an unmatched value publishes it and checks nothing

- Guarantee: Calling `selectOption` with a value no option carries publishes that value and leaves every option unchecked, rather than throwing or silently clearing the selection.
- Sources: Runtime `onSelect` stores the argument without membership checking; the documented `selectOption(value)` action places no constraint on the argument.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real exposed `selectOption` with an unknown value; observe exposed `value` and that no option is checked.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: adding a membership guard that returned early made this scenario fail; restored before the final run.

### [RadioButtonV2-EVT-001] Re-selecting the already-checked option fires no On select

- Guarantee: Clicking the option that is already selected is not a selection change: the `On select` event does not fire, so handlers wired to it never run on a no-op click.
- Sources: Documented `On select` semantics ("triggered whenever a user chooses a specific option"); the runtime uses the native `onChange`, which a checked radio does not emit.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Click the already-checked option with a real `onSelectionChange` action attached; observe that the handler never wrote its variable.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: moving the handler to `onClick` fired the event on the re-click and made this scenario fail; restored before the final run.

### [RadioButtonV2-STATE-003] Options loading hides the options without claiming the component is loading

- Guarantee: `optionsLoadingState` replaces the options with a spinner while leaving the component-level contract untouched: exposed `isLoading` stays false and the group is not marked busy. The two loading flags are independent.
- Sources: Registered `optionsLoadingState` and `loadingState` are separate properties; only `loadingState` is published as `isLoading`. User decided on 2026-09-04 to keep them independent.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render with `optionsLoadingState` true; observe that no options render, `aria-busy` stays false, and exposed `isLoading` is false.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: folding `optionsLoadingState` into `aria-busy` made this scenario fail; restored before the final run. Recorded accessibility question: a spinner that replaces every option while the group reports itself idle announces nothing to assistive tech.

### [RadioButtonV2-STATE-004] Each layout lays the options out in its configured direction

- Guarantee: The `layout` property drives the options container: `row` lays out horizontally with horizontal overflow, `column` vertically with vertical overflow, and `wrap` horizontally with wrapping enabled.
- Sources: Layout support commit `66c88ddc4f0`; registered `layout` select with options row/column/wrap. `wrap` is implemented as `row` plus `flexWrap`, which is exactly the mapping a refactor gets wrong.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render each configured layout; assert the options container's `flexDirection`, `flexWrap`, and `overflow` inline style contract.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 across all three layouts. Sensitivity: mapping `wrap` to `column` made the wrap case fail; restored before the final run. Reclassified from `BRW-001`: the direction contract is an inline style and needs no real geometry, while scrolling and wrapping *appearance* remain QA-owned.

### [RadioButtonV2-STATE-005] Dynamic height grows the group in the Viewer and never on the editor canvas

- Guarantee: With `dynamicHeight` enabled, the group grows to fit its options in the Viewer while keeping the configured height as a floor, and is left at its laid-out height in the editor so a builder positioning it sees no self-resizing.
- Sources: Dynamic-height commit `3fef828ab40`; the runtime gates it on `currentMode === "view"` (RadioButtonV2.jsx:73).
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render the same definition in edit and view mode; assert the group height/minHeight inline style contract in each.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 in two cases. Sensitivity: dropping the `currentMode === "view"` gate made the editor case fail; restored before the final run. Required a harness addition: `widgetProps`/`render` now accept `currentMode`, defaulting to `edit`.

### [RadioButtonV2-VAL-004] Making the field mandatory after mount revalidates the current selection

- Guarantee: A builder or binding that turns `mandatory` on while the app is running immediately revalidates: an empty group flips `isValid` to false, republishes `isMandatory`, and surfaces its error.
- Sources: Registered `validation.mandatory`; documented mandatory behavior; the runtime revalidates on a changed `validate` reference (RadioButtonV2.jsx:153-159).
- Layer: RTL integration
- Owner: Engineering
- Public seam: Flip `validation.mandatory` through the real store after mount; observe the rendered message, `aria-required`, and exposed `isValid`/`isMandatory`.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: emptying the `[validate]` effect left `isValid: true` and made this scenario fail; restored before the final run.

### [RadioButtonV2-STATE-006] A state action survives an unrelated property change

- Guarantee: After `setDisable`/`setLoading`/`setVisibility`, an unrelated property re-resolving (a bound label, say) must not revert the action: CSA-driven state persists until the corresponding property value itself changes.
- Sources: Registered state actions and their paired properties; the runtime guards its property-to-state sync with `!==` and keys it to the state properties only (RadioButtonV2.jsx:127-133). This is the recurring CSA-versus-property precedence class across ToolJet widgets.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke `setDisable(true)`, then change `label` through the real store; observe that the group stays disabled and `isDisabled` stays true.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: running the sync effect unguarded on every render reverted the action and made this scenario fail; restored before the final run.

### [RadioButtonV2-STATE-007] Rewriting a state property with its current value does not revert an action

- Guarantee: A property write that does not change the resolved value — a binding re-resolving `disabledState` to the same `false` — leaves a CSA-driven state intact.
- Sources: Same runtime guard as `STATE-006`; the no-op-write path is the half a dependency-graph cascade actually exercises.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke `setDisable(true)`, then rewrite `disabledState` with its existing value; observe the group stays disabled.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: the same unguarded-sync fault made this scenario fail; restored before the final run.

### [RadioButtonV2-STATE-008] Component loading and options loading hide the options independently

- Guarantee: `loadingState` and `optionsLoadingState` each hide the options on their own, clearing one while the other is still set leaves the options hidden, and only `loadingState` ever reaches `aria-busy` and the exposed `isLoading`. A selection made before the spinner is still the selection after it.
- Sources: the single `isLoading || optionsLoadingState` ternary (RadioButtonV2.jsx:286) crossed with the separate `aria-busy={isLoading}` (RadioButtonV2.jsx:262) and `isLoading: loadingState` publication (RadioButtonV2.jsx:193); `STATE-003` fixed the meaning of each flag alone, this crossing fixes what happens when both are live.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Set both loading flags through the real store, clear them one at a time, and observe the rendered options, `aria-busy`, and exposed `isLoading` after each step, with an option selected throughout.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: folding `optionsLoadingState` into `aria-busy` failed this scenario and `STATE-003`, which is expected — they share that branch, and `STATE-008` additionally owns the clear-one-flag-at-a-time sequence `STATE-003` never exercises; restored before the final run.

### [RadioButtonV2-STATE-009] Layout and dynamic height together produce the right options-container box

- Guarantee: The options container's `height`, `maxHeight`, and `overflow` follow both keys at once: `row` keeps horizontal overflow whether or not dynamic height is on, `column` switches from vertical scrolling to visible overflow when dynamic height is on, and `wrap` is the only combination that releases `maxHeight`.
- Sources: `computedLayoutStyles` (RadioButtonV2.jsx:226-235), which branches on `layout` and `isDynamicHeightEnabled` in every one of its four declarations; layout commit `66c88ddc4f0` and dynamic-height commit `3fef828ab40`. `STATE-004` pins the layouts with dynamic height off and `STATE-005` pins the mode gate, so the crossing itself is untested.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render each layout in the Viewer with `dynamicHeight` on and off; assert the options container's inline `height`, `maxHeight`, `flexWrap`, and `overflow` contract.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 across all three layouts. Sensitivity: collapsing the dynamic-height arm of `overflow` to `hidden auto` failed the column and wrap cases and left `STATE-004` green; restored before the final run. Recorded limitation: `height: max-content` is not asserted because jsdom's CSS parser drops the intrinsic keyword — that half of the box stays with `BRW-001`.

### [RadioButtonV2-OPT-007] An options rewrite discards the user's selection; an identical rewrite leaves it alone

- Guarantee: After a user or `selectOption` has chosen an option, replacing the options — a query returning fresh rows, a bound schema re-resolving, `advanced` being toggled — re-derives the selection from the new schema's default, while a rewrite whose content is unchanged leaves the chosen option selected. Both halves are published through `value` and the checked DOM state.
- Sources: the default-selection effect keyed to `advanced` and `JSON.stringify(schema)`/`JSON.stringify(options)` (RadioButtonV2.jsx:122-125). This is the state-precedence class applied to the selection; `STATE-006`/`STATE-007` cover it only for the visibility/loading/disabled trio, which is a different effect with a different guard.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select an option, rewrite `options` through the real store with different content and then with identical content, and observe exposed `value` and the checked radio after each rewrite.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: re-keying the default-selection effect to `[advanced, schema, options]` instead of their JSON content made this scenario fail and nothing else; restored before the final run.

### [RadioButtonV2-OPT-008] Hiding the currently selected option removes it and re-derives the selection

- Guarantee: When the option a user has selected is rewritten to `visible: false`, it stops rendering and the widget does not keep publishing a value the user can no longer see or reach; the published `value` and the checked state agree with what is on screen.
- Sources: the `visible ?? true` render filter (RadioButtonV2.jsx:92) crossed with `checkedValue`, which the filter never touches, and the re-derive effect that the same rewrite triggers.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select an option, rewrite the schema so that option carries `visible: false`, and observe the rendered options and the exposed `value`.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: dropping the `visible ?? true` filter from `selectOptions` failed this scenario and `OPT-001` — both own that filter — and no others; restored before the final run.

### [RadioButtonV2-OPT-009] An option that is both default and disabled starts checked

- Guarantee: `findDefaultItem` ignores an option's `disable` flag, so an option configured as both the default and disabled is the initial selection and renders as a checked, disabled input rather than leaving the group empty.
- Sources: `findDefaultItem` matching only `default === true && visible === true` (RadioButtonV2.jsx:109) against `disabled={option.isDisabled}` (RadioButtonV2.jsx:329); saved apps carry `disable`/`visible`/`default` wrappers on every option, so this combination arrives from imported apps.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Render a schema whose default option is also disabled; observe the checked radio, its disabled state, and the exposed `value`.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: adding `&& item?.disable !== true` to `findDefaultItem` failed only this scenario; restored before the final run.

### [RadioButtonV2-VAL-005] A hidden group does not surface its validation message and surfaces it again when shown

- Guarantee: An invalid radio group that is not visible keeps its validation message off the surface, and making it visible again brings the message back without re-running validation.
- Sources: the message block's class expression `isValid ? 'd-none' : visibility ? 'd-flex' : 'd-none'` (RadioButtonV2.jsx:353), the only place the visibility state and the validation state are read together.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Make a mandatory group invalid, hide it through `setVisibility(false)`, and observe the message's presentation before and after showing it again.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: removing the visibility arm from the message block's class expression failed only this scenario; restored before the final run. Recorded finding: the message TEXT stays in the DOM while hidden and only the class changes, and jsdom loads no stylesheet, so the class is the observable this scenario owns and the visual result stays with `BRW-003`.

### [RadioButtonV2-VAL-006] deselectOption moves a mandatory field into the invalid state

- Guarantee: Calling the documented `deselectOption()` on a mandatory radio that currently holds a valid selection clears the selection, republishes `isValid` as false, and surfaces the mandatory message — the same end state as a user who never chose anything.
- Sources: `deselectOption` routing through `onSelect(null)` and revalidating (RadioButtonV2.jsx:200-203, 113-120) crossed with `validation.mandatory`; `ACT-001` covers the action's selection effect and `VAL-001` covers the untouched mandatory field, neither covers the action driving the field invalid.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Select an option on a mandatory group, invoke the real `deselectOption` exposed action, and observe the checked state, exposed `isValid`, and the surfaced message.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: making `deselectOption` set the selection without re-running `validate` failed only this scenario; restored before the final run.

### [RadioButtonV2-FORM-002] Clearing a Form leaves a mandatory radio invalid rather than reset to its default

- Guarantee: A `clearForm` on a Form containing a mandatory radio clears the selection and leaves the field invalid with its mandatory message surfaced; it does not fall back to the schema's `default` option, which would report a value the user never chose.
- Sources: `useFormClear(() => onSelect(null))` (RadioButtonV2.jsx:222) crossed with `validation.mandatory`; `clearForm` CSA `36034d81e17`. `FORM-001` covers the clear on an unvalidated field.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Invoke the real Form `clearForm` action with a mandatory radio as a Form child; observe the checked state, exposed `value` and `isValid`, and the surfaced message.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04 on the same real-Form session as `FORM-001`. Sensitivity: clearing to `findDefaultItem(...)` instead of `null` failed this scenario along with `FORM-001` and `FORM-003`, all three of which read that one callback; restored before the final run.

### [RadioButtonV2-FORM-003] Clearing a Form also clears a disabled radio

- Guarantee: The Form clear signal reaches the radio regardless of the widget's own disabled state, so a disabled field cannot strand a stale value in a cleared Form.
- Sources: `useFormClear(() => onSelect(null))` is registered unconditionally (RadioButtonV2.jsx:222) — a guard added on `isDisabled` or `isLoading` is the production change this scenario names.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Disable the radio through the real `setDisable` action, invoke the real Form `clearForm`, and observe the exposed `value` and the checked state.
- Status: verified
- Evidence: Characterization GREEN on 2026-09-04. Sensitivity: guarding the `useFormClear` callback on `isDisabled` failed only this scenario, which is what separates it from `FORM-001`; restored before the final run.

### [RadioButtonV2-A11Y-002] The group is announced with its label under default label settings

- Guarantee: Whenever the widget renders a visible label, the `radiogroup` carries an accessible name equal to that label — including under the shipped defaults (`auto: true`, `labelWidth: 33`) and in both editor and Viewer modes — so assistive technology never announces an unnamed group.
- Sources: D-01 (user, 2026-09-04). Today `aria-label` is set only when `!auto && labelWidth == 0 && label.length != 0` (RadioButtonV2.jsx:266), which the defaults never satisfy, and `_ui/Label` emits `htmlFor` only in view mode against a `div[role=radiogroup]` that cannot take a `<label for>`.
- Layer: RTL integration
- Owner: Engineering
- Public seam: Query the group by its accessible role and name under default label styles, then with the label emptied, and in both modes.
- Status: verified
- Evidence: Focused RED then GREEN on 2026-09-04: before the fix `getByRole('radiogroup', { name: 'Pick one' })` found nothing under the shipped defaults. GREEN after adding `aria-labelledby` plus an `id` on `Label` (3 lines). The empty-label half passed before and after, which is the point — it pins that the attribute is not emitted when `Label` renders nothing.

### [RadioButtonV2-BRW-003] A hidden radio collapses its canvas space when collapseWhenHidden is set

- Guarantee: With `collapseWhenHidden` on, hiding the widget removes the space it occupied rather than leaving a gap, and the widgets below move up.
- Sources: `RenderWidget.jsx:273-289`; D-02 (user, 2026-09-04) assigned real layout collapse to the browser lane.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [RadioButtonV2-BRW-004] showOnDesktop and showOnMobile gate the widget per viewport

- Guarantee: The widget renders on the layouts its `others.showOnDesktop`/`showOnMobile` flags allow and is absent on the others, across a real desktop and mobile viewport.
- Sources: `others.showOnDesktop`/`showOnMobile` in the registered definition, resolved by the shared canvas layer; D-02 (user, 2026-09-04) assigned viewport behavior to the browser lane.
- Layer: Browser
- Owner: QA
- Status: qa-owned

### [RadioButtonV2-BRW-005] A disabled group is not selectable with a real pointer

- Guarantee: With the group disabled, a real pointer cannot change the selection, because `div[data-disabled='true'] { pointer-events: none }` in `src/_styles/custom.scss` applies. The inputs themselves stay enabled by design.
- Sources: D-06 (user, 2026-09-04) kept CSS-only disable as the intended contract. `disabled` is set from an option's own `disable` flag only (RadioButtonV2.jsx:329), so the group-level contract exists solely in computed CSS and cannot be observed in jsdom.
- Layer: Browser
- Owner: QA
- Status: qa-owned


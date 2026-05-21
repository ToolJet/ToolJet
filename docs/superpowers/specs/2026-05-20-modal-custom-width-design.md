# Modal Custom Width Design

## Goal

Allow ModalV2 users to set a custom modal width without adding another inspector field. Reuse the existing `size` property, which is already displayed as `Width`, and allow custom pixel widths only through that field's fx mode.

## UX Flow

- When fx is disabled for `Width`, the existing select behavior remains unchanged:
  - `small`
  - `medium`
  - `large`
  - `fullscreen`
- When fx is enabled for `Width`, users can enter an expression that resolves to either:
  - an existing preset value: `sm`, `lg`, `xl`, or `fullscreen`
  - a numeric custom width: `800`
  - a numeric string custom width: `"800"`
- Numeric custom width values are treated as pixels.
- No `Custom` select option is required.
- No separate `modalWidth` property or inspector field is required.

## Requirements

- Reuse ModalV2's existing `size` / `Width` property for both preset widths and fx-driven custom widths.
- Do not add a new `modalWidth` property.
- Do not add a `custom` option to the non-fx `Width` select.
- Accept numeric values and numeric strings only when `size` is resolved from fx.
- Treat numeric custom width values as pixels.
- Fall back to the existing default width behavior when `size` resolves to an empty, non-numeric, zero, negative, non-finite, or unknown value.
- If the screen is narrower than the configured custom width, the modal should shrink to the available screen width.
- Existing `small`, `medium`, `large`, and `fullscreen` behavior must remain unchanged.

## Proposed Shape

In both widget configs:

- `frontend/src/AppBuilder/WidgetManager/widgets/modalV2.js`
- `server/src/modules/apps/services/widget-config/modalV2.js`

- Keep the `size` property as the single source of truth for modal width.
- Keep the current non-fx `Width` select options limited to `small`, `medium`, `large`, and `fullscreen`.
- Update the `size` validation schema to accept both strings and numbers, because fx can resolve to either preset strings or numeric custom widths.
- Keep the default as `lg`.
- Do not add `modalWidth`.
- Do not add a conditional field for custom width.

In `frontend/src/AppBuilder/Widgets/ModalV2/ModalV2.jsx`:

- Read the resolved `size` value.
- Classify the resolved value as one of:
  - Bootstrap preset: `sm`, `lg`, `xl`
  - `fullscreen`
  - custom pixel width: finite positive number or numeric string
  - fallback/default
- Keep Bootstrap's `size` prop limited to known Bootstrap sizes. When `size` resolves to a numeric custom width, do not pass that value as a Bootstrap size class.
- Apply custom dialog width with React Bootstrap props and CSS: add a custom `dialogClassName` only for numeric custom widths, and set a CSS custom property containing the normalized width.
- Include the normalized custom width in the width-measurement dependencies so open modals re-measure when the fx result changes.

In `frontend/src/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects.js` or a nearby helper:

- Convert fx-resolved custom `size` values to CSS width:
  - `800` -> `800px`
  - `"800"` -> `800px`
- Treat preset strings as presets, not custom widths.
- Treat invalid/empty/zero/negative/non-finite/unknown values as the existing default behavior.
- Apply the custom width to the Bootstrap modal dialog only when the resolved `size` is numeric.
- Clamp custom width to the viewport, for example with `max-width: min(<width>px, calc(100vw - 24px))` and `width: calc(100vw - 24px)` or equivalent Bootstrap-compatible styles.
- Avoid direct DOM width mutation unless React Bootstrap cannot express the required dialog width. Existing resize side effects can still measure the rendered width for child canvas layout.

## Responsive Behavior

For fx-driven custom widths larger than the viewport, the modal must fit the screen. On narrow screens this means the visible dialog covers the available screen width, respecting Bootstrap/modal margins where existing layout requires them.

## Data Flow

1. Builder stores the existing `size` property.
2. When fx is disabled, `size` stores one of the existing preset strings.
3. When fx is enabled, property resolution evaluates `size` and may produce a preset string or numeric width.
4. Validation accepts resolved string or number values for `size`.
5. ModalV2 computes whether resolved `size` is a Bootstrap preset, fullscreen, or numeric custom width.
6. Runtime applies a CSS max width to the modal dialog only for numeric custom widths.
7. Modal body/header/footer canvas width continues to come from the rendered dialog width, so child layout uses the final responsive width.
8. When the resolved `size` value changes while the modal is open, width measurement re-runs so header, body, footer, and child canvas widths reflect the new rendered width.

## Mode Behavior

Fx-driven custom width applies in both edit and view mode. If `size` resolves to a numeric value, runtime should use it as the modal width. `fullscreen` ignores numeric custom width handling and keeps the existing fullscreen behavior.

## Verification

- Manually verify non-fx `Width` still shows only the existing preset options.
- Manually verify fx-enabled `Width` accepts `sm`, `lg`, `xl`, and `fullscreen`.
- Manually verify fx-enabled numeric and numeric-string `Width` values render as pixel widths.
- Manually verify invalid fx results fall back to existing default behavior.
- Manually verify custom width clamps on smaller screens.
- Manually verify numeric custom width values are not passed as invalid Bootstrap size classes.

## Non-Goals

- No change to legacy Modal unless implementation discovery shows it shares the same ModalV2 config path.
- No support for percent, `vw`, or arbitrary CSS units in the `Width` value.
- No migration of existing modal definitions beyond preserving current default `size: 'lg'`.
- No update to AI/component metadata mirrors such as `server/ee/ai/helpers/componentsMeta.json`.

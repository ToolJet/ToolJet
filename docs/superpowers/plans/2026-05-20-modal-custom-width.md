# Modal Custom Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Custom width option to ModalV2 that reveals a numeric `modalWidth` property and renders the modal at that pixel width while clamping to smaller screens.

**Architecture:** Keep `size` as the existing preset selector, add `custom` as another preset, and store custom pixel width separately in `modalWidth`. Normalize width in a ModalV2 helper, pass only supported Bootstrap sizes to React Bootstrap, and apply custom dialog width with `dialogClassName` plus a CSS variable. Keep frontend and server widget configs in sync.

**Tech Stack:** React, React Bootstrap Modal, ToolJet widget config metadata, SCSS.

---

## File Structure

- Modify `frontend/src/AppBuilder/WidgetManager/widgets/modalV2.js`
  - Add `custom` width option.
  - Add `modalWidth` property and default definition value.
- Modify `server/src/modules/apps/services/widget-config/modalV2.js`
  - Mirror frontend widget config changes for server-side widget metadata.
- Modify `frontend/src/AppBuilder/Widgets/ModalV2/helpers/utils.js`
  - Add a small helper that converts custom width values into CSS pixels with `600px` fallback.
- Modify `frontend/src/AppBuilder/Widgets/ModalV2/ModalV2.jsx`
  - Read `modalWidth`.
  - Normalize custom width.
  - Avoid passing unsupported `size="custom"` to React Bootstrap.
  - Pass custom-width props into ModalWidget and width-measurement hook.
- Modify `frontend/src/AppBuilder/Widgets/ModalV2/Components/Modal.jsx`
  - Apply custom dialog class and CSS variable to Bootstrap Modal.
- Modify `frontend/src/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects.js`
  - Include custom width in dependencies so body/header/footer canvas width remeasures when width changes while open.
- Modify `frontend/src/AppBuilder/Widgets/ModalV2/style.scss`
  - Add custom dialog CSS that clamps width to smaller screens.

No tests, lint, build, public docs, commits, migrations, or AI metadata updates are part of this implementation by user request.

## Task 1: Widget Config Metadata

**Files:**
- Modify: `frontend/src/AppBuilder/WidgetManager/widgets/modalV2.js`
- Modify: `server/src/modules/apps/services/widget-config/modalV2.js`

- [ ] **Step 1: Add `custom` option after `fullscreen` in both files**

Change each `size.options` block to:

```js
options: [
  { name: 'small', value: 'sm' },
  { name: 'medium', value: 'lg' },
  { name: 'large', value: 'xl' },
  { name: 'fullscreen', value: 'fullscreen' },
  { name: 'custom', value: 'custom' },
],
```

- [ ] **Step 2: Add `modalWidth` property after `size` in both files**

Insert this block immediately after the `size` property:

```js
modalWidth: {
  type: 'numberInput',
  displayName: 'Modal width',
  accordian: 'Data',
  validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 600 },
  conditionallyRender: {
    key: 'size',
    value: 'custom',
  },
},
```

- [ ] **Step 3: Add default `modalWidth` definition in both files**

In each `definition.properties` block, add this immediately after `size: { value: 'lg' },`:

```js
modalWidth: { value: '{{600}}' },
```

- [ ] **Step 4: Manually inspect config parity**

Run:

```bash
rg -n "modalWidth|value: 'custom'|value: '{{600}}'" frontend/src/AppBuilder/WidgetManager/widgets/modalV2.js server/src/modules/apps/services/widget-config/modalV2.js
```

Expected: both files contain the `custom` option, `modalWidth` property, and default definition value.

## Task 2: Width Normalization Helper

**Files:**
- Modify: `frontend/src/AppBuilder/Widgets/ModalV2/helpers/utils.js`

- [ ] **Step 1: Add custom width constants and helper**

Append this helper near the other exported utility functions:

```js
const DEFAULT_MODAL_WIDTH = 600;

export const getCustomModalWidth = (value) => {
  const parsedValue = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').trim());

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return `${DEFAULT_MODAL_WIDTH}px`;
  }

  return `${parsedValue}px`;
};
```

- [ ] **Step 2: Manually inspect helper export**

Run:

```bash
rg -n "getCustomModalWidth|DEFAULT_MODAL_WIDTH" frontend/src/AppBuilder/Widgets/ModalV2/helpers/utils.js
```

Expected: helper is exported once, constant exists once.

## Task 3: Wire Custom Width Through ModalV2

**Files:**
- Modify: `frontend/src/AppBuilder/Widgets/ModalV2/ModalV2.jsx`

- [ ] **Step 1: Import helper**

Change the ModalV2 helper import to include `getCustomModalWidth`:

```js
import {
  getModalBodyHeight,
  getModalHeaderHeight,
  getModalFooterHeight,
  getCustomModalWidth,
} from '@/AppBuilder/Widgets/ModalV2/helpers/utils';
```

- [ ] **Step 2: Read `modalWidth` from properties**

Add `modalWidth` to the properties destructuring:

```js
const {
  closeOnClickingOutside = false,
  hideOnEsc,
  hideCloseButton,
  hideTitleBar,
  useDefaultButton,
  triggerButtonLabel,
  modalHeight,
  modalWidth,
  showHeader,
  showFooter,
  headerHeight,
  footerHeight,
  dynamicHeight,
} = properties;
```

- [ ] **Step 3: Compute custom width state**

After `const isFullScreen = properties.size === 'fullscreen';`, add:

```js
const isCustomWidth = size === 'custom';
const customModalWidth = isCustomWidth ? getCustomModalWidth(modalWidth) : undefined;
const bootstrapModalSize = isCustomWidth ? undefined : size;
```

- [ ] **Step 4: Pass custom width into width-measurement hook**

Use an alias for the rendered modal width so it does not collide with the resolved `modalWidth` property:

```js
const { modalWidth: renderedModalWidth, parentRef } = useModalEventSideEffects({
  showModal,
  size,
  id,
  onShowSideEffects,
  closeOnClickingOutside,
  onHideModal,
  customModalWidth,
});
```

Pass `renderedModalWidth` wherever the rendered canvas width is needed.

- [ ] **Step 5: Do not pass custom as Bootstrap size**

Change Bootstrap Modal prop from:

```jsx
size={size}
```

to:

```jsx
size={bootstrapModalSize}
```

- [ ] **Step 6: Pass custom width props to ModalWidget**

Inside `modalProps`, replace the existing `modalWidth` value with `renderedModalWidth` and add custom width props:

```js
modalWidth: renderedModalWidth,
isCustomWidth,
customModalWidth,
```

- [ ] **Step 7: Manually inspect no unsupported Bootstrap custom size**

Run:

```bash
rg -n "size=\\{size\\}|bootstrapModalSize|isCustomWidth|customModalWidth|renderedModalWidth" frontend/src/AppBuilder/Widgets/ModalV2/ModalV2.jsx
```

Expected: no `size={size}` remains for Bootstrap Modal, and custom width values are passed through.

## Task 4: Apply Dialog Width in ModalWidget

**Files:**
- Modify: `frontend/src/AppBuilder/Widgets/ModalV2/Components/Modal.jsx`

- [ ] **Step 1: Read custom width props**

Add these to the `modalProps` destructuring:

```js
isCustomWidth,
customModalWidth,
```

- [ ] **Step 2: Add `dialogClassName` and CSS variable to Bootstrap Modal**

In `<BootstrapModal ...>`, add:

```jsx
dialogClassName={classNames(isCustomWidth && 'tj-modal-widget-custom-width-dialog')}
style={{
  ...(restProps.style || {}),
  ...(isCustomWidth ? { '--tj-modal-custom-width': customModalWidth } : {}),
}}
```

Keep existing props spread and merge with `restProps.style` exactly as shown.

- [ ] **Step 3: Manually inspect class and variable**

Run:

```bash
rg -n "tj-modal-widget-custom-width-dialog|--tj-modal-custom-width|dialogClassName" frontend/src/AppBuilder/Widgets/ModalV2/Components/Modal.jsx
```

Expected: class and CSS variable are present once.

## Task 5: Remeasure Width on Custom Width Changes

**Files:**
- Modify: `frontend/src/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects.js`

- [ ] **Step 1: Add parameter**

Add `customModalWidth` to the function parameter destructuring:

```js
export function useModalEventSideEffects({
  showModal,
  size,
  id,
  onShowSideEffects,
  closeOnClickingOutside,
  onHideModal,
  customModalWidth,
}) {
```

- [ ] **Step 2: Include custom width in measurement effect dependencies**

Change the second effect dependency list from:

```js
}, [showModal, size, id]);
```

to:

```js
}, [showModal, size, id, customModalWidth]);
```

- [ ] **Step 3: Manually inspect dependency**

Run:

```bash
rg -n "customModalWidth|\\[showModal, size, id, customModalWidth\\]" frontend/src/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects.js
```

Expected: parameter and dependency are both present.

## Task 6: Add Custom Width CSS

**Files:**
- Modify: `frontend/src/AppBuilder/Widgets/ModalV2/style.scss`

- [ ] **Step 1: Add dialog width rule**

Append this near the existing ModalV2 styles:

```scss
.tj-modal-widget-custom-width-dialog {
  width: calc(100vw - 24px);
  max-width: min(var(--tj-modal-custom-width, 600px), calc(100vw - 24px));
}
```

- [ ] **Step 2: Manually inspect CSS**

Run:

```bash
rg -n "tj-modal-widget-custom-width-dialog|--tj-modal-custom-width" frontend/src/AppBuilder/Widgets/ModalV2/style.scss
```

Expected: CSS class and variable are present once.

## Task 7: Manual Verification Review

**Files:**
- Inspect only.

- [ ] **Step 1: Confirm all scoped files changed**

Run:

```bash
git status --short frontend/src/AppBuilder/WidgetManager/widgets/modalV2.js server/src/modules/apps/services/widget-config/modalV2.js frontend/src/AppBuilder/Widgets/ModalV2/helpers/utils.js frontend/src/AppBuilder/Widgets/ModalV2/ModalV2.jsx frontend/src/AppBuilder/Widgets/ModalV2/Components/Modal.jsx frontend/src/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects.js frontend/src/AppBuilder/Widgets/ModalV2/style.scss docs/superpowers/specs/2026-05-20-modal-custom-width-design.md docs/superpowers/plans/2026-05-20-modal-custom-width.md
```

Expected: only intended files show changes for this feature.

- [ ] **Step 2: Inspect behavior-relevant strings**

Run:

```bash
rg -n "modalWidth|customModalWidth|bootstrapModalSize|tj-modal-widget-custom-width-dialog|--tj-modal-custom-width" frontend/src/AppBuilder/WidgetManager/widgets/modalV2.js server/src/modules/apps/services/widget-config/modalV2.js frontend/src/AppBuilder/Widgets/ModalV2
```

Expected:
- frontend and server configs include `modalWidth`
- ModalV2 uses `bootstrapModalSize`
- ModalWidget applies custom dialog class and CSS variable
- CSS clamps width to viewport

- [ ] **Step 3: Do not run tests/lint/build**

User explicitly requested no tests and no lint. Final response must state tests/lint/build were not run by request.

---

## Self-Review Notes

- Spec coverage: config option, `modalWidth`, numeric/numeric-string px handling, fallback, edit/view behavior, fullscreen ignore, server config, no migration, no AI metadata, no tests/lint all mapped to tasks.
- Placeholder scan: no `TBD`/`TODO`/unspecified test steps.
- Type consistency: `modalWidth` is stored property; `customModalWidth` is normalized CSS string; rendered measured width is aliased as `renderedModalWidth`.

# Widget Registration Checklist

Reference for the `create-widget` skill — Phase 4 (REGISTER) + Phase 5 (MIGRATIONS).

Placeholders used throughout:
- `{Name}` — PascalCase widget name (e.g. `FileInput`)
- `{camelName}` — camelCase file name, first letter lowercase (e.g. `fileInput`)
- `{SECTION_GROUP}` — one of: `buttons` / `data` / `layouts` / `textInputs` / `numberInputs` / `selectInputs` / `dateTimeInputs` / `navigation` / `media` / `presentation` / `custom` / `miscellaneous`
- `{INSPECTOR_TYPE}` — `A` (DefaultComponent), `B` (fall-through to existing), or `C` (custom, manual TODO)
- `{INSPECTOR_FALLTHROUGH}` — the existing Inspector component name (only when INSPECTOR_TYPE = B)
- `{RESTRICTED_PARENTS}` — list of parent container names (or empty)

---

## Edit 1 — `frontend/src/AppBuilder/WidgetManager/widgets/index.js`

**What:** Add import + named export for the new schema.

**Find (import block anchor):** The last import line before the `export {` block:
```js
import { navigationConfig } from './navigation';
```

Note: If `navigationConfig` is no longer the last import (because another widget was added after it), use the actual last import line in the file as the anchor instead.

**Add after that line:**
```js
import { {camelName}Config } from './{camelName}';
```

**Find (export block anchor):** The last entry before the closing `};`:
```js
  navigationConfig,
};
```

**Add before `};`:**
```js
  {camelName}Config,
```

---

## Edit 2 — `server/src/modules/apps/services/widget-config/index.js`

**What:** Add import + entry in the `widgets` object.

**Find (import block anchor):** The last import line before the blank line + `const widgets = {`:
```js
import { navigationConfig } from './navigation';
```

Note: If `navigationConfig` is no longer the last import (because another widget was added after it), use the actual last import line in the file as the anchor instead.

**Add after that line:**
```js
import { {camelName}Config } from './{camelName}';
```

**Find (widgets object anchor):** The last entry before `};` that closes the `widgets` object:
```js
  navigationConfig,
};
```

**Add before that `};`:**
```js
  {camelName}Config,
```

---

## Edit 3 — `frontend/src/AppBuilder/WidgetManager/configs/widgetConfig.js`

**What:** Add `{camelName}Config` to the import destructure AND into the correct comment-delimited group in the `widgets` array.

**Step A — import:** Add `{camelName}Config,` to the destructured import list from `'../widgets'`. Insert it near other configs in the same section group for readability.

**Step B — array insertion:** The `widgets` array (line 81+) is divided by comments:
```
// Buttons
//Data
// Layouts
//Text inputs
//Number inputs
//Select inputs
//Date and time inputs
//Navigation
//Media
//Presentation
//Custom
//Miscellaneous
//Legacy
//Module
```

Insert `{camelName}Config,` under the comment that matches `{SECTION_GROUP}`. Do NOT append at the end.

Example — if `{SECTION_GROUP}` = `buttons`, insert after `popoverMenuConfig,`:
```js
  // Buttons
  buttonConfig,
  buttonGroupConfig,
  popoverMenuConfig,
  {camelName}Config,   // <-- insert here
```

---

## Edit 4 — `frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx` (`NEW_REVAMPED_COMPONENTS`)

**What:** Append widget name to the `NEW_REVAMPED_COMPONENTS` array.

**Find anchor** (last element before closing bracket):
```js
  'Navigation',
];
```

**Add before `];`:**
```js
  '{Name}',
```

Full array is at line 96; the closing `];` is at line 148.

---

## Edit 5 — `frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx` (`GetAccordion`)

**What:** Add a `case` for the new widget inside the `GetAccordion` switch.

The `GetAccordion` switch starts at line 864. The `default:` case returns `<DefaultComponent {...restProps} />`.

### Pattern A — DefaultComponent (INSPECTOR_TYPE = A)

Do NOT add a case — the `default:` branch already returns `<DefaultComponent>`. No edit needed here.

### Pattern B — Fall-through to existing Inspector (INSPECTOR_TYPE = B)

**Find (insertion point — before `default:`):**
```js
      case 'Navigation':
        return <Navigation {...restProps} />;

      default: {
```

**Add before `default: {`:**
```js
      case '{Name}':   // fall-through
      case '{INSPECTOR_FALLTHROUGH}':
        return <{INSPECTOR_FALLTHROUGH} {...restProps} />;
```

If the fall-through target already has a `case` in the switch, instead add `{Name}` as an additional fall-through above the existing case:
```js
      case '{Name}':   // fall-through to {INSPECTOR_FALLTHROUGH}
      case '{INSPECTOR_FALLTHROUGH}':
        return <{INSPECTOR_FALLTHROUGH} {...restProps} />;
```

### Pattern C — Custom Inspector (INSPECTOR_TYPE = C)

Add a placeholder case and leave a TODO comment:
```js
      // TODO: replace PlaceholderInspector with the real {Name} Inspector component
      case '{Name}':
        return <DefaultComponent {...restProps} />;
```

---

## Edit 6 — `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx` (`SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY`)

**What:** Append widget name to the array.

**File:** `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx`, line 12.

**Find anchor** (last element before closing bracket):
```js
  'KeyValuePair',
];
```

**Add before `];`:**
```js
  '{Name}',
```

---

## Edit 7 — `frontend/src/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent.jsx`

Two sub-edits in this file.

### 7A — `SHOW_ADDITIONAL_ACTIONS` array

**Find anchor** (last element before closing bracket):
```js
  'ReorderableList',
];
```

**Add before `];`:**
```js
  '{Name}',
```

### 7B — `PROPERTIES_VS_ACCORDION_TITLE` object

**Condition:** Skip Edit 7B if INSPECTOR_TYPE = C. Custom Inspector widgets do not use DefaultComponent's accordion title mapping.

**Find anchor** (last entry before closing brace):
```js
  JSONEditor: 'Data',
};
```

**Add before `};`:**
```js
  {Name}: 'Data',
```

Note: Use a different value than `'Data'` only if the PRD specifies a custom accordion title for the Properties section (e.g. Kanban uses `'Board configuration'`, AudioRecorder uses `'Content'`). Default is `'Data'`.

---

## Edit 8 — `frontend/src/AppBuilder/RightSideBar/Inspector/Utils.js`

Two sub-edits in this file — one in `renderCustomStyles`, one in `renderElement`.

### 8A — `renderCustomStyles` conditional block (line 41+)

**What:** Add the widget's component name to the long `if` condition that enables `conditionallyRender` support for styles.

**Find anchor** (last condition before closing paren):
```js
    componentConfig.component == 'ProgressBar'
  ) {
```

**Add before `) {`:**
```js
    componentConfig.component == '{Name}' ||
```

So the result looks like:
```js
    componentConfig.component == 'ProgressBar' ||
    componentConfig.component == '{Name}'
  ) {
```

### 8B — `renderElement` conditional block (line 167+)

**Condition:** Only apply Edit 8B if the widget has at least one field in the `properties` section with a `conditionallyRender` key. If no properties have `conditionallyRender`, skip Edit 8B entirely.

**What:** Add the widget's component name to the `if` condition that enables `conditionallyRender` support for properties.

**Find anchor** (last condition before closing paren):
```js
    componentConfig.component == 'ProgressBar'
  ) {
```

**Add before `) {`:**
```js
    componentConfig.component == '{Name}' ||
```

---

## Edit 9 — `frontend/src/AppBuilder/RightSideBar/ComponentManagerTab/sectionConfig.js`

**What:** Add `'{Name}'` to the `valueSet` of the section matching `{SECTION_GROUP}`.

**File path:** `frontend/src/AppBuilder/RightSideBar/ComponentManagerTab/sectionConfig.js`

Find the section object matching `{SECTION_GROUP}`. For example, if `{SECTION_GROUP}` = `selectInputs`:

```js
  selectInputs: {
    title: 'Select inputs',
    valueSet: new Set([
      'TagsInput',
      'DropdownV2',
      'MultiselectV2',
      'ToggleSwitchV2',
      'RadioButtonV2',
      'Checkbox',
      'TreeSelect',
    ]),
  },
```

Add `'{Name}'` as the last entry in that `new Set([...])`:
```js
      'TreeSelect',
      '{Name}',
```

---

## Edit 10 — `frontend/assets/images/icons/widgets/index.jsx`

Two sub-edits in this file.

### 10A — Import statement

**Find anchor** (last import before `const WidgetIcon`):
```js
import Navigation from './navigation.jsx';
```

**Add after that line:**
```js
import {Name} from './{camelName}.jsx';
```

### 10B — Switch case

**Find anchor** (last case before `default:`):
```js
    case 'jsoneditor':
      return <JSONEditor {...props} />;
    default:
```

**Add before `default:`:**
```js
    case '{camelName}':
      return <{Name} {...props} />;
```

Note: The switch uses lowercase-only `props.name` values (e.g. `'tagsinput'`, `'jsoneditor'`). The case string must be the fully lowercased, no-separator version of the widget name.

The switch case key is derived by calling `.toLowerCase()` on the full `camelName`. Example: `camelName = fileInput` → case key = `'fileinput'`. Example: `camelName = rangeSliderV2` → case key = `'rangesliderv2'`.

---

## Edit 11 — `frontend/assets/images/icons/widgets/{camelName}.jsx` (CREATE)

**What:** Create a stub SVG icon file. The final SVG will be replaced by the designer; this stub lets the widget render without errors.

**File to create:** `frontend/assets/images/icons/widgets/{camelName}.jsx`

**Content:**
```jsx
import React from 'react';

const {Name} = ({ fill = '#CCD1D5', width = 24, className = '', viewBox = '0 0 48 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* TODO: replace with final {Name} icon SVG paths */}
    <rect width="48" height="48" rx="8" fill={fill} />
  </svg>
);

export default {Name};
```

---

## Edit 12 — `frontend/src/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig.js`

**Conditional:** Only perform this edit if `{RESTRICTED_PARENTS}` is non-empty.

**What:** For each parent container in `{RESTRICTED_PARENTS}`, append `'{Name}'` to its array in `RESTRICTED_WIDGETS_CONFIG`.

**File:** `frontend/src/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig.js`

The structure is:
```js
export const RESTRICTED_WIDGETS_CONFIG = {
  Form: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Accordion'],
  Kanban_card: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Listview', 'Container', 'Accordion', 'Table'],
  Calendar: ['Calendar', 'Kanban'],
  Container: ['Calendar', 'Kanban'],
  Modal: ['Calendar', 'Kanban'],
  ModalV2: ['Calendar', 'Kanban'],
  ModalSlot: ['Calendar', 'Kanban', 'Table', 'Listview', 'Container', 'Accordion'],
  Tabs: ['Calendar', 'Kanban'],
  Kanban_popout: ['Calendar', 'Kanban'],
  Listview: ['Calendar', 'Kanban'],
};
```

For each parent listed in `{RESTRICTED_PARENTS}`, append `'{Name}'` to that parent's array.

Example — if `{RESTRICTED_PARENTS}` = `['Form', 'Listview']`:
```js
  Form: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Accordion', '{Name}'],
  ...
  Listview: ['Calendar', 'Kanban', '{Name}'],
```

---

## Edit 13 — `server/src/modules/apps/services/app-import-export.service.ts` (`NewRevampedComponents`)

**What:** Append the widget name to the `NewRevampedComponents` TypeScript array.

**File:** `server/src/modules/apps/services/app-import-export.service.ts`

**Find anchor** (last entry before closing bracket, around line 143):
```ts
  'IFrame',
];
```

**Add before `];`:**
```ts
  '{Name}',
```

---

## Dependency Order (safe execution sequence)

Execute edits in this order to avoid broken imports at any point:

1. Edit 11 — create icon SVG stub file (no dependencies)
2. Edit 1 — `widgets/index.js` (import + export)
3. Edit 2 — `widget-config/index.js` (import + object entry)
4. Edit 3 — `widgetConfig.js` (import + array insertion in correct group)
5. Edit 4 — `Inspector.jsx` `NEW_REVAMPED_COMPONENTS`
6. Edit 5 — `Inspector.jsx` `GetAccordion` (only for Pattern B or C)
7. Edit 6 — `RenderWidget.jsx` `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY`
8. Edit 7 — `DefaultComponent.jsx` `SHOW_ADDITIONAL_ACTIONS` + `PROPERTIES_VS_ACCORDION_TITLE`
9. Edit 8 — `Utils.js` `renderCustomStyles` + `renderElement`
10. Edit 9 — `sectionConfig.js` Set entry
11. Edit 10 — icon `index.jsx` import + switch case
12. Edit 12 — `restrictedWidgetsConfig.js` (skip if `{RESTRICTED_PARENTS}` is empty)
13. Edit 13 — `app-import-export.service.ts` `NewRevampedComponents`

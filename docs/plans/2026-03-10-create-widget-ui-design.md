# Design: `tooljet:create-widget-ui` Skill

**Date:** 2026-03-10
**Status:** Approved
**Scope:** Generate a wired-up UI stub for a new ToolJet widget from its existing schema file

---

## Problem

After `create-widget` runs, the engineer has schemas + registration but no UI component. Creating `Widgets/{Name}/{Name}.jsx` manually means re-reading the schema to find all events, CSAs, exposed variables, and standard state hooks — mechanical work that belongs in a skill.

---

## Goal

A Claude skill (`tooljet:create-widget-ui`) that:
1. Reads the already-generated schema file (`widgets/{camelName}.js`)
2. Produces a correctly-wired UI stub with all boilerplate present
3. Optionally fills in the Inspector stub sections[] if a Type C stub exists
4. Leaves actual JSX layout as a manual TODO

The skill does NOT generate final widget UI logic or third-party library integration.

---

## Input

Single argument: the PascalCase widget name (e.g. `FileInput`, `PopoverMenu`).

The skill derives `camelName` from it and reads:
```
frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js
```

No PRD re-input required.

---

## Output Files

### Always created

**`frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx`**

Contains:
1. Standard imports: `React`, `useState`, `useEffect`, `Loader` from `@/_ui/Loader`
2. Props destructuring: `height`, `width`, `properties`, `styles`, `fireEvent`, `setExposedVariable`, `setExposedVariables`, `darkMode`, `dataCy`, `id`
3. `useState` for `isVisible`, `isLoading`, `isDisabled` (initialized from properties)
4. Mount `useEffect` — calls `setExposedVariables({})` with:
   - All exposed variables from schema with their default values
   - All CSA setter methods (`setDisable`, `setLoading`, `setVisibility` + any extras)
5. One `useEffect` per standard prop tracking (`loadingState`, `visibility`, `disabledState`) — each calls `setExposedVariable(key, value)`
6. Event handler stubs: `const handle{EventName} = () => fireEvent('{eventName}')` for each event in schema
7. JSX: visibility-gated outer div → loading branch (`<Loader />`) → disabled-aware TODO div

**`frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss`**

Empty stub:
```scss
.{camelName}-widget {
  // TODO: styles for {Name} widget
}
```

### Conditionally updated

**`frontend/src/AppBuilder/RightSideBar/Inspector/Components/{Name}/{Name}.jsx`**

Only if this file already exists (created by `create-widget` Phase 4 Edit 14).

The generic `'Properties'` section is replaced with real sections derived from the schema:
- One section per unique `accordian:` value found in `properties` (e.g. `'Data'`, `'Options'`)
- Properties with no `accordian:` key fall into a catch-all `'Properties'` section
- `additionalActions` properties → `'Additional Actions'` section (already present in stub)
- Events and Devices sections are left as-is (already correct in stub)

---

## Skill Flow (2 phases)

### Phase 1 — READ SCHEMA

Announce: "Phase 1: Reading schema..."

Spawn an **Explore** agent to read `frontend/src/AppBuilder/WidgetManager/widgets/{camelName}.js` and extract:

| What | Where in schema |
|---|---|
| Events | `events` object keys → `[{ handle, displayName }]` |
| CSAs | `actions` array → `[{ handle, displayName, params? }]` |
| Exposed variables | `exposedVariables` object → `{ key: defaultValue }` |
| Standard props | `properties` where `section: 'additionalActions'` → loadingState, visibility, disabledState confirmed |
| Accordion groups | All unique `accordian:` values across `properties` fields |
| Properties by group | `{ [accordian]: [key, ...] }` map |
| Inspector stub exists | Check if `Inspector/Components/{Name}/{Name}.jsx` exists |

Return all extracted data as structured output.

### Phase 2 — GENERATE

Announce: "Phase 2: Generating UI stub..."

Spawn a **general-purpose** agent with the full extracted data. Agent writes:
1. `{Name}/{Name}.jsx` — full wired stub
2. `{Name}/{Name}.scss` — empty stub
3. Inspector `{Name}.jsx` — sections[] update (only if stub exists)

After agent completes, verify:
```bash
ls frontend/src/AppBuilder/Widgets/{Name}/
```
Expected: `{Name}.jsx` and `{Name}.scss` present.

---

## UI Stub Template

```jsx
import React, { useState, useEffect } from 'react';
import Loader from '@/_ui/Loader';

export const {Name} = ({
  height,
  width,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
  id,
}) => {
  const { loadingState, visibility, disabledState } = properties;

  const [isVisible, setIsVisible] = useState(visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  // Expose variables and CSA methods on mount
  useEffect(() => {
    setExposedVariables({
      // --- exposed variables from schema ---
      {exposedVarEntries},
      // --- standard CSA methods ---
      setVisibility: async (value) => { setIsVisible(value); setExposedVariable('isVisible', value); },
      setLoading:    async (value) => { setIsLoading(value);  setExposedVariable('isLoading', value); },
      setDisable:    async (value) => { setIsDisabled(value); setExposedVariable('isDisabled', value); },
      // --- extra CSA methods from schema ---
      {extraCsaEntries},
    });
  }, []);

  // Sync standard props → state + exposed variables
  useEffect(() => { setIsLoading(loadingState);  setExposedVariable('isLoading', loadingState);   }, [loadingState]);
  useEffect(() => { setIsVisible(visibility);    setExposedVariable('isVisible', visibility);     }, [visibility]);
  useEffect(() => { setIsDisabled(disabledState); setExposedVariable('isDisabled', disabledState); }, [disabledState]);

  // Event handlers
  {eventHandlerEntries}

  if (!isVisible) return null;

  return (
    <div
      className="{camelName}-widget"
      style={{ height, width }}
      data-cy={dataCy}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div
          style={{
            opacity: isDisabled ? 0.5 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
            height: '100%',
          }}
        >
          {/* TODO: implement {Name} widget UI */}
        </div>
      )}
    </div>
  );
};
```

---

## Inspector Sections[] Pattern

When updating the Inspector stub, replace the `'Properties'` section with groups derived from the schema:

```js
const sections = [
  // One entry per accordion group in schema properties:
  {
    title: 'Data',                    // ← accordian value from schema
    type: 'properties',
    properties: ['label', 'value'],  // ← keys with accordian: 'Data'
  },
  // ... other groups ...
  {
    title: 'Events',
    custom: () => <EventManager ... />,
  },
  {
    title: 'Additional Actions',
    type: 'properties',
    properties: additionalActions,
    extraProps: (property) => ({ placeholder: componentMeta.properties?.[property]?.placeholder }),
  },
  {
    title: 'Devices',
    type: 'others',
    properties: ['showOnDesktop', 'showOnMobile'],
    extraProps: () => ({ paramUpdated: layoutPropertyChanged }),
  },
];
```

---

## Safety Rules

- Skill is **additive only** — never modifies schema files
- If `Widgets/{Name}/` already exists, stop and warn: "Widget UI already exists. Delete the directory first if you want to regenerate."
- If schema file not found, stop: "Schema not found at `widgets/{camelName}.js`. Run `create-widget` first."

---

## Out of Scope

- Actual widget JSX/logic (left as TODO)
- Third-party library integration (react-select, Radix, etc.)
- Final SCSS styling
- Icon SVG

---

## Reference Files

| Purpose | Path |
|---|---|
| Simple widget example | `frontend/src/AppBuilder/Widgets/Button.jsx` |
| Complex widget example | `frontend/src/AppBuilder/Widgets/PopoverMenu/PopoverMenu.jsx` |
| Shared utils | `frontend/src/AppBuilder/Widgets/utils.js` |
| Inspector stub reference | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/PopoverMenu/PopoverMenu.jsx` |
| Loader component | `frontend/src/_ui/Loader` |

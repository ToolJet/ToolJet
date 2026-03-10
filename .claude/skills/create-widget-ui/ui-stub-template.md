# Widget UI Stub Template

Use this template to generate `frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx`.

Substitute all `{placeholder}` tokens before writing the file.

## Token Reference

| Token | Value |
|---|---|
| `{Name}` | PascalCase widget name (e.g. `MyWidget`) |
| `{camelName}` | camelCase file name (e.g. `myWidget`) |
| `{exposedVarEntries}` | One line per exposed variable: `varName: defaultValue,` |
| `{extraCsaEntries}` | One block per non-standard CSA (all except setDisable/setLoading/setVisibility) |
| `{eventHandlerEntries}` | One const per event: `const handle{PascalEventName} = () => fireEvent('{eventHandle}');` |

## Exposed Variable Entries

For each key in `exposedVariables` in the schema:
- String default (`''`): `varName: '',`
- Number default (`0`): `varName: 0,`
- Boolean default (`false`/`true`): `varName: false,`
- Array default (`[]`): `varName: [],`
- null default: `varName: null,`

**Do NOT include `isVisible`, `isLoading`, `isDisabled` here** — they are handled by the standard state block.

## Extra CSA Entries

For each action in `actions[]` that is NOT `setDisable`, `setLoading`, or `setVisibility`:

If action has params:
```js
{handle}: async ({paramHandles}) => {
  // TODO: implement {displayName}
  setExposedVariable('{handle}', {firstParamHandle});
},
```

If action has no params:
```js
{handle}: async () => {
  // TODO: implement {displayName}
},
```

## Event Handler Entries

For each key in `events` in the schema, PascalCase the handle:
```js
const handle{PascalEventName} = () => fireEvent('{eventHandle}');
```

Example: event key `onSelect` → `const handleOnSelect = () => fireEvent('onSelect');`
Example: event key `onSearchTextChanged` → `const handleOnSearchTextChanged = () => fireEvent('onSearchTextChanged');`

## Full JSX Template

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
      // exposed variables from schema
      {exposedVarEntries}
      // standard CSA methods
      setVisibility: async (value) => { setIsVisible(value); setExposedVariable('isVisible', value); },
      setLoading:    async (value) => { setIsLoading(value);  setExposedVariable('isLoading', value); },
      setDisable:    async (value) => { setIsDisabled(value); setExposedVariable('isDisabled', value); },
      // extra CSA methods from schema
      {extraCsaEntries}
    });
  }, []);

  // Sync props → state + exposed variables
  useEffect(() => { setIsLoading(loadingState);   setExposedVariable('isLoading', loadingState);   }, [loadingState]);
  useEffect(() => { setIsVisible(visibility);     setExposedVariable('isVisible', visibility);     }, [visibility]);
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

## SCSS Stub

Create `frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss`:

```scss
.{camelName}-widget {
  // TODO: styles for {Name} widget
}
```

## Self-Consistency Checklist

Before writing the file, verify:
1. `{Name}` replaced everywhere (component name, className, TODO comment)
2. `{camelName}` replaced everywhere (className, data-cy)
3. All exposed variables from schema present in `setExposedVariables` call (except isVisible/isLoading/isDisabled)
4. All extra CSAs present (every action except setDisable/setLoading/setVisibility)
5. All events have a handler const
6. No placeholder tokens remain in the output (`{` characters should only appear in JSX expressions like `{{ height, width }}`)

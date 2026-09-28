---
id: build-components
title: Build Components with the SDK
sidebar_label: Build Components
---

<div className="badge badge--primary heading-badge">
  <img
    src="/img/badge-icons/premium.svg"
    alt="Icon"
    width="16"
    height="16"
  />
 <span>Paid feature</span>
</div>

A custom component is a regular React component. The only ToolJet-specific part is the `ToolJet` object from `@tooljet/custom-component-sdk`. Each of its hooks declares one thing that appears in the App Builder, such as a property, an event or an action.

There is no separate config file. **The hook calls are the component's schema.**

```tsx
import React from "react";
import { ToolJet } from "@tooljet/custom-component-sdk";

export const HelloWorld: React.FC = () => {
  const [firstName, setFirstName] = ToolJet.useStateString({
    name: 'firstName',
    label: 'First Name',
    initialValue: 'John',
  });

  ToolJet.useComponentSettings({ defaultWidth: 7, defaultHeight: 11 });

  ToolJet.useAction({ name: 'reset', displayName: 'Reset' }, () => setFirstName('John'));

  return <div><h1>Hello World</h1><p>First Name: {firstName}</p></div>;
};
```

Remember to export the component from `src/index.ts`. Only components exported there are published.

## Hooks

| <div style={{ width:"200px"}}> Hook </div> | <div style={{ width:"250px"}}> What It Creates in ToolJet </div> | <div style={{ width:"150px"}}> Returns </div> |
|:---------- | :---------- | :------------ |
| `useStateString` | A text property in the inspector and an exposed variable. | `[value, setValue]` |
| `useStateNumber` | A number property. | `[value, setValue]` |
| `useStateBoolean` | A toggle property. | `[value, setValue]` |
| `useStateObject` | An object property, edited in a code editor. | `[value, setValue]` |
| `useStateArray` | An array property, edited in a code editor. | `[value, setValue]` |
| `useStateEnumeration` | A select or switch property with a fixed list of options. | `[value, setValue]` |
| `useEventCallback` | An event that app builders can attach event handlers to. | A function that fires the event |
| `useAction` | An action that queries and other components can trigger on this component. | Nothing |
| `useComponentSettings` | The component's default size when it is dropped on the canvas. | Nothing |

## Properties

Each `useState*` hook creates a property in the inspector and an exposed variable with the same name.

### Options

All `useState*` hooks accept these options:

| <div style={{ width:"150px"}}> Option </div> | <div style={{ width:"400px"}}> Purpose </div> |
|:---------- | :---------- |
| `name` | Required. The property key and the name of the exposed variable, for example `{{components.myWidget.firstName}}`. |
| `initialValue` | The value the property starts with. |
| `label` | The field label shown in the inspector. Defaults to `name`. |
| `inspector` | Which editor the inspector shows for the property. See [Inspector Editors](#inspector-editors). |
| `section` | Groups the property under a named accordion section in the inspector. |

### Inspector Editors

The values allowed for `inspector` depend on the hook:

| <div style={{ width:"200px"}}> Hook </div> | <div style={{ width:"300px"}}> Allowed `inspector` Values </div> |
|:---------- | :---------- |
| `useStateString` | `code`, `color`, `hidden` |
| `useStateNumber` | `code`, `number`, `hidden` |
| `useStateBoolean` | `toggle`, `hidden` |
| `useStateObject` | `code`, `hidden` |
| `useStateArray` | `code`, `hidden` |
| `useStateEnumeration` | `select`, `switch`, `hidden` |

Set `inspector` to `hidden` to keep the property out of the inspector. It is still available as an exposed variable.

### Enumerations

`useStateEnumeration` takes two extra options:

- `enumDefinition`: Required. The array of allowed values.
- `enumLabels`: Optional. A map from each value to the label shown in the inspector.

## Events

```tsx
const onEnterPressed = ToolJet.useEventCallback({ name: 'onEnterPressed' });
```

Call `onEnterPressed()` in your component to fire the event. In the App Builder, the event appears under **Events** in the inspector. App builders attach handlers to it the same way they do for a built-in **Button** component's **On click** event.

## Actions

Actions work in the opposite direction to events. They let a query or another component tell this component to do something.

```tsx
ToolJet.useAction(
  { name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] },
  (value) => setValue(value)
);
```

The handler receives params **as separate arguments, in the order you declare them**, not as a single object.

Each param supports:

| <div style={{ width:"150px"}}> Field </div> | <div style={{ width:"400px"}}> Purpose </div> |
|:---------- | :---------- |
| `handle` | The param key. |
| `displayName` | The label shown to app builders. |
| `defaultValue` | The value used when the app builder doesn't set one. |
| `type` | The editor used for the param: `code`, `toggle`, `select`, `switch` or `color`. |
| `options` | Required when `type` is `select` or `switch`. The list of choices. |

## Default Size

```tsx
ToolJet.useComponentSettings({ defaultWidth: 7, defaultHeight: 11 });
```

`defaultWidth` is in grid columns and `defaultHeight` is in grid rows. Both must be positive whole numbers, or the build fails. This only sets the size when the component is dropped on the canvas. App builders can resize it afterwards.

## Styling and Dependencies

- ToolJet provides React 18 at runtime. `react`, `react-dom` and `react/jsx-runtime` are left out of your bundle, which keeps it small. Don't bundle your own copy of React.
- CSS imported by a component is collected into `dist/index.css` and loaded automatically.

## Next Steps

See your changes live in the App Builder with [dev preview](/docs/app-builder/custom-component-library/preview-and-publish#preview-changes-with-dev-mode), then publish a version.

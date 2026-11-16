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

:::caution BETA
Custom Component Libraries are currently in beta and not recommended for production use.
:::

A custom component is a regular React component. The only ToolJet-specific part is the `ToolJet` object from `@tooljet/custom-component-sdk`. Each of its hooks declares one thing that appears in the App Builder, such as a property, an event or an action.

There is no separate config file. **The hook calls are the component's schema.**

ToolJet reads the hook calls written directly in the component's body. If a component calls hooks from a helper function, set `"recordRender": true` in the project's `.tooljet/config.json`. The build warns you when a component needs it.

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
| `useStateString` | A text property in the component properties panel and an exposed variable. | `[value, setValue]` |
| `useStateNumber` | A number property. | `[value, setValue]` |
| `useStateBoolean` | A toggle property. | `[value, setValue]` |
| `useStateObject` | An object property, edited in a code editor. | `[value, setValue]` |
| `useStateArray` | An array property, edited in a code editor. | `[value, setValue]` |
| `useStateEnumeration` | A select or switch property with a fixed list of options. | `[value, setValue]` |
| `useEventCallback` | An event that app builders can attach event handlers to. | A function that fires the event |
| `useAction` | An action that queries and other components can trigger on this component. | Nothing |
| `useComponentSettings` | The component's default size when it is dropped on the canvas. | Nothing |

## Properties

Each `useState*` hook creates a property in the component properties panel and an exposed variable with the same name.

### Options

All `useState*` hooks accept these options:

| <div style={{ width:"150px"}}> Option </div> | <div style={{ width:"400px"}}> Purpose </div> |
|:---------- | :---------- |
| `name` | Required. The property key and the name of the exposed variable, for example `{{components.myWidget.firstName}}`. |
| `initialValue` | The value the property starts with. |
| `label` | The field label shown in the properties panel. Defaults to `name`. |
| `inspector` | The type of input shown for the property in the properties panel, such as a code editor, color picker or toggle. See [Property Input Types](#property-input-types). |
| `section` | Groups the property under a named, collapsible section in the properties panel. |

### Property Input Types

The values allowed for `inspector` depend on the hook:

| <div style={{ width:"200px"}}> Hook </div> | <div style={{ width:"300px"}}> Allowed `inspector` Values </div> |
|:---------- | :---------- |
| `useStateString` | `code`, `color`, `hidden` |
| `useStateNumber` | `code`, `number`, `hidden` |
| `useStateBoolean` | `toggle`, `hidden` |
| `useStateObject` | `code`, `hidden` |
| `useStateArray` | `code`, `hidden` |
| `useStateEnumeration` | `select`, `switch`, `hidden` |

Set `inspector` to `hidden` to hide the property from the properties panel. App builders can't edit it, but it is still available as an exposed variable.

### Enumerations

`useStateEnumeration` takes two extra options:

- `enumDefinition`: Required. The array of allowed values.
- `enumLabels`: Optional. A map from each value to the label app builders see in the properties panel.

### Reserved Names

ToolJet adds its own properties and actions to every component, so these names are reserved: `isVisible`, `isLoading`, `setVisibility`, `setLoading` and, for a style, `boxShadow`. ToolJet also sets `isDisabled` and `setDisable` on every component, so avoid those two as well. See [Default Properties](./use-in-app-builder.md#default-properties).

## Events

```tsx
const onEnterPressed = ToolJet.useEventCallback({ name: 'onEnterPressed' });
```

Call `onEnterPressed()` in your component to fire the event. In the App Builder, the event appears under **Events** in the component properties panel. Its label comes from the name, so `onEnterPressed` is shown as "On enter pressed". To set the label yourself, add `displayName`. App builders attach handlers to it the same way they do for a built-in **Button** component's **On click** event.

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

`defaultWidth` is in grid columns and `defaultHeight` is in grid rows. Both must be positive whole numbers, or the build fails. This only sets the size when the component is dropped on the canvas. App builders can resize it afterwards. A component that sets no size is dropped 6 columns wide and 5 rows high.

Content that doesn't fit in the component's box is clipped.

## Styling and Dependencies

A component renders inline in the app page and shares the app's copy of React.

- ToolJet provides React 18 at runtime. `react`, `react-dom` and `react/jsx-runtime` are left out of your bundle, which keeps it small. Don't bundle your own copy of React.
- Every other package you import must be part of your bundle. If the built code still imports a package ToolJet doesn't provide, the component fails with `the code imports "<name>", which ToolJet does not provide`.
- CSS imported by a component is collected into `dist/index.css` and loaded automatically. It applies only inside your component, and ToolJet's global styles don't reach in.
- The app's font and theme variables are available inside your component, so it can follow the app's theme.
- Your code runs with the same access to the page as the app itself. Bundle only code you trust.

## Next Steps

See your changes live in the App Builder with [dev preview](./preview-and-publish.md#preview-changes-with-dev-mode), then publish a version.

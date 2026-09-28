---
id: use-in-app-builder
title: Use Custom Components in the App Builder
sidebar_label: Use in the App Builder
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

Once a library is published to your workspace, its components are available to every app builder in that workspace.

## Find Custom Components

Open the component library on the right and switch to the **Custom** tab. Each library appears as a collapsible section with its name and a version label. Inside each section is a card for every component, showing its display name and description.

Search in the component library matches both library names and component names.

## Add and Configure a Component

Drag a card onto the canvas. A custom component works like any built-in component. You can resize, move and rename it, and bind it to queries. The component is named after the component itself (for example, *currencyinput1*), and it is dropped at the default size the author set with `useComponentSettings`.

The inspector has four groups:

| <div style={{ width:"150px"}}> Group </div> | <div style={{ width:"400px"}}> Contents </div> |
|:---------- | :---------- |
| **Component** | Read-only details: the library, the component and the version in use. |
| **Properties** | One field for each property the author declared, pre-filled with its initial value. Properties grouped with the `section` option appear in their own accordion. |
| **Events** | One entry for each event the author declared. Attach event handlers the same way as on a built-in component. |
| **Layout** | **Show on desktop** and **Show on mobile**. |

### Exposed Variables

Every property is also an exposed variable that you can read anywhere in the app, for example `{{components.myWidget.firstName}}`. Values update live as the component changes them.

### Component Actions

Actions declared by the author appear wherever you choose component actions. For example, in a query's **Query Success** event, select **Control component** → your component → the action.

## Versions and Pinning

Each app pins one version of each library. The pinned version is saved with the app version, so it carries over when you release, clone, export or import the app.

- The first time you drop a component from a library into an app, the app pins the **latest** version.
- To change the version, open the version picker on the library header in the **Custom** tab. The list shows each version with its date, a ✓ next to the current one, and a **New** badge when a newer version exists.
- An icon on the library header tells you when the pinned version is behind the latest version.
- **Changing the version updates every component from that library in the app at once.** It only happens when you choose a version. Publishing a new version never changes a running app.
- Previewed and released apps always render the pinned version.

## Default Properties

In addition to what the author declares, ToolJet adds the same set of properties, variables and actions to every custom component. Authors don't declare these and can't remove them.

### Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"100px"}}> Type </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"200px"}}> Where It Appears </div> |
|:---------- | :---------- | :---------- | :---------- |
| **Visibility** | Toggle | `true` | Additional actions |
| **Loading state** | Toggle | `false` | Additional actions |

### Layout

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"100px"}}> Type </div> | <div style={{ width:"100px"}}> Default </div> |
|:---------- | :---------- | :---------- |
| **Show on desktop** | Toggle | `true` |
| **Show on mobile** | Toggle | `false` |

### Styles

| <div style={{ width:"150px"}}> Style </div> | <div style={{ width:"100px"}}> Type </div> | <div style={{ width:"200px"}}> Default </div> |
|:---------- | :---------- | :---------- |
| **Box shadow** | Box shadow | `0px 0px 0px 0px #00000040` |

### Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"100px"}}> Type </div> | <div style={{ width:"100px"}}> Initial Value </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:---------- | :---------- | :---------- | :---------- |
| `isVisible` | Boolean | `true` | `{{components.myWidget.isVisible}}` |
| `isLoading` | Boolean | `false` | `{{components.myWidget.isLoading}}` |

### Component Specific Actions (CSA)

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"350px"}}> Parameter </div> |
|:---------- | :---------- |
| **Set visibility** | **Value**: Toggle, defaults to `{{false}}`. |
| **Set loading** | **Value**: Toggle, defaults to `{{false}}`. |

These appear in the same action list as the author's own actions. For example, a query can show a loading spinner on a custom component without the author writing any code for it.

:::info
If a component's bundle is missing, for example because its library was deleted, the component renders as an empty box. The app still opens, and everything else keeps working.
:::

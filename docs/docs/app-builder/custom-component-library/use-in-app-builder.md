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

:::caution BETA
Custom Component Libraries are currently in beta and not recommended for production use.
:::

Once a library is published to your workspace, its components are available to every app builder in that workspace.

## Find Custom Components

Click the library picker at the top of the components panel and choose a library under Custom libraries. The panel then shows the library's **Version** and a tile for every component, with an icon or the component's initials and its display name. See [Choose a Component Library](../building-ui/component-library.md#choose-a-component-library).

A library is listed once it has a published version or a dev upload.

<!-- TODO screenshot: /img/app-builder/custom-component-library/custom-libraries-in-picker.png | img-full | alt: The library picker open in the App Builder, with a published custom library listed under Custom libraries below the libraries that ship with ToolJet | shows: a visual app in the App Builder with the library picker open: ToolJet UI 1.0, Rocket 2.0 and Ant Design, then the Custom libraries group with one published library with a realistic name; crop the canvas edge plus the panel; list only the libraries that ship -->

## Add and Configure a Component

Drag a tile onto the canvas. A custom component works like any built-in component. You can resize, move and rename it, and bind it to queries. The component is named after the component itself (for example, *currencyinput1*), and it is dropped at the default size the author set with `useComponentSettings`.

The component properties panel opens with a line that names the library and the component, and a Revision row. Below them are these sections:

| <div style={{ width:"150px"}}> Section </div> | <div style={{ width:"400px"}}> Contents </div> |
|:---------- | :---------- |
| **Properties** | One field for each property the author declared, pre-filled with its initial value. Properties grouped with the `section` option appear in a section of their own. |
| **Events** | One entry for each event the author declared. Attach event handlers the same way as on a built-in component. |
| **Validation** | Shown for field components only. |
| **Additional Actions** | **Visibility** and **Loading state**, plus **Disable** and **Dynamic height** on components that support them. |
| **Devices** | **Show on desktop** and **Show on mobile**. |

The **Styles** tab lists the style fields the author declared, then **Box shadow**.

### Exposed Variables

Every property is also an exposed variable that you can read anywhere in the app, for example `{{components.myWidget.firstName}}`. Values update live as the component changes them.

### Component Actions

Actions declared by the author appear wherever you choose component actions. For example, in a query's **Query Success** event, select **Control component** → your component → the action.

## Versions and Pinning

Each app pins one version of each library. The pinned version is saved with the app version, so it carries over when you release, clone, export or import the app.

- The first time you drop a component from a library into an app, the app pins the version the panel shows. That is the latest version, unless you picked another one.
- To change the version, pick the library in the library picker, open its **Version** picker and choose a version.
- **Changing the version updates every component from that library in the app at once.** It only happens when you choose a version. Publishing a new version never changes a running app.
- Previewed and released apps always render the pinned version.

## Default Properties

In addition to what the author declares, ToolJet adds the same set of properties, variables and actions to every custom component. Authors don't declare these and can't remove them.

### Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"100px"}}> Type </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"200px"}}> Where It Appears </div> |
|:---------- | :---------- | :---------- | :---------- |
| **Visibility** | Toggle | `true` | Additional Actions |
| **Loading state** | Toggle | `false` | Additional Actions |

Components that support them also get **Disable** and **Dynamic height** in the same section.

### Devices

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

Every component also exposes `isDisabled`.

### Component Specific Actions (CSA)

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"350px"}}> Parameter </div> |
|:---------- | :---------- |
| **Set visibility** | **Value**: Toggle, defaults to `{{false}}`. |
| **Set loading** | **Value**: Toggle, defaults to `{{false}}`. |

Every component also has a **Set disable** action.

These appear in the same action list as the author's own actions. For example, a query can show a loading spinner on a custom component without the author writing any code for it. The spinner covers the component, which stays in place underneath.

:::info
If a component's code can't be loaded, ToolJet tries again on its own. If it still can't load, the canvas shows "This component couldn't load." in its place, with a **Retry** button. The app still opens, and everything else keeps working.
:::

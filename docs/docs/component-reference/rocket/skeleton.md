---
id: skeleton
title: Skeleton
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Skeleton** component shows gray placeholder shapes where content will appear, so the page keeps its layout while data loads. Show it while a query runs and hide it when the data arrives.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Shape | Placeholder to draw. **Profile** is an avatar beside two lines, **Card** is a large block above two lines, and **Text lines** is a stack of lines. | Profile, Card, Text lines. Default: Text lines |
| Lines | Number of lines in the **Text lines** shape. Only as many as fit the component's height are drawn. | Number. Default: `3` |
| Avatar | Adds a round avatar placeholder beside the lines in the **Text lines** shape. | On or off. Default: Off |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.skeleton1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.skeleton1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.skeleton1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `shape` | Placeholder to draw. **Profile** is an avatar beside two lines, **Card** is a large block above two lines, and **Text lines** is a stack of lines. | `{{components.skeleton1.shape}}` |
| `lines` | Number of lines in the **Text lines** shape. Only as many as fit the component's height are drawn. | `{{components.skeleton1.lines}}` |
| `avatar` | Adds a round avatar placeholder beside the lines in the **Text lines** shape. | `{{components.skeleton1.avatar}}` |
| `isVisible` | Whether the component is visible. | `{{components.skeleton1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.skeleton1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.skeleton1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Placeholder color | Theme: Brand primary |
| Shade | Theme: Brand primary |
| Background | `transparent` |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).

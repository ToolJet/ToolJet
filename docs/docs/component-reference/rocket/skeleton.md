---
id: skeleton
title: Skeleton
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Skeleton** component shows gray placeholder shapes where content will appear, so the page keeps its layout while data loads. Show it while a query runs and hide it when the data arrives.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Shape | Placeholder to draw. **Profile** is an avatar beside two lines, **Card** is a large block above two lines, and **Text lines** is a stack of lines. | Profile, Card, Text lines. Default: Text lines |
| Lines | Number of lines in the **Text lines** shape. Only as many as fit the component's height are drawn. | Number. Default: `3` |
| Avatar | Adds a round avatar placeholder beside the lines in the **Text lines** shape. | On or off. Default: Off |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `shape` | Placeholder to draw. **Profile** is an avatar beside two lines, **Card** is a large block above two lines, and **Text lines** is a stack of lines. | `{{components.skeleton1.shape}}` |
| `lines` | Number of lines in the **Text lines** shape. Only as many as fit the component's height are drawn. | `{{components.skeleton1.lines}}` |
| `avatar` | Adds a round avatar placeholder beside the lines in the **Text lines** shape. | `{{components.skeleton1.avatar}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Placeholder color | Theme: Brand primary |
| Shade | Theme: Brand primary |
| Background | `transparent` |
| Border radius | — |

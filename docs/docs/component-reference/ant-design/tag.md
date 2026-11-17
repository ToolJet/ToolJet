---
id: tag
title: Tag
---

<div className="badge badge--primary">Ant Design</div>

The **Tag** component is Ant Design's tag. It shows a short colored label, such as a status, a category or a priority, and can be closed by the user.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown in the tag. | Text. Default: `Tag` |
| Color | Color of the tag. Use a status (`success`, `processing`, `warning`, `error`), a palette name such as `blue`, `gold`, `purple` or `volcano`, or any CSS color such as `#87d068`. | Text. Default: `default` |
| Bordered | Draws a border around the tag. | On or off. Default: On |
| Closable | Shows a close icon. Clicking it hides the tag until the **Reopen** action runs. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On close](../common-settings.md#events) | Triggers when the user closes the tag with its close icon. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Reopen | Shows a tag the user closed. | `components.tag1.reopen()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown in the tag. | `{{components.tag1.children}}` |
| `color` | Color of the tag. Use a status (`success`, `processing`, `warning`, `error`), a palette name such as `blue`, `gold`, `purple` or `volcano`, or any CSS color such as `#87d068`. | `{{components.tag1.color}}` |
| `bordered` | Draws a border around the tag. | `{{components.tag1.bordered}}` |
| `closable` | Shows a close icon. Clicking it hides the tag until the **Reopen** action runs. | `{{components.tag1.closable}}` |
| `closed` | `true` after the user closes the tag, until **Reopen** runs. | `{{components.tag1.closed}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

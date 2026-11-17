---
id: modal
title: Modal
---

<div className="badge badge--primary">Ant Design</div>

The **Modal** component is Ant Design's dialog. It opens over the app to confirm an action or collect input in its own components, and closes with **OK**, **Cancel** or the close button.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Trigger text | Text on the trigger button that opens the modal. | Text. Default: `Open` |
| Show trigger | Shows a button on the canvas that opens the modal. Turn it off to open the modal only with the **Show** action. | On or off. Default: On |
| Title | Heading at the top of the modal. | Text. Default: `Modal title` |
| Content | Text shown above the components in the modal body. | Text |
| OK text | Text on the OK button. | Text. Default: `OK` |
| Cancel text | Text on the Cancel button. | Text. Default: `Cancel` |
| OK type | Style of the OK button. Use `danger` for actions that delete or remove data. | `primary`, `danger`. Default: `primary` |
| Footer | Shows the OK and Cancel buttons at the bottom of the modal. | On or off. Default: On |
| Width (px) | Width of the modal. | Number. Default: `520` |
| Body height (px) | Height of the area that holds components inside the modal. Set it to `0` for a modal with no components. | Number. Default: `200` |
| Centered | Places the modal in the middle of the screen instead of near the top. | On or off. Default: On |
| Closable | Shows the close button in the top right corner. | On or off. Default: On |
| Mask closable | Closes the modal when the user clicks the dimmed area around it. | On or off. Default: On |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On ok](../common-settings.md#events) | Triggers when the user clicks the OK button. The modal closes. |
| [On cancel](../common-settings.md#events) | Triggers when the user closes the modal with Cancel, the close button, the dimmed area or the Escape key. |
| [After open](../common-settings.md#events) | Triggers when the modal has finished opening. |
| [After close](../common-settings.md#events) | Triggers when the modal has finished closing. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Show | Opens the modal. | `components.modal1.show()` |
| Hide | Closes the modal. | `components.modal1.hide()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `triggerText` | Text on the trigger button that opens the modal. | `{{components.modal1.triggerText}}` |
| `showTrigger` | Shows a button on the canvas that opens the modal. Turn it off to open the modal only with the **Show** action. | `{{components.modal1.showTrigger}}` |
| `title` | Heading at the top of the modal. | `{{components.modal1.title}}` |
| `content` | Text shown above the components in the modal body. | `{{components.modal1.content}}` |
| `okText` | Text on the OK button. | `{{components.modal1.okText}}` |
| `cancelText` | Text on the Cancel button. | `{{components.modal1.cancelText}}` |
| `okType` | Style of the OK button. Use `danger` for actions that delete or remove data. | `{{components.modal1.okType}}` |
| `footer` | Shows the OK and Cancel buttons at the bottom of the modal. | `{{components.modal1.footer}}` |
| `width` | Width of the modal. | `{{components.modal1.width}}` |
| `bodyHeight` | Height of the area that holds components inside the modal. Set it to `0` for a modal with no components. | `{{components.modal1.bodyHeight}}` |
| `centered` | Places the modal in the middle of the screen instead of near the top. | `{{components.modal1.centered}}` |
| `closable` | Shows the close button in the top right corner. | `{{components.modal1.closable}}` |
| `maskClosable` | Closes the modal when the user clicks the dimmed area around it. | `{{components.modal1.maskClosable}}` |
| `open` | `true` while the modal is open. | `{{components.modal1.open}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

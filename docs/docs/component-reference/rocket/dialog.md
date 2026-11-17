---
id: dialog
title: Dialog
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Dialog** component opens a window over the app with a title, a description, an area for other components and **Confirm** and **Cancel** buttons. Use it to confirm a risky action or to collect details in a small form without leaving the page.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Button label | Text on the button that opens the dialog. | Text. Default: `Delete account` |
| Button variant | Look of the button that opens the dialog. | `default`, `secondary`, `outline`, `destructive`. Default: `outline` |
| Title | Heading at the top of the dialog. | Text. Default: `Are you absolutely sure?` |
| Description | Text under the title, such as what the action will do. | Text. Default: `This action cannot be undone. This will permanently delete your account and remove your data.` |
| Confirm label | Text on the confirm button. | Text. Default: `Continue` |
| Cancel label | Text on the cancel button. | Text. Default: `Cancel` |
| Destructive confirm | Makes the confirm button red, for actions that delete or remove data. | On or off. Default: On |
| Components in the body | Adds an area under the description where you can drop other components, such as a form. What users type there is kept when the dialog closes. | On or off. Default: On |
| Confirm and cancel buttons | Shows the confirm and cancel buttons at the bottom of the dialog. | On or off. Default: On |
| Body height (px) | Height of the components area in pixels. | Number. Default: `240` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On close](../common-settings.md#events) | Triggers when the dialog closes for any reason. |
| [On open](../common-settings.md#events) | Triggers when the dialog opens. |
| [On confirm](../common-settings.md#events) | Triggers when the user clicks the confirm button. |
| [On cancel](../common-settings.md#events) | Triggers when the user dismisses the dialog with the cancel button, the close icon, the Escape key or a click on the backdrop. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Open | Opens the dialog. | `components.dialog1.open()` |
| Close | Closes the dialog. It fires **On close** but not **On cancel**. | `components.dialog1.close()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `triggerText` | Text on the button that opens the dialog. | `{{components.dialog1.triggerText}}` |
| `triggerVariant` | Look of the button that opens the dialog. | `{{components.dialog1.triggerVariant}}` |
| `title` | Heading at the top of the dialog. | `{{components.dialog1.title}}` |
| `description` | Text under the title, such as what the action will do. | `{{components.dialog1.description}}` |
| `confirmText` | Text on the confirm button. | `{{components.dialog1.confirmText}}` |
| `cancelText` | Text on the cancel button. | `{{components.dialog1.cancelText}}` |
| `destructive` | Makes the confirm button red, for actions that delete or remove data. | `{{components.dialog1.destructive}}` |
| `showBody` | Adds an area under the description where you can drop other components, such as a form. What users type there is kept when the dialog closes. | `{{components.dialog1.showBody}}` |
| `showFooter` | Shows the confirm and cancel buttons at the bottom of the dialog. | `{{components.dialog1.showFooter}}` |
| `bodyHeight` | Height of the components area in pixels. | `{{components.dialog1.bodyHeight}}` |
| `show` | `true` while the dialog is open. | `{{components.dialog1.show}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Button background | Theme: Surface 1 |
| Button text | Theme: Primary text |
| Dialog background | Theme: Surface 1 |
| Dialog radius | — |

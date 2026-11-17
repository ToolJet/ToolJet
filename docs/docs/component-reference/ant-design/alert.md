---
id: alert
title: Alert
---

<div className="badge badge--primary">Ant Design</div>

The **Alert** component shows a colored message box for feedback such as a success notice, a warning or an error. Users can close it when **Closable** is on, and it can carry one action button.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Message | Title line of the alert. When it is empty, **Description** is shown as the title instead. | Text. Default: `A new version is available.` |
| Description | Longer text shown under **Message**. | Text |
| Type | Color and icon of the alert. `custom` uses your own background, text and border colors, set in the **Custom alert** section. | Info, Success, Warning, Error, Custom. Default: Info |
| Show icon | Shows the type icon at the start of the alert. | On or off. Default: On |
| Closable | Shows a close button that dismisses the alert. | On or off. Default: Off |
| Banner | Shows the alert as a full-width strip with no rounded border, for a notice at the top of a page. | On or off. Default: Off |
| Action text | Text of a small button at the right of the alert. Leave it empty for no button. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On close](../common-settings.md#events) | Triggers when the alert is dismissed, by its close button or the **Dismiss** action. |
| [On action clicked](../common-settings.md#events) | Triggers when the user clicks the action button set by **Action text**. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Show | Shows the alert again after it was dismissed. | `components.alert1.show()` |
| Dismiss | Hides the alert and fires its **On close** event. Nothing happens if it is already hidden. | `components.alert1.dismiss()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `message` | Title line of the alert. When it is empty, **Description** is shown as the title instead. | `{{components.alert1.message}}` |
| `description` | Longer text shown under **Message**. | `{{components.alert1.description}}` |
| `type` | Color and icon of the alert. `custom` uses your own background, text and border colors, set in the **Custom alert** section. | `{{components.alert1.type}}` |
| `showIcon` | Shows the type icon at the start of the alert. | `{{components.alert1.showIcon}}` |
| `closable` | Shows a close button that dismisses the alert. | `{{components.alert1.closable}}` |
| `banner` | Shows the alert as a full-width strip with no rounded border, for a notice at the top of a page. | `{{components.alert1.banner}}` |
| `actionText` | Text of a small button at the right of the alert. Leave it empty for no button. | `{{components.alert1.actionText}}` |
| `dismissed` | `true` while the alert is dismissed and hidden. | `{{components.alert1.dismissed}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Background | Theme: Surface 1 |
| Text and icon color | Theme: Primary text |
| Border color | Theme: Default border |

---
id: alert
title: Alert
---

<div className="badge badge--primary">Ant Design</div>

The **Alert** component shows a colored message box for feedback such as a success notice, a warning or an error. Users can close it when **Closable** is on, and it can carry one action button.

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

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On close | Triggers when the alert is dismissed, by its close button or the **Dismiss** action. |
| On action clicked | Triggers when the user clicks the action button set by **Action text**. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Show | Shows the alert again after it was dismissed. | `components.alert1.show()` |
| Dismiss | Hides the alert and fires its **On close** event. Nothing happens if it is already hidden. | `components.alert1.dismiss()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.alert1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.alert1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.alert1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.alert1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.alert1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.alert1.isDisabled}}` |

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
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).

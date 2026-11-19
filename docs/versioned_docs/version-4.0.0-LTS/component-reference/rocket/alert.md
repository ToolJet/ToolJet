---
id: alert
title: Alert
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Alert** component shows a short message in a colored box, such as a warning, an error or a success note. It can include a button for a follow-up step and a close button.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Bold heading of the alert. | Text. Default: `Heads up` |
| Description | Text shown under the title. | Text |
| Action label | Text of a button shown under the description. The button appears only when this has a value. | Text |
| Show close button | Shows a close button in the corner that hides the alert. | On or off. Default: Off |
| Variant | Color and icon of the alert. **Info**, **Success**, **Warning** and **Destructive** use the theme's status colors; **Custom** uses the **Custom accent** style. | Default, Info, Success, Warning, Destructive, Custom. Default: Default |
| Show icon | Shows the icon that matches the **Variant**. **Default** and **Custom** have no icon. | On or off. Default: On |
| Loading look | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | Spinner, Skeleton. Default: Spinner |

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
| On action clicked | Triggers when the user clicks the action button. |
| On close | Triggers when the alert is closed, by the close button or the **Dismiss** action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set title | Changes the alert's title to **Title**. | `components.alert1.setTitle("New title")` |
| Set description | Changes the alert's description to **Description**. | `components.alert1.setDescription("New description")` |
| Set variant | Changes the alert's look to **Variant**, such as `info`, `success`, `warning` or `destructive`. | `components.alert1.setVariant("info")` |
| Show | Shows the alert again after it was closed. | `components.alert1.show()` |
| Dismiss | Hides the alert and fires **On close**. | `components.alert1.dismiss()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.alert1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.alert1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.alert1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | Bold heading of the alert. | `{{components.alert1.title}}` |
| `description` | Text shown under the title. | `{{components.alert1.description}}` |
| `actionLabel` | Text of a button shown under the description. The button appears only when this has a value. | `{{components.alert1.actionLabel}}` |
| `dismissible` | Shows a close button in the corner that hides the alert. | `{{components.alert1.dismissible}}` |
| `variant` | Color and icon of the alert. **Info**, **Success**, **Warning** and **Destructive** use the theme's status colors; **Custom** uses the **Custom accent** style. | `{{components.alert1.variant}}` |
| `showIcon` | Shows the icon that matches the **Variant**. **Default** and **Custom** have no icon. | `{{components.alert1.showIcon}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | `{{components.alert1.loadingIndicator}}` |
| `dismissed` | `true` while the alert is closed. | `{{components.alert1.dismissed}}` |
| `isVisible` | Whether the component is visible. | `{{components.alert1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.alert1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.alert1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Alert background | Theme: Surface 1 |
| Alert border color | Theme: Default border |
| Custom accent | Theme: Brand primary |
| Alert title color | Theme: Primary text |
| Alert description color | Theme: Primary text |
| Alert radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).

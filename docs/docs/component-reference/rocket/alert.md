---
id: alert
title: Alert
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Alert** component shows a short message in a colored box, such as a warning, an error or a success note. It can include a button for a follow-up step and a close button.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On action clicked](../common-settings.md#events) | Triggers when the user clicks the action button. |
| [On close](../common-settings.md#events) | Triggers when the alert is closed, by the close button or the **Dismiss** action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set title | Changes the alert's title to **Title**. | `components.alert1.setTitle("New title")` |
| Set description | Changes the alert's description to **Description**. | `components.alert1.setDescription("New description")` |
| Set variant | Changes the alert's look to **Variant**, such as `info`, `success`, `warning` or `destructive`. | `components.alert1.setVariant("info")` |
| Show | Shows the alert again after it was closed. | `components.alert1.show()` |
| Dismiss | Hides the alert and fires **On close**. | `components.alert1.dismiss()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Alert background | Theme: Surface 1 |
| Alert border color | Theme: Default border |
| Custom accent | Theme: Brand primary |
| Alert title color | Theme: Primary text |
| Alert description color | Theme: Primary text |
| Alert radius | — |

---
id: common-settings
title: Common Component Settings
---

Every component in the Rocket 2.0 and Ant Design libraries shares the settings on this page. Each component's own page lists only what is particular to it: its properties, events, actions, exposed variables and styles.

## Events

An event runs one or more actions when something happens to a component, for example running a query when a button is clicked. Add one from the **Events** section of the component's properties panel. See [Setting Up Events](/docs/app-builder/events/event-triggers) for the steps and the [Actions Reference](/docs/actions/overview) for what an event can do.

Each library names its events its own way. For example, Rocket 2.0's text input has **On enter pressed**, and Ant Design's has **On press enter**. The component's page lists the ones it has.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Fires when </div> |
|:--|:--|
| On click | The user clicks the component. |
| On double click | The user double-clicks the component. |
| On hover | The pointer moves onto the component. |
| On change | The component's value changes, by the user or by an action. |
| On focus | The component gets keyboard focus. |
| On blur | The component loses keyboard focus. |
| On select | The user selects an item, a row or a date. |
| On enter pressed, On press enter | The user presses Enter in the field. |
| On open, On close | The component opens or closes, for example a dialog or a dropdown. |

## Additional Actions

These sit in the **Additional Actions** section of the properties panel. Each one can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"180px"}}> Setting </div> | <div style={{ width:"420px"}}> What it does </div> |
|:--|:--|
| Visibility | Shows or hides the component. |
| Collapse when hidden | Removes a hidden component's space, so the components around it close the gap. |
| Loading state | Shows the component's loading look, for example while a query runs. |
| Disable | Stops the user from interacting with the component. Offered on components that can be disabled. |
| Dynamic height | Lets the component grow with its content. Offered on components that can grow. |

## Devices

| <div style={{ width:"180px"}}> Setting </div> | <div style={{ width:"420px"}}> What it does </div> |
|:--|:--|
| Show on desktop | Shows the component in the desktop layout. |
| Show on mobile | Shows the component in the mobile layout. |

## Actions on Every Component

Run these from an event handler with **Control Component**, or from a RunJS query, for example `components.button1.setDisable(true)`.

| <div style={{ width:"180px"}}> Action </div> | <div style={{ width:"420px"}}> What it does </div> |
|:--|:--|
| `setVisibility(value)` | Shows the component when `true`, hides it when `false`. |
| `setDisable(value)` | Disables the component when `true`. |
| `setLoading(value)` | Turns the loading state on or off. |

## Exposed Variables on Every Component

| <div style={{ width:"180px"}}> Variable </div> | <div style={{ width:"420px"}}> Holds </div> |
|:--|:--|
| `isVisible` | Whether the component is visible. |
| `isLoading` | Whether the component is in its loading state. |
| `isDisabled` | Whether the component is disabled. |

## Box Shadow

Every component has a **Box shadow** style under **Container** in the **Styles** tab.

Styles whose default reads **Theme:**, for example **Theme: Brand primary**, follow the app's theme until you set them. See [App Themes](/docs/app-builder/custom-theme).

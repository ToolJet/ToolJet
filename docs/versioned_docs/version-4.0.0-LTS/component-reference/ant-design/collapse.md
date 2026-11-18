---
id: collapse
title: Collapse
---

<div className="badge badge--primary">Ant Design</div>

The **Collapse** component stacks panels that users open and close by their headers, each holding its own components. Use it to tuck away optional sections of a form or page.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The panels, as a list of `{key, label}`. The label is the header text, and each panel holds the components dropped into it. | Array |
| Active key | Keys of the panels that are open. | Array. Default: `["panel1"]` |
| Accordion | Lets only one panel be open at a time. Opening a panel closes the one that was open. | On or off. Default: Off |
| Bordered | Draws a border around the panels. | On or off. Default: On |
| Ghost | Removes the background and border, so the panels blend into the page. | On or off. Default: Off |
| Size | Padding of the panel headers and bodies. | `small`, `middle`, `large`. Default: `middle` |
| Panel height (px) | Height of each panel's body, from 40 to 2000 pixels. | Number. Default: `160` |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On change | Triggers when a panel opens or closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set open panels | Opens the panels whose keys are given in **Key or keys** and closes the rest. It fires **On change** when the open panels change. | `components.collapse1.setActiveKey("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.collapse1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.collapse1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.collapse1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The panels, as a list of `{key, label}`. The label is the header text, and each panel holds the components dropped into it. | `{{components.collapse1.items}}` |
| `activeKey` | Keys of the panels that are open. | `{{components.collapse1.activeKey}}` |
| `accordion` | Lets only one panel be open at a time. Opening a panel closes the one that was open. | `{{components.collapse1.accordion}}` |
| `bordered` | Draws a border around the panels. | `{{components.collapse1.bordered}}` |
| `ghost` | Removes the background and border, so the panels blend into the page. | `{{components.collapse1.ghost}}` |
| `size` | Padding of the panel headers and bodies. | `{{components.collapse1.size}}` |
| `panelHeight` | Height of each panel's body, from 40 to 2000 pixels. | `{{components.collapse1.panelHeight}}` |
| `isVisible` | Whether the component is visible. | `{{components.collapse1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.collapse1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.collapse1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).

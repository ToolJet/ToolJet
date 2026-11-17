---
id: result
title: Result
---

<div className="badge badge--primary">Ant Design</div>

The **Result** component is Ant Design's result page. It tells users how an action ended, such as a submitted request or a failed payment, or that a page is missing or not allowed.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Status | Kind of result, which sets the icon or illustration. `success`, `info`, `warning` and `error` show an icon; `404`, `403` and `500` show an illustration for not found, no access and a server error. | `success`, `info`, `warning`, `error`, `404`, `403`, `500`. Default: `info` |
| Title | Main message. | Text. Default: `Your request was received` |
| Sub title | Smaller text under the title with details or next steps. | Text. Default: `We will email you when it is ready.` |

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

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.result1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.result1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.result1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `status` | Kind of result, which sets the icon or illustration. `success`, `info`, `warning` and `error` show an icon; `404`, `403` and `500` show an illustration for not found, no access and a server error. | `{{components.result1.status}}` |
| `title` | Main message. | `{{components.result1.title}}` |
| `subTitle` | Smaller text under the title with details or next steps. | `{{components.result1.subTitle}}` |
| `isVisible` | Whether the component is visible. | `{{components.result1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.result1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.result1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).

---
id: transfer
title: Transfer
---

<div className="badge badge--primary">Ant Design</div>

The **Transfer** component is Ant Design's two-list picker. Users tick items in one list and move them to the other, for example to choose which reports a role can see.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data source | The items, each with a unique `key` and a `title`, such as `[{ key: 'orders', title: 'Orders' }]`. An item with `disabled: true` can't be moved. | Array |
| Target keys | Keys of the items in the right-hand list. It updates as the user moves items. | Array |
| Titles | Headings of the two lists, left then right, such as `['Available', 'Selected']`. | Array. Default: `["Available", "Selected"]` |
| Show search | Shows a search box above each list that filters items by title. | On or off. Default: On |
| One way | Only lets items move to the right. Items on the right get a remove icon instead of a move back button. | On or off. Default: Off |

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
| On change | Triggers when items move between the lists. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Sets which items are on the right to the keys in the given **Value**. | `components.transfer1.setFieldValue("")` |
| Reset field | Sets the right-hand list back to the **Target keys** property. | `components.transfer1.resetFields()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.transfer1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.transfer1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.transfer1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `dataSource` | The items, each with a unique `key` and a `title`, such as `[{ key: 'orders', title: 'Orders' }]`. An item with `disabled: true` can't be moved. | `{{components.transfer1.dataSource}}` |
| `targetKeys` | Keys of the items in the right-hand list. It updates as the user moves items. | `{{components.transfer1.targetKeys}}` |
| `titles` | Headings of the two lists, left then right, such as `['Available', 'Selected']`. | `{{components.transfer1.titles}}` |
| `showSearch` | Shows a search box above each list that filters items by title. | `{{components.transfer1.showSearch}}` |
| `oneWay` | Only lets items move to the right. Items on the right get a remove icon instead of a move back button. | `{{components.transfer1.oneWay}}` |
| `value` | Keys of the items in the right-hand list, the same as **Target keys**. A **Form** reads this key. | `{{components.transfer1.value}}` |
| `isVisible` | Whether the component is visible. | `{{components.transfer1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.transfer1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.transfer1.isDisabled}}` |

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

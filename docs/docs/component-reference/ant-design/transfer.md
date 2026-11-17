---
id: transfer
title: Transfer
---

<div className="badge badge--primary">Ant Design</div>

The **Transfer** component is Ant Design's two-list picker. Users tick items in one list and move them to the other, for example to choose which reports a role can see.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data source | The items, each with a unique `key` and a `title`, such as `[{ key: 'orders', title: 'Orders' }]`. An item with `disabled: true` can't be moved. | Array |
| Target keys | Keys of the items in the right-hand list. It updates as the user moves items. | Array |
| Titles | Headings of the two lists, left then right, such as `['Available', 'Selected']`. | Array. Default: `["Available", "Selected"]` |
| Show search | Shows a search box above each list that filters items by title. | On or off. Default: On |
| One way | Only lets items move to the right. Items on the right get a remove icon instead of a move back button. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when items move between the lists. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Sets which items are on the right to the keys in the given **Value**. | `components.transfer1.setFieldValue("")` |
| Reset field | Sets the right-hand list back to the **Target keys** property. | `components.transfer1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `dataSource` | The items, each with a unique `key` and a `title`, such as `[{ key: 'orders', title: 'Orders' }]`. An item with `disabled: true` can't be moved. | `{{components.transfer1.dataSource}}` |
| `targetKeys` | Keys of the items in the right-hand list. It updates as the user moves items. | `{{components.transfer1.targetKeys}}` |
| `titles` | Headings of the two lists, left then right, such as `['Available', 'Selected']`. | `{{components.transfer1.titles}}` |
| `showSearch` | Shows a search box above each list that filters items by title. | `{{components.transfer1.showSearch}}` |
| `oneWay` | Only lets items move to the right. Items on the right get a remove icon instead of a move back button. | `{{components.transfer1.oneWay}}` |
| `value` | Keys of the items in the right-hand list, the same as **Target keys**. A **Form** reads this key. | `{{components.transfer1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

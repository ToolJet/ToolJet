---
id: rate
title: Rate
---

<div className="badge badge--primary">Ant Design</div>

The **Rate** component is Ant Design's star rating. Users give a score by clicking stars, for example to rate a supplier or a support reply.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the stars, or beside them when **Layout** is `horizontal`. | Text. Default: `Rating` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Number of stars filled at the start. It's rounded to a whole star, or a half star with **Allow half**, and capped at **Count**. | Number. Default: `0` |
| Count | Number of stars shown, from 1 to 20. | Number. Default: `5` |
| Allow half | Lets the user pick half stars. | On or off. Default: Off |
| Allow clear | Clears the rating when the user clicks the star that is already picked. | On or off. Default: On |
| Tooltips | Text shown when hovering each star, one per star, such as `['Bad', 'Poor', 'Okay', 'Good', 'Great']`. | Array |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the rating changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Sets the rating to the given **Value**. | `components.rate1.setFieldValue("")` |
| Reset field | Sets the rating back to the **Value** property. | `components.rate1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the stars, or beside them when **Layout** is `horizontal`. | `{{components.rate1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.rate1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.rate1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.rate1.layout}}` |
| `value` | Number of stars filled at the start. It's rounded to a whole star, or a half star with **Allow half**, and capped at **Count**. | `{{components.rate1.value}}` |
| `count` | Number of stars shown, from 1 to 20. | `{{components.rate1.count}}` |
| `allowHalf` | Lets the user pick half stars. | `{{components.rate1.allowHalf}}` |
| `allowClear` | Clears the rating when the user clicks the star that is already picked. | `{{components.rate1.allowClear}}` |
| `tooltips` | Text shown when hovering each star, one per star, such as `['Bad', 'Poor', 'Okay', 'Good', 'Great']`. | `{{components.rate1.tooltips}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

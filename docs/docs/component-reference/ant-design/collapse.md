---
id: collapse
title: Collapse
---

<div className="badge badge--primary">Ant Design</div>

The **Collapse** component stacks panels that users open and close by their headers, each holding its own components. Use it to tuck away optional sections of a form or page.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The panels, as a list of `{key, label}`. The label is the header text, and each panel holds the components you drop into it. | Array |
| Active key | Keys of the panels that are open. | Array. Default: `["panel1"]` |
| Accordion | Lets only one panel be open at a time. Opening a panel closes the one that was open. | On or off. Default: Off |
| Bordered | Draws a border around the panels. | On or off. Default: On |
| Ghost | Removes the background and border, so the panels blend into the page. | On or off. Default: Off |
| Size | Padding of the panel headers and bodies. | `small`, `middle`, `large`. Default: `middle` |
| Panel height (px) | Height of each panel's body, from 40 to 2000 pixels. | Number. Default: `160` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when a panel opens or closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set open panels | Opens the panels whose keys are given in **Key or keys** and closes the rest. It fires **On change** when the open panels change. | `components.collapse1.setActiveKey("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The panels, as a list of `{key, label}`. The label is the header text, and each panel holds the components you drop into it. | `{{components.collapse1.items}}` |
| `activeKey` | Keys of the panels that are open. | `{{components.collapse1.activeKey}}` |
| `accordion` | Lets only one panel be open at a time. Opening a panel closes the one that was open. | `{{components.collapse1.accordion}}` |
| `bordered` | Draws a border around the panels. | `{{components.collapse1.bordered}}` |
| `ghost` | Removes the background and border, so the panels blend into the page. | `{{components.collapse1.ghost}}` |
| `size` | Padding of the panel headers and bodies. | `{{components.collapse1.size}}` |
| `panelHeight` | Height of each panel's body, from 40 to 2000 pixels. | `{{components.collapse1.panelHeight}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

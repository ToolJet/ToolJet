---
id: dropdown
title: Dropdown
---

<div className="badge badge--primary">Ant Design</div>

The **Dropdown** component is a button that opens a menu of actions, such as Edit, Duplicate and Delete for a record.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown on the button. | Text. Default: `Actions` |
| Menu items | The menu entries, as a list of `{key, label}`. Add `danger: true` to show an entry in red, for actions that delete or remove data. | Array |
| Type | `primary` fills the button with the theme color; `default` has a border. | `default`, `primary`. Default: `default` |
| Split button | Splits the button in two: the main part runs its own action and an arrow part opens the menu. | On or off. Default: Off |
| Trigger | Whether the menu opens when the user clicks the button or hovers over it. | `click`, `hover`. Default: `click` |
| Placement | Where the menu opens relative to the button. | `bottomLeft`, `bottom`, `bottomRight`, `topLeft`, `top`, `topRight`. Default: `bottomLeft` |
| Arrow | Shows a small arrow on the menu that points at the button. | On or off. Default: Off |
| Block | Makes the button fill the width of its box. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user picks a menu entry. |
| [On button click](../common-settings.md#events) | Triggers when the user clicks the main part of a split button. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown on the button. | `{{components.dropdown1.children}}` |
| `items` | The menu entries, as a list of `{key, label}`. Add `danger: true` to show an entry in red, for actions that delete or remove data. | `{{components.dropdown1.items}}` |
| `type` | `primary` fills the button with the theme color; `default` has a border. | `{{components.dropdown1.type}}` |
| `split` | Splits the button in two: the main part runs its own action and an arrow part opens the menu. | `{{components.dropdown1.split}}` |
| `trigger` | Whether the menu opens when the user clicks the button or hovers over it. | `{{components.dropdown1.trigger}}` |
| `placement` | Where the menu opens relative to the button. | `{{components.dropdown1.placement}}` |
| `arrow` | Shows a small arrow on the menu that points at the button. | `{{components.dropdown1.arrow}}` |
| `block` | Makes the button fill the width of its box. | `{{components.dropdown1.block}}` |
| `selectedKey` | Key of the menu entry the user picked last. | `{{components.dropdown1.selectedKey}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

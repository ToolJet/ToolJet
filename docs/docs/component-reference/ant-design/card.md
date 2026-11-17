---
id: card
title: Card
---

<div className="badge badge--primary">Ant Design</div>

The **Card** component is a bordered box with a title that holds other components, such as a form section or a group of related figures.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Heading at the top of the card. Leave it empty for no header. | Text. Default: `Card title` |
| Extra | Text shown at the right of the title. | Text |
| Variant | `outlined` draws a border around the card; `borderless` uses a plain background. | `outlined`, `borderless`. Default: `outlined` |
| Size | `small` uses a shorter header and less padding. | `default`, `small`. Default: `default` |
| Hoverable | Raises the card with a shadow when the pointer is over it. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks anywhere on the card. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | Heading at the top of the card. Leave it empty for no header. | `{{components.card1.title}}` |
| `extra` | Text shown at the right of the title. | `{{components.card1.extra}}` |
| `variant` | `outlined` draws a border around the card; `borderless` uses a plain background. | `{{components.card1.variant}}` |
| `size` | `small` uses a shorter header and less padding. | `{{components.card1.size}}` |
| `hoverable` | Raises the card with a shadow when the pointer is over it. | `{{components.card1.hoverable}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

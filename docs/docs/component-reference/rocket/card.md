---
id: card
title: Card
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Card** component is a panel with a title and description that holds other components dropped into it. Use it to group related fields or figures on a page.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Heading shown at the top of the card. | Text. Default: `Card title` |
| Description | Text shown under the title. Leave it empty to hide it. | Text. Default: `Drop components into the area below.` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | Heading shown at the top of the card. | `{{components.card1.title}}` |
| `description` | Text shown under the title. Leave it empty to hide it. | `{{components.card1.description}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | Theme: Surface 1 |
| Accent | Theme: Brand primary |
| Border radius | — |
| Padding | `16` |

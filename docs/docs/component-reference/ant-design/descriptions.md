---
id: descriptions
title: Descriptions
---

<div className="badge badge--primary">Ant Design</div>

The **Descriptions** component shows a record's details as label and value pairs, such as the fields of an order or a customer profile.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The rows to show. Use a list of `{label, children}` objects, `[label, value]` pairs or one object of label and value. A row's `format` can be `number`, `currency`, `percent`, `date`, `datetime`, `boolean`, `tag` (a colored status tag) or `link`. | Array |
| Title | Heading shown above the details. | Text. Default: `Order details` |
| Extra | Text shown at the right of the title. | Text |
| Column | Number of label and value pairs per row, from 1 to 6. | Number. Default: `1` |
| Bordered | Draws the details as a table with borders and shaded label cells. | On or off. Default: Off |
| Layout | `horizontal` puts each label beside its value; `vertical` puts the label above the value. | `horizontal`, `vertical`. Default: `horizontal` |
| Size | Spacing around each pair. It shows most clearly when **Bordered** is on. | `default`, `middle`, `small`. Default: `default` |
| Currency | Currency code, such as `USD` or `EUR`, for rows with the `currency` format that don't set their own. | Text. Default: `USD` |
| Locale | Locale for number, currency and date formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Empty text | Text shown in place of an empty value. | Text. Default: `-` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The rows to show. Use a list of `{label, children}` objects, `[label, value]` pairs or one object of label and value. A row's `format` can be `number`, `currency`, `percent`, `date`, `datetime`, `boolean`, `tag` (a colored status tag) or `link`. | `{{components.descriptions1.items}}` |
| `title` | Heading shown above the details. | `{{components.descriptions1.title}}` |
| `extra` | Text shown at the right of the title. | `{{components.descriptions1.extra}}` |
| `column` | Number of label and value pairs per row, from 1 to 6. | `{{components.descriptions1.column}}` |
| `bordered` | Draws the details as a table with borders and shaded label cells. | `{{components.descriptions1.bordered}}` |
| `layout` | `horizontal` puts each label beside its value; `vertical` puts the label above the value. | `{{components.descriptions1.layout}}` |
| `size` | Spacing around each pair. It shows most clearly when **Bordered** is on. | `{{components.descriptions1.size}}` |
| `currency` | Currency code, such as `USD` or `EUR`, for rows with the `currency` format that don't set their own. | `{{components.descriptions1.currency}}` |
| `locale` | Locale for number, currency and date formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.descriptions1.locale}}` |
| `emptyText` | Text shown in place of an empty value. | `{{components.descriptions1.emptyText}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

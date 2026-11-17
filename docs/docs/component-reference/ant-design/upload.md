---
id: upload
title: Upload
---

<div className="badge badge--primary">Ant Design</div>

The **Upload** component is Ant Design's file picker. Users drop or select files, such as a CSV to import or a receipt to attach, and a query reads their contents to send them on.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Attachment` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Type | `drag` shows a drop area that fills the component; `select` shows a button that opens the file browser. | Drag area, Button. Default: Drag area |
| Text | Main text in the drop area, or the label of the button. | Text. Default: `Click or drag a file to this area` |
| Hint | Smaller text under the main text in the drop area. | Text |
| Accept | File types the picker offers, as extensions or types such as `.csv,.xlsx` or `image/*`. Leave it empty to accept any file. | Text |
| Multiple | Lets the user pick several files at once. | On or off. Default: Off |
| Max count | Most files the component holds. Extra files are turned away with a message, and with `1` a new file replaces the old one. `0` sets no limit. | Number. Default: `0` |
| List type | How picked files are listed. `picture` adds a thumbnail for images. | `text`, `picture`. Default: `text` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when files are added, removed or cleared. |
| [On remove](../common-settings.md#events) | Triggers when the user removes a file from the list. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Reset field | Removes all files. | `components.upload1.resetFields()` |
| Clear files | Removes all files. | `components.upload1.clearFiles()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.upload1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.upload1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.upload1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.upload1.layout}}` |
| `type` | `drag` shows a drop area that fills the component; `select` shows a button that opens the file browser. | `{{components.upload1.type}}` |
| `text` | Main text in the drop area, or the label of the button. | `{{components.upload1.text}}` |
| `hint` | Smaller text under the main text in the drop area. | `{{components.upload1.hint}}` |
| `accept` | File types the picker offers, as extensions or types such as `.csv,.xlsx` or `image/*`. Leave it empty to accept any file. | `{{components.upload1.accept}}` |
| `multiple` | Lets the user pick several files at once. | `{{components.upload1.multiple}}` |
| `maxCount` | Most files the component holds. Extra files are turned away with a message, and with `1` a new file replaces the old one. `0` sets no limit. | `{{components.upload1.maxCount}}` |
| `listType` | How picked files are listed. `picture` adds a thumbnail for images. | `{{components.upload1.listType}}` |
| `fileList` | The picked files, each as `{ uid, name, size, type, base64, content }`. `base64` holds the file's data, and `content` holds the text of text, CSV, JSON and XML files under 2 MB. | `{{components.upload1.fileList}}` |
| `value` | The same files as **fileList**. A **Form** reads this key. | `{{components.upload1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |

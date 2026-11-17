---
id: file-upload
title: File Upload
---

<div className="badge badge--primary">Rocket 2.0</div>

The **File Upload** component lets users drag and drop or browse for files, such as attachments, images or CSV imports. It checks each file's type and size and can turn CSV, TSV and JSON files into data.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Label shown above the drop zone. | Text. Default: `Attachments` |
| Help text | Help text shown under the label. | Text |
| Title | Main text inside the drop zone. | Text. Default: `Drag & drop files here` |
| Hint (empty: accepted types and size) | Smaller text under the title. Leave it empty to list the accepted file types, the size limit and the file limit. | Text |
| Accept file types | Comma-separated file types the user can pick, as MIME types or extensions, for example `image/*,application/pdf,.csv`. Other files are rejected with a message. | Text. Default: `image/*,application/pdf` |
| Allow multiple files | Lets the user add more than one file. When off, a new file replaces the current one. | On or off. Default: On |
| Max files | Most files the user can add when **Allow multiple files** is on. Extra files are not added. | Number. Default: `5` |
| Max size (bytes, 0 for no limit) | Largest file size accepted, in bytes. Use `0` for no limit. | Number. Default: `5242880` |
| Min size (bytes) | Smallest file size accepted, in bytes. | Number. Default: `0` |
| Show image thumbnails | Shows a thumbnail for image files in the file list instead of a file-type icon. | On or off. Default: On |
| Parse content (CSV, TSV, JSON) | Reads CSV, TSV and JSON files into data, available in each file's `parsedData`. | On or off. Default: Off |
| Parse as | How files are parsed when **Parse content** is on. **Autodetect from type** uses the file's extension and type. | Autodetect from type, CSV, TSV, JSON. Default: Autodetect from type |
| CSV delimiter | Character that separates values in CSV files when parsing. | Text. Default: `,` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On file selected](../common-settings.md#events) | Triggers when one or more files are added to the list. |
| [On file deselected](../common-settings.md#events) | Triggers when the user removes a file or the files are cleared. |
| [On file loaded](../common-settings.md#events) | Triggers when added files have finished reading and parsing. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear files | Removes all files from the list. | `components.fileupload1.clearFiles()` |
| Set file name | Renames a file and keeps its extension. Pass the file's position as **Index or updates** and the name as **New name**, or pass a list of `{ index, newFileName }` objects to rename several. | `components.fileupload1.setFileName("", "")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Label shown above the drop zone. | `{{components.fileupload1.label}}` |
| `description` | Help text shown under the label. | `{{components.fileupload1.description}}` |
| `title` | Main text inside the drop zone. | `{{components.fileupload1.title}}` |
| `hint` | Smaller text under the title. Leave it empty to list the accepted file types, the size limit and the file limit. | `{{components.fileupload1.hint}}` |
| `accept` | Comma-separated file types the user can pick, as MIME types or extensions, for example `image/*,application/pdf,.csv`. Other files are rejected with a message. | `{{components.fileupload1.accept}}` |
| `multiple` | Lets the user add more than one file. When off, a new file replaces the current one. | `{{components.fileupload1.multiple}}` |
| `maxFiles` | Most files the user can add when **Allow multiple files** is on. Extra files are not added. | `{{components.fileupload1.maxFiles}}` |
| `maxSize` | Largest file size accepted, in bytes. Use `0` for no limit. | `{{components.fileupload1.maxSize}}` |
| `minSize` | Smallest file size accepted, in bytes. | `{{components.fileupload1.minSize}}` |
| `showPreview` | Shows a thumbnail for image files in the file list instead of a file-type icon. | `{{components.fileupload1.showPreview}}` |
| `parseContent` | Reads CSV, TSV and JSON files into data, available in each file's `parsedData`. | `{{components.fileupload1.parseContent}}` |
| `parseFileType` | How files are parsed when **Parse content** is on. **Autodetect from type** uses the file's extension and type. | `{{components.fileupload1.parseFileType}}` |
| `delimiter` | Character that separates values in CSV files when parsing. | `{{components.fileupload1.delimiter}}` |
| `file` | List of the selected files. Each has `name`, `type`, `size`, `content`, `base64Data`, `dataURL`, and `parsedData` and `parseError` when **Parse content** is on. | `{{components.fileupload1.file}}` |
| `fileSize` | Total size of the selected files, in bytes. | `{{components.fileupload1.fileSize}}` |
| `isParsing` | `true` while added files are still being read and parsed. | `{{components.fileupload1.isParsing}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Dropzone background | `transparent` |
| Dropzone border color | Theme: Default border |
| Upload icon color | Theme: Placeholder text |
| Upload icon background | Theme: Surface 3 |
| Title color | Theme: Primary text |
| Hint color | Theme: Placeholder text |
| Accent (drag over, browse link) | Theme: Brand primary |
| File row background | Theme: Surface 1 |
| File row border color | Theme: Default border |
| Error color | `var(--cc-error-systemStatus)` |
| Radius | — |

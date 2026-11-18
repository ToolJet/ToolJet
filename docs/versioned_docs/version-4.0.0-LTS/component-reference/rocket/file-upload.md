---
id: file-upload
title: File Upload
---

<div className="badge badge--primary">Rocket 2.0</div>

The **File Upload** component lets users drag and drop or browse for files, such as attachments, images or CSV imports. It checks each file's type and size and can turn CSV, TSV and JSON files into data.

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

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On file selected | Triggers when one or more files are added to the list. |
| On file deselected | Triggers when the user removes a file or the files are cleared. |
| On file loaded | Triggers when added files have finished reading and parsing. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear files | Removes all files from the list. | `components.fileupload1.clearFiles()` |
| Set file name | Renames a file and keeps its extension. Pass the file's position as **Index or updates** and the name as **New name**, or pass a list of `{ index, newFileName }` objects to rename several. | `components.fileupload1.setFileName("", "")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.fileupload1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.fileupload1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.fileupload1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.fileupload1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.fileupload1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.fileupload1.isDisabled}}` |

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
| Error color | Theme: Error |
| Radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).

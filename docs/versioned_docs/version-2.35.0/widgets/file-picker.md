---
id: file-picker
title: Filepicker
---
# Filepicker

Filepicker widget allows the user to drag and drop files or upload files by browsing the filesystem and selecting one or more files in a directory.

:::info
 File types must be a valid [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) type according to input element specification or a valid file extension.

 To accept any/all file type(s), set `Accept file types` to an empty value.
:::

:::tip
[MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) type determination is not reliable across platforms. CSV files, for example, are reported as text/plain under macOS but as application/vnd.ms-excel under Windows.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"135px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Instruction text | Instruction text can be set to give information on the file picker. |
| Use drop zone | Creates a drag & drop zone. Files can be dragged and dropped to the "drag & drop" zone. |
| Use file picker | On clicking it invokes the default OS file prompt. |
| Pick multiple files | Allows drag and drop (or selection from the file dialog) of multiple files. `Pick multiple files` is disabled by default. |
| Max file count | The maximum accepted number of files The default value is `2`. |
| Accept file types | By providing types, you can make the dropzone accept specific file types and reject the others. Example: `{{"image/*,application/pdf,application/msword"}}`. |
| Max size limit | Maximum file size (in bytes). |
| Min size limit | Minimum file size (in bytes). |

:::tip
Files can be accepted or rejected based on the file types, maximum file count, maximum file size (in bytes) and minimum file size (in bytes).
If `Pick multiple files` is set to false and additional files are dropped, all files besides the first will be rejected. 
Any file that does not have a size in the range of `Max size limit` and `Min size limit` will be rejected.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On file selected | On file selected event is triggered when one or more files are selected by the selector dialogue box. |
| On file loaded | On file loaded event is triggered when a file is loaded in the browser. |
| On file deselected | On file selected event can be triggered when one or more files are removed from the picker. |

:::info
Checkout **[this](/docs/how-to/loading-image-pdf-from-db)** guide to learn how to refer or display images/PDFs using base64 string
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:-------- |:----------- |
| clearFiles() | You can clear the selected files on the filepicker component via a component-specific action within any event handler. |Employ a RunJS query to execute component-specific actions such as `await components.filepicker1.clearFiles()` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> How To Access </div> |
|:----------- |:----------- |:-------- |
| file | This variable holds the array of objects where each object represents the file loaded on the file picker component. Each object has the following keys: **name**, **type**, **content**, **dataURL**, **base64Data**, **parsedData**, **filePath**. | The values can be accesed using `{{components.filepicker1.file[0].base64Data}}`|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Options

| <div style={{ width:"135px"}}> Option </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Parse content | Parse the selected files, supports **CSV**, **xls**, and **xlsx** files. |
| File type | If **Parse content** is enabled, options to auto-detect files and parse content or parse selected file types. |

:::info
- If **Parse content** option is toggled off, **File Type** option will not be available.
- If the **Parse content** option is toggled on, it only parses the next file that is selected, not the already selected one.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:----------- |:----------- |:----------- |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`.  |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |
| Border radius | Use this property to modify the border radius of the filepicker widget. The field expects only numerical value from `1` to `100`. | By default, its value is set to `0`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>

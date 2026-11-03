---
id: file-picker
title: File Picker
---

**File Picker** component allows the user to drag and drop files or upload files by browsing the file system and selecting one or more files in a directory.

:::info
File types must be a valid [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) type according to input element specification or a valid file extension.

To accept any/all file type(s), set `Accept file types` to an empty value.
:::

:::tip
[MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) type determination is not reliable across platforms. CSV files, for example, are reported as text/plain under macOS but as application/vnd.ms-excel under Windows.
:::

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Text to display as the label for the field. | String |
| Placeholder | A hint displayed to guide the user. | String |
| Use drop zone | Creates a drag & drop zone. Files can be dragged and dropped to the "drag & drop" zone. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Use file picker | On clicking it invokes the default OS file prompt. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Allow picking multiple files | Allows drag and drop (or selection from the file dialog) of multiple files. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Enable parsing | Enable parsing to automatically convert uploaded files into usable data within your app. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| File type | Shown when **Enable parsing** is on. Choose the file type to parse: **Autodetect from extension** (default), **CSV**, **TSV**, **Microsoft Excel - xls** or **Microsoft Excel - xlsx**. | Select from dropdown or dynamically configure the value by clicking on **fx**. |
| Delimiter | Character used to separate values when parsing CSV files. Shown only when **Enable parsing** is on and **File type** is **CSV**. TSV files always use a tab, and **Autodetect from extension** always uses a comma. | String (default `,`). |

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>                              |
| :------------------------------------------ | :----------------------------------------------------------------------------- |
| On file selected                            | Triggers whenever one or more files are selected by the selector dialogue box. |
| On file loaded                              | Triggers whenever a file is loaded in the browser.                             |
| On file deselected                          | Triggers whenever one or more files are removed from the picker.               |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"110px"}}> Actions </div> | <div style={{ width:"200px"}}> Description </div>         | <div style={{ width:"150px"}}> How To Access </div> |
| :-------------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------- |
| clearFiles( )                                 | Clears the selected files from the file picker component. | `components.filepicker1.clearFiles()`               |
| clear( )                                      | Same as `clearFiles()`. Available from RunJS only. | `components.filepicker1.clear()`                    |
| setFileName( )                                | Renames selected files. Pass the file's index (starting at 0) and the new name, or an array of `{ index, newFileName }` objects to rename several files. The original extension is kept, so pass the name without it. | `components.filepicker1.setFileName(0, 'invoice')` or `components.filepicker1.setFileName([{ index: 0, newFileName: 'a' }, { index: 1, newFileName: 'b' }])` |
| setVisibility( )                              | Sets the visibility of the component.                     | `components.filepicker1.setVisibility(true)`            |
| setLoading( )                                 | Sets the loading state of the component.                  | `components.filepicker1.setLoading(true)`               |
| setDisable( )                                 | Disables the component.                                   | `components.filepicker1.setDisable(true)`               |

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div>         | <div style={{ width:"200px"}}> How To Access </div> |
| :---------------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------- |
| file                                            | Holds information of file loaded in the file picker.      | `{{components.filepicker1.file}}`                   |
| isParsing                                       | Indicates if the selected files are being parsed.         | `{{components.filepicker1.isParsing}}`              |
| isValid                                         | Indicates if the uploaded file is valid.                  | `{{components.filepicker1.isValid}}`                |
| fileSize                                        | Stores the total size of the selected files, in bytes.    | `{{components.filepicker1.fileSize}}`               |
| isMandatory                                     | Indicates if the component is mandatory.                  | `{{components.filepicker1.isMandatory}}`            |
| isLoading                                       | Indicates if the component is loading.                    | `{{components.filepicker1.isLoading}}`              |
| isVisible                                       | Indicates if the component is visible.                    | `{{components.filepicker1.isVisible}}`              |
| isDisabled                                      | Indicates if the component is disabled.                   | `{{components.filepicker1.isDisabled}}`             |
| files                                           | Holds an array of file objects loaded in the file picker. | `{{components.filepicker1.files}}`                  |
| uiErrorMessage                                  | Holds the error message currently shown in the component, for example a rejected file type or a missing mandatory file. Empty when there's no error. | `{{components.filepicker1.uiErrorMessage}}` |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Displays a 'This field is mandatory. Please select a file.' message if no file is selected. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| File type | Select the acceptable file type. | Choose from dropdown or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Min size limit | Sets the minimum file size that can be uploaded. | File size in Bytes. |
| Max size limit | Sets the maximum file size that can be uploaded. | File size in Bytes. |
| Min file count | Sets the minimum number of files that needs to be uploaded. | Numeric |
| Max file count | Sets the maximum number of files that can be uploaded. | Numeric |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Dynamic height | Automatically adjusts the component's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | Collapses the component's space when it is hidden, so surrounding components fill the space. Takes effect when the app runs (preview or released app), not on the editor canvas. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### File Drop Area

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Title | Sets the title text color. | Select a theme or choose from color picker. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Border radius | Modifies the border radius of the component. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the component.  | Select the box shadow color and adjust the related properties or programmatically set it using **fx**. |
| Padding | Sets the padding around the component. | Select **Default** or **None**. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

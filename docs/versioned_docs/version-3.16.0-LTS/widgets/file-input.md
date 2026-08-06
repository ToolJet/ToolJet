---
id: file-input
title: File Input
---

The **File Input** component lets users select files from their device using a compact input field with a **Browse** button. Unlike the File Picker, it does not include a drag-and-drop zone — it is designed for inline form use where a familiar, button-triggered file selection is preferred.

## Example Usage

A procurement team builds an internal expense management tool where employees submit reimbursement requests. The form includes a File Input component so users can attach receipts by clicking **Browse**, selecting one or more files, and submitting. The component enforces a 5 MB max file size and accepts only PDFs and images, preventing invalid uploads before they reach the backend.

## Properties

### Data

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"150px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Text displayed as the field label. | String (e.g., `Attach Receipt`). |
| Placeholder | Hint text shown in the input area when no file is selected. | String (e.g., `Click to select file`). |
| Allow uploading multiple files | Allows the user to select more than one file at a time. | Toggle (default: enabled). |
| Enable clear selection | Shows a clear (×) button inside the input area to remove the selected file(s). | Toggle (default: disabled). |
| Enable parsing | Parses the file content and makes it available as structured data. | Toggle (default: disabled). |
| File type | When **Enable parsing** is on, specifies how the file is parsed. | Select — **Autodetect from extension**, **CSV**, **Microsoft Excel – xls**, **Microsoft Excel – xlsx**, **JSON** (default: Autodetect from extension). |

## Events

| Event | Description |
| :---- | :---------- |
| On File Selected | Triggers when the user selects one or more files from the file dialog. |
| On File Loaded | Triggers when a selected file finishes loading in the browser. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions can be controlled using component-specific actions (CSA), triggered via an event or a RunJS query.

| <div style={{ width:"130px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"220px"}}> How To Access </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| clear() | Clears the currently selected file(s). | `components.fileinput1.clear()` |
| setFocus() | Moves focus to the file input component. | `components.fileinput1.setFocus()` |
| setBlur() | Removes focus from the file input component. | `components.fileinput1.setBlur()` |
| setVisibility() | Shows or hides the component. | `components.fileinput1.setVisibility(false)` |
| setDisable() | Enables or disables the component. | `components.fileinput1.setDisable(true)` |
| setLoading() | Sets the loading state of the component. | `components.fileinput1.setLoading(true)` |

## Exposed Variables

| <div style={{ width:"120px"}}> Variable </div> | <div style={{ width:"220px"}}> Description </div> | <div style={{ width:"220px"}}> How To Access </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| files | Array of file objects selected by the user. Each object includes the file name, content, and metadata. | `{{components.fileinput1.files}}` |
| isParsing | Indicates whether file content is currently being parsed. | `{{components.fileinput1.isParsing}}` |
| isValid | Indicates whether the selected file(s) pass all validation rules. | `{{components.fileinput1.isValid}}` |
| fileSize | The size of the selected file in bytes. | `{{components.fileinput1.fileSize}}` |
| isMandatory | Indicates whether the field is marked as mandatory. | `{{components.fileinput1.isMandatory}}` |
| isLoading | Indicates whether the component is in a loading state. | `{{components.fileinput1.isLoading}}` |
| isVisible | Indicates whether the component is currently visible. | `{{components.fileinput1.isVisible}}` |
| isDisabled | Indicates whether the component is currently disabled. | `{{components.fileinput1.isDisabled}}` |

## Validation

| <div style={{ width:"130px"}}> Validation Option </div> | <div style={{ width:"230px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Mark as mandatory | Displays a validation error if no file is selected on form submission. | Toggle (default: disabled). |
| File type | Restricts accepted file types using MIME types or extensions. | String (e.g., `image/*`, `.pdf`, `*/*`). Default: `*/*`. |
| Min size (Bytes) | The minimum allowed file size in bytes. | Number (default: `50`). |
| Max size (Bytes) | The maximum allowed file size in bytes. | Number (default: `51200000`, ~51 MB). |
| Min files | The minimum number of files required. Only shown when **Allow uploading multiple files** is enabled. | Number (default: `0`). |
| Max files | The maximum number of files the user can select. Only shown when **Allow uploading multiple files** is enabled. | Number (default: `2`). |

:::info
File types must be valid [MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) or file extensions. MIME type detection may vary across platforms — for example, CSV files are reported as `text/plain` on macOS and `application/vnd.ms-excel` on Windows.
:::

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Upload your expense receipt here.`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"120px"}}> Property </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"230px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Color | Sets the label text color. | Select a theme color or pick from the color picker. |
| Alignment | Controls whether the label appears above (**Top**) or beside (**Side**) the input field. | Switch — **Top** (default) / **Side**. |
| Direction | When alignment is **Side**, positions the label to the left or right of the input. | Icon toggle — Left (default) / Right. |
| Width | When alignment is **Side**, determines whether the label width adjusts automatically or uses a fixed value. | Checkbox — **Auto** (default). Uncheck to set a custom width. |
| Label width | Sets a fixed width for the label. Only available when **Side** alignment is selected and **Auto** width is unchecked. | Slider (percentage of component width). |
| Width type | Specifies whether the label width is measured relative to the whole component or just the input field. Only available when **Side** alignment is selected and **Auto** width is unchecked. | Select — **Of the Component** (default) / **Of the Field**. |

### Field

| <div style={{ width:"120px"}}> Property </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"230px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Icon | Sets the icon displayed in the **Browse** button. Toggle the visibility switch to show or hide the icon, and set the icon color using the color picker. | Icon selector with visibility toggle and color picker. |
| Background | Sets the background color of the input field. | Select a theme color or pick from the color picker. |
| Border | Sets the border color of the input field. | Select a theme color or pick from the color picker. |
| Accent | Sets the accent color used for interactive elements such as the Browse button. | Select a theme color or pick from the color picker. |
| Text | Sets the color of the selected file name text. | Select a theme color or pick from the color picker. |
| Error text | Sets the color of validation error messages displayed below the field. | Select a theme color or pick from the color picker. |
| Border radius | Rounds the corners of the input field. | Number (default: `6`). Enter a value or click **fx** to set it programmatically. |
| Box shadow | Adds a shadow effect around the input field. | Set shadow color and properties, or configure programmatically with **fx**. |

### Container

| <div style={{ width:"120px"}}> Property </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"230px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Padding | Controls the internal padding of the component. | Switch (**Default** / **None**). |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

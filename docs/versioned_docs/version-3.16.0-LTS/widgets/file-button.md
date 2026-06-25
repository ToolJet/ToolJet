---
id: file-button
title: File Button
---

**File Button** is a button component that opens the file picker dialog when clicked, allowing users to select and upload files. Once files are selected, the button label updates to show the selected file count, and the file data is made available through exposed variables for use in queries and other components.

## Example Usage

A logistics company builds an internal tool for processing bulk shipment orders. Employees click the **File Button** to upload a CSV file containing hundreds of order entries. The parsed CSV data is then bound to a table query that inserts each row into the database — eliminating manual data entry entirely.

## Properties

| Property | Description | Expected Value |
|:---------|:------------|:---------------|
| Button text | The label shown on the button before any file is selected. Updates to show file count after selection. | String (e.g., `Upload file`). Default: `Upload file`. |
| Enable multiple files | Allows users to select more than one file at a time. | Toggle on/off or use **fx** to set `{{true}}` or `{{false}}`. Default: `false`. |
| Parse file content | When enabled, ToolJet automatically reads and parses the content of selected files into structured data. | Toggle on/off or use **fx** to set `{{true}}` or `{{false}}`. Default: `false`. |
| File type | Specifies the format ToolJet uses to parse the file content. Only shown when **Parse file content** is enabled. | Select one of: `Autodetect from extension`, `CSV`, `XLS`, `XLSX`, `JSON`. Default: `Autodetect from extension`. |
| Delimiter | The character used to separate values when parsing CSV files. Only shown when **Parse file content** is enabled and **File type** is `CSV`. | String (e.g., `,` or `;`). Default: `,`. |

## Events

| Event | Description |
|:------|:------------|
| On file selected | Fires immediately when the user picks a file from the dialog, before content is read. |
| On file loaded | Fires after the file has been fully read and processed by ToolJet. |

## Component Specific Actions (CSA)

Following actions of File Button component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
|:-------------|:------------|:--------------|
| clear() | Clears all selected files and resets the button label. | Use a RunJS query: `await components.filebutton1.clear()` or trigger it using an event. |
| setFocus() | Brings focus to the file button. | Use a RunJS query: `await components.filebutton1.setFocus()` or trigger it using an event. |
| setBlur() | Removes focus from the file button. | Use a RunJS query: `await components.filebutton1.setBlur()` or trigger it using an event. |
| setVisibility() | Shows or hides the component. | Use a RunJS query: `await components.filebutton1.setVisibility(true)` or trigger it using an event. |
| setDisable() | Enables or disables the component. | Use a RunJS query: `await components.filebutton1.setDisable(true)` or trigger it using an event. |
| setLoading() | Toggles the loading spinner on the button. | Use a RunJS query: `await components.filebutton1.setLoading(true)` or trigger it using an event. |

## Exposed Variables

| Variable | Description | How To Access |
|:---------|:------------|:-------------|
| files | Array of processed file objects. Each object contains `name`, `size`, `type`, `content` (raw text), `base64Data`, `parsedValue` (structured parsed data), and `lastModified`. | `{{components.filebutton1.files}}` |
| fileSize | Total size in bytes of all currently selected files. | `{{components.filebutton1.fileSize}}` |
| isParsing | `true` while ToolJet is actively reading and parsing file content. | `{{components.filebutton1.isParsing}}` |
| isValid | `true` when the component's validation rules are satisfied (mandatory check and min file count). | `{{components.filebutton1.isValid}}` |
| isMandatory | `true` when the **Make this field mandatory** validation option is enabled. | `{{components.filebutton1.isMandatory}}` |
| isLoading | `true` when the component is in loading state. | `{{components.filebutton1.isLoading}}` |
| isVisible | `true` when the component is visible. | `{{components.filebutton1.isVisible}}` |
| isDisabled | `true` when the component is disabled. | `{{components.filebutton1.isDisabled}}` |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
|:----------------|:------------------------------------------------|:-----------------------------|
| Make this field mandatory | Marks the file selection as required. Shows an error message if the user submits without selecting a file. | Toggle on/off or use **fx**. Default: `false`. |
| File type | Restricts which file types the picker will accept. Supports MIME types and extensions. | String (e.g., `image/*`, `.pdf`, `image/png,.pdf`). Default: `*/*` (all types). |
| Min size (bytes) | The minimum allowed size for each file. Files smaller than this are rejected. | Number (e.g., `1024` for 1 KB). Default: `0`. |
| Max size (bytes) | The maximum allowed size for each file. Files larger than this are rejected. | Number (e.g., `1048576` for 1 MB). Default: `1048576`. |
| Min file count | The minimum number of files that must be selected. Only shown when **Enable multiple files** is on. | Number (e.g., `1`). Default: `1`. |
| Max file count | The maximum number of files that can be selected. Only shown when **Enable multiple files** is on. | Number (e.g., `5`). Default: `2`. |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
|:------------------|:------------|:------------------------------|
| Enable clear selection | Shows an **×** button inside the file button after files are selected, allowing users to clear the selection without clicking the button again. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. | String (e.g., `Click to upload a file`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label and Icon

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
|:---------------|:------------|:---------------|
| Label size | Sets the font size of the button label. | Number in pixels (e.g., `14`). Default: `14`. |
| Label weight | Sets the font weight of the button label. | Select `Normal`, `Medium`, or `Bold`. Default: `Medium`. |
| Label color | Sets the color of the button label text. | Select a color using the color picker or set programmatically with **fx** using a hex code. |
| Icon | Sets an icon displayed alongside the button label. | Enable icon visibility, then select the desired icon from the icon picker. |
| Icon color | Sets the color of the icon. | Select a color using the color picker or set programmatically with **fx**. |
| Icon direction | Controls whether the icon appears to the left or right of the label. | Select `Left` or `Right`. |
| Loader color | Sets the color of the loading spinner shown when the button is in loading state. | Select a color using the color picker or set programmatically with **fx**. |
| Content alignment | Controls the horizontal alignment of the button content (label and icon). | Select `Left`, `Center`, or `Right`. |

### Button

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
|:---------------|:------------|:---------------|
| Button type | Sets the visual style of the button. | Select `Solid` for a filled button or `Outline` for a transparent button with a border. Default: `Solid`. |
| Background | Sets the background color of the button. Only available when **Button type** is `Solid`. | Select a color using the color picker or set programmatically with **fx** using a hex code. |
| Border radius | Controls the roundness of the button corners. | Number in pixels (e.g., `6`). Default: `6`. |
| Box shadow | Adds a shadow effect to the button. Only available when **Button type** is `Solid`. | Use the shadow editor or set programmatically with **fx**. |
| Padding | Controls whether the button uses default padding or no padding. | Select `Default` or `None`. |

<br/>

---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

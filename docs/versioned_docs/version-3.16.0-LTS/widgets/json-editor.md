---
id: json-editor
title: JSON Editor
---

The **JSON Editor** component provides a full-featured code editor for writing and editing JSON data directly within your application. It includes syntax highlighting, code folding, bracket matching, and real-time validation, making it ideal for building configuration panels, API request builders, or any interface where users need to input structured JSON.

## Example Usage

A DevOps team builds an internal tool to manage feature flags across multiple services. The JSON Editor component lets engineers directly edit the flag configuration as JSON, with syntax highlighting and validation that immediately catches malformed input before it's saved to the database.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
|:----------- |:----------- |:----------------- |
| JSON | Sets the JSON data displayed in the editor. | A valid JSON `Object` or `Array`. |
| Theme | Sets the color theme for the editor. | Select from: `monokai`, `solarized` (default), `tomorrow`, or `bespin`. |

## Component Specific Actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setValue | Sets the JSON value of the editor. Accepts a JSON object or array. | `components.jsoneditor1.setValue({key: "value"})` |
| setLoading | Toggles the loading state of the editor. | `components.jsoneditor1.setLoading(true)` |
| setVisibility | Toggles the visibility of the editor. | `components.jsoneditor1.setVisibility(false)` |
| setDisable | Toggles the disabled state of the editor. | `components.jsoneditor1.setDisable(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:--------|:-----------|:------------|
| value | Holds the current JSON value from the editor as a parsed object. | `{{components.jsoneditor1.value}}` |
| isValid | Returns `true` if the current content is valid JSON, `false` otherwise. | `{{components.jsoneditor1.isValid}}` |
| isVisible | Returns the current visibility state of the component. | `{{components.jsoneditor1.isVisible}}` |
| isLoading | Returns the current loading state of the component. | `{{components.jsoneditor1.isLoading}}` |
| isDisabled | Returns the current disabled state of the component. | `{{components.jsoneditor1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Expand entire JSON | Controls whether the JSON tree is fully expanded or collapsed when loaded. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Dynamic height | Automatically adjusts the component's height based on its content. Only applies in the viewer mode. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Disables the component and makes the editor read-only. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display. | String (e.g., `Edit your JSON configuration here.`). |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Background | Sets the background color of the editor. | Select a color from the color picker or set it programmatically using **fx**. |
| Border color | Sets the border color of the editor container. | Select a color from the color picker or set it programmatically using **fx**. |
| Border radius | Sets the corner radius of the editor container. | Enter a numeric value (default: `6`) or set it programmatically using **fx**. |
| Box shadow | Sets the box shadow around the editor container. | Use the box shadow picker or set it programmatically using **fx**. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

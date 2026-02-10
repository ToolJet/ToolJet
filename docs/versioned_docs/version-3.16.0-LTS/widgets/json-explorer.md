---
id: json-explorer
title: JSON Explorer
---

The **JSON Explorer** component renders JSON data as a collapsible tree view within your application. It provides a read-only visualization of complex nested objects and arrays with syntax-highlighted values, making it useful for displaying API responses, debugging query results, or letting users inspect structured data without editing it.

## Example Usage

A support team uses an internal tool to look up customer details by ID. The application fetches the customer record from an API and displays the full JSON response in a JSON Explorer, allowing the support agent to quickly drill into nested fields like order history, payment methods, and preferences without building a custom UI for each data shape.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
|:----------- |:----------- |:----------------- |
| JSON | Sets the JSON data to be displayed in the tree view. | A valid JSON `Object` or `Array`. |
| Theme | Sets the color theme for the tree view. | Select from: `monokai`, `solarized` (default), `tomorrow`, or `bespin`. |

## Component Specific Actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setValue | Sets the JSON data displayed in the explorer. Accepts a JSON object or array. | `components.jsonexplorer1.setValue({key: "value"})` |
| setLoading | Toggles the loading state of the explorer. | `components.jsonexplorer1.setLoading(true)` |
| setVisibility | Toggles the visibility of the explorer. | `components.jsonexplorer1.setVisibility(false)` |
| setDisable | Toggles the disabled state of the explorer. | `components.jsonexplorer1.setDisable(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:--------|:-----------|:------------|
| value | Holds the current JSON data displayed in the explorer. | `{{components.jsonexplorer1.value}}` |
| isVisible | Returns the current visibility state of the component. | `{{components.jsonexplorer1.isVisible}}` |
| isLoading | Returns the current loading state of the component. | `{{components.jsonexplorer1.isLoading}}` |
| isDisabled | Returns the current disabled state of the component. | `{{components.jsonexplorer1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Expand entire JSON | Controls whether the JSON tree is fully expanded or collapsed on load. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show root node | Controls whether the root-level node label is shown in the tree. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Dynamic height | Automatically adjusts the component's height based on its content. Only applies in the viewer mode. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display. | String (e.g., `Inspect the API response below.`). |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Background | Sets the background color of the explorer. | Select a color from the color picker or set it programmatically using **fx**. |
| Border color | Sets the border color of the explorer container. | Select a color from the color picker or set it programmatically using **fx**. |
| Border radius | Sets the corner radius of the explorer container. | Enter a numeric value (default: `6`) or set it programmatically using **fx**. |
| Box shadow | Sets the box shadow around the explorer container. | Use the box shadow picker or set it programmatically using **fx**. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

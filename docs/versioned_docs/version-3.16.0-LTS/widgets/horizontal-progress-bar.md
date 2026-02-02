---
id: horizontal-progress-bar
title: Horizontal Progress Bar
---

The **Horizontal Progress Bar** component displays progress in a linear bar format, ideal for visualizing task completion, file uploads, or any process with a defined start and end point.

## Example Usage

A project management dashboard needs to display task completion status for multiple projects. Using the Horizontal Progress Bar component, each project shows its completion percentage with a visual bar that fills from left to right, changing color when the task reaches 100% completion.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Sets how the progress label is displayed. | Select `Auto` to show the progress percentage, or select `Custom` to display custom text. |
| Text | Custom text to display as the label. Only visible when Label is set to `Custom`. | String (e.g., `Loading files...`). |
| Progress | Sets the progress value of the component. Values are clamped between 0 and 100. | Number (e.g., `50`). |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA). You can trigger these using an event or through a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setValue      | Sets the progress value of the component. Values are automatically clamped between 0-100. | `components.progressbar1.setValue(75)` |
| setVisibility | Sets the visibility of the component. | `components.progressbar1.setVisibility(false)` |

## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
| value | Holds the current progress value of the component (0-100). | `{{components.progressbar1.value}}` |
| isVisible | Indicates if the component is visible. | `{{components.progressbar1.isVisible}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Visibility         | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. | String (e.g., `Task completion status`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Color | Sets the text color of the label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Size | Sets the font size of the label text. | Enter a value or use the slider. |
| Alignment | Sets the position of the label relative to the progress bar. | Select `side` to place the label beside the bar, or `top` to place it above the bar. |
| Width | Sets the width of the label area when alignment is set to `side`. | Enable **Auto width** to use the standard width automatically, or disable it to manually adjust using the slider. |

### Progress Bar

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Track | Sets the background color of the progress bar track. | Select a color or click on **fx** and input code that programmatically returns a Hex color code. |
| Progress track | Sets the color of the filled progress portion. | Select a color or click on **fx** and input code that programmatically returns a Hex color code. |
| Completion | Sets the color displayed when progress reaches 100%. | Select a color or click on **fx** and input code that programmatically returns a Hex color code. |
| Progress bar width | Sets the height/thickness of the progress bar. | Enter a value or use the slider. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |
| Padding | Adds padding between the component and its container boundary. | Select `Default` for standard padding or `None` to remove padding. |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

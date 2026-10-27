---
id: divider
title: Divider
---

The **Divider** component is used to add a separator between components.

## Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :-- | :-- | :-- |
| Label | Text displayed on the divider line. Leave empty for a plain line. Position it with **Label alignment** under Styles. | String (e.g., `Billing details`). |

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

## Exposed variables

There are currently no exposed variables for the component.

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String. |

## Devices

| Property | Description | Expected Value  |
| :-------------- | :-----------------| :------------------ |
| Show on desktop  | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| Property | Description | Configuration Options |
|:-------- |:----------- |:----------------------|
| Divider color | Sets the color of the divider line. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Style | Sets the style of the divider line. | Select **Solid** (default) or **Dashed**. |
| Label alignment | Sets the horizontal position of the label text on the divider. | Select **Left**, **Center** (default), or **Right**. |
| Label color | Sets the color of the label text. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text wrap | Controls whether the label text wraps onto multiple lines or stays on a single line. When set to **No wrap**, text that exceeds the divider width is truncated with an ellipsis. | Select **Wrap** (default) or **No wrap**. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust related properties or set it programmatically using **fx**. |

### Container

| Property | Description | Configuration Options |
|:-------- |:----------- |:----------------------|
| Padding | Sets the padding around the component. | Select **Default** or **None**. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::
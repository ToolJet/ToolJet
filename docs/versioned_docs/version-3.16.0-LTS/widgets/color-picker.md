---
id: color-picker
title: Color Picker
---

The **Color Picker** component allows users to select a color from a visual palette. It supports HEX and RGB color formats, optional alpha (opacity) control, and can be used as a standalone component or within a Form. In this document, we'll go through all the configuration options for the **Color Picker** component.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------- | :--------------------------------------------------- |
| Label | Text displayed as the label for the field. | String (e.g., `Color`). |
| Placeholder | A hint displayed inside the field when no color is selected. | String (e.g., `Select a color`). |
| Default value | The default color displayed when the app is loaded. Must be a valid hex code. | Hex color string (e.g., `#4368E3`). |
| Color format | Determines the format in which the selected color is displayed in the field. | `HEX` or `RGB`. |
| Show alpha | Enables the alpha (opacity) channel slider in the color picker popover. | Toggle on or off. |
| Show clear button | Displays a clear button inside the field to reset the selected color. | Toggle on or off. |

## Events

| Event | Description |
| :---- | :---------- |
| On change | Triggers whenever the user selects a new color from the color picker. |
| On focus | Triggers whenever the color picker popover is opened. |
| On blur | Triggers whenever the color picker popover is closed. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA). You can trigger them using an event or a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> How To Access </div> |
| :------------------------------------------- | :------------------------------------------------- | :-------------------------------------------------- |
| setColor() | Sets the selected color on the component. | `components.colorpicker1.setColor('#64A07A')` |
| setDisable() | Enables or disables the component. | `components.colorpicker1.setDisable(true)` |
| setLoading() | Sets the loading state of the component. | `components.colorpicker1.setLoading(true)` |
| setVisibility() | Sets the visibility of the component. | `components.colorpicker1.setVisibility(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | How To Access |
| :--------------------------------------------- | :---------- | :------------ |
| selectedColorHex | Holds the HEX code of the currently selected color. Updated whenever the user picks a color. | `{{components.colorpicker1.selectedColorHex}}` |
| selectedColorRGB | Holds the RGB value of the currently selected color. | `{{components.colorpicker1.selectedColorRGB}}` |
| selectedColorRGBA | Holds the RGBA value of the currently selected color (includes alpha/opacity). | `{{components.colorpicker1.selectedColorRGBA}}` |
| colorFormat | Reflects the currently active color format (`hex` or `rgb`). | `{{components.colorpicker1.colorFormat}}` |
| allowOpacity | Indicates whether the alpha channel is enabled. | `{{components.colorpicker1.allowOpacity}}` |
| isValid | Indicates whether the current value passes validation. | `{{components.colorpicker1.isValid}}` |
| isLoading | Indicates whether the component is in a loading state. | `{{components.colorpicker1.isLoading}}` |
| isVisible | Indicates whether the component is visible. | `{{components.colorpicker1.isVisible}}` |
| isDisabled | Indicates whether the component is disabled. | `{{components.colorpicker1.isDisabled}}` |

## Validation

| <div style={{ width:"150px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Displays a validation error if no color is selected when the form is submitted. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation | Specifies a custom validation error message for a specific condition. | Logical Expression (e.g., `{{components.colorpicker1.selectedColorHex === '#FF0000' && 'Red is not allowed'}}`). |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, typically used to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls whether the component is visible. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | Collapses the component's space when it is hidden, so surrounding components fill the space. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Disables user interaction with the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Displays an informational tooltip when the user hovers over the component. | String (e.g., `Pick a brand color`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"130px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Alignment | Sets the position of the label relative to the input field. | Click the toggle options or click on **fx** to enter a value — `side` (label and field on the same row) or `top` (label above the field). |
| Direction | When alignment is set to `side`, controls whether the label appears to the left or right of the field. | Select **Left** or **Right** using the icon toggles. |
| Width | Sets the width of the label. Available when alignment is `side`. | Enable **Auto** to use the standard width automatically, or disable it to manually set the width using the slider or **fx**. |

### Field

| <div style={{ width:"130px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Sets the background color of the input field. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Sets the border color of the input field. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Accent | Sets the accent color used for focus outlines and other interactive highlights. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text | Sets the color of the selected color value displayed inside the field. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Error text | Sets the color of the validation error message. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Rounds the corners of the input field. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the input field. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

### Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option. Select `None` to remove all padding.

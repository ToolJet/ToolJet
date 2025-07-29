---
id: range-slider
title: Range Slider
---

The **Range Slider** component allows users to select a value or a range of values by sliding a handle along a track. It’s perfect for adjusting numeric inputs like price, rating, or volume in an intuitive and interactive way.

## Properties

### Slider

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String          |
| Min value | Set the minimum value for the slider. | This field accepts any numerical value. |
| Max value | Set the maximum value for the slider. | This field accepts any numerical value. |
| Default value | Set the default value when the component loads. This can be used to pre-fill the value based on your data and requirements. | This field accepts any numerical value. |
| Step size | Choose the step size for the slider. | This field accepts any numerical value. |
| Set marks | Set marking on the slider. | Accepts an array of objects with `label` and `value` as properties. |

### Range slider

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String          |
| Min value | Set the minimum value for the slider. | This field accepts any numerical value. |
| Max value | Set the maximum value for the slider. | This field accepts any numerical value. |
| Default start value | Set the default start value when the component loads. This can be used to pre-fill the value based on your data and requirements. | This field accepts any numerical value. |
| Default end value | Set the end default value when the component loads. This can be used to pre-fill the value based on your data and requirements. | This field accepts any numerical value. |
| Step size | Choose the step size for the slider. | This field accepts any numerical value. |
| Set marks | Set marking on the slider. | Accepts an array of objects with `label` and `value` as properties. |

## Events

| Event            | Description         |
|:------------------|:---------------------|
| On change    | Triggers whenever the value is changed.   |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"130px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setValue( ) | Sets the value of the component. | `components.rangeslider1.setValue()` |
| setRangeValue( ) | Sets the range of the component. | `components.rangeslider1.setRangeValue()` |
| setVisibility( )| Sets the visibility of the component.     | `components.rangeslider1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.  | `components.rangeslider1.setLoading(true)` |
| setDisable( )   | Disables the component.                   | `components.rangeslider1.setDisable(true)` |
| reset( ) | Resets the component to default state. | `components.rangeslider1.reset()` |

## Exposed Variables

|  Variables  | Description | How To Access |
|:----------- |:----------- |:--------- |
| value | Holds the value of the slider, or an array when using range slider. | `{{components.rangeslider1.value}}` |
| label | Holds the value of the component's label. | `{{components.rangeslider1.label}}`|

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String                        |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Text     | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - `side` or `top`. |
| Width          | Sets the width of the input field. | Keep the `Auto width` option for standard width or deselect it to modify the width using the slider or through code entry in **fx** that returns a numeric value.  |

### Slider

| Property | Description | Configuration Options |
|:---------------|:------------|:---------------|
| Track | Sets the color for slider track. | Select a theme or choose from color picker. |
| Accent | Sets the accent color. | Select a theme or choose from color picker. |
| Handle | Sets the handle color. | Select a theme or choose from color picker. |
| Handle border | Sets the handle border color. | Select a theme or choose from color picker. |
| Market label | Sets the marker label color. | Select a theme or choose from color picker. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

---
id: circular-progress-bar
title: Circular Progressbar
---

The **Circular Progress bar** component can be used to show progress in a progress circle.

## Properties

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| ------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------- |
| Label | The label value shown inside the circle. | Select `Auto` to show the progress bar value, or select `Custom` to customize it. |
| Allow negative progress | Enabling this allows negative progress, making the circle move anticlockwise. | Enable or disable the toggle, or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Progress | Sets the progress of the component. | Progress value |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setValue()     | Sets the value of the circular progress bar.     | `components.circularprogressbar1.setValue` |
| setVisibility()| Sets the visibility of the component.     | `components.circularprogressbar1.setVisibility` |
| setLoading()   | Sets the loading state of the component.  | `components.circularprogressbar1.setLoading` |


## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
| value | Holds the value of the component | `{{components.circularprogressbar1.value}}` |
| isLoading | Indicates if the component is loading. | `{{components.circularprogressbar1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.circularprogressbar1.isVisible}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with the isLoading property to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip  | Provides additional information on hover. Set a display string.  | String |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Expected Value </div> |
| ----------- | ----------- | ----------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Color | Sets the text color of the label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Size | Sets the text size of the label. | Enter the value or use the slider. |
 
### Progress Circle

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
|:----------------|:------------|:--------------|
| Track | Sets the base track color of the progress circle. | Select a color or click on **fx** and input code that programmatically returns a hex color code. |
| Positive | Sets the color of the progress for positive values. | Select a color or click on **fx** and input code that programmatically returns a hex color code. |
| Negative | Sets the color of the progress for negative values. | Select a color or click on **fx** and input code that programmatically returns a hex color code. |
| Completion | Sets the color of the completed portion of the progress circle. | Select a color or click on **fx** and input code that programmatically returns a hex color code. |
| Progress bar width | Determines the thickness of the progress circle. | Enter a value or use the slider. |
| Circle ratio | Determines how much of the circle is visible (partial/full circle). | Enter a value or use the slider. |
| Alignment | Sets the horizontal alignment of the component. | Choose from left, center, or right. |
| Counter clockwise rotation | Determines the direction in which the progress moves. | Enable or disable the toggle, or dynamically configure the value by clicking on **fx** and entering a logical expression. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |
| Padding | Allows you to maintain a standard padding by enabling the `Default` option. | Choose from `Default` or `None`. |

---
id: camera
title: Camera
---

The **Camera** component allows users to capture photos and record videos directly from their camera. It provides device selection, fullscreen mode, and controls for capturing images or recording video. In this document, we'll go through all the configuration options for the **Camera** component.

## Properties
| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Content | Determines whether the component captures images or videos. | Select either `Image` or `Video` from the dropdown. |

## Events

| Event            | Description  |
|:-----------------|:---------------------------------------------|
| On recording start    | Triggers when the user starts recording video (only applicable when Content is set to Video). |
| On recording save | Triggers when the user saves the recorded video (only applicable when Content is set to Video). |
| On image save | Triggers when the user saves a captured image (only applicable when Content is set to Image). |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| resetVideo() | Clears the recorded video and resets the video data. | `components.camera1.resetVideo()` |
| resetImage() | Clears the captured image and resets the image data. | `components.camera1.resetImage()` |
| setVisibility()| Sets the visibility of the component. | `components.camera1.setVisibility(false)` |
| setDisable()   | Disables the component. | `components.camera1.setDisable(true)` |

## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
| imageDataURL | Holds the captured image as a data URL (base64 encoded). | `{{components.camera1.imageDataURL}}`|
| videoDataURL | Holds the recorded video as a data URL (base64 encoded). | `{{components.camera1.videoDataURL}}`|
| isVisible | Indicates if the component is visible. | `{{components.camera1.isVisible}}`|
| isDisabled | Indicates if the component is disabled. | `{{components.camera1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Visibility | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Capture photos or record videos.` ). |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Recorder

| <div style={{ width:"100px"}}> Style Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Text color | Sets the color of the text displayed in the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.  |
| Accent color | Sets the accent color used for buttons and controls. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.  |

### Container

| <div style={{ width:"100px"}}> Style Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background | Sets the background color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Sets the border color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Modifies the border radius of the component. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

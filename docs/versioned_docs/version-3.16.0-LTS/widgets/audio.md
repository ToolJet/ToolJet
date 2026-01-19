---
id: audio-recorder
title: Audio Recorder
---

The **Audio Recorder** component allows users to record audio directly from their microphone. It provides controls for recording, pausing, playing back, and saving audio recordings. In this document, we'll go through all the configuration options for the **Audio Recorder** component.

## Properties
| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the component.           | String (e.g., `Click to start recording`).         |

## Events

| Event            | Description  |
|:-----------------|:---------------------------------------------|
| On recording start    | Triggers when the user starts recording audio.                                 |
| On recording save | Triggers when the user saves the recorded audio. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| resetAudio() | Clears the recorded audio and resets the component to its initial state. | `components.audiorecorder1.resetAudio()` |
| setVisibility()| Sets the visibility of the component. | `components.audiorecorder1.setVisibility(false)` |
| setLoading()   | Sets the loading state of the component. | `components.audiorecorder1.setLoading(true)` |
| setDisable()   | Disables the component. | `components.audiorecorder1.setDisable(true)` |
 
## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
|  dataURL | Holds the recorded audio as a data URL (base64 encoded). | `{{components.audiorecorder1.dataURL}}` |
|  isVisible | Indicates if the component is visible. | `{{components.audiorecorder1.isVisible}}` |
|  isLoading | Indicates if the component is loading. | `{{components.audiorecorder1.isLoading}}` |
|  isDisabled | Indicates if the component is disabled. | `{{components.audiorecorder1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Record audio from your microphone.` ). |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Recorder

| <div style={{ width:"100px"}}> Style Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Icon | Allows you to select an icon for the component. | Enable the icon visibility and select icon. Alternatively, you can programmatically set it using **fx**.          |
| Icon color | Sets the color of the recorder icon. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Label text | Sets the color of the label text. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.  |
| Accent color | Sets the accent color used for the waveform and controls. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.  |

### Container

| <div style={{ width:"100px"}}> Style Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background | Sets the background color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Sets the border color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Modifies the border radius of the component. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |
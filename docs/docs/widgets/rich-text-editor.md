---
id: rich-text-editor
title: Text Editor
---

The **Text Editor** component allows users to create and format text with styling options like bold, italic, headings, links, and more. It’s ideal for capturing long-form content, notes, or descriptions with a clean, user-friendly editing experience.

## Properties

| **Property**  | **Description** | **Expected Value** |
|:-----------|:-----------|:-----------|
| Placeholder | A hint displayed to guide the user on what to enter. | String (e.g., `John Doe`) <br/> HTML(e.g., `<h1>John Doe</h1>`) |
| Default Value | The default value that the component will hold when the app is loaded. | String (e.g., `Default Text`) <br/> HTML (e,g., `<p>Hello, ToolJet!</p>`).|

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action  </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:---------|
| setValue( ) | Sets the value of the text editor. | `components.richtexteditor1.setValue()` |
| setVisibility( ) | Sets the visibility of the component. | `components.richtexteditor1.setVisibility()` |
| setLoading( )   | Sets the loading state of the component. | `components.richtexteditor1.setLoading()` |
| setDisable( )   | Disables the component. | `components.richtexteditor1.setDisable()` |


## Exposed Variables

| **Variable** | **Description** | **How To Access** |
|:-----------|:-----------|:-----------|
| value | Holds the value entered by the user in the component. | `{{components.richtexteditor1.value}}` |
| isLoading    | Indicates if the component is loading. | `{{components.richtexteditor1.isLoading}}` |
| isVisible    | Indicates if the component is visible. | `{{components.richtexteditor1.isVisible}}` |
| isDisabled   | Indicates if the component is disabled. | `{{components.richtexteditor1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip  | Provides additional information on hover. Set a display string.  | String |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| **Property** | **Description** | **Configuration Options** |
|:-----------|:-----------|:-----------|
| Visibility   | Controls component visibility. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Box-shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or programmatically set it using **fx**. |


---
id: icon
title: Icon
---

An **Icon** component can be used to add icons. It supports events like on hover and on click.

## Properties

| Properties  |  Description |
| :---------- | :----------- | 
| Icon  | Use this to choose an icon form the list of available icons. | 

## Events

|  Event  | Description    |
| :------ | :------------- |
| On hover  | Triggers whenever the cursor is hovered over the icon. |
| On click  | Triggers whenever the icon is clicked.                 |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> RunJS Query </div>|
| :------------ | :---------- | :------------ |
| click( )    | Regulate the click on the icon.  | `components.icon1.click()`      |
| setVisibility( )  | Sets the visibility of the component. | `components.icon1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.              | `components.icon1.setLoading(true)` |
| setDisable( )   | Disables the component.                               | `components.icon1.setDisable(true)` |

## Exposed Variables

| Variable | <div style={{ width:"250px"}}> Description </div> | How To Access |
|:--------|:-----------|:------------|
|  isLoading | Indicates if the component is loading. | `{{components.icon1.isLoading}}`|
|  isVisible | Indicates if the component is visible. | `{{components.icon1.isVisible}}`|
|  isDisabled  | Indicates if the component is disabled. | `{{components.icon1.isDisabled}}`|

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state  | Enables a loading spinner, often used with `isLoading` to indicate progress.    | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Visibility  | Controls component visibility.                                                  | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Disable  | Enables or disables the component.                                              | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Tooltip  | Provides additional information on hover. Set a display string.  | String   |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:----------- |:----------- |:------------- |
| Color |   Choose the Icon Color | Hex color code or choose from color picker. |
| Alignment | Set the Icon alignment | Select from left, center or right. |
| Padding | Set the padding inside the component | Choose from Default or None. |
| Box shadow | This property adds a shadow to the component. | You can use different values for box shadow property like offsets, blur, spread, and the color code. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

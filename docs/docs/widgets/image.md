---
id: image
title: Image
---

The **Image** component is used to display images in your application.

## Properties

|  <div style={{ width:"100px"}}> Properties </div> |  <div style={{ width:"100px"}}> Description </div> | 
|:----------- |:----------- |
| Image URL | Enter the URL of the image to display it on the component. |
| JS Object | Allows setting an image using a JS object with properties like name, type, size, and base64-encoded data. |
| Alternative | Used for alt text of images. |

## Events

|  <div style={{ width:"100px"}}> Event </div> |  <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On click | Triggers whenever the user clicks on an image. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of component can be controlled using the component specific actions(CSA):

| <div style={{ width:"120px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setImageURL( ) | Sets the image URL. | `components.image1.setImageURL` |
| clearImage( ) | Clears the image URL. | `components.image1.clearImage` |
| setVisibility( )| Sets the visibility of the component. | `components.image1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component. | `components.image1.setLoading(true)` |
| setDisable( )   | Disables the component.   | `components.image1.setDisable(true)` |

## Exposed Variables

| Variable | Description | How To Access |
|:-------- |:----------- |:------------ |
| imageURL | Access the image URL using this variable. | `{{components.image1.imageURL}}` |
| alternativeText | Access the alternative text using this variable. | `{{components.image1.alternativeText}}` |
| isLoading | Indicates if the component is loading. | `{{components.image1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.image1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.image1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Zoom button | Toggle this to enable zoom options inside image. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Rotate button | Toggle this on to enable rotate button in the image. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show loading state | Enables a loading spinner, often used with `isLoading` to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility  | Controls component visibility.       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable   | Enables or disables the component.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip   | Provides additional information on hover.    | String  |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Image

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | 
|:--------- |:-------- |
| Image fit | Choose an image fit - similar to object fit for the image from available options: **fill**, **cover**, **contain**, **scale-down** |
| Shape | Choose the border type for the image. |
| Alignment | Choose the image alignment from available options: **left**, **center**, **right**.  |

### Container

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | 
|:--------- |:-------- |
| Background | Add a background color to component by providing the `HEX color code` or choosing the color of your choice from the color-picker. |
| Border | Add a border color to component by providing the `HEX color code` or choosing the color of your choice from the color-picker. |
| Border radius | Add the border radius to the component. |
| Padding | Adds padding between the image and component border. |
| Box shadow      | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

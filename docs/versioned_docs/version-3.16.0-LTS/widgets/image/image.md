---
id: image
title: Image
slug: /widgets/image/
---

The **Image** component is used to display images in your application.

## Properties

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div>                                                         |
| :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| Image Format                                     | Choose how the image source is provided: **Image URL** (default) or **JS Object**. The input field below changes based on the selection. |
| Image URL                                        | Shown when Image Format is **Image URL**. Enter the URL of the image to display. |
| JS Object                                        | Shown when Image Format is **JS Object**. Provide an object in the form `{ name, type, sizeBytes, base64Data }`. The image is rendered from `type` and `base64Data` as a `data:<type>;base64,<base64Data>` URL. |
| Alternative                                      | Alternative (alt) text for the image. Also shown below the broken-image icon if the image fails to load. |

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On click                                    | Triggers whenever the user clicks on an image.    |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of component can be controlled using the component specific actions(CSA):

| <div style={{ width:"120px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setImageURL( )                               | Sets the image URL.                               | `components.image1.setImageURL('https://example.com/img.png')`                     |
| clearImage( )                                | Clears the image URL.                             | `components.image1.clearImage()`                      |
| setVisibility( )                             | Sets the visibility of the component.             | `components.image1.setVisibility(false)`            |
| setLoading( )                                | Sets the loading state of the component.          | `components.image1.setLoading(true)`                |
| setDisable( )                                | Disables the component.                           | `components.image1.setDisable(true)`                |

## Exposed Variables

| Variable        | Description                                      | How To Access                           |
| :-------------- | :----------------------------------------------- | :-------------------------------------- |
| imageURL        | The current image URL. In JS Object mode, this is the generated `data:` URL. | `{{components.image1.imageURL}}`        |
| alternativeText | Access the alternative text using this variable. | `{{components.image1.alternativeText}}` |
| isLoading       | Indicates if the component is loading.           | `{{components.image1.isLoading}}`       |
| isVisible       | Indicates if the component is visible.           | `{{components.image1.isVisible}}`       |
| isDisabled      | Indicates if the component is disabled.          | `{{components.image1.isDisabled}}`      |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                            | <div style={{ width:"250px"}}> Configuration Options </div>                                                                  |
| :------------------------------------------- | :--------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Zoom button                                  | Toggle this to enable zoom options inside image.                             | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Rotate button                                | Toggle this on to enable rotate button in the image.                         | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show loading state                           | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility                                   | Controls component visibility.                                               | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Dynamic height | Automatically adjusts the component's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | Collapses the component's space when it is hidden, so surrounding components fill the space. Takes effect when the app runs (preview or released app), not on the editor canvas. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable                                      | Enables or disables the component.                                           | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String                                                                                                                       |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Image

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div>                                                                                  |
| :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| Image fit                                   | Choose an image fit - similar to object fit for the image from available options: **fill**, **cover**, **contain**, **scale-down** |
| Shape                                       | Choose the shape of the image: **None**, **Rounded**, **Circle** or **Thumbnail**. |
| Alignment                                   | Choose the image alignment from available options: **left**, **center**, **right**.                                                |

### Container

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------| 
| Background | Add a background color to component by providing the `HEX color code` or choosing the color of your choice from the color-picker. |
| Border                                      | Add a border color to component by providing the `HEX color code` or choosing the color of your choice from the color-picker.     |
| Border radius                               | Add the border radius to the component. Available only when **Shape** is set to **None**. |
| Padding                                     | Sets the padding between the image and the component border. Choose **Default** (no padding) or **Custom**, then enter a padding value in pixels. |
| Box shadow                                  | Sets the box shadow properties of the component. Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

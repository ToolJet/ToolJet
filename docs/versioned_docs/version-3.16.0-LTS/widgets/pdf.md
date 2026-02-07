---
id: pdf
title: PDF
---

The **PDF** component can be used to embed PDF files either by URL or through Base64 code.

## Compatibility

The PDF component is compatible with the following browser versions: <br/>

| <div style={{ width:"100px"}}> Browser </div> | <div style={{ width:"100px"}}> Version </div> |
| :-------------------------------------------- | :-------------------------------------------- |
| Chrome                                        | 92 or later                                   |
| Edge                                          | 92 or later                                   |
| Safari                                        | 15.4 or later                                 |
| Firefox                                       | 90 or later                                   |

If the PDF component is integrated into your application, it will only render in supported browsers.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                        |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File URL                                       | Under this property, you can enter the URL of the PDF file to display. Base64 format is also supported, the input needs to be prefixed with `data:application/pdf;base64,`.                              |
| Scale page to width                            | The **Scale page to width** property automatically adjusts the PDF to fill the entire width of the component.                                                                                              |
| Show page controls                             | By default, when hovering over the PDF file, buttons for the previous and next page, along with the page number, are displayed. They can be toggled on or off using the **Show page controls** toggle.     |
| Show the download                              | The **Download** button on the PDF component allows you to download the PDF file. By default, **Show the download** button is enabled. Toggle it off to remove the **Download** button from the PDF component. |

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

## Exposed Variables

There are currently no exposed variables for the component.

## General

### Tooltip

To display instructional text when a user hovers over the PDF component, add some text under the Tooltip property.

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Border color | Sets the border color of the PDF viewer. | Select a color from the color picker or set it programmatically using **fx**. |
| Border radius | Sets the corner radius of the PDF viewer. | Enter a numeric value (default: `6`) or set it programmatically using **fx**. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

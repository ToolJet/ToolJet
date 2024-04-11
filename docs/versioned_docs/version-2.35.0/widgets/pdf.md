---
id: pdf
title: PDF
---

# PDF

The PDF component can be used to embed PDF files either by URL or through Base64 code.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Compatibility

The PDF component is compatible with the following browser versions: <br/>

| <div style={{ width:"100px"}}> Browser </div> | <div style={{ width:"100px"}}> Version </div> |
|:--------|:--------------------|
| Chrome  | 92 or later         |
| Edge    | 92 or later         |
| Safari  | 15.4 or later       |
| Firefox | 90 or later         |


If the PDF component is integrated into your application, it will only render in supported browsers.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:------------|
| File URL | Under this property, you can enter the URL of the PDF file to display. Base64 format is also supported, the input needs to be prefixed with `data:application/pdf;base64,`. |
| Scale page to width | The `Scale page to width` property automatically adjusts the PDF to fill the entire width of the component. |
| Show page controls | By default, when hovering over the PDF file, buttons for the previous and next page, along with the page number, are displayed. They can be toggled on or off using the `Show page controls` toggle. |
| Show the download | The `Download` button on the PDF component allows you to download the PDF file. By default, `Show the download` button is enabled. Toggle it off to remove the `Download` button from the PDF component. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

To display instructional text when a user hovers over the PDF component, add some text under the Tooltip property.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property   </div>       | <div style={{ width:"100px"}}>  Description           </div>                    | <div style={{ width:"135px"}}>  Expected Value </div>   |
| :-------------- | :---------------------------------------- | :------------------ |
| Show on desktop | Display the component in Desktop view. | Programmatically determine the value by clicking on `fx` or use the toggle switch |
| Show on mobile  | Display the component in Mobile view.  | Programmatically determine the value by clicking on `fx` or use the toggle switch |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}>  Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:------------ |:-------------|:--------- |
| Visibility | Toggle the `Visibility` condition on or off to control the visibility of the component. You can also programmatically change its value by clicking on the `fx` button next to it. If `{{false}}` the component will not be visible after the app is deployed. | By default, it's set to `{{true}}` |

:::info
Checkout **[this](/docs/how-to/loading-image-pdf-from-db)** guide to learn how to display images/PDFs using base64 string
:::

</div>
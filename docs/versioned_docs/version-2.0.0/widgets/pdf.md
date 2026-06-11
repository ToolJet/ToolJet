---
id: pdf
title: PDF
---

# PDF

PDF widget can be used to embed the PDF file either by URL or as a Base64 encoded.

:::info
Checkout **[this](/docs/2.0.0/how-to/loading-image-pdf-from-db)** guide to learn how to display images/PDFs using base64 string
:::

## Properties

### File URL

The URL of the PDF file on the web. `data:application/pdf;base64,` format is supported and the input needs to be prefixed with `data:application/pdf;base64,`

### Scale page to width

It can be toggled to adjust the PDF content to fit the width or height of the component

### Show page controls

By default, page number, previous & next button is displayed while hovering the PDF file. It can be toggled on or off.

### Show the download

The `Download` button on the PDF component allows you to download the pdf file. By default, Show the download button is enabled. Toggle it off to remove the `Download` button from PDF component, you can also click on the `Fx` button to set the values `{{true}}` or `{{false}}` dynamically.

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - PDF" />

</div>

## Layout

| Layout          | description                               | Expected value                                                                                                |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

| Style      | Description                                                                                                                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

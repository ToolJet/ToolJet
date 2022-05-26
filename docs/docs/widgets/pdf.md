---
id: pdf
title: PDF
---

# PDF

PDF widget can be used to embed the PDF file either by URL or as a Base64 encoded.

## Properties

### File URL

The URL of the PDF file on the web. `data:application/pdf;base64,` format is supported and the input needs to be prefixed with `data:application/pdf;base64,`

### Scale page to width

It can be toggled to adjust the PDF content to fit the width or height of the component

### Show page controls

By default, page number, previous & next button is displayed while hovering the PDF file. It can be toggled on or off.

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

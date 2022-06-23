---
id: text
title: Text
---
# Text

Text widget can be used to display text.

:::info
Users cannot enter and edit text.
::: 

## How To Use Text Widget

<iframe height="500" src="https://www.youtube.com/embed/mcjYKw2VeAI" title="Text Widget" frameborder="0" allowfullscreen width="100%"></iframe>


## Properties

### Text

This property sets the content/text inside the Text widget. Refer your query data with dynamic variables `{{queries.datasource.data.text}}` or populate it with sample values `Text goes here !`.

### Show loading state

Toggle `on` or `off` to show or hide the loading state. You can also click on the `Fx` next to it to set the value `{{true}}` and `{{false}}` dynamically. Shows a loading status if the value is `true`. This property is often used with the `isLoading` property of queries so that the table shows a spinner while the query is being run. Default value is `false`.

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Text color

Change the color of the text by providing the `Hex color code` or choosing a color from the picker.

### Align text

You can align the text inside the widget in following ways:
- Left
- Right
- Center
- Justified

### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.
### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::
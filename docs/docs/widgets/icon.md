---
id: icon
title: Icon
---
# Icon

Icon widget allows you to add an icon from a set of icons in your app.

## Properties

### Icon

This property sets a selected icon. Click on the button to get a list of icons which Tooljet supports. You can search and select the icon by clicking on it.


### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.


### Event: On click, On hover

To add an event to an icon, click on the widget handle to open the widget properties on the right sidebar. Go to the **Events** section and click on **Add handler**.

**On Click** event is triggered when the icon is clicked. Just like any other event on ToolJet, you can set multiple handlers for on click event.

**On Hover** event is triggered when the icon is hovered. Just like any other event on ToolJet, you can set multiple handlers for on click event.

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::

### General
#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the 
mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. 
Now hovering over the widget will display the string as the tooltip.

### Layout


#### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

#### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

| Style      | Description |
| ----------- | ----------- | 
| Icon Color |  You can change the color of the icon by entering the Hex color code or choosing a color of your choice from the color picker. |




:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::
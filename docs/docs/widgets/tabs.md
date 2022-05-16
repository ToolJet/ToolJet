---
id: tabs
title: Tabs
---
# Tabs

A Tabs widget contains a number of defined containers that can be navigated through the tabs. Each tab acts as a container and can have different components or widgets.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Tabs](/img/widgets/tabs/tabs.png)

</div>

## Properties

### Tabs

This property lets you add and remove containers from the tabs widget. Each container in the tab has its unique `id` and `title`. This field expects an array of objects.

### Default tab

This property selects the container in the tab which matches the corresponding `id`. By default, the value is set to `0`. 

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Highlight Color

You can change the highlight color of the selected tab by entering the Hex color code or choosing a color of your choice from the color picker.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::
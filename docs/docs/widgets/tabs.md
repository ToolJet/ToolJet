---
id: tabs
title: Tabs
---

# Tabs

A Tabs widget contains a number of defined containers that can be navigated through the tabs. Each tab acts as a <a href="https://docs.tooljet.com/docs/widgets/tabs/" target="_blank">container</a> that can have different widgets placed inside it.

## How To Use Tabs Widget

<iframe height="500" src="https://www.youtube.com/embed/YmAhpO4Ku5w" title="Tabs Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Tabs

This property lets you add and remove containers from the tabs widget. Each container in the tab has its unique `id` , `title` and `disabled` for disabling individual tabs . This field expects an array of objects.

`{{[ { title: 'Home', id: '0' }, { title: 'Profile', id: '1',disabled:'true' }, { title: 'Settings', id: '2' } ]}}`

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

### Tab width

You have 2 options auto and equally split.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

---
id: pagination
title: Pagination
---
# Pagination

Pagination enables the user to select a specific page from a range of pages. It is used to separate the content into discrete pages.

:::tip
You can club pagination widget with the List View widget.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/pagination/pagination.png" alt="ToolJet - Widget Reference - Pagination" />

</div>

## Properties

### Number of pages

You can use this to predefined the total number of pages. It is calculated by dividing the length of the data array that will be passed, by the data limit which is the number of posts we will show on each page. 

### Default page index
It is used to set and display the default page index when the app initially loads. You can also put a conditional logic to set its value as per your use case.

## Event 

### On Page Change

This event is triggered whenever the user switches to another page index. You can explore various actions associated with this event as per app logic.

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Pagination" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed Variables

| Variables    | Description |
| ----------- | ----------- |
| totalPages | This variable holds the value of the `Number of Pages` set from the pagination component properties. You can access the value dynamically using JS: `{{components.pagination1.totalPages}}`|
| currentPageIndex | This variable will hold the index of the currently selected option on the pagination component. You can access the value dynamically using JS: `{{components.pagination1.currentPageIndex}}`|

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
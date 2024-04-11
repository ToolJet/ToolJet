---
id: pagination
title: Pagination
---
# Pagination

Pagination enables the user to select a specific page from a range of pages. It is used to separate the content into discrete pages.

:::tip
You can club pagination widget with the List View widget.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | 
|:------------ |:-------------|
| Number of pages | You can use this to predefined the total number of pages. It is calculated by dividing the length of the data array that will be passed, by the data limit which is the number of posts we will show on each page. |
| Default page index | It is used to set and display the default page index when the app initially loads. You can also put a conditional logic to set its value as per your use case. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Event 

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------------|:---------------------|
| On Page Change | This event is triggered whenever the user switches to another page index. You can explore various actions associated with this event as per app logic. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div>|
|:----------- |:----------- |:--------- |
| totalPages | This variable holds the value of the `Number of Pages` set from the pagination component properties. | Access the value dynamically using JS: `{{components.pagination1.totalPages}}`. |
| currentPageIndex | This variable will hold the index of the currently selected option on the pagination component. | Access the value dynamically using JS: `{{components.pagination1.currentPageIndex}}`. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}>  Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:------------ |:-------------|:--------- |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. | By default, it's set to `{{true}}`. |
| Disable | This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>
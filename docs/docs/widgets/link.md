---
id: link
title: Link
---

The **Link** component allows you to add a hyperlink and navigate to the external URL.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:----------- |:----------- |:-------------- |
| Link target | This property sets the URL where the user needs to be taken on clicking the link. | example: `https://dev.to/tooljet` or `{{queries.xyz.data.url}}`. | 
| Link text | This property sets the text for the Link component.  | example: **Click here** or **Open webpage**. | 
| Target type | This property specifies the link to be opened in the same tab or new tab on clicking the link. | Options: **New Tab** & **Same Tab**. |

</div>

<div style={{paddingTop:'24px'}}>

## Events

|  <div style={{ width:"100px"}}> Event </div> |  <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On click | Triggered when the link is clicked. |
| On hover | Triggered when the cursor hovers over the link. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

The following actions of the link component can be controlled using the component-specific actions(CSA):

| <div style={{ width:"100px"}}> Actions  </div>   | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:------------ |
| click | Triggers click action of the link component. | Employ a RunJS query to execute component-specific actions such as `await components.link1.click()` or trigger it using an event. |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the **General** accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

----

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- | 
| Text color |  You can change the background color of the text by entering the Hex color code or choosing a color of your choice from the color picker. |
| Text size | By default, the text size is set to 14. You can enter any value from 1-100 to set a custom text size. |
| Underline | You can change the underline of the text in the following ways: **on-hover (default), never, always**. |
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>

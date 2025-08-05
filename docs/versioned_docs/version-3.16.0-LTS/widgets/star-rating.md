---
id: star-rating
title: Star Rating
---
# Star Rating

The **Star Rating** component can be used to display as well as input ratings. The component supports half stars, and the number of stars can be set too.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:------------ |:-------------|:---------- |
| Label | The text to be used as the label for the star rating. | This field expects a `String` value. |
| Number of stars | Initial number of stars in the list on initial load. `default: 5`. | This field expects an integer value. |
| Default no of selected stars | This property specifies the default count of stars that are selected on the initial load. `default: 5` (integer). | This field expects an integer value. |
| Enable half star | Toggle `on` to allow selection of half stars. `default: false` (bool). | Click on **fx** to programmatically define the value `{{true}}` or `{{false}}`. |
| Tooltips | This is used for displaying informative tooltips on each star, and it is mapped to the index of the star. | `default: []` (array of strings ). |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On change | Triggers whenever the user clicks a star. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| value |Holds the value entered by the user whenever a rating is added on the component. | Accessible dynamically with JS (for e.g., `{{components.starrating1.value}}`).|

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}>  Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:------------ |:-------------|:--------- |
| Star Color | Display color of the star. Change color by providing `Hex color code` or choosing one from the picker. | `default: #ffb400` (color hex). |
| Label color | Change the color of label in component by providing `Hex color code` or choosing one from the picker. |  |
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed. | By default, it's set to `{{true}}`. |
| Disable | This is `off` by default, toggle `on` the switch to lock the component and make it non-functional. You can also programmatically set the value by clicking on the **fx** button next to it. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

</div>

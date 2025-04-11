---
id: date-range-picker
title: Date-range Picker
---

The **Date-Range Picker** component allows users to select a range of dates.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"135px"}}> Property  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Default start date | Set the start date to be selected by default in the component. |
| Default end date | Set the start date to be selected by default in the component. |
| Format | The format of the date selected by the date picker. Default date format is **DD/MM/YYYY**. Date format should be followed as ISO 8601 as mentioned in the [moment documentation](https://momentjs.com/docs/). |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On select | Triggers whenever a start date or end date is selected in the date range picker component. |

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

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| endDate | Holds the date selected as the end date in the component. | Accessible dynamically with JS (e.g., `{{components.daterangepicker1.endDate}}`). |
| startDate | Holds the date selected as the start date in the component. | Accessible dynamically with JS (e.g., `{{components.daterangepicker1.startDate}}`). |

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

---

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Border radius | This is to modify the border radius of the date range picker. The field expects only numerical value from `1` to `100`. | By default, it's set to `0`. |
| Visibility | This is to control the visibility of the component. If `{{false}}` the component will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>

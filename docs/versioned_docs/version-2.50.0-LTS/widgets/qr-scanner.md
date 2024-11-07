---
id: qr-scanner
title: QR Scanner
---
# QR Scanner
Scan QR codes using device camera and hold the data they carry.

:::note Known Issue
You might have to stick to the Safari browser in IOS as camera access is restricted for third-party browsers.
:::

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------------|:---------------------|
| On detect | Triggers whenever the component successfully scans a QR code. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

:::caution Debugging tip

Browser camera APIs restrict this component to only work in either `localhost` or `https`.

So if you're testing it out, be sure to either use `localhost` or `https`.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div>|
|:----------- |:----------- |:--------- |
| lastDetectedValue | Holds the data from the last QR code scanned by the component.  | Accessible dynamically with JS (for e.g., `{{components.qrscanner1.lastDetectedValue}}`). |

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the 
mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. 
Now hovering over the component will display the string as the tooltip.

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
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed. | By default, it's set to `{{true}}`. |
| Disable | This is `off` by default, toggle `on` the switch to lock the component and make it non-functional. You can also programmatically set the value by clicking on the **fx** button next to it. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

</div>

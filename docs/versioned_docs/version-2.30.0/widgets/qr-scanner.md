---
id: qr-scanner
title: QR Scanner
---
# QR Scanner
Scan QR codes using device camera and hold the data they carry.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/qr-scanner/qr-scanner.jpeg" alt="ToolJet - Widget Reference - QR Scanner" />

</div>

:::note Known Issue
You might have to stick to the Safari browser in IOS as camera access is restricted for third-party browsers.
:::

## Exposed variables
### lastDetectedValue

This variable holds the data contained in the last QR code scanned by the widget. To fetch the data use `{{components.qrscanner1.lastDetectedValue}}`.

## Events
### onDetect

This event is fired whenever the widget successfully scans a QR code.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

:::caution Debugging tip

Browser camera APIs restrict this widget to only work in either `localhost` or `https`.

So if you're testing it out, be sure to either use `localhost` or `https`.
:::

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the 
mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. 
Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - QR Scanner" />

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

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

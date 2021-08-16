---
sidebar_position: 1
---

# QR Scanner
Scan QR codes using device camera and hold the data they carry. 
<img class="screenshot-full" src="/img/widgets/qr-scanner/qr-scanner.jpeg" alt="ToolJet - QR Scanner" height="420"/>

#### Known issue: 
In IOS, you might have to stick to the Safari browser as camera access had been restricted for third party browsers.

## Properties
#### active
This is a code block that must return `true` for the QR Scanner to be active, otherwise, the widget won't be displayed. This property can be used to enable/disable the widget.

## Exposed variables
#### lastDetectedValue
This variable holds the data contained in the last QR code scanned by the widget.

## Events
#### onDetect
This event is fired whenever the widget successfully scans a QR code.

## Debugging tip
Browser camera APIs restrict this widget to only work in either `localhost` or `https`.

So if you're testing it out, be sure to either use `localhost` or `https`.


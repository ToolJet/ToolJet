---
id: image
title: Image
---
# Image

Image widget is used to display images in your app.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/image/image.png" alt="ToolJet - Widget Reference - Image" />

</div>

## Events

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/image/events.png" alt="ToolJet - Widget Reference - Image" />

</div>

### On click

On click event is triggered when an image is clicked.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Properties

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/image/props.png" alt="ToolJet - Widget Reference - Image" />

</div>

### URL
Enter the URL of the image to display it on the widget.

### Loading state
Loading state can be used to show a spinner as the image content. Loading state is commonly used with `isLoading` property of the queries to show a loading status while a query is being run. Switch the toggle **On** or click on `fx` to programmatically set the value `{{true}}` or `{{false}}`.

### Alternative text
Used for alt text of images.

### Zoom buttons
Toggle this to enable zoom options inside image.

### Rotate buttons
Toggle this on to enable rotate button in the image.

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Image" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}`.

### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border type
Choose a border type for the image from available options:
- **None**
- **Rounded**
- **Circle**
- **Thumbnail**

### Image fit
Choose a image fit - similar to object fit for the image from available options:
- **fill**
- **cover**
- **contain**
- **scale-down**

### Background color
Add a background color to widget by providing the `HEX color code` or choosing the color of your choice from the color-picker.

### Padding
Adds padding between the image and widget border. It accepts any numerical value from `0` to `100`.

### Visibility
Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable
This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed variables

There are currently no exposed variables for the component.

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

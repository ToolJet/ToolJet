---
id: icon
title: Icon 
---

An Icon widget can be used to add icons(sourced from icon library). It supports events like on hover and on click.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/icon/icon.png" alt="ToolJet - Widget - Icon" />

</div>

## Properties

| Properties  | description | Expected value |
| ----------- | ----------- | -------------- |
| Icon | Use this to choose an icon form the list of available icons | You can also use the search bar in it to look for the icons | 

## Events

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/icon/events.png" alt="ToolJet - Widget - Icon" />

</div>

To add an event, click on the icon widget's configuration handle to open the widget properties on the components drawer on the right. Go to the **Events** section and click on **+ Add handler**.

The Icon widget supports the following events:

| Event  | Description |
| ----------- | ----------- |
| On hover      | This event is triggered when the cursor is hovered over the icon|
| On click      | This event is triggered when the icon is clicked |

Just like any other event on ToolJet, you can set multiple handlers for any of the above-mentioned events.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General

<b>Tooltip:</b> Set a tooltip text to specify the information when the user moves the mouse pointer over the widget.

## Devices

| Property  | description | Expected value |
| ----------- | ----------- | ------------ |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.   |

## Styles

| Style      | Description | Expected value |
| ----------- | ----------- | ------------- |
| Icon color |  You can change the color of the icon widget by entering the Hex color code or choosing a color of your choice from the color picker. |
| Visibility | This is to control the visibility of the widget. | If `{{false}}` the widget will not visible after the app is deployed. | It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`. |
| Box shadow | This property adds a shadow to the widget. | You can use different values for box shadow property like offsets, blur, spread, and the color code. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed variables

There are currently no exposed variables for the component.

## Component specific actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| Actions     | Description | How to Access |
| ----------- | ----------- | ------------- |
| setVisibility() | Sets the visibility of the component. | Employ a RunJS query (for e.g., `await components.icon1.setVisibility(false))` or trigger it using an event. |
| click() | Triggers the click action on the component.  | Employ a RunJS query (for e.g., `await components.icon1.click())` or trigger it using an event. |

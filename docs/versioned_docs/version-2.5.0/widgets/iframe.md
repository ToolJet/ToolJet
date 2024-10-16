---
id: iframe
title: Iframe
---

# Iframe

Iframe component is used to embed another HTML page into the current one and display iframes in your app.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/iframe/iframe.png" alt="ToolJet - Widget Reference - Iframe" />

</div>

## Properties

### URL

Set the **URL** of the page to embed.

### General

#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Iframe" />

</div>

## Layout

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/iframe/layout.png" alt="ToolJet - Widget Reference - Iframe" />

</div>

### Show on desktop

Toggle on or off to display the component in desktop view. You can programmatically determine the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`.

### Show on mobile

Toggle on or off to display the component in mobile view. You can programmatically determine the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`.

## Styles

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/iframe/styles.png" alt="ToolJet - Widget Reference - Iframe" />

</div>

### Visibility

Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the component and make it non-functional. You can also programmatically set the value by clicking on the **fx** button next to it. If set to `{{true}}`, the component will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

## Exposed variables

There are currently no exposed variables for the component.

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

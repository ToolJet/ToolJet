---
id: container
title: Container
---
# Container

Containers are used to group widgets together. You can move the desired number of widgets inside a container to organize your app better.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/container/container.gif" alt="ToolJet - Widget Reference - Container" />

</div>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers themouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Container" />

</div>

## Layout

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/container/layout.png" alt="ToolJet - Widget Reference - Container" />

</div>

| Layout      | description |
| ----------- | ----------- |
| Show on desktop | This property have toggle switch. If enabled, the Container widget will display in the desktop view else it will not appear. This is enabled by default.|
| Show on mobile | This property have toggle switch. If enabled, the Container wisget will display in the mobile view else it will not appear.|

## Styles

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/container/styles.png" alt="ToolJet - Widget Reference - Container" />

</div>

| Style      | Description |
| ----------- | ----------- |
| Background Color |  You can change the background color of the Container by entering the `Hex color code` or choosing a color of your choice from the color picker. |
| Border radius | Use this property to modify the border radius of the container. The field expects only numerical value from `1` to `100`, default is `0`. |
| Border Color |  You can change the border color of the Container by entering the `Hex color code` or choosing a color of your choice from the color picker. |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`. |
| Disable |  This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |


:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed variables

There are currently no exposed variables for the component.

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
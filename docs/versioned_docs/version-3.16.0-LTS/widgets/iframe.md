---
id: iframe
title: Iframe
---

The **IFrame** component allows you to embed external content from other websites or applications directly within your ToolJet application. This component is useful for integrating third-party services, displaying external web pages, or embedding multimedia content.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| URL                                            | The URL of the external content to be embedded in the iframe. | String (e.g., `https://example.com`).    |

## Events

The IFrame component currently does not have any event handlers.

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action </div> |   <div style={{ width:"200px"}}> Description </div>   |  <div style={{width: "150px"}}> How To Access </div>  |
| :------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------- |
| setUrl()                                     | Sets the URL of the iframe to display different content dynamically. | `components.iframe1.setUrl('https://example.com')` |

## Exposed Variables

The IFrame component currently does not expose any variables.

## General

#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
| :------------------------------------------ | :------------------------------------------------ | :-------------------------------------------------- |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

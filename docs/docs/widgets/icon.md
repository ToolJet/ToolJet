---
id: icon
title: Icon
---

An **Icon** component can be used to add icons(sourced from icon library). It supports events like on hover and on click.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div>           | <div style={{ width:"135px"}}> Expected Value </div>        |
| :----------------------------------------------- | :---------------------------------------------------------- | :---------------------------------------------------------- |
| Icon                                             | Use this to choose an icon form the list of available icons. | You can also use the search bar in it to look for the icons. |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>      |
| :------------------------------------------ | :----------------------------------------------------- |
| On hover                                    | Triggers whenever the cursor is hovered over the icon. |
| On click                                    | Triggers whenever the icon is clicked.                 |

Just like any other event on ToolJet, you can set multiple handlers for any of the above-mentioned events.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"135px"}}> Description </div>  | <div style={{ width:"135px"}}> How To Access </div>  |
| :-------------------------------------------- | :------------------------------------------------- | :--------------------------------------------------- |
| setVisibility()                                 | Sets the visibility of the component. | Employ a RunJS query (for e.g., `await components.icon1.setVisibility(false)`) or trigger it using an event. |
| click()                                         | Regulate the click on the icon.  | Employ a RunJS query (for e.g., `await components.icon1.click()`) or trigger it using an event.              |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px'}}>

## General

<b>Tooltip:</b> Set a tooltip text to specify the information when the user moves the mouse pointer over the component.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div>                                                            |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------- |
| Show on desktop                              | Makes the component visible in desktop view.         | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                               | Makes the component visible in mobile view.          | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:----------- |:----------- |:------------- |
| Icon color |  You can change the color of the Icon component by entering the Hex color code or choosing a color of your choice from the color picker. |
| Visibility | This is to control the visibility of the component. | If `{{false}}` the component will not visible after the app is deployed. | It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`. |
| Box shadow | This property adds a shadow to the component. | You can use different values for box shadow property like offsets, blur, spread, and the color code. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>

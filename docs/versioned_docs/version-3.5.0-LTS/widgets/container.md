---
id: container
title: Container
---

Containers are used to group components together. You can move a group of related components inside a container for better organization of your UI elements.

:::caution Restricted components
Certain components, namely **Calendar** and **Kanban**, are restricted from being placed within the Container component.
:::

## Loading State

To activate the loader on the **Container** component, access its properties and dynamically adjust the **Loading state** property by clicking the **fx** button. You can set it to either `{{true}}` or `{{false}}`.

For instance, if you wish to display the loader on the container when the query named `restapi1` is in progress, set the **Loading State** value to `{{queries.restapi1.isLoading}}`.

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

## Exposed Variables

There are currently no exposed variables for the component.

## Tooltip

You can add a Tooltip to the component in string format. Once you pass a value in the tooltip input, hovering over the component will display the value on the right.

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:----------- |:----------- |:---------|
| Background color |  Change the background color of the Container by entering the `Hex color code` or choosing a color of your choice from the color picker. | |
| Border radius | Modifies the border radius of the container. The field expects only numerical values from `1` to `100`.| Default is `0`. |
| Border color |  Change the border color of the Container by entering the `Hex color code` or choosing a color of your choice from the color picker. | |
| Visibility | Controls the visibility of the component. If `{{false}}` the component will not be visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable |  This property only accepts boolean values. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |





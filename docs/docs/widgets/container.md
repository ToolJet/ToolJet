---
id: container
title: Container
---

Containers are used to group components together. You can move a group of related components inside a container for better organization of your UI elements.

:::caution Restricted components
Certain components, namely **Calendar** and **Kanban**, are restricted from being placed within the Container component.
:::

## Show header

The show header toggle can be used to display or hide a header for the component. If you keep the toggle on, the container will display a header on which you can place other components. The styling of the header can be controlled separately under the Styles tab. 

## Component Specific Actions (CSA)

Following actions of component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setVisibility()| Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.container1.setVisibility(false)`) or trigger it using an event. |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.container1.setLoading(true)`) or trigger it using an event. |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.container1.setDisable(true)`) or trigger it using an event. |

## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|

| <div style={{ width:"100px"}}> isLoading </div> | Indicates if the component is loading. | Accessible dynamically with JS (for e.g., `{{components.textinput1.isLoading}}`).|
| <div style={{ width:"100px"}}> isVisible </div> | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.textinput1.isVisible}}`).|
| <div style={{ width:"100px"}}> isDisabled </div> | Indicates if the component is disabled. | Accessible dynamically with JS (for e.g., `{{components.textinput1.isDisabled}}`).|

## Tooltip

You can add a Tooltip to the component in string format. Once you pass a value in the tooltip input, hovering over the component will display the value on the right.

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.                                               | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.                                            | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

---

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background        | Sets the background color of the container.                                                   | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Header    | Sets the background color of the header.                                                       | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Header height      | Sets the height of the header within the component.                                     | Enter a number or click on **fx** and input a number programmatically using code.          |
| Border radius      | Sets the radius of the component.                                     | Enter a number or click on **fx** and input a number programmatically using code.          |
| Border color          | Sets the color of the border.                                               | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties or set it programmatically using **fx**.                                            |





---
id: button
title: Button
---
# Button

**Button** component can be used to trigger an action. It can be used to submit a form, navigate to another page, or trigger a query.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display on the button.           | String (e.g., `Submit`).         |

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :----------- | :----------- |
| On click | The On click event is triggered when the button is clicked. |
| On hover | The On hover event is triggered when the mouse cursor is moved over the button. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :----------- |
| Button text | Used to set the label of the button. | Any **String** value: `Send Message`, `Delete`, or `{{queries.xyz.data.action}}` |
| Loading state | The loading state is used to show a spinner as the button content. Loading state is commonly used with isLoading property of the queries to show a loading status while a query is being run. | Toggle the switch **On** or click on **fx** to programmatically set the value to `{{true}}` or `{{false}}`  |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

Following actions of Button component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :----------- | :----------- | :--------|
| click() | Regulate the click of the button. | Employ a RunJS query to execute component-specific actions such as `await components.button1.click()` or trigger it using an event.|
| setText() | Sets the label of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.button1.setText('Update')`) or trigger it using an event. |
| setVisibility() | Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.textinput1.setVisibility(false)`) or trigger it using an event. |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.button1.setLoading(true)`) or trigger it using an event. |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.button1.setDisable(true)`) or trigger it using an event. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :----------- | :----------- | :---------- |
| buttonText | This variable stores the text displayed on the button. | Access the value dynamically through JavaScript using the following syntax: `{{components.button1.buttonText}}` |
| <div style={{ width:"100px"}}> isValid </div> | Indicates if the input meets validation criteria. | Accessible dynamically with JS (for e.g., `{{components.button1.isValid}}`).|
| <div style={{ width:"100px"}}> isLoading </div> | Indicates if the component is loading. | Accessible dynamically with JS (for e.g., `{{components.button1.isLoading}}`).|
| <div style={{ width:"100px"}}> isVisible </div> | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.button1.isVisible}}`).|

</div>

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Button to Submit Form` ).                       |

## Devices

**Show on desktop**

Makes the component visible in desktop view. You can set it with the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.

**Show on mobile**

Makes the component visible in mobile view. You can set it with the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.


---

# Styles 

## Button

| <div style={{ width:"100px"}}> Button Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Type        | Sets the fill value of the Button component.                                                   | Select `Solid` for a button with a solid background and `Outline` for a transparent button with an outline.          |
| Background        | Sets the background color of the component.                                                   | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Text color    | Sets the text color of the text entered in the component.                                     | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Border color    | Sets the border color of the component.                                                       | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Loader color    | Sets the loader color of the component.                                                       | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Icon            | Allows you to select an icon for the component.                                               | Enable the icon visibility, select icon and icon color. Alternatively, you can programmatically set it using `fx`.                                     |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on `fx` and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties or set it programmatically using `fx`.                                            |

## Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.


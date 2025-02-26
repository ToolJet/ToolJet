---
id: text-area
title: Text Area
---

# Textarea

The **Textarea** component allows users to enter text in an input field. It is generally preferred when multiple sentences are expected. 

All configuration options for the **Textarea** component are as follows:

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div>    | <div style={{ width:"100px"}}> Description  </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:-------------|:------------------------------------------------------------|:------------|
| Label | Text to display as the label for the field. | String (for e.g., `This is a Text Area`). |
| Default value| Used to set initial value in textarea on load. It is a pre-established value that can be retrieved from the Text area component if no modifications are made to it. | Enter some text as the value (for e.g., `Hello, John Doe. Welcome to ToolJet!`). |
| Placeholder  | Provides a hint for the expected value. It disappears once the user interacts with the component. | Enter some instructional text as the value (for e.g., `Type your text here`). |


</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Property </div>    | <div style={{ width:"100px"}}> Description  </div> |
|:-------------|:------------------------------------------------------------|
| onFocus( )     | Triggers whenever the user clicks inside the text area.  |
| onBlur( )      | Triggers whenever the user clicks outside the text area. |
| onChange( )    | Triggers whenever the user types something in the text area. |

</div>

<div style={{paddingTop:'24px'}}>

## Additional Actions

| <div style={{ width:"100px"}}> Property </div>    | <div style={{ width:"100px"}}> Description  </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:-------------|:------------------------------------------------------------|:------------|
| isLoading  | Indicates if the Text Area component is loading. | Accessible dynamically with JS (for e.g., `{{components.text_area.isLoading}}`). |
| isVisible  | Indicates if the Text Area component is Visible. | Accessible dynamically with JS (for e.g., `{{components.text_area.isVisible}}`). |
| isDisabled  | Indicates if the Text Area component is Disabled. | Accessible dynamically with JS (for e.g., `{{components.text_area.isDisabled}}`). |

### Tooltip

A **Tooltip** is commonly used to provide additional information about an element. This information becomes visible when the user hovers the mouse pointer over the respective component.

In the Text Area under **Tooltip**, you can enter some text and the component will show the specified text as a tooltip when it is hovered over.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| Variables | Description | How To Access |
|:---------|:-----------|:-------------|
| <div style={{ width:"100px"}}> value </div> | This component holds the value entered in the text area. | Access the value dynamically using JS. (for e.g., `{{components.text_area.value}}`) |
| isValid  | Indicates if the input meets validation criteria. | Accessible dynamically with JS (for e.g., `{{components.text_area.isValid}}).` |
| isMandatory  | Indicates if the component is Mandatory. | Accessible dynamically with JS (for e.g., `{{components.text_area.isMandatory}}`). |

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

Following actions of the **Textarea** component can be controlled using Component-Specific Actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setText( )      | Sets the value of the input field.    | Employ a RunJS query (for e.g.,  <br/> `await components.textarea.setText('this is input text')`) or trigger it using an event. |
| clear( )        | Clears the entered text in the input field.      | Employ a RunJS query (for e.g.,  <br/> `await components.textarea.clear()`) or trigger it using an event. |
| setFocus( )     | Sets the focus of the cursor on the input field.   | Employ a RunJS query (for e.g.,  <br/> `await components.textarea.setFocus()`) or trigger it using an event. |
| setBlur( )      | Removes the focus of the cursor from the input field. | Employ a RunJS query (for e.g.,  <br/> `await components.textarea.setBlur()`) or trigger it using an event. |
| setVisibility( )| Sets the visibility of the component. | Employ a RunJS query (for e.g.,`await components.textarea.setVisibility(false)`) or trigger it using an event. |
| setDisable( )   | Disables the component.	| Employ a RunJS query (for e.g.,`await components.textarea.setDisable(true)`) or trigger it using an event. |
| setLoading( )   | Sets the loading state of the component.	 | Employ a RunJS query (for e.g.,`await components.textarea.setLoading(true)`) or trigger it using an event. |

</div>

<div style={{paddingTop:'24px'}}>

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Regex              | Regular Expression to validate the input.             | Regular Expression Pattern (for e.g., `^\d{3}-\d{2}-\d{4}$`). |
| Min length         | Sets the minimum number of characters allowed.                | Integer (for e.g., `6` for a minimum of 6 characters). |
| Max length         | Sets the maximum number of characters allowed.                | Integer (for e.g., `12` for a maximum of 12 characters).|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (for e.g., `{{components.text_area.value<5&&"Value needs to be more than 5"}}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.text_area.value)) ? '' : 'Error message';}}`

</div>

<div style={{paddingTop:'24px'}}>

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Devices </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :------------ |
| Show on desktop  | Makes the component visible in desktop view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div>  | <div style={{ width:"135px"}}> Expected Value </div>  |
| :------------- | :-------------- | :-------------- |
| Visibility  | Controls the visibility of the component. If set to `{{false}}`, the component will not be visible after the app is deployed. | Use the toggle button OR click on **fx** to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`. |
| Disable  | Makes the component non-functional when set to true.  | Use the toggle button OR click on **fx** to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`. |
| Border radius  | Adjusts the roundness of the component's corners.  | Numeric value  |

</div>

<div style={{paddingTop:'24px'}}>

## General

### Box Shadow

The **Box Shadow** property is used to add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow.

</div>

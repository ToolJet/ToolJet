---
id: properties
title: Properties
---

Using the **Form** component's property panel, you can control the form structure, generate the form, add fields, configure events, and more.

## Structure

| <div style={{ width:"120px"}}> Property </div> | Description | Expected Value |
|----------|-------------|:---------------|
| Header | Show or hide the form header. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Footer | Show or hide the form footer. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Submit button | Select a **Button** that will be used to submit the form. | Choose any **Button** that is a child component inside the **Form** component from the dropdown or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Data

Choose how the form should be generated and manage all input fields from a single place. The form can be generated in the following ways:
- Using JSON Schema
- Using Raw JSON
- Using Query Output
- Using the Form Property Panel
- By Dragging Components into the Form

Refer to the [Generate Form](/docs/widgets/form/form) guide for more details.

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------|:-----------------|
| On submit  | Triggers when the submit button is clicked. |
| On invalid | Triggers when the there is invalid input in the form.  |

## Additional Actions

| <div style={{ width:"100px"}}>Action</div> | <div style={{ width:"150px"}}>Description</div> | <div style={{ width:"250px"}}>Configuration Options</div> |
|:------------------|:------------|:------------------------------|
| Validate all fields on submission      | Validates all fields when the form is submitted. | Enable/disable the toggle, or use **fx** to enter a logical expression. |
| Reset form on submission               | Resets all form fields after submission.         | Enable/disable the toggle, or use **fx** to enter a logical expression. |
| Loading state                          | Enables a loading spinner during submission, often tied to `isLoading`. | Enable/disable the toggle, or use **fx** to enter a logical expression. |
| Visibility                             | Controls whether the component is visible.       | Enable/disable the toggle, or use **fx** to enter a logical expression. |
| Dynamic height                         | Automatically adjusts height based on content.   | Enable/disable the toggle, or use **fx** to enter a logical expression. |
| Disable                                | Enables or disables the entire component.        | Enable/disable the toggle, or use **fx** to enter a logical expression. |
| Tooltip                                | Displays a tooltip on hover.                     | String value (e.g., `Enter your password here.`) |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Header

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Background | Sets the background color of the form header. | Select a color from the color picker or set it programmatically using **fx**. |
| Divider | Sets the color of the divider line between the header and form body. | Select a color from the color picker or set it programmatically using **fx**. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Background | Sets the background color of the form body. | Select a color from the color picker or set it programmatically using **fx**. |
| Border color | Sets the border color of the form container. | Select a color from the color picker or set it programmatically using **fx**. |
| Border radius | Sets the corner radius of the form container. | Enter a numeric value (e.g., `6`) or set it programmatically using **fx**. |

### Footer

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Background | Sets the background color of the form footer. | Select a color from the color picker or set it programmatically using **fx**. |
| Divider | Sets the color of the divider line between the form body and footer. | Select a color from the color picker or set it programmatically using **fx**. |

:::info
Any property having an **fx** button next to its field can be **programmatically configured**.
:::

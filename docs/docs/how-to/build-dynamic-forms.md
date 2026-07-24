---
id: build-dynamic-forms
title: Build Dynamic Forms
---

This guide walks you through the process of building dynamic, interactive forms in ToolJet through validations.   

<div style={{paddingBottom:'24px'}}>

## 1. Creating the UI
Let’s get started by setting up your form’s interface.

Drag and drop a **Form** component on the canvas and place the following input components inside it. 

| Component         | Component Name | Label                                              |
|:--------------------------------|:---------------|:-----------------------------------------------------------------|
| Star Rating       | *starrating1*  | How satisfied are you with our service?           |
| Text Input        | *textinput1*   | What specific issues did you encounter?           |
| Text Input        | *textinput2*   | Email                                              |
| Number Input      | *numberinput1* | Contact                                            |
| Button            | *button1*      | Submit                                             |

<div >
    <img src="/img/how-to/build-dynamic-forms/dynamic-form-UI.png" alt="Dynamic Form UI" />
</div>

</div>

<div style={{paddingBottom:'24px'}}>

## 2. Add Validations and Conditions
Now, let’s add some magic with validations and conditions to make your form smart and responsive. 

a. Select the *textinput1* component and navigate to its Visibility condition. Click on **fx** next to the Visibility condition and enter the below code in the input:

```javascript
{{components.form1.children.starrating1.value<4}}
```
*This code will ensure that the *textinput1* component is only visible when the start rating is below 4.*

b. Select the *textinput2* component and navigate to its Custom Validation property. Click on **fx** and enter the following code to test the email format using regex:
```javascript
{{/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(components.form1.children.textinput2.value) 
? '' : 'Invalid email'}}
```

c. Select the *numberinput1* component and enable the toggle for Make this field mandatory. This setting will display an error when the *numberinput1* component is left blank.

d. Finally, the *button1* component has to be disabled if the rating, email, and contact fields are not valid. Use the following code in the component's Visibility condition to achieve that:

```javascript
{{!components.form1.children.textinput2.isValid || 
!components.form1.children.starrating1.value || 
!components.form1.children.numberinput1.value}}
```
</div>

<div style={{paddingBottom:'24px'}}>

## 3. Test the Functionality

It’s time to put your form to the test! Check that everything functions smoothly and as expected.

a. Check whether the *textinput1* is visible and hidden based on the star rating.

<div >
    <img src="/img/how-to/build-dynamic-forms/start-rating-condition-test.png" style={{paddingBottom:"25px"}} alt="Dynamic Form UI - Test Star Rating" />
</div>

<div >
    <img src="/img/how-to/build-dynamic-forms/start-rating-condition-test-2.png" style={{paddingBottom:"25px"}} alt="Dynamic Form UI - Test Star Rating 2" />
</div>

<br/>

b. Enter incorrect email and contact details to see whether the related components throw an error while disabling the button.

<div>
    <img src="/img/how-to/build-dynamic-forms/incorrect-email-and-contact-test.png" alt="Dynamic Form UI - Incorrect Email and Contact Test" />
</div>

</div>

This short guide covers the main validation options that you can use while creating a dynamic form. To explore further, use the Tabs component to create multi-page forms while using the same logic to make it dynamic. 



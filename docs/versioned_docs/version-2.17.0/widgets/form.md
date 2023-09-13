---
id: form
title: Form
---

The **Form** component is designed to capture user input. It can act as a parent component to various components such as **Text**, **Text Input**, **Dropdown** and **Buttons** to initiate specific events. In this document, we'll go through all the configuration options for the **Form** component. 

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/formnew.png" alt="Form" />

</div>
<br/>

:::caution Restricted components
Components like **Kanban**, **Calendar**, **Modal**, **Container**, **ListView**, **Tabs**, and **Form** can't be dropped inside the Form component.
:::

## Properties

| Properties | Description | Expected Value |
| :---------- | :--------------------------- | :------------- |
| **Button To Submit For**m | This dropdown can be used to select a **Button** that will be used to submit the form. | Any button that is a child component inside the **Form** component
| **Loading State** | Loading state can be used to show a spinner while the content is loaded. Loading state is commonly used with the **isLoading** property of queries. | Use the toggle button or dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either `{{true}}` or `{{false}}`|
| **Use Custom Schema** | Enabling this property allows you to provide a schema for the Form component in the JSON format. | Switch the toggle or click on `Fx` to programmatically enable the **JSON schema**|

:::info
If you need a step-by-step guide on using a **Form** component, you can checkout **[this](/docs/how-to/use-form-component)** guide.  
:::

## Using Custom Schema

To provide the form schema in JSON format, we'll pass a JavaScript object with **title**, **properties** and **submitButton**.

| Key  | Description |
| :----------- | :----------- | 
| title | The **title** key specifies the title of the form. | 
| properties | The **properties** key holds an object that defines the properties of the components that will be inside the form. | 
| submitButton | The **submitButton** key holds an object that defines the properties of the Submit Button of the form. | 

This **[list](/docs/widgets/form#custom-schema-examples)** provides examples of Custom Schema for all components that can be used in a Form component.  

```js
{{
  {
    title: '', // Provide title for Form
    properties: {

    }, // Provide schema of the components that will be inside the form
    submitButton: {

    } // Provide schema of the submit button
  }
}}
```

## Events

To add an event to the **Form** component, go to the **Events** section and click on **Add handler**.

| Event      | Description  |
|:------------|:-----------------|
| **On submit**  | **On submit** event is triggered when the submit button on the form component is clicked. |
| **On invalid** | **On invalid** event is triggered when the input on the form is invalid.                  |


:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
<font size="4"><b>Tooltip</b></font>

A Tooltip is often used to specify the extra information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/form/tooltip.png" alt="Tooltip Example" />
</div>

## Layout

<font size="4"><b>Show on desktop</b></font>

Use this toggle to show or hide the component in the desktop view. You can dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to `{{true}}` or `{{false}}`.

<font size="4"><b>Show on mobile</b></font>

Use this toggle to show or hide the component in the mobile view. You can dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to `{{true}}` or `{{false}}`. 

--- 

## Styles

| Style      | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **Background color** |  Changes the background color of the form. | Hex color code/choose a color using the color picker|
| **Border radius** | Adjusts the roundness of the component's corners. | Numeric value|
| **Border color** |  Changes the border color of the component.| Hex color code/choose a color using the color picker|
| **Visibility** | Controls the visibility of the component. If set to `{{false}}`, the component will not be visible.| Use the toggle button OR click on `Fx` to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`|
| **Disable** | Makes the component non-functional when set to true. | Use the toggle button OR click on `Fx` to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`|


## General

<font size="4"><b>Box Shadow</b></font>

The **Box Shadow** property is used to add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/form/box-shadow.png" alt="Box Shadow Example" />
</div>

## Exposed Variables

| Variables      | Description | Expected Value
| :----------- | :----------- | :-------- |
| **data** | This variable holds the data of all the components that are nested inside the form component. | You can access the value dynamically using JS. For example, `{{components.form1.data.numberinput1.value}}`

## Component Specific Actions (CSA)

Following actions of form component can be controlled using the Component Specific Actions(CSA):

| Actions     | Description |
| :----------- | :----------- |
| **submitForm** | Submits the form data via a **[component-specific action](/docs/actions/control-component/)** within any event handler. Additionally, there is an option to employ a RunJS query to execute component-specific actions such as `await components.form1.submitForm()` |
| **resetForm** | Resets the form data via a **[component-specific action](/docs/actions/control-component/)** within any event handler. Additionally, there is an option to employ a RunJS query to execute component-specific actions such as `await components.form1.resetForm()` |

## Custom Schema Examples
- **[Datepicker](#datepicker)**
- **[Number Input](#number-input)**
- **[Password](#password)**
- **[Checkbox](#checkbox)**
- **[Toggle](#toggle)**
- **[Text Area](#text-area)**
- **[Date Range Picker](#date-range-picker)**
- **[Multiselect](#multiselect)**
- **[Star Rating](#star-rating)**
- **[File Picker](#file-picker)**
- **[Text Input](#text-input)**
- **[Dropdown](#dropdown)**
- **[Button](#button)**
- **[Text](#text)**
- **[Radio](#radio)**

### Datepicker

Properties that can be used in Datepicker schema are:

```js
datepicker1: {    // component name
    type: 'datepicker', // define the type of component
    styles: {
        borderRadius: 5, // define the border radius as a numeric value
        disabled: false,  // set true to disable the component or false to enable it
        visibility: 'true' // set 'true' to show the component or 'false' to hide it
    },
    value: '09/09/2023',  // set the default date for the datepicker
    disabledDates: ['08/09/2023'], // provide the dates in an array that you want to disable 
    enableTime: true, // set true to enable time or false to disable it
    format: 'DD/MM/YYYY', // set the format of the date
    label: 'Select a date' // set the label of the component
}
```

<div style={{textAlign:'center'}}>
  <img className="screenshot-full" src="/img/widgets/form/datepickerschema.png" alt="Form custom schema" />
</div>

### Number Input

**Properties**

```js
numberInput:{ // component name
  type: 'number', // define the type of component
  styles: {
        backgroundColor: '#f6f5ff', // set the background color of the component by providing a hex color code
        borderRadius: 20, // provide a numeric value to set the border radius
        textColor: 'red', // set the text color of the component by providing a hex color code
        borderColor: 'blue', // set the border color of the component by providing a hex color code
        disabled: false, // set true to disable the component or false to enable it
        visibility: 'true' // set 'true' to show the component or 'false' to hide it
 },
    value: 10, // set the default value of the number input
    maxValue: 12, // set the maximum value of the number input
    minValue: 6, // set the minimum value of the number input
    placeholder: 'test', // set the placeholder text of the number input
    label: 'Number Input' // set the label of the component
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/numberinput.png" alt="Form custom schema" />

</div>

### Password

**Properties**

```js
passwordInput1:{ // component name
  type:"password", // define the type of component
  styles:{
      backgroundColor: '#f6f5ff', // set the background color of the component by providing a hex color code
      borderRadius: 10, // provide a numeric value to set the border radius
      disabled: false, // set true to disable the component or false to enable it
      visibility: 'true' // set 'true' to show the component or 'false' to hide it
   },
   validation:{
      maxLength: 9, // set the maximum length of the password
      minLength: 5, // set the minimum length of the password
      regex: '^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$' // set the regex for the password
},
   placeholder:"Enter a password", // set the placeholder text of the password input
   label: '' // set the label of the component
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/password.png" alt="Form custom schema" />

</div>


### Checkbox

**Properties**

```js
checkbox1:{ // component name
  type: 'checkbox', // define the type of component
  styles: {
    checkboxColor: 'red', // set the color of the checkbox by providing a hex color code
    disabled: false, // set true to disable the component or false to enable it
    textColor: 'red', // set the text color of the component by providing a hex color code
    visibility: 'true' // set 'true' to show the component or 'false' to hide it
  },
  value: false, // set the default value of the checkbox
  label: 'Checkbox' // set the label of the component
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/checkbox.png" alt="Form custom schema" />

</div>

### Toggle

**Properties**

```js
toggleswitch1:{ // component name
  type: 'toggle',  // define the type of component
  styles: {
    textColor: 'blue', // set the text color of the component by providing a hex color code
    disabled: false, // set true to disable the component or false to enable it
    visibility: 'true', // set 'true' to show the component or 'false' to hide it
    toggleSwitchColor: 'red' // set the color of the toggle switch by providing a hex color code
  },
  value: true, // set the default value of the toggle switch
  label: 'Toggle switch' // set the label of the component
 },
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/toggle.png" alt="Form custom schema" />

</div>

### Text Area

**Properties**

```js
textArea1:{ // component name
  type: 'textarea', // define the type of component
  styles: {
    disabled: false, // set true to disable the component or false to enable it
    visibility: 'true', // set 'true' to show the component or 'false' to hide it
    borderRadius: 20 // provide a numeric value to set the border radius
  },
  value: 'This is a text area', // set the default value of the text area
  placeholder: 'Enter text here',   // set the placeholder text of the text area
  label: 'Text Area' // set the label of the component
 },
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/textarea.png" alt="Form custom schema" />

</div>

### Date Range Picker

**Properties**

```js
daterangepicker1: { // component name
  type: 'daterangepicker', // define the type of component
  styles: {
    disabled: true, // set true to disable the component or false to enable it  
    visibility: 'true', // set 'true' to show the component or 'false' to hide it
    borderRadius: 5 // provide a numeric value to set the border radius
  },
  defaultEndDate: '12/04/2022', // set the default end date of the date range picker
  defaultStartDate: '1/04/2022', // set the default start date of the date range picker
  format: 'DD/MM/YYYY', // set the format of the date
  label: 'Select a date range' // set the label of the component
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/daterange.png" alt="Form custom schema" />

</div>

### Multiselect

**Properties**

```js
multiselect1: { // component name
  type: 'multiselect', // define the type of component
  styles: {
    disabled: false, // set true to disable the component or false to enable it
    visibility: 'true', // set 'true' to show the component or 'false' to hide it
    borderRadius: 5 // provide a numeric value to set the border radius
  },
  displayValues: ["one","two","three"], // set the value for option labels in an array format
  label: 'Select options', // set the label of the component
  value: [2,3], // set the default value(s) in an array
  values: [1,2,3], // set the values in an array
  showAllOption: true, // set true to show the 'All' option in the multiselect or false to hide it
  label: 'Select options of your choice' // set the label of the component
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/multiselect.png" alt="Form custom schema" />

</div>

### Star Rating

**Properties**

```js
starRating1: { // component name
  type: 'starrating', // define the type of component
  styles: {
    disabled: false, // set true to disable the component or false to enable it
    visibility: 'true', // set 'true' to show the component or 'false' to hide it
    textColor: 'yellow', // set the color of the stars by providing a hex color code
    labelColor: 'red' // set the color of the label by providing a hex color code
  },
  allowHalfStar: true, // set true to allow selection of half star rating or false to disable it
  defaultSelected: 4.5, // set the default value of the star rating
  maxRating: 10, // set the maximum rating 
  tooltips: ['one','two','three','four'], // set the tooltips for each star in an array
  label: 'Select a rating' // set the label of the component
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/star.png" alt="Form custom schema" />

</div>

### File Picker

**Properties**

```js
filepicker1: { // component name
  type: 'filepicker', // define the type of component
  styles: {
    visibility: 'true', // set 'true' to show the component or 'false' to hide it
    borderRadius: 10 // provide a numeric value to set the border radius
  },
  enableMultiple: true, // set true to enable multiple file selection or false to disable it
  fileType: '*/*', // set the mime file type
  instructionText: 'Click here to select files', // set the instruction text of the file picker
  maxFileCount: 5, // set the maximum number of files that can be selected
  maxSize: 6000000, // set the maximum size of the file in bytes
  minSize: 25, // set the minimum size of the file in bytes
  parseContent: true, // set true to parse the content of the file or false to disable it
  parseFileType: 'csv', // set the file type to parse e.g. csv, text, xlsx
  label: 'Select a file' // set the label of the component
},
```


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/filepicker.png" alt="Form custom schema" />

</div>

### Text Input

**Properties**

```js
textinput1: { // component name
    type: 'textinput', // define the type of component
    value: 'Random text', // set the default value of the text input 
    placeholder: 'enter first name here', // set the placeholder text of the text input
    label: 'First name', // set the label of the component
    validation: {
      maxLength: 6, // set the maximum length validation of the text input
    },
    styles: {
      backgroundColor: 'red', // set the background color of the component by providing a hex color code
      borderRadius: 20, // provide a numeric value to set the border radius
      errorTextColor: 'green', // set the color of the error text by providing a hex color code
      disabled: false, // set true to disable the component or false to enable it
      visibility: false, // set 'true' to show the component or 'false' to hide it
      textColor: 'yellow' // set the text color by providing a hex color code
    },
    },
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/textinput.png" alt="Form custom schema" />

</div>

### Dropdown

**Properties**

```js
dropdown1: { // component name
  type: 'dropdown', // define the type of component
  displayValues: [1, 2, 3], // set the value for option labels in an array format
  values: ['one', 'two', 'three'], // set the option labels in an array
  loading: false, // set true to show the loading state or false to hide it
  value: 'two', // set the default selected value of the dropdown
  label: 'Select a number', // set the label of the component
  styles: {
    disabled: false, // set true to disable the component or false to enable it
    visibility: 'true', // set 'true' to show the component or 'false' to hide it
    borderRadius: 5, // provide a numeric value to set the border radius
    justifyContent: 'end' // set the alignment of the dropdown options to start, center or end
  }
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/dropdown.png" alt="Form custom schema" />

</div>

### Button

**Properties**

```js
button1: { // component name
  type:'button', // define the type of component
  value: 'Submit', // set the button text
  label: '', // set the label of the component, set the value null i.e '' to hide the label
  styles: {
      backgroundColor: 'blue', // set the background color of the button by providing a hex color code
      textColor: 'white', // set the text color of the button by providing a hex color code
      borderRadius: 5, // provide a numeric value to set the border radius
      borderColor: 'black', // set the border color of the button by providing a hex color code
      loaderColor: 'gray', // set the color of the loader on the button by providing a hex color code
      visibility: 'true', // set 'true' to show the component or 'false' to hide it
      disabled: true // set true to disable the component or false to enable it
    }
    },
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/button.png" alt="Form custom schema" />

</div>

### Text

**Properties**

```js
text1: { // component name
  type: 'text', // define the type of component
  value: 'This is a text component', // set the value of the text component
  label: '', // set the label of the component, set the value null i.e '' to hide the label
  styles: {
    backgroundColor: '#f6f5ff', // set the background color of the text by providing a hex color code
    textColor: 'red', // set the text color by providing a hex color code
    fontSize: 24, // set the font size of the text
    fontWeight: 30 // set the font weight of the text
  }
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/text.png" alt="Form custom schema" />

</div>

### Radio

**Properties**

```js
radioButton1: { // component name
  type: 'radio', // define the type of component
  styles: {
    textColor: 'black', // set the text color of the radio option by providing a hex color code
    disabled: false, // set true to disable the component or false to enable it
    visibility: 'true' // set 'true' to show the component or 'false' to hide it 
  },
  displayValues: ['option 1', 'option 2', 'option 3'], // set the value for labels in an array format
  label: 'Radio Buttons', // set the label of the component
  value: 2, // set the default selected value of the radio button
  values: [1,2,3], // set the valuees in an array
},
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/radio.png" alt="Form custom schema" />

</div>

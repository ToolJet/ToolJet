---
id: form
title: Form
---

The **Form** component is designed to capture user input. It can act as a parent component to various components such as **Text**, **Text Input**, **Dropdown** and **Buttons** to initiate specific events. In this document, we'll go through all the configuration options for the **Form** component. 

<div style={{textAlign:'center'}}>
  <img className="screenshot-full" src="/img/widgets/form/form-preview.png" alt="Form" />
</div>
<br/>

:::caution Restricted components
To prevent complexity, components like **Kanban**, **Calendar**, **Modal**, **Container**, **ListView**, **Tabs**, and **Form** can't be dragged and dropped inside the Form component. If tried, an error appears: 

`<Restricted component> cannot be used as a child component within the Form.`
:::

## Properties

| Properties | Description | Expected Value |
| :---------- | :--------------------------- | :------------- |
| Button To Submit Form | This dropdown can be used to select a **Button** that will be used to submit the form. | Any button that is a child component inside the **Form** component
| Loading State | Loading state can be used to show a spinner while the content is loaded. Loading state is commonly used with the **isLoading** property of queries. | Use the toggle button or dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either `{{true}}` or `{{false}}`|
| Use Custom Schema | Enabling this property allows you to provide a schema for the Form component in the JSON format. | Switch the toggle or click on `Fx` to programmatically enable the **JSON schema**|

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
    title: // Provide A Title for the Form
    properties: // Provide Schema for Components
    submitButton: // Properties of Submit Button
  }
}}
```

## Events

To add an event to the **Form** component, go to the **Events** section and click on **Add handler**.

| Event      | Description  |
|:------------|:-----------------|
| On submit  | **On submit** event is triggered when the submit button on the form component is clicked. |
| On invalid | **On invalid** event is triggered when the input on the form is invalid.                  |


:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
<font size="4"><b>Tooltip</b></font>

A Tooltip is commonly used to provide additional information about an element. This information becomes visible when the user hovers the mouse pointer over the respective component.

In the input field under Tooltip, you can enter some text and the component will show the specified text as a tooltip when it is hovered over.

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
| Background color |  Changes the background color of the form. | Hex color code/choose a color using the color picker|
| Border radius | Adjusts the roundness of the component's corners. | Numeric value|
| Border color |  Changes the border color of the component.| Hex color code/choose a color using the color picker|
| Visibility | Controls the visibility of the component. If set to `{{false}}`, the component will not be visible.| Use the toggle button OR click on `Fx` to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`|
| Disable | Makes the component non-functional when set to true. | Use the toggle button OR click on `Fx` to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`|


## General
<font size="4"><b>Box Shadow</b></font>


The **Box Shadow** property is used to add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/form/box-shadow.png" alt="Box Shadow Example" />
</div>

## Exposed Variables

| Variables      | Description | Expected Value
| :----------- | :----------- | :-------- |
| data | This variable holds the data of all the components that are nested inside the form component. | You can access the value dynamically using JS. For example, `{{components.form1.data.numberinput1.value}}`

## Component Specific Actions (CSA)

Following actions of form component can be controlled using the Component Specific Actions(CSA):

| Actions     | Description |
| :----------- | :----------- |
| submitForm | Submits the form data via a **[component-specific action](/docs/actions/control-component/)** within any event handler. Additionally, there is an option to employ a RunJS query to execute component-specific actions such as `await components.form1.submitForm()` |
| resetForm | Resets the form data via a **[component-specific action](/docs/actions/control-component/)** within any event handler. Additionally, there is an option to employ a RunJS query to execute component-specific actions such as `await components.form1.resetForm()` |

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
datepicker: {
    type: 'datepicker',
    styles: {
        borderRadius: '',
        disabledState: false,
        visibility: true
    },
    validation: {
        customRule: ''
    },
    defaultValue: '',
    disabledDates: '',
    enableDate: '',
    enableTime: '',
    format: ''
}
```

**Example**

```js
{{{
    title: "User registration form",
    properties: {
      "Select the date": {
        type: "datepicker",
        styles: {
            borderRadius: 5,
            disabledState: false,
            visibility: true
        },
      }
    },
    submitButton: {
      value: "Submit"
    }
}}}
```

<div style={{textAlign:'center'}}>
  <img className="screenshot-full" src="/img/widgets/form/datepickerschema.png" alt="Form custom schema" />
</div>

Not that the "Select the date" key in the above example is passed with double-quotes. In JavaScript, any key with space needs to be wrapped in double-quotes.
```js
let employee = {
  name: "Paul",
  age: 50,
  "likes birds": true  // property names with space must be quoted
}
```

### Number Input

**Properties**

```js
numberinput: {
    type: 'number',
    styles: {
        backgroundColor: '#f6f5ff',
        borderRadius: '80',
        textColor: 'red',
        borderColor: 'blue',
        disabled: false,
        visibility: false
    },
    value: 10,
    maxValue: 12,
    minValue: 6,
    placeholder: 'test'
}
```

**Example**

```js
{{{
    title: "User registration form",
        properties: {
            'Choose the date': {
                type: 'number',
                styles: {
                    backgroundColor: '#f6f5ff',
                    borderRadius: '5',
                    textColor: 'red',
                    borderColor: 'black',
                    disabled: false,
                    visibility: false
                },
                value: 50,
                maxValue: 100,
                minValue: 6,
                placeholder: 'Select the quantity'
            }
        },
        "submitButton": {
            "value": "Submit"
        }
}}}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/numberinput.png" alt="Form custom schema" />

</div>

### Password

**Properties**

```js
password:{
   type:"password",
   style:{
      "backgroundColor":"green",
      "borderRadius":"60",
      "disabled":false,
      "visibility":true
   },
   validation:{
      customRule:"",
      maxLength:"",
      minLength:"",
      regex:""
   },
   placeholder:"enter a password"
}
```

**Example**

```js
"Enter the Password":{
               "type":"password",
               "styles":{
                  "backgroundColor":"white",
                  "borderRadius":"5",
                  "disabled":false,
                  "visibility":true
               },
               "placeholder":"enter a password"
            }
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/password.png" alt="Form custom schema" />

</div>


### Checkbox

**Properties**

```js
checkbox:{
  type: 'checkbox',
  styles: {
    checkboxColor: 'red',
    disabled: false,
    textColor: 'red',
    visibility: false
  },
  value: true,
  label: 'TJ checkox'
}
```

**Example**

```js
"checkbox1":{
   "type":"checkbox",
   "styles":{
      "checkboxColor":"red",
      "disabled":false,
      "textColor":"red",
      "visibility":false
   },
   "value":true,
   "label":"Product 1"
},
"checkbox2":{
   "type":"checkbox",
   "styles":{
      "checkboxColor":"red",
      "disabled":false,
      "textColor":"red",
      "visibility":false
   },
   "value":false,
   "label":"Product 2"
},
"checkbox3":{
   "type":"checkbox",
   "styles":{
      "checkboxColor":"red",
      "disabled":false,
      "textColor":"red",
      "visibility":false
   },
   "value":true,
   "label":"Product 3"
}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/checkbox.png" alt="Form custom schema" />

</div>

### Toggle

**Properties**

```js
toggle:{
  type: 'toggle',
  styles: {
    textColor: 'red',
    disabled: false,
    visibility: true,
    toggleSwitchColor: 'red'
  },
  value: true,
  label: 'Toggle Switch'
 },
```

**Example**

```js
{{{title:"User registration form",
         properties:{
         toggle1:{
  type: 'toggle',
  styles: {
    textColor: 'red',
    disabled: false,
    visibility: true,
    toggleSwitchColor: 'red'
  },
  value: true,
  label: 'Enable this option?'
 },
         },
         "submitButton":{
            "value":"Submit"
         }}}}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/toggle.png" alt="Form custom schema" />

</div>

### Text Area

**Properties**

```js
textarea:{
  type: 'textarea',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 45
  },
  value: 'xyz',
  placeholder: 'Enter text here'
 }
```

**Example**

```js
Enter the text here':{
  type: 'textarea',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 5
  },
  value: 'This is a sample text',
  placeholder: 'Enter text here'
 }
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/textarea.png" alt="Form custom schema" />

</div>

### Date Range Picker

**Properties**

```js
daterangepicker: {
  type: 'daterangepicker',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 100
  },
  defaultEndDate: '12/04/2022',
  defaultStartDate: '1/04/2022',
  format: 'DD/MM/YYYY'
}
```

**Example**

```js
{{{
         "title":"User registration form",
         "properties":{
         'Select the range': {
  type: 'daterangepicker',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 100
  },
  defaultEndDate: '12/04/2022',
  defaultStartDate: '16/01/2020',
  format: 'DD/MM/YYYY'
}
         },
         "submitButton":{
            "value":"Submit"
         }}}}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/daterange.png" alt="Form custom schema" />

</div>

### Multiselect

**Properties**

```js
{
  type: 'multiselect',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 2
  },
  displayValues: ["one","two","three"],
  label: 'Select options',
  value: [2,3],
  values: [1,2,3],
  showAllOption: false
}
```

**Example**

```js
'Select an option':{
  type: 'multiselect',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 2
  },
  displayValues: ["one","two","three"],
  label: 'Select options',
  value: [2,3],
  values: [1,2,3],
  showAllOption: false
}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/multiselect.png" alt="Form custom schema" />

</div>

### Star Rating

**Properties**

```js
{
  type: 'starrating',
  styles: {
    disabled: false,
    visibility: true,
    textColor: 'yellow',
    labelColor: 'red'
  },
  allowHalfStar: false,
  defaultSelected: 0,
  label: 'Rate the item',
  maxRating: 6,
  tooltips: ['one'],
}
```

**Example**

```js
'Select the rating':{
  type: 'starrating',
  styles: {
    disabled: false,
    visibility: true,
    textColor: 'gold',
    labelColor: 'red'
  },
  allowHalfStar: false,
  defaultSelected: 0,
  label: 'Rate the item',
  maxRating: 6,
  tooltips: ['one'],
}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/star.png" alt="Form custom schema" />

</div>

### File Picker

**Properties**

```js
{
  type: 'filepicker',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 10
  },
  enableDropzone: true,
  enableMultiple: true,
  enablePicker: true,
  fileType: '',
  instructionText: 'Select files',
  maxFileCount: 0,
  maxSize: '',
  minSize: '',
  parseContent: false,
  parseFileType: ''
}
```

**Example**

```js
filepicker1:{
  type: 'filepicker',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: 10
  },
  enableDropzone: true,
  enableMultiple: true,
  enablePicker: true,
  fileType: '',
  instructionText: 'Select files',
  maxFileCount: 0,
  maxSize: '',
  minSize: '',
  parseContent: false,
  parseFileType: ''
}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/filepicker.png" alt="Form custom schema" />

</div>

### Text Input

**Properties**

```js
{
    type: 'textinput',
    value: 'Maria',
    placeholder: 'enter first name here',
    label: 'First name',
    validation: {
      maxLength: 6,
      minLength: 2
    },
    styles: {
      backgroundColor: 'red',
      borderRadius: '',
      errorTextColor: '',
      disabled: false,
      visibility: true,
      textColor: 'black'
    },
    },
```

**Example**

```js
textinput1: {
    type: 'textinput',
    value: 'Maria',
    placeholder: 'enter first name here',
    label: 'First name',
    validation: {
      maxLength: 6,
      minLength: 2
    },
    styles: {
      backgroundColor: 'white',
      borderRadius: '',
      errorTextColor: '',
      disabled: false,
      visibility: true,
      textColor: 'black'
    }
    }
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/textinput.png" alt="Form custom schema" />

</div>

### Dropdown

**Properties**

```js
{
  type: 'dropdown',
  displayValues: [1, 2, 3],
  values: ['one', 'two', 'three'],
  loading: false,
  value: 2,
  label: 'dropdown test',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: '',
    justifyContent: 'start'
  }
}
```

**Example**

```js
dropdown1: 
         {
  type: 'dropdown',
  displayValues: [1, 2, 3],
  values: ['one', 'two', 'three'],
  loading: false,
  value: 2,
  label: 'dropdown test',
  styles: {
    disabled: false,
    visibility: true,
    borderRadius: '',
    justifyContent: 'start'
  }
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/dropdown.png" alt="Form custom schema" />

</div>

### Button

**Properties**

```js
{    type:'button'
    "text": "Submit",
    "styles": {
      "backgroundColor": "blue",
      "textColor": "white",
      "borderRadius": "40",
      "borderColor": "black",
      "loaderColor": "gray",
      "visibility": true,
      "disabledState": false
    },
```

**Example**

```js
{{{
"title":"User registration form",
         "properties":{
         'Open the page':{
         type:'button',
         value: "Sample text",
         styles:{
      "backgroundColor": "blue",
      "textColor": "white",
      "borderRadius": "40",
      "borderColor": "black",
      "loaderColor": "gray",
      "visibility": true,
      "disabledState": false
    },
    },},
         "submitButton":{
            "value":"Submit"
         }}}}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/button.png" alt="Form custom schema" />

</div>

### Text

**Properties**

```js
{
  type: 'text',
  value: 'maria',
  styles: {
    backgroundColor: '#f6f5ff',
    textColor: 'black',
    fontSize: '',
    fontWeight: ''
  }
}
```

**Example**

```js
{{{
"title":"User registration form",
         "properties":{
         text1:{
  type: 'text',
  value: 'This is text component',
  styles: {
    backgroundColor: '#f6f5ff',
    textColor: 'black',
    fontSize: '',
    fontWeight: ''
  },
  },
    },
         "submitButton":{
            "value":"Submit"
         }}}}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/text.png" alt="Form custom schema" />

</div>

### Radio

**Properties**

```js
radio: {
  type: 'radio',
  styles: {
    textColor: 'black',
    disabled: false,
    visibility: true
  },
  displayValues: ['option 1', 'option 2', 'option 3'],
  label: 'Radio Buttons',
  value: 1,
  values: [1,2,3],
}
```

**Example**

```js
{{{
"title":"User registration form",
         "properties":{radio: {
  type: 'radio',
  styles: {
    textColor: 'black',
    disabled: false,
    visibility: true
  },
  displayValues: ['option 1', 'option 2', 'option 3'],
  label: 'Radio Buttons',
  value: 1,
  values: [1,2,3],
},},
         "submitButton":{
            "value":"Submit"
         }}}}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/radio.png" alt="Form custom schema" />

</div>

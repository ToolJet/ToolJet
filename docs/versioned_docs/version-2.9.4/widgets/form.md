---
id: form
title: Form
---

Form component can be used to get input from the user and store it in the connected datasource. Form component serves as a parent widget that can store different widgets like texts, input box, dropdown to allow selection, and a button for triggering the event.

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/form2.png" alt="Form" />

</div>

## Properties

| Properties  | description | Expected value |
| ----------- | ----------- | -------------- |
| Button To Submit Form | The dropdown can be used to select the button that will be used as the submit button for the form | Any button that will be added as a child component inside the form component can be selected from the dropdown |
| Loading state | Loading state can be used to show a spinner as the form content. Loading state is commonly used with isLoading property of the queries to show a loading status while a query is being run. | Switch the toggle **On** or click on `fx` to programmatically set the value `{{true}}` or `{{false}}`  |
| Use Custom Schema | Enabling this property allows you to provide a schema for the Form component in the JSON format | Switch the toggle **On** or click on `fx` to programmatically enable the **JSON schema** |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/newprop.png" alt="Form" />

</div>

## Using Custom Schema

It is mandatory to provide the Form schema in the following format:

```js
{{{title:"<FormTitle>", properties: {<ProvideSchemaForComponents>}, submitButton: {<PropertiesOfSubmitButton>}}}}
```

| Key  | description | 
| ----------- | ----------- |
| title | The title key specifies the title of the form. |
| properties | The properties key holds an object that defines the properties of the components that will be inside the form. The **Custom Schema** for all the components is available below. |
| submitButton | This key key holds an object that defines the properties of the Submit Button of the form. |

**Submit button schema:**
```js
submitButton: {
    "value": "Submit",
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

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/submitbuttonschema.png" alt="Form custom schema" />

</div>

Custom Schema is available for all the components available under the form category in the components manager:

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
datepicker:{
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
         "title":"User registration form",
         "properties":{
            "Select the date":{
               "type":"datepicker"
            }
         },
         "submitButton":{
            "value":"Submit"
         }}}}
```

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/datepickerschema.png" alt="Form custom schema" />

</div>

### Number Input

**Properties**

```js
numberinput:{
    type:'number',
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
{{{title:"User registration form",
         properties:{
            'Select the date':{
               type:"datepicker",
            },
            'Choose the date':{
    type:'number',
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
         "submitButton":{
            "value":"Submit"
         }}}}
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

## Events

To add an event to a button group, click on the widget handle to open the widget properties on the right sidebar. Go to the **Events** section and click on **Add handler**.

### On submit

**On submit** event is triggered when the button on the form component is clicked. Just like any other event on ToolJet, you can set multiple handlers for on submit event.

### On invalid

**On invalid** event is triggered when the input on the form is invalid.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget. Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

## Layout

| Layout  | description | Expected value |
| ----------- | ----------- | ------------ |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile | Toggle on or off to display mobile view. | You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/styles.png" alt="Form" />

</div>

| Style      | Description |
| ----------- | ----------- | 
| Background color |  You can change the background color of the form by entering the Hex color code or choosing a color of your choice from the color picker. |
| Border radius | Use this property to modify the border radius of the form component. |
| Border color |  You can change the color of the border of the form by entering the Hex color code or choosing a color of your choice from the color picker. |
| Visibility | Toggle on or off to control the visibility of the form. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not visible after the app is deployed. By default, it's set to `{{true}}`. |
| Disable | Toggle on to lock the widget. You can programmatically change its value by clicking on the `Fx` button next to it, if set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |
| Box shadow | This property adds a shadow to the widget. | You can use different values for box shadow property like offsets, blur, spread, and the color code. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::


## Exposed Variables

| Variables      | Description |
| ----------- | ----------- |
| data | This variable holds the data of all the components that are nested inside the form components. You can access the value dynamically using JS: `{{components.form1.data.numberinput1.value}}`|

## Component specific actions (CSA)

Following actions of form component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| ----------- | ----------- |
| submitForm | You can submit the form data via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.form1.resetForm()` |
| resetForm | You can reset the form data via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.form1.submitForm()` |


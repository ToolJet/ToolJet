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

Here's an example using the custom schema of **Text Input**, **Number Input** and **Dropdown** components:

```js
{{{
   "title":"Event Registration",
   "properties":{
      "textinput1":{
         "type":"textinput",
         "value":"",
         "placeholder":"Enter Full Name",
         "label":"Full Name",
         "validation":{
            "maxLength":30,
            "minLength":5
         },
         "styles":{
            "backgroundColor":"#00000000",
            "borderRadius":5,
            "borderColor":"#4299e1",
            "errorTextColor":"#4299e1",
            "disabled":false,
            "visibility":"true",
            "textColor":"#4299e1"
         }
      },
      "numberInput1":{
         "type":"number",
         "styles":{
            "backgroundColor":"#f6f5ff",
            "borderRadius":5,
            "textColor":"#4299e1",
            "borderColor":"#4299e1",
            "disabled":false,
            "visibility":"true"
         },
         "value":22,
         "maxValue":100,
         "minValue":14,
         "placeholder":"Enter your age",
         "label":"Age"
      },
      "dropdown1":{
         "type":"dropdown",
         "values":[
            1,
            2,
            3
         ],
         "displayValues":[
            "Male",
            "Female",
            "Perfer not to Answer"
         ],
         "loading":false,
         "value":3,
         "label":"Gender",
         "styles":{
            "disabled":false,
            "visibility":"true",
            "borderRadius":5,
            "borderColor":"#4299e1",
            "justifyContent":"center"
         }
      }
   },
   "submitButton":{
      "value":"Submit",
      "styles":{
         "backgroundColor":"#3A433B",
         "borderColor":"#595959"
      }
   }
}
}}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/form/customform.png" alt="Example form schema" />
</div>

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
datepicker1: {
    type: 'datepicker',
    styles: {
        borderRadius: 5, 
        disabled: false, 
        visibility: 'true'
    },
    value: '09/09/2023',
    disabledDates: ['08/09/2023'],
    enableTime: true,
    format: 'DD/MM/YYYY',
    label: 'Select a date' 
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'datepicker' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `borderRadius`, `disabled`, `visibility` etc. |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 5, 10, 20 etc. |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **value** | Specifies the default date of the datepicker. | Any date in the format specified in the `format` key |
| **disabledDates** | Specifies the dates that you want to disable. | Provide the dates in an array that you want to disable |
| **enableTime** | Specifies whether to enable time or not. | set `true` to enable time or `false` to disable it |
| **format** | Specifies the format of the date. | 'DD/MM/YYYY' |
| **label** | Specifies the label of the component. | Any string value |


<div style={{textAlign:'center'}}>
  <img className="screenshot-full" src="/img/widgets/form/datepickerschema.png" alt="Form custom schema" />
</div>

### Number Input

**Properties**

```js
numberInput1: {
    type: 'number',
    styles: {
        backgroundColor: '#f6f5ff',
        borderRadius: 20,
        textColor: 'red',
        borderColor: 'blue',
        disabled: false,
        visibility: 'true'
    },
    value: 10,
    maxValue: 12,
    minValue: 6,
    placeholder: 'test',
    label: 'Number Input'
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'number' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `backgroundColor`, `borderRadius`, `textColor`, `borderColor`, `disabled`, `visibility` etc. |
| **backgroundColor** | Specifies the background color of the component. | Color name or Hex color code '#f6f5ff' |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 5, 10, 20 etc. |
| **textColor** | Specifies the text color of the component. | Color name or Hex color code '#f6f5ff'|
| **borderColor** | Specifies the border color of the component. | Color name or Hex color code '#f6f5ff'|
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **value** | Specifies the default value of the number input. | Numeric value |
| **maxValue** | Specifies the maximum value of the number input. | Numeric value |
| **minValue** | Specifies the minimum value of the number input. | Numeric value |
| **placeholder** | Specifies the placeholder text of the number input. | Any string value |
| **label** | Specifies the label of the component. | Any string value |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/numberinput.png" alt="Form custom schema" />

</div>

### Password

**Properties**

```js
passwordInput1: {
    type: 'password',
    styles: {
        backgroundColor: '#f6f5ff',
        borderRadius: 10,
        disabled: false,
        visibility: 'true'
    },
    validation: {
        maxLength: 9,
        minLength: 5,
        regex: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$'
    },
    placeholder: 'Enter a password',
    label: ''
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'password' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `backgroundColor`, `borderRadius`, `disabled`, `visibility` etc. |
| **backgroundColor** | Specifies the background color of the component. | Color name or Hex color code '#f6f5ff' |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 10 |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **validation** | Specifies validation rules for the password. | Object containing `maxLength`, `minLength`, and `regex` properties |
| **maxLength** | Specifies the maximum length of the password. | Numeric value like 9 |
| **minLength** | Specifies the minimum length of the password. | Numeric value like 5 |
| **regex** | Specifies the regular expression for password validation. | Regular expression pattern like '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$' |
| **placeholder** | Specifies the placeholder text of the password input. | Any string value like 'Enter a password' |
| **label** | Specifies the label of the component. | Any string value (in this case, it's an empty string), to hide the label you can use whitespace within quotes `' '` |


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/password.png" alt="Form custom schema" />

</div>

### Checkbox

**Properties**

```js
checkbox1: {
    type: 'checkbox',
    styles: {
        checkboxColor: 'red',
        disabled: false,
        textColor: 'red',
        visibility: 'true'
    },
    value: false,
    label: 'Checkbox'
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'checkbox' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `checkboxColor`, `disabled`, `textColor`, `visibility` etc. |
| **checkboxColor** | Specifies the color of the checkbox. | Color name or Hex color code '#f6f5ff' |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **textColor** | Specifies the text color of the component. | Color name or Hex color code '#f6f5ff' |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **value** | Specifies the default value of the checkbox. | Boolean value (true or false) |
| **label** | Specifies the label of the component. | Any string value like 'Checkbox' |


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/checkbox.png" alt="Form custom schema" />

</div>

### Toggle

**Properties**

```js
toggleswitch1: {
    type: 'toggle',
    styles: {
        textColor: 'blue',
        disabled: false,
        visibility: 'true',
        toggleSwitchColor: 'red'
    },
    value: true,
    label: 'Toggle switch'
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'toggle' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `textColor`, `disabled`, `visibility`, `toggleSwitchColor` etc. |
| **textColor** | Specifies the text color of the component. | Color name or Hex color code '#f6f5ff' |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **toggleSwitchColor** | Specifies the color of the toggle switch. | Color name or Hex color code '#f6f5ff' |
| **value** | Specifies the default value of the toggle switch. | Boolean value (true or false) |
| **label** | Specifies the label of the component. | Any string value like 'Toggle switch' |


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/toggle.png" alt="Form custom schema" />

</div>

### Text Area

**Properties**

```js
textArea1: {
    type: 'textarea',
    styles: {
        disabled: false,
        visibility: 'true',
        borderRadius: 20
    },
    value: 'This is a text area',
    placeholder: 'Enter text here',
    label: 'Text Area'
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'textarea' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `disabled`, `visibility`, `borderRadius` etc. |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 20 |
| **value** | Specifies the default value of the text area. | Any string value like 'This is a text area' |
| **placeholder** | Specifies the placeholder text of the text area. | Any string value like 'Enter text here' |
| **label** | Specifies the label of the component. | Any string value like 'Text Area' |


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/textarea.png" alt="Form custom schema" />

</div>

### Date Range Picker

**Properties**

```js
daterangepicker1: {
    type: 'daterangepicker',
    styles: {
        disabled: true,
        visibility: 'true',
        borderRadius: 5
    },
    defaultEndDate: '12/04/2022',
    defaultStartDate: '1/04/2022',
    format: 'DD/MM/YYYY',
    label: 'Select a date range'
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'daterangepicker' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `disabled`, `visibility`, `borderRadius` etc. |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 5 |
| **defaultEndDate** | Specifies the default end date of the date range picker. | Date in the format specified in the `format` key, e.g., '12/04/2022' |
| **defaultStartDate** | Specifies the default start date of the date range picker. | Date in the format specified in the `format` key, e.g., '1/04/2022' |
| **format** | Specifies the format of the date. | 'DD/MM/YYYY' |
| **label** | Specifies the label of the component. | Any string value like 'Select a date range' |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/daterange.png" alt="Form custom schema" />

</div>

### Multiselect

**Properties**

```js
multiselect1: {
    type: 'multiselect',
    styles: {
        disabled: false,
        visibility: 'true',
        borderRadius: 5
    },
    displayValues: ["one", "two", "three"],
    label: 'Select options of your choice',
    value: [2, 3],
    values: [1, 2, 3],
    showAllOption: true
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'multiselect' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `disabled`, `visibility`, `borderRadius` etc. |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 5 |
| **displayValues** | Specifies the value for option labels in an array format. | Array of strings like `["one", "two", "three"]` |
| **label** | Specifies the label of the component. | Any string value like 'Select options of your choice' |
| **value** | Specifies the default value(s) in an array. | Array of values like `[2, 3]` |
| **values** | Specifies the values in an array. | Array of values like `[1, 2, 3]` |
| **showAllOption** | Specifies whether to show the 'All' option in the multiselect or not. | set `true` to show the 'All' option or `false` to hide it |


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/multiselect.png" alt="Form custom schema" />

</div>

### Star Rating

**Properties**

```js
starRating1: {
    type: 'starrating',
    styles: {
        disabled: false,
        visibility: 'true',
        textColor: 'yellow',
        labelColor: 'red'
    },
    allowHalfStar: true,
    defaultSelected: 4.5,
    maxRating: 10,
    tooltips: ['one', 'two', 'three', 'four'],
    label: 'Select a rating'
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'starrating' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `disabled`, `visibility`, `textColor`, `labelColor` etc. |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **textColor** | Specifies the color of the stars. | Color name or Hex color code '#f6f5ff' |
| **labelColor** | Specifies the color of the label. | Color name or Hex color code '#f6f5ff' |
| **allowHalfStar** | Specifies whether to allow selection of half star rating or not. | set `true` to allow half-star ratings or `false` to disable it |
| **defaultSelected** | Specifies the default value of the star rating. | Numeric value like 4.5 |
| **maxRating** | Specifies the maximum rating. | Numeric value like 10 |
| **tooltips** | Specifies the tooltips for each star in an array. | Array of strings like `['one', 'two', 'three', 'four']` |
| **label** | Specifies the label of the component. | Any string value like 'Select a rating' |


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/star.png" alt="Form custom schema" />

</div>

### File Picker

**Properties**

```js
filepicker1: {
    type: 'filepicker',
    styles: {
        visibility: 'true',
        borderRadius: 10
    },
    enableMultiple: true,
    fileType: '*/*',
    instructionText: 'Click here to select files',
    maxFileCount: 5,
    maxSize: 6000000,
    minSize: 25,
    parseContent: true,
    parseFileType: 'csv',
    label: 'Select a file'
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'filepicker' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `visibility`, `borderRadius` etc. |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 10 |
| **enableMultiple** | Specifies whether to enable multiple file selection or not. | set `true` to enable multiple file selection or `false` to disable it |
| **fileType** | Specifies the mime file type. | Mime types like '*/*' (accepts all file types) |
| **instructionText** | Specifies the instruction text of the file picker. | Any string value like 'Click here to select files' |
| **maxFileCount** | Specifies the maximum number of files that can be selected. | Numeric value like 5 |
| **maxSize** | Specifies the maximum size of the file in bytes. | Numeric value like 6000000 (6MB) |
| **minSize** | Specifies the minimum size of the file in bytes. | Numeric value like 25 |
| **parseContent** | Specifies whether to parse the content of the file or not. | set `true` to parse the content or `false` to disable it |
| **parseFileType** | Specifies the file type to parse (e.g., csv, text, xlsx). | File type like 'csv' |
| **label** | Specifies the label of the component. | Any string value like 'Select a file' |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/filepicker.png" alt="Form custom schema" />

</div>

### Text Input

**Properties**

```js
textinput1: {
    type: 'textinput',
    value: 'Random text',
    placeholder: 'enter first name here',
    label: 'First name',
    validation: {
        maxLength: 6
    },
    styles: {
        backgroundColor: 'red',
        borderRadius: 20,
        errorTextColor: 'green',
        disabled: false,
        visibility: false,
        textColor: 'yellow'
    }
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'textinput' |
| **value** | Specifies the default value of the text input. | Any string value like 'Random text' |
| **placeholder** | Specifies the placeholder text of the text input. | Any string value like 'enter first name here' |
| **label** | Specifies the label of the component. | Any string value like 'First name' |
| **validation** | Specifies validation rules for the text input. | Object containing `maxLength` property |
| **maxLength** | Specifies the maximum length validation of the text input. | Numeric value like 6 |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `backgroundColor`, `borderRadius`, `errorTextColor`, `disabled`, `visibility`, `textColor` etc. |
| **backgroundColor** | Specifies the background color of the component. | Color name or Hex color code '#f6f5ff' |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 20 |
| **errorTextColor** | Specifies the color of the error text. | Color name or Hex color code '#f6f5ff' |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `false` to hide the component or `true` to show it |
| **textColor** | Specifies the text color of the component. | Color name or Hex color code '#f6f5ff' |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/textinput.png" alt="Form custom schema" />

</div>

### Dropdown

**Properties**

```js
dropdown1: {
    type: 'dropdown',
    displayValues: [1, 2, 3],
    values: ['one', 'two', 'three'],
    loading: false,
    value: 'two',
    label: 'Select a number',
    styles: {
        disabled: false,
        visibility: 'true',
        borderRadius: 5,
        justifyContent: 'end'
    }
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'dropdown' |
| **displayValues** | Specifies the value for option labels in an array format. | Array of values like `[1, 2, 3]` |
| **values** | Specifies the option labels in an array. | Array of strings like `['one', 'two', 'three']` |
| **loading** | Specifies whether to show the loading state or not. | set `true` to show the loading state or `false` to hide it |
| **value** | Specifies the default selected value of the dropdown. | Any value from the `values` array, like 'two' |
| **label** | Specifies the label of the component. | Any string value like 'Select a number' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `disabled`, `visibility`, `borderRadius`, `justifyContent` etc. |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **borderRadius** | Specifies the border radius of the component. | Numeric value like 5 |
| **justifyContent** | Specifies the alignment of the dropdown options. | 'start', 'center', or 'end' |


<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/dropdown.png" alt="Form custom schema" />

</div>

### Button

**Properties**

```js
button1: {
    type: 'button',
    value: 'Submit',
    label: '',
    styles: {
        backgroundColor: 'blue',
        textColor: 'white',
        borderRadius: 5,
        borderColor: 'black',
        loaderColor: 'gray',
        visibility: 'true',
        disabled: true
    }
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'button' |
| **value** | Specifies the button text. | Any string value like 'Submit' |
| **label** | Specifies the label of the component. | Set to `''` (empty string) to hide the label |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `backgroundColor`, `textColor`, `borderRadius`, `borderColor`, `loaderColor`, `visibility`, `disabled` etc. |
| **backgroundColor** | Specifies the background color of the button. | Color name or Hex color code '#f6f5ff' |
| **textColor** | Specifies the text color of the button. | Color name or Hex color code '#f6f5ff' |
| **borderRadius** | Specifies the border radius of the button. | Numeric value like 5 |
| **borderColor** | Specifies the border color of the button. | Color name or Hex color code '#f6f5ff' |
| **loaderColor** | Specifies the color of the loader on the button. | Color name or Hex color code '#f6f5ff' |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/button.png" alt="Form custom schema" />

</div>

### Text

**Properties**

```js
text1: {
    type: 'text',
    value: 'This is a text component',
    label: '',
    styles: {
        backgroundColor: '#f6f5ff',
        textColor: 'red',
        fontSize: 24,
        fontWeight: 30
    }
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'text' |
| **value** | Specifies the value of the text component. | Any string value like 'This is a text component' |
| **label** | Specifies the label of the component. | Set to `''` (empty string) to hide the label |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `backgroundColor`, `textColor`, `fontSize`, `fontWeight` etc. |
| **backgroundColor** | Specifies the background color of the text. | Color name or Hex color code '#f6f5ff' |
| **textColor** | Specifies the text color of the text. | Color name or Hex color code '#f6f5ff' |
| **fontSize** | Specifies the font size of the text. | Numeric value like 24 |
| **fontWeight** | Specifies the font weight of the text. | Numeric value like 30 |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/text.png" alt="Form custom schema" />

</div>

### Radio

**Properties**

```js
radioButton1: {
    type: 'radio',
    styles: {
        textColor: 'black',
        disabled: false,
        visibility: 'true'
    },
    displayValues: ['option 1', 'option 2', 'option 3'],
    label: 'Radio Buttons',
    value: 2,
    values: [1, 2, 3]
}
```

| Key | Description | Expected Value |
| :----------- | :----------- | :-----------|
| **type** | Specifies the type of component. | 'radio' |
| **styles** | Specifies the styles of the component. | Object that will contain the styles of the component like `textColor`, `disabled`, `visibility` etc. |
| **textColor** | Specifies the text color of the radio options. | Color name or Hex color code '#f6f5ff' |
| **disabled** | Specifies whether to disable the component or not. | set `true` to disable the component or `false` to enable it |
| **visibility** | Specifies whether to show the component or not. | set `'true'` to show the component or `'false'` to hide it |
| **displayValues** | Specifies the value for labels in an array format. | Array of strings like `['option 1', 'option 2', 'option 3']` |
| **label** | Specifies the label of the component. | Any string value like 'Radio Buttons' |
| **value** | Specifies the default selected value of the radio button. | Any value from the `values` array, like 2 |
| **values** | Specifies the values in an array. | Array of values like `[1, 2, 3]` |

<div style={{textAlign:'center'}}>

<img className="screenshot-full" src="/img/widgets/form/radio.png" alt="Form custom schema" />

</div>

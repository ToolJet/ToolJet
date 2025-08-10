---
id: schema
title: Custom Schema
---

In this guide, we’ll cover some of the most commonly used custom schemas.
For more information:
- On how to generate a form, refer to the [Generate Form](/docs/widgets/form/form) guide.
- For available form properties, refer to the [Properties](/docs/widgets/form/properties) guide.
- For CSAs and exposed variables, refer to the [CSA and Exposed Variables](/docs/widgets/form/csa) guide.

## Datepicker

Properties that can be used in Datepicker schema are:

```js
  "datepicker1": {
    "type": "datepicker",
    "styles": {
      "borderRadius": 5,
      "disabled": false,
      "visibility": "true"
    },
    "value": "09/09/2025",
    "disabledDates": ["08/09/2025"],
    "enableTime": true,
    "format": "DD/MM/YYYY",
    "label": "Date of Birth"
  }
```

|  Key | Description | Expected Value  |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `datepicker` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *borderRadius*, *disabled*, *visibility*, etc. |
| borderRadius | Specifies the border radius of the component. | Numeric value like 5, 10, 20 etc. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| value | Specifies the default date of the datepicker. | Date in correct format. |
| disabledDates | Specifies the dates that you want to disable. | Dates in an array, in the correct format. |
| enableTime | Specifies whether to enable time or not. | Set `true` to enable time or `false` to disable it. |
| format | Specifies the format of the date. | 'DD/MM/YYYY' |
| label | Specifies the label of the component. | Any string value. |

## Number Input

```js
"numberInput1": {
  "type": "number",
  "styles": {
    "backgroundColor": "#f6f5ff",
    "borderRadius": 3,
    "textColor": "#025aa3",
    "borderColor": "blue",
    "disabled": false,
    "visibility": "true"
  },
  "value": 10,
  "maxValue": 12,
  "minValue": 6,
  "placeholder": "Enter a Number",
  "label": "Number Input"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | 'number' |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *backgroundColor*, *borderRadius*, *textColor*, *borderColor*, *disabled*, *visibility* etc. |
| backgroundColor | Specifies the background color of the component. | Color name or Hex color code. |
| borderRadius | Specifies the border radius of the component. | Numeric value like 5, 10, 20 etc. |
| textColor | Specifies the text color of the component. | Color name or Hex color code. |
| borderColor | Specifies the border color of the component. | Color name or Hex color code. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| value | Specifies the default value of the number input. | Numeric value |
| maxValue | Specifies the maximum value of the number input. | Numeric value |
| minValue | Specifies the minimum value of the number input. | Numeric value |
| placeholder | Specifies the placeholder text of the number input. | Any string value |
| label | Specifies the label of the component. | Any string value |

## Password

```js
"passwordInput1": {
  "type": "password",
  "styles": {
    "backgroundColor": "#f6f5ff",
    "borderRadius": 5,
    "disabled": false,
    "visibility": "true"
  },
  "validation": {
    "maxLength": 9,
    "minLength": 5,
    "regex": "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$"
  },
  "placeholder": "Enter Password",
  "label": "Password"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `password` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *backgroundColor*, *borderRadius*, *disabled*, *visibility* etc. |
| backgroundColor | Specifies the background color of the component. | Color name or Hex color code. |
| borderRadius | Specifies the border radius of the component. | Numeric value like 10. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| validation | Specifies validation rules for the password. | Object containing *maxLength*, *minLength*, and *regex* properties. |
| maxLength | Specifies the maximum length of the password. | Numeric value like 9. |
| minLength | Specifies the minimum length of the password. | Numeric value like 5. |
| regex | Specifies the regular expression for password validation. | Regular expression pattern like `'^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$'` |
| placeholder | Specifies the placeholder text of the password input. | Any string value like 'Enter a password'. |
| label | Specifies the label of the component. | Any string value. |

## Checkbox

```js
"checkbox1": {
  "type": "checkbox",
  "styles": {
    "checkboxColor": "#025aa3",
    "disabled": false,
    "textColor": "#025aa3",
    "visibility": "true"
  },
  "value": false,
  "label": "Checkbox"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `checkbox` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *checkboxColor*, *disabled*, *textColor*, *visibility*, etc. |
| checkboxColor | Specifies the color of the checkbox. | Color name or Hex color code.  |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| textColor | Specifies the text color of the component. | Color name or Hex color code.  |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| value | Specifies the default value of the checkbox. | Boolean value (true or false). |
| label | Specifies the label of the component. | Any string value like 'Accept T&C'. |

## Toggle

```js
"toggleswitch1": {
  "type": "toggle",
  "styles": {
    "textColor": "#025aa3",
    "disabled": false,
    "visibility": "true",
    "toggleSwitchColor": "#025aa3"
  },
  "value": true,
  "label": "Toggle switch"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `toggle` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *textColor*, *disabled*, *visibility*, *toggleSwitchColor* etc. |
| textColor | Specifies the text color of the component. | Color name or Hex color code.  |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| toggleSwitchColor | Specifies the color of the toggle switch. | Color name or Hex color code.  |
| value | Specifies the default value of the toggle switch. | Boolean value (true or false) |
| label | Specifies the label of the component. | Any string value. |

## Text Area

```js
"textArea1": {
  "type": "textarea",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "borderRadius": 5
  },
  "value": "This is a text area",
  "placeholder": "Enter Text Here",
  "label": "Text Area"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `textarea` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *disabled*, *visibility*, *borderRadius*, etc. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| borderRadius | Specifies the border radius of the component. | Numeric value. |
| value | Specifies the default value of the text area. | String value. |
| placeholder | Specifies the placeholder text of the text area. | String value. |
| label | Specifies the label of the component. | String value. |

## Date Range Picker

```js
"daterangepicker1": {
  "type": "daterangepicker",
  "styles": {
    "disabled": true,
    "visibility": "true",
    "borderRadius": 5
  },
  "defaultEndDate": "12/04/2022",
  "defaultStartDate": "1/04/2022",
  "format": "DD/MM/YYYY",
  "label": "Select a Date Range"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | *daterangepicker* |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *disabled*, *visibility*, *borderRadius*, etc. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| borderRadius | Specifies the border radius of the component. | Numeric value. |
| defaultEndDate | Specifies the default end date. | Date in the correct format. |
| defaultStartDate | Specifies the default start date. | Date in the correct format. |
| format | Specifies the format of the date. | 'DD/MM/YYYY' |
| label | Specifies the label of the component. | String value. |

## Multiselect

```js
"multiselect1": {
  "type": "multiselect",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "borderRadius": 5
  },
  "displayValues": ["one", "two", "three"],
  "label": "Select Options of Your Choice",
  "value": [2, 3],
  "values": [1, 2, 3],
  "showAllOption": true
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `multiselect` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *disabled*, *visibility*, *borderRadius* etc. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| borderRadius | Specifies the border radius of the component. | Numeric value. |
| displayValues | Specifies the value for option labels in an array format. | Array of strings like `["one", "two", "three"]`. |
| label | Specifies the label of the component. | String value. |
| value | Specifies the default value(s) in an array. | Array of values like `[2, 3]`. |
| values | Specifies the values in an array. | Array of values like `[1, 2, 3]`. |
| showAllOption | Specifies whether to show the 'All' option in the component or not. | Set `true` to show the 'All' option or `false` to hide it. |

## Star Rating

```js
"starRating1": {
  "type": "starrating",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "textColor": "gold",
    "labelColor": "#025aa3"
  },
  "allowHalfStar": true,
  "defaultSelected": 3.5,
  "maxRating": 5,
  "tooltips": ["one", "two", "three", "four"],
  "label": "Select a Rating"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `starrating` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *disabled*, *visibility*, *textColor*, *labelColor* etc. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| textColor | Specifies the color of the stars. | Color name or Hex color code.  |
| labelColor | Specifies the color of the label. | Color name or Hex color code.  |
| allowHalfStar | Specifies whether to allow selection of half star rating or not. | Set `true` to allow half-star ratings or `false` to disable it. |
| defaultSelected | Specifies the default value of the star rating. | Numeric value |
| maxRating | Specifies the maximum rating. | Numeric value |
| tooltips | Specifies the tooltips for each star in an array. | Array of strings like `['one', 'two', 'three', 'four']`. |
| label | Specifies the label of the component. | String value. |

## File Picker

```js
"filepicker1": {
  "type": "filepicker",
  "styles": {
    "visibility": "true",
    "borderRadius": 10
  },
  "enableMultiple": true,
  "fileType": "*/*",
  "instructionText": "Click here to select files",
  "maxFileCount": 5,
  "maxSize": 6000000,
  "minSize": 25,
  "parseContent": true,
  "parseFileType": "csv",
  "label": "Select a File"
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `filepicker` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *visibility*, *borderRadius* etc. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| borderRadius | Specifies the border radius of the component. | Numeric value |
| enableMultiple | Specifies whether to enable multiple file selection or not. | Set `true` to enable multiple file selection or `false` to disable it. |
| fileType | Specifies the mime file type. | Mime types like '*/*' (accepts all file types). |
| instructionText | Specifies the instruction text of the file picker. | String value |
| maxFileCount | Specifies the maximum number of files that can be selected. | Numeric value |
| maxSize | Specifies the maximum size of the file in bytes. | Numeric value like 6000000 (6 MB). |
| minSize | Specifies the minimum size of the file in bytes. | Numeric value like 25. |
| parseContent | Specifies whether to parse the content of the file or not. | Set `true` to parse the content or `false` to disable it. |
| parseFileType | Specifies the file type to parse (e.g., csv, text, xlsx). | File type |
| label | Specifies the label of the component. | String value. |

## Text Input

```js
"textinput1": {
  "type": "textinput",
  "value": "John",
  "placeholder": "Enter the Name Here",
  "label": "First Name",
  "validation": {
    "maxLength": 6
  },
  "styles": {
    "backgroundColor": "#f6f5ff",
    "borderRadius": 5,
    "errorTextColor": "#025aa3",
    "disabled": false,
    "visibility": false,
    "textColor": "#025aa3"
  }
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `textinput` |
| value | Specifies the default value of the text input. | String value |
| placeholder | Specifies the placeholder text of the text input. | String value |
| label | Specifies the label of the component. | String value |
| validation | Specifies validation rules for the text input. | Object containing `maxLength` property. |
| maxLength | Specifies the maximum length validation of the text input. | Numeric value |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *backgroundColor*, *borderRadius*, *errorTextColor*, *disabled*, *visibility*, *textColor* etc. |
| backgroundColor | Specifies the background color of the component. | Color name or Hex color code.  |
| borderRadius | Specifies the border radius of the component. | Numeric value |
| errorTextColor | Specifies the color of the error text. | Color name or Hex color code.  |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `false` to hide the component or `true` to show it. |
| textColor | Specifies the text color of the component. | Color name or Hex color code.  |

## Dropdown

```js
"dropdown1": {
  "type": "dropdown",
  "displayValues": ["One", "Two", "Three"],
  "values": [1, 2, 3],
  "loading": false,
  "value": 2,
  "label": "Select a Number",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "borderRadius": 5,
    "justifyContent": "start"
  }
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `dropdown` |
| displayValues | Specifies the value for option labels in an array format. | Array of values like `[1, 2, 3]`. |
| values | Specifies the option labels in an array. | Array of strings like `['one', 'two', 'three']`. |
| loading | Specifies whether to show the loading state or not. | Set `true` to show the loading state or `false` to hide it. |
| value | Specifies the default selected value of the dropdown. | Any value from the `values` array. |
| label | Specifies the label of the component. | String value |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *disabled*, *visibility*, *borderRadius*, *justifyContent* etc. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| borderRadius | Specifies the border radius of the component. | Numeric value |
| justifyContent | Specifies the alignment of the dropdown options. | `start`, `center`, or `end` |

## Button

```js
"button1": {
  "type": "button",
  "value": "Submit",
  "label": "",
  "styles": {
    "backgroundColor": "#3A433B",
    "textColor": "white",
    "borderRadius": 5,
    "borderColor": "#595959",
    "loaderColor": "gray",
    "visibility": "true",
    "disabled": true
  }
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `button` |
| value | Specifies the button text. | String value |
| label | Specifies the label of the component. | String value |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *backgroundColor*, *textColor*, *borderRadius*, *borderColor*, *loaderColor*, *visibility*, *disabled* etc. |
| backgroundColor | Specifies the background color of the button. | Color name or Hex color code.  |
| textColor | Specifies the text color of the button. | Color name or Hex color code.  |
| borderRadius | Specifies the border radius of the button. | Numeric value |
| borderColor | Specifies the border color of the button. | Color name or Hex color code.  |
| loaderColor | Specifies the color of the loader on the button. | Color name or Hex color code.  |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |

## Text

```js
"text1": {
  "type": "text",
  "value": "This is a text component",
  "label": "",
  "styles": {
    "backgroundColor": "#f6f5ff",
    "textColor": "#025aa3",
    "fontSize": 12,
    "fontWeight": 500
  }
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `text` |
| value | Specifies the value of the text component. | String value |
| label | Specifies the label of the component. | String value |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *backgroundColor*, *textColor*, *fontSize*, *fontWeight* etc. |
| backgroundColor | Specifies the background color of the text. | Color name or Hex color code.  |
| textColor | Specifies the text color of the text. | Color name or Hex color code.  |
| fontSize | Specifies the font size of the text. | Numeric value |
| fontWeight | Specifies the font weight of the text. | Numeric value |

## Radio

```js
"radioButton1": {
  "type": "radio",
  "styles": {
    "textColor": "black",
    "disabled": false,
    "visibility": "true"
  },
  "displayValues": ["Yes", "No"],
  "label": "Radio Buttons",
  "value": 1,
  "values": [1, 2]
}
```

| <div style={{ width:"100px"}}> Key </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------- | :----------- | :-----------|
| type | Specifies the type of component. | `radio` |
| styles | Specifies the styles of the component. | Object that will contain the styles of the component like *textColor*, *disabled*, *visibility*, etc. |
| textColor | Specifies the text color of the radio options. | Color name or Hex color code.  |
| disabled | Specifies whether to disable the component or not. | Set `true` to disable the component or `false` to enable it. |
| visibility | Specifies whether to show the component or not. | Set `true` to show the component or `false` to hide it. |
| displayValues | Specifies the value for labels in an array format. | Array of strings like `['option 1', 'option 2', 'option 3']`. |
| label | Specifies the label of the component. | String value |
| value | Specifies the default selected value of the radio button. | Any value from the `values` array. |
| values | Specifies the values in an array. | Array of values like `[1, 2, 3]`. |

---
sidebar_position: 12
---

# Radio Button

Radio button widget can be used to select one option from a group of options.

<img class="screenshot-full" src="/img/widgets/radio-button/radiobutton.gif" alt="oolJet - Widget Reference - RadioButton " height="420"/>

:::tip
Radio buttons are preferred when the list of options is less than six, and all the options can be displayed at once.
:::

:::info
For more than six options, consider using [Dropdown](/docs/widgets/dropdown) widget.
:::


## Event: On select

This event is triggered when an option is clicked.


#### Properties

| properties      | description |
| ----------- | ----------- |
| Label | The text is to be used as the label for the radio button. |
| Default value | The value of the default option. |
| Option values | List of values for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.value)}}` or populate it with sample values `{{[true, false]}}`  |
| Option labels | List of labels for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.label)}}` or populate it with sample values `{{["yes", "no"]}}` |


## Example
<img class="screenshot-full" src="/img/widgets/radio-button/radiobutton-example.gif" alt="ToolJet - Radio Button Widget Properties" height="420"/>

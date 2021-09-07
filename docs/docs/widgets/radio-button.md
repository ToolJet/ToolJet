---
sidebar_position: 10
---

# Radio Button

Radio Buttons can be used to select one option from a group of options.

<img class="screenshot-full" src="/img/widgets/radio-button/radiobutton.gif" alt="oolJet - Widget Reference - RadioButton " height="420"/>

:::tip
Radio buttons are preferred when the list of options is less than six and all the options can be displayed at once.
:::

:::info
For more than six options, consider using [Dropdown](/docs/widgets/dropdown) widget.
:::


## Event: On select

This event is triggered when an option is clicked.


#### Properties

| properties      | description |
| ----------- | ----------- |
| Label | The text to be used in a label of the radio button. |
| Default value | It is the default option that will be selected as user input unless it is changed. |
| Option values | List of values for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.value)}}` or populate it with sample values `{{[true, false]}}`  |
| Option labels | List of labels for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.label)}}` or populate it with sample values `{{["yes", "no"]}}` |


## Example
<img class="screenshot-full" src="/img/widgets/radio-button/radiobutton-example.gif" alt="ToolJet - Radio Button Widget Properties" height="420"/>

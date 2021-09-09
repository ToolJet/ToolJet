---
sidebar_position: 6
---

# Dropdown

Dropdown widget can be used to collect user input from a list of options.


<img class="screenshot-full" src="/img/widgets/dropdown/dropdown.gif" alt="ToolJet - Widget Reference - Dropdown" height="420"/>

:::tip
Dropdown options can be refered to your query data with dynamic variables.
:::

<img class="screenshot-full" src="/img/widgets/dropdown/dropdown-dynamicvalues.gif" alt="ToolJet - Widget Reference - Dropdown" height="420"/>


## Event: On select

On select event is triggered when option is selected.

#### Properties

| properties      | description |
| ----------- | ----------- |
| Label | The text to be used as the label of the dropdown. |
| Default value | It is the default option that will be selected as user input unless it is changed. |
| Option values | Values for different items/options in the list of the dropdown. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.value)}}` or populate it with sample values `{{[1,2,3]}}`  |
| Option labels | Labels for different items/options in the list of the dropdown. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.label)}}` or populate it with sample values `{{["one", "two", "three"]}}` |
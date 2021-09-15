---
sidebar_position: 6
---

# Dropdown

The Dropdown widget can be used to collect user input from a list of options.


<img class="screenshot-full" src="/img/widgets/dropdown/dropdown.gif" alt="ToolJet - Widget Reference - Dropdown" height="420"/>

:::tip
Dropdown options can be referred to your query data with dynamic variables.
:::

<img class="screenshot-full" src="/img/widgets/dropdown/dropdown-dynamicvalues.gif" alt="ToolJet - Widget Reference - Dropdown" height="420"/>


## Event: On select

On select event is triggered when an option is selected.

#### Properties

| properties      | description |
| ----------- | ----------- |
| Label | The text is to be used as the label of the dropdown. |
| Default value | Value of the default option. |
| Option values | Option values are values for different options in the list of the dropdown. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.value)}}` or populate it with sample values `{{[1,2,3]}}`  |
| Option labels | Option labels are labels for different options in the list of the dropdown. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.label)}}` or populate it with sample values `{{["one", "two", "three"]}}` |
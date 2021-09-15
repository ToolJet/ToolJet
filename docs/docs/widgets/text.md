---
sidebar_position: 17
---

# Text

Text widget can be used to display text.

:::info
Users cannot enter and edit text.
:::


<img class="screenshot-full" src="/img/widgets/text/text.gif" alt="ToolJet - Widget Reference - Text" height="420"/>


#### Properties

| properties      | description |
| ----------- | ----------- |
| Text |  This property sets the content/text inside the Text widget. Refer your query data with dynamic variables `{{queries.datasource.data.text}}` or populate it with sample values `Text goes here !` |
 Loading state | Shows a loading status if the value is `true`. This property is often used with the `isLoading` property of queries so that the table shows a spinner while the query is being run. Default value is `false`.|
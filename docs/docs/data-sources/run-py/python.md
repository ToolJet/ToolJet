---
id: python-integration
title: Python Integration
slug: /data-sources/run-py
---

In ToolJet, custom **Run Python Code** can be used to interact with components and queries, making it possible to customize actions and data handling.

<img className="screenshot-full" src="/img/datasource-reference/custom-python/add-run-py.png" alt="Run Python code" />

<div style={{paddingTop:'24px'}}>

## Using Python Code to Trigger Component Specific Actions

1. Drag a **Text** component onto the canvas. We will set the text on the Text component using the Python query.
2. Create a query and select **Run Python code** from the available data sources
3. Paste the below code in the code editor and save the query:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        
    def myfunc(self):
        return "Hello my name is " + self.name

p1 = Person(tj_globals.currentUser.firstName, 36)

components.text1.setText(p1.myfunc())
```

4. The above code has a function `myfunc` which returns a string and we are using a **[Component Specific Action](/docs/tooljet-concepts/component-specific-actions)** to set the Text Component's value from the Python query. 

:::tip
- As of now, Run Python code only supports the [Python standard library](https://docs.python.org/3/library/).
- Check **[RunPy Limitations](/docs/contributing-guide/troubleshooting/runpy-limitations)** to go through the limitations with using Python code
:::

</div>

<div style={{paddingTop:'24px'}}>

## Trigger Queries Using Run Python Code

To trigger queries in Python, you can use the below functions:

```py
actions.runQuery('getSalesData')
#replace getSalesData with your query name
```
Or
```py
queries.getSalesData.run()
#replace getSalesData with your query name
```
</div>

<div style={{paddingTop:'24px'}}>

## Refer Python Query Data in Components

Just like other dynamic values, you can refer the data returned by **Run Python code** queries using double curly braces`{{}}`.

For instance, if you have a **Run Python code** query named *updatedProductInfo*, you can pass `{{queries.updatedProductInfo.data}}` under the **Data** property of a Table component to populate it with the data returned by the *updatedProductInfo* query. 

<img className="screenshot-full" src="/img/datasource-reference/custom-python/query-data.png" alt="Python Query Data in Components" />

:::info
Issues with writing custom Python code? Ask in our [Slack community](https://www.tooljet.com/slack).
:::

</div>
---
id: python-integration
title: Python Integration
slug: /data-sources/run-py
---

In ToolJet, custom **Run Python Code** can be used to interact with components and queries, making it possible to customize actions and data handling.

<img className="screenshot-full" src="/img/datasource-reference/custom-python/add-run-py-v2.png" alt="Run Python code" />

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

## Parameters in Run Python Code

Parameters allow for dynamic control over the Python code execution without altering the core script. This provides flexibility by allowing the same code to execute with different inputs.

Each parameter requires:
- **Name**: Name for the parameter
- **Default value**: The value can be constant strings, numbers and object.

### Steps to Add a Parameter

1. In the RunPY query editor, click the **Parameters - + Add** button to create a new parameter.
2. Provide a **Name** for the parameter.
3. Set a Default **Value**, which can be a string, number, or object.

Once added, the **parameter can be referenced in the code using the syntax**: `parameters.<name>`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/js-param.png" alt="Run JavaScript code" />

</div>

### Displaying a Parameter Value

Let's create a new parameter named *getData* and set the value as object `22` and use the run button to show the value in the preview.

Syntax:
```
parameters.getData
```

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/param-alert.png" alt="Run JavaScript code" />

### Calling Another Query with Parameters

Parameters can also be used to trigger other queries and pass custom values. Below is an example of how to call one query from another by providing custom parameters.

1. Begin by creating a new RunJS query named *multiply*. 
    - In this query, add the following parameters: 

        - *num1* with a default value of **10**
        - *num2* with a default value of **2**.
    - Add the following JavaScript Code:

    ```javascript
    return parameters.num1 * parameters.num2;
    ```
    - To display the result, place a text component on the canvas and set its text to `{{queries.multiply.data}}`.
    <br/>
    <img className="screenshot-full" src="/img/datasource-reference/custom-javascript/multiply-v2.png" alt="Run JavaScript code" />

2. Now, let's create another RunJS query called *callMultiply*, where we will invoke the *multiply* query created earlier using custom parameter values. Here's the code snippet for *callMultiply*:
 
    ```js
    queries.multiply.run({num1: 20, num2: 7})
    ```
 
    By executing this code within *callMultiply*, we trigger the *multiply* query with specific values for its parameters.
 
    <img className="screenshot-full" src="/img/datasource-reference/custom-javascript/call-multiply-v2.png" alt="Run JavaScript code" />

With this setup, the *multiply* query can be called from other queries, such as *callMultiply*, by providing custom parameter values. This allows you to reuse the *multiply* query with different inputs and display the results accordingly.


## Refer Python Query Data in Components

Just like other dynamic values, you can refer the data returned by **Run Python code** queries using double curly braces`{{}}`.

For instance, if you have a **Run Python code** query named *updatedProductInfo*, you can pass `{{queries.updatedProductInfo.data}}` under the **Data** property of a Table component to populate it with the data returned by the *updatedProductInfo* query. 

<img className="screenshot-full" src="/img/datasource-reference/custom-python/query-data.png" alt="Python Query Data in Components" />

:::info
Issues with writing custom Python code? Ask in our [Slack community](https://www.tooljet.com/slack).
:::

</div>
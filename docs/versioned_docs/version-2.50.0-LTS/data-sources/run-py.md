---
id: run-py
title: Run Python Code
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

## Get Query Data

To immediately access the data returned by a query in **Run Python code**, you can use the below functions: 

### Trigger a Query and Retrieve its Data

```py
await queries.getSalesData.run()
#replace getSalesData with your query name

value = queries.getSalesData.getData()
#replace getSalesData with your query name

value
```

### Trigger a Query and Retrieve its Raw Data

```py
await queries.getCustomerData.run()
#replace getCustomerData with your query name

value = queries.getCustomerData.getRawData()
#replace getCustomerData with your query name

value
```

### Trigger a Query and Retrieve its Loading State

```py
await queries.getTodos.run()
#replace getTodos with your query name

value = queries.getTodos.getLoadingState()
#replace getTodos with your query name

value
```

</div>

<div style={{paddingTop:'24px'}}>

## Get Variables

To set and access variables or page variables in **Run Python code**, you can use the below functions:

### Set a Variable

```py
actions.setVariable('color','blue')
#replace color with your desired variable name
```

### Immediately Retrieve a Variable After Setting it

```py
actions.setVariable('mode','dark')
#replace mode with your desired variable name

actions.getVariable('mode')
#replace mode with your desired variable name
```

### Set a Page-Specific Variable

```py
actions.setPageVariable('version', 1)
#replace version with your desired variable name
```

### Immediately Retrieve a Page-Specific Variable After Setting it

```py
actions.setPageVariable('number',1)
#replace number with your desired variable name

actions.getPageVariable('number')
#replace number with your desired variable name
```

</div>

<div style={{paddingTop:'24px'}}>

## Using Transformations With Python

**Run Python code** can be used to transform the data that is fetched in the queries. To test transformations using Python, create a new **REST API** query, leave the method as *GET* and enter the below url under the **URL** property.

```yaml
https://dummyjson.com/products
```

Click on the **Run** button and check the preview of the returned data, below is the data structure of the response:

```js
products_data = {
    "products": [
        {"title": "iPhone 9", ...},
        {"title": "iPhone X", ...},
        # Additional products...
    ]
}
```

### Filter the Titles From the Response

To extract a list of product titles from the given data structure, we iterate through the *products* list and collect each product's *title* using the below code. Enable **Transformations** in the Query Editor and use the below code:

```python
return [product["title"] for product in data["products"]]
```

### Filter Products by Category

To filter products by a specific category, such as *smartphones*, and extract their titles. Enable **Transformations** in the Query Editor and use the below code:

```python
return [product["title"] for product in data["products"] if product["category"] == "smartphones"]
```

### Calculate Average Price of a Category

To calculate the average price of products within the *laptops* category. Enable **Transformations** in the Query Editor and use the below code:

```python
return sum(product["price"] for product in data["products"] if product["category"] == "laptops") / len([product for product in data["products"] if product["category"] == "laptops"]) if len([product for product in data["products"] if product["category"] == "laptops"]) > 0 else 0
```

</div>

<div style={{paddingTop:'24px'}}>

## Refer Python Query Data in Components

Just like other dynamic values, you can refer the data returned by **Run Python code** queries using double curly braces`{{}}`.

For instance, if you have a **Run Python code** query named *updatedProductInfo*, you can pass `{{queries.updatedProductInfo.data}}` under the **Data** property of a Table component to populate it with the data returned by the *updatedProductInfo* query. 

:::info
Issues with writing custom Python code? Ask in our [Slack community](https://www.tooljet.com/slack).
:::

</div>

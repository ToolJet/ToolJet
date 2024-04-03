---
id: run-py
title: Run Python code
---

You can write custom Python code to interact with components and queries. To do that, you need to create a new query and select **Run Python code** from the available data sources.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/custom-python/add-run-py.png" alt="Run Python code" />
</div>

## Using Python Code to Trigger Component Specific Actions

- Drag a **Text** component onto the canvas. We will set the text on the Text component using the Python query.
- Create a query and select **Run Python code** from the available data sources
- Paste the below code in the code editor and save the query:

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

- The above code has a function `myfunc` which returns a string and we are using a **[Component Specific Action](/docs/tooljet-concepts/component-specific-actions)** to set the Text Component's value from the Python query. 

:::tip
- As of now, Run Python code only supports the [Python standard library](https://docs.python.org/3/library/).
- Check **[RunPy Limitations](/docs/contributing-guide/troubleshooting/runpy-limitations)** to go through the limitations with using Python code
:::

## Trigger Queries
To trigger queries in Python, you can use the below functions:

```py
actions.runQuery('getSalesData')
#replace getSalesData with your query name
```

```py
queries.getSalesData.run()
#replace getSalesData with your query name
```

## Get Query Data

To immediately access the data returned by a query in **Run Python code**, you can use the below functions: 

#### Retrieve the latest data of a query:
```py
response = await queries.getSalesData.run()
#replace getSalesData with your query name

value = queries.getSalesData.getData()
#replace getSalesData with your query name

value
```

#### Retrieve the latest raw data of a query:
```py
response = await queries.getCustomerData.run()
#replace getCustomerData with your query name

value = queries.getCustomerData.getRawData()
#replace getCustomerData with your query name

value
```

#### Retrieve the loading state of a query:
```py
response = await queries.getTodos.run()
#replace getTodos with your query name

value = queries.getTodos.getLoadingState()
#replace getTodos with your query name

value
```

## Get Variables

To immediately access a variable or page variable after setting it in the **Run Python code**, you can use the below functions.

#### Retrieve the current value of a variable: 
```py
actions.setVariable('mode','dark')
#replace mode with your desired variable name

actions.getVariable('mode')
#replace mode with your desired variable name
```

#### Retrieve the current value of a page-specific variable:
```py
actions.setPageVariable('number',1)
#replace number with your desired variable name

actions.getPageVariable('number')
#replace number with your desired variable name
```

## Using Transformations With Python
**Run Python code** can be used to transform the data that is fetched in the queries. To test transformations using Python, create a new `REST API` query, leave the method as `GET` and enter the below url under the `URL` property.

```js
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

#### Filter the titles from the response
To extract a list of product titles from the given data structure, we iterate through the `products` list and collect each product's `title` using the below code. Enable `Transformations` in the Query Editor and use the below code:

```python
return [product["title"] for product in data["products"]]
```

### Filtering Products by Category

To filter products by a specific category, such as "smartphones", and extract their titles. Enable `Transformations` in the Query Editor and use the below code:

```python
return [product["title"] for product in data["products"] if product["category"] == "smartphones"]
```

### Calculating Average Price of a Category

To calculate the average price of products within the "laptops" category. Enable `Transformations` in the Query Editor and use the below code:

```python
return sum(product["price"] for product in data["products"] if product["category"] == "laptops") / len([product for product in data["products"] if product["category"] == "laptops"]) if len([product for product in data["products"] if product["category"] == "laptops"]) > 0 else 0
```

:::info
Issues with writing custom Python code? Ask in our [Slack community](https://www.tooljet.com/slack).
:::

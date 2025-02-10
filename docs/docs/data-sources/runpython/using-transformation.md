---
id: using-transformation
title: Using Transformation
---

## Using Transformations With Python

**Run Python code** can be used to transform the data that is fetched in the queries. To test transformations using Python, create a new **REST API** query, leave the method as *GET* and enter the below url under the **URL** property.

:::info
**Note:** Using transformation in Python code, we get a **JSON object**, which allows access using dot notation. If Python syntax is needed, convert the data into a dictionary using an appropriate method.
.
:::

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
[product.title for product in data.products]
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/filter-title-py.png" alt="Filter Titles with Python code" />

### Filter Products by Category

To filter products by a specific category, such as *smartphones*, and extract their titles. Enable **Transformations** in the Query Editor and use the below code:

```python
[product.title for product in data.products if product.category == "beauty"]
```
<img className="screenshot-full" src="/img/datasource-reference/custom-python/filter-category-py.png" alt="Filter category with Python code" />

### Calculate Average Price of a Category

To calculate the average price of products within the *laptops* category. Enable **Transformations** in the Query Editor and use the below code:

```python
sum(product.price for product in data.products if product.category == "beauty") / len([product for product in data.products if product.category == "beauty"]) if len([product for product in data.products if product.category == "beauty"]) > 0 else 0
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/calc-avg-price-py.png" alt="Calculate Average Price with Python code" />
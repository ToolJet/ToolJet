---
id: transforming-data
title: Transforming Data
---

Transformations help you reshape, clean, or filter your data before passing it to UI components. While buliding apps, the raw data you fetch from an API or database often needs customization before displaying it in the components. You might need to:
-	 Convert raw ISO timestamps into DD/MM/YYYY.
-	 Flatten deeply nested objects for use in tables or dropdowns.
-	 Convert currency, distance, or temperature values before display.
-	 Adjust field names to match component expectations.

That’s where data transformations come in. It helps you to shape your backend data into a frontend-friendly format, keeping your UI logic simple and your app easier to maintain.

You can write transformation code in JavaScript or Python. Let’s say you’re building an employee management dashboard, and your getEmployees API returns a lot of extra data:

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+91876543210",
    "department_id": 1,
    "salary": "$50k"
  },
  { ... }
]
```

But in your table, you only want to display *id*, *name*, *designation* fields. Instead of changing the API or manually filtering inside every component, you can transform the data once, at the query level.

## Using JavaScript

Head to the Transformations tab of your query and write your javascript code:

```javascript
return data.map(item => ({
	id: item.id,
	name: item.name,
	designation: item.designation
}));
```
This ensures every time the query runs, your components receive exactly the shape of data they need.

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_js.png" alt="App Builder: query transformations"/>

## Using Python

If you’re more comfortable with Python, just switch the language in the transformation tab and use a similar approach:

```python
[
    {"id":item.id,
     "name": item['name'],
     "designation": item['designation']}
     for item in data
]
```

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_python.png" alt="App Builder: query transformations"/>


Instead of changing APIs or writing extra code in every component, you can transform the data once at the query level. This makes your app easier to build and maintain.
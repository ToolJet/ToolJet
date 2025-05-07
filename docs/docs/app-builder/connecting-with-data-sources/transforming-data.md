---
id: transforming-data
title: Transforming Data
---

When working with real-world applications, the data you receive from APIs or databases often needs customization before displaying it in the components sometimes. You might want to show only certain fields, format timestamps, or map values into a specific data structure. That’s where Transformations come in.

For example, after fetching a list employees from an API for for a employee management application, you may only want to display the *id*, *name*, *designation* fields. You can transform the response with JavaScript (or Python), inside trasformation tab of the query to return just the data your component needs.

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_js.png" alt="App Builder: query transformations"/>

If you’re using Python as the transformation language, you can implement it as shown in the image below:

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_python.png" alt="App Builder: query transformations"/>
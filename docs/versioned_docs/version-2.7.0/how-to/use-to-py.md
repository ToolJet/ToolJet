---
id: use-to-py-function-in-runpy
title: "Use the to_py() Function in RunPy: Converting JavaScript Objects to Python"
---

This how-to guide will demonstrate the usage of `to_py()` function in RunPy queries for converting the JavaScript objects to Python.

## to_py() function

The **to_py()** function in **Pyodide** is the counterpart of the **to_js()** function. It is used to convert JavaScript objects into their equivalent Python representations. This conversion is necessary when it is required to work with JavaScript objects within the Pyodide environment and manipulate them using Python code.

Similar to **to_js()**, **to_py()** performs the necessary mapping and conversion of data types between JavaScript and Python. It converts JavaScript objects, arrays, and other JavaScript data structures into their Python equivalents.

:::tip
Check **[RunPy](/docs/data-sources/run-py)** doc to learn more.
:::

## Using to_py() function

Here's an example demonstrating the usage of to_py():

```js
from js import Object
from pyodide import to_py

my_js_object = Object.fromEntries([("name", "John"), ("age", 25), ("country", "USA")])

my_py_dict = to_py(my_js_object)

print(my_py_dict)
```

In this example, a JavaScript object my_js_object is created using the Object.fromEntries() method from JavaScript. It represents a dictionary-like structure. The to_py() function is then used to convert the JavaScript object into a Python dictionary my_py_dict.

The output will be:
```json
{'name': 'John', 'age': 25, 'country': 'USA'}
```

By using to_py(), JavaScript objects can seamlessly convert into Python representations and work with them using Python code within the Pyodide environment.

Both **to_js()** and **to_py()** functions provide a convenient way to exchange data between Python and JavaScript when working with Pyodide, enabling to leverage the strengths of both languages in a unified environment.

## Why use of to_py() is required?

When previewing the results of a RunPy query, the discrepancy between the JSON and Raw tabs can arise due to the way data is converted and displayed in Pyodide. By default, **Python dictionaries** are converted to **Javascript Map objects** in Pyodide. This conversion is performed *to ensure compatibility between the two languages*.

As a result, when viewing the data in the **JSON** tab, it is presented in the format of JavaScript objects, represented by **()** symbols. On the other hand, the **Raw** tab displays the raw representation of the returned data **[{}, {}, ...],** which may show Python dictionaries in their original form with **{}** symbols.

In this case, both representations are correct. The JSON tab presents the converted data in a format that is compatible with JavaScript, while the Raw tab displays the original Python dictionaries. The choice depends on the user's specific use case and whether they need to work with the data in a **Javascript context** or **Python context**.

To ensure consistency between the JSON and Raw representations, **to_js()** function provided by Pyodide can be used to explicitly convert Python dictionaries to JavaScript objects. This will help align the representations and ensure that the data is in the desired format.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/to_py/to_py.gif" alt="Use the to_py() Function in runPy: Converting JavaScript Objects to Python" />

</div>
---
id: use-to-py-function-in-runpy
title: "Utilize the to_py() Function in RunPy: Translating JavaScript Objects to Python"
---

This guide demonstrates the utilization of the `to_py()` function in RunPy queries for converting JavaScript objects into their corresponding Python representations.

## The to_py() Function

The **to_py()** function within the **Pyodide** library serves as the counterpart to the **to_js()** function. Its purpose is to transform JavaScript objects into their equivalent Python structures. This conversion becomes essential when handling JavaScript objects within the Pyodide environment and manipulating them using Python code.

Similar to **to_js()**, **to_py()** facilitates the mapping and conversion of data types between JavaScript and Python. It effectively converts JavaScript objects, arrays, and other data structures into their Python counterparts.

**Note**: Refer to the **[RunPy](/docs/data-sources/run-py)** documentation for a more in-depth understanding.

## Using the to_py() Function

Here's an example demonstrating the application of the to_py() function:

```python
import pyodide # Import the Pyodide library

def to_py(js_object): # Define a function to convert JavaScript objects to Python dictionaries
  return dict(js_object) # Convert the JavaScript object to a Python dictionary

my_js_object = {"name": "John", "age": 25, "country": "USA"} # Create a JavaScript object

my_py_dict = to_py(my_js_object) # Convert the JavaScript object to a Python dictionary

my_py_dict # Return the Python dictionary
```

In this example, a JavaScript object `my_js_object` is created using the Object.fromEntries() method, representing a dictionary-like structure. The to_py() function is then employed to convert this JavaScript object into a Python dictionary, resulting in `my_py_dict`.

The output will be:
```json
{'name': 'John', 'age': 25, 'country': 'USA'}
```

By leveraging to_py(), JavaScript objects can seamlessly transition into Python representations, allowing for manipulation using Python code within the Pyodide environment.

Both **to_js()** and **to_py()** functions offer a convenient means to exchange data between Python and JavaScript in Pyodide, enabling the utilization of both languages' strengths in a unified environment.

## Why the Use of to_py() is Essential?

When previewing results in a RunPy query, discrepancies between the JSON and Raw tabs may arise due to the conversion and display mechanisms in Pyodide. By default, **Python dictionaries** are converted to **JavaScript Map objects** in Pyodide, ensuring compatibility between the two languages.

Consequently, the **JSON** tab presents data in the format of JavaScript objects, denoted by **()** symbols, while the **Raw** tab displays the raw representation as **[{}, {}, ...],** showing Python dictionaries in their original form with **{}** symbols.

Both representations are correct, with the JSON tab showcasing converted data compatible with JavaScript, and the Raw tab displaying the original Python dictionaries. The choice depends on the user's use case and whether they need to work with the data in a **JavaScript context** or **Python context**.

To maintain consistency between JSON and Raw representations, the **to_js()** function provided by Pyodide can explicitly convert Python dictionaries to JavaScript objects. This ensures alignment between representations and guarantees that the data is in the desired format.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/to_py/topy.gif" alt="Print data from multiple tabs" />
</div>
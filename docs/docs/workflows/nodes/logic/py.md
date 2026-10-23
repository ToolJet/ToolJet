---
id: py
title: Python Node
---

<br/>

The **Python** node allows you to run custom server-side Python within your workflow. It can be used to:
- Transform Data
- Run Complex Calculations
- Fine Tune Response
- Implement Business Logic

This node executes securely inside a sandboxed environment on the server, so it can handle data manipulation at scale, prepare or enrich data for downstream nodes, or create custom responses for external services.

**Note:** To pass results to subsequent nodes, you can either set a `result` variable or end your code with an expression — the evaluated value of the last expression is automatically returned.

## Accessing Workflow State

All previous node outputs, parameters, and workflow variables are injected into the Python execution context as global variables. You can reference them directly in your code.

```python
# Access results from a previous node named 'getSalesData'
sales = getSalesData['data']

# Access workflow parameters
user_id = params['userId']
```

## Example: Fine-Tuning Your Response Using Python

Refine your response by manipulating data using Python. For example, you can use list slicing to select a subset of data:

```python
result = {
    "sales": getSalesData["data"][:5],
    "inventory": getInventory["data"][:5],
    "csv": generateCSVData["data"]
}
```

## Example: Using External Packages

You can install external Python packages for your workflow through the package manager. Packages are defined in `requirements.txt` format and installed once per workflow version.

```python
import pydash

result = pydash.map_([1, 2, 3], lambda x: x * 2)
# Returns: [2, 4, 6]
```

:::info
Only packages with prebuilt wheels (pure Python or manylinux) are supported. Packages that require C compilation during installation are not available.
:::

## Limitations

- **Timeout**: Each Python node execution has a 10-second time limit.
- **Memory**: Execution is limited to 512 MB of virtual memory.
- **No network access**: The sandbox does not allow outbound network calls. Use datasource nodes to fetch external data before passing it to a Python node.
- **Return values must be JSON-serializable**: Strings, numbers, lists, dicts, `None`, and booleans are supported.
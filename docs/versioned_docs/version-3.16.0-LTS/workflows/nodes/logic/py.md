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

The outputs of previous nodes are injected into the Python execution context as global variables, each named after its node. The parameters the workflow was triggered with are available under `startTrigger['params']`; there is no separate `params` variable.

```python
# Access results from a previous node named 'getSalesData'
sales = getSalesData['data']

# Access workflow parameters
user_id = startTrigger['params']['userId']
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

You can install external Python packages for your workflow from the **Libraries** panel. Packages are defined in `requirements.txt` format and installed once per workflow version. See [Python libraries](/docs/workflows/external-libraries/py).

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
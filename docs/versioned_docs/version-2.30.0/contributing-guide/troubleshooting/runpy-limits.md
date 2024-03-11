---
id: runpy-limitations
title: RunPy limitations
---

### Limitation: Unable to Open External URLs with urlopen in RunPy

When using the `urlopen` function within a RunPy query, you may encounter an error when trying to open external URLs, such as `https://api.baserow.io`. This limitation is due to the underlying framework used by RunPy, Pyodide, which has certain constraints and may not support all features available in a standard Python environment.

### Solution: Using fetch function with JavaScript

To overcome this limitation, you can utilize the `fetch` function from JavaScript, as Pyodide supports interoperability between Python and JavaScript. Here's an example of how to make an HTTP request using the `fetch` function in a RunPy query:

```python
from js import fetch
import json

async def push_data(url, data):
    response = await fetch(
        url,
        method='POST',
        headers=[
            ["Authorization", "Token <my_token>"],
            ["Content-Type", "application/json"]
        ],
        body=data
    )
    reply = await response.json()
    return reply

url = "https://api.baserow.io/api/database/rows/table/.../?user_field_names=true"
reply = await push_data(url, json.dumps(<my_data>))
reply
```

In the example above, the `fetch` function is used to make an HTTP POST request to the specified URL. The `Authorization` header is included to provide the necessary authentication token, and the request body is passed as JSON data.

By using the `fetch` function and incorporating JavaScript interoperability, you can successfully make HTTP requests within a RunPy query in scenarios where `urlopen` may encounter limitations.

It's important to note that the solution provided here assumes you have the necessary authorization token and data to push to the Baserow table. Adjust the code accordingly to fit your specific requirements.
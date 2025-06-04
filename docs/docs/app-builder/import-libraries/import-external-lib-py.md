---
id: runpy
title: Using RunPy
---

RunPy lets you use Python code inside your ToolJet apps and by installing supported libraries with micropip, you can add more functionality to your applications without needing a full backend. In this guide, we will learn to import external python packages and use them in the application.

:::caution Unsupported modules
Modules with C/C++ extensions needing system libraries won't work in Pyodide, as it runs in a web browser without system library access. Pyodide, based on WebAssembly-compiled Python, also doesn't support certain system calls.
:::

## Installing Python Packages

In ToolJet you can write Python code, but for certain data processing tasks you can use Python packages like pandas and NumPy. Here’s how to you can use it.


Use micropip to install packages like Pandas and NumPy. **Run** the query to complete installation.

```python
import micropip
await micropip.install('pandas')
await micropip.install('numpy')
```

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/install_py.png" alt="Installing py modules" />

:::tip
Enable the **Run this query on application load?** option in the query settings to make the libraries available throughout the application as soon as the app is loaded.
:::

## Use cases

### Parse CSV data

Say you want users to upload a CSV and view the parsed output. Here’s how you can use pandas and Python’s csv module. Create a RunPy query to parse CSV data using `StringIO`, `csv`, and `Pandas` module.

```python
from io import StringIO
import csv
import pandas as pd

scsv = components.filepicker1.file[0].content

f = StringIO(scsv)
reader = csv.reader(f, delimiter=',')

df = pd.DataFrame(reader)

print(df.info())
print(df)
```

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/parseCSV.png" alt="Installing py modules" />

- Add a File Picker to your app and change the file type to CSV.
- In the File Picker’s event settings:
    - Event: On File Loaded
    - Action: Run Query → choose your RunPy script
- Upload a CSV file. Now when you trigger the RunPy query, it will parse the data and output it in the browser console.


### Prompt Preprocessing for AI APIs

When building apps that integrate with AI APIs (like OpenAI, Cohere, or HuggingFace), you often need to send long-form text inputs—like meeting transcripts, user feedback, or document excerpts to the API. However, many AI APIs have input size limitations (e.g., 4,096 tokens for GPT-3.5), and they often work best when the input is clean and concise.

So, before sending the data, you may want to:
- Clean and normalize the text (remove line breaks, extra spaces, non-ASCII characters)
- Chunk the text into API-safe sizes (e.g., 500 characters or 300 words)
- Optionally, remove irrelevant sections (like headers, boilerplate, or disclaimers)

Here's an example of how to do this preprocessing step using regular expressions (`re`):

```python
import re

# Get raw text from a multi-line input component (like a long form or a textarea)
raw_text = components.textarea1.text

# 1. Clean the text
cleaned = re.sub(r"\s+", " ", raw_text).strip()

# 2. Chunk the cleaned text into slices of 500 characters each
chunks = [cleaned[i:i+500] for i in range(0, len(cleaned), 500)]

# Output the cleaned and chunked data
print({"chunks": chunks})
```
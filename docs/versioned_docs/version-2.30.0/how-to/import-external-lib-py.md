---
id: import-external-libraries-using-runpy
title: Import External Libraries Using RunPy
---

ToolJet allows you to utilize python packages in your app by importing them using the [RunPy query](/docs/data-sources/run-py). 
In this how-to guide, we will import a few packages and use them in the application.

:::caution Unsupported modules
Modules with C/C++ extensions needing system libraries won't work in Pyodide, as it runs in a web browser without system library access. Pyodide, based on WebAssembly-compiled Python, also doesn't support certain system calls.
:::

- Start by creating a new application in ToolJet.
- From the Query Panel, add a new RunPy query - it will be named *runpy1* by default.

<div style={{textAlign: 'left', marginBotton: '15px'}}>
    <img className="screenshot-full" src="/img/how-to/import-python/runpy.png" alt="Import external libraries using RunPy" />
</div>

- Use micropip to install packages like Pandas and NumPy. **Run** the query to complete installation.

```python
import micropip
await micropip.install('pandas')
await micropip.install('numpy')
```
    
<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/import-python/installing.png" alt="Import external libraries using RunPy"/>
</div>

- Enable `Run this query on application load?` to make these packages available every time the application loads.

## Generating Random Numbers with NumPy

- Create a RunPy query using NumPy's random module to generate random numbers.

```python
from numpy import random
x = random.binomial(n=10, p=0.5, size=10)
print(x)
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/import-python/random.gif" alt="Import external libraries using RunPy"/>
</div>

*You can check the output on the browser's console.*

## Parse CSV data

- Create a RunPy query to parse CSV data using `StringIO`, `csv`, and `Pandas` module.

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

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/import-python/csvparse.png" alt="Import external libraries using RunPy"/>
</div>

- Add a **File Picker** component on the canvas
- Select  `On File Loaded` as the Event and Run Query as the Action.
- Select the query we just created as the Query. 

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/import-python/event.png" alt="Import external libraries using RunPy"/>
</div>

- Finally, load a csv file on the File Picker component, **Run** related RunPy query and check the output on the browser console.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/import-python/console.gif" alt="Import external libraries using RunPy"/>
</div>
    
---
id: import-external-libraries-using-runpy
title: Import external libraries using RunPy
---

ToolJet allows you to utilize python packages in your app by importing them using the [RunPy query](/docs/data-sources/run-py). 
In this how-to guide, we will import a few packages and use it in the application.

:::caution Unsupported modules
The modules that are not currently supported in Pyodide are those that have C or C++ extensions that rely on system libraries. These modules cannot be used in Pyodide because it runs in a web browser, which does not have access to the underlying system libraries that the C or C++ extensions rely on. Additionally, Pyodide uses a version of Python that has been compiled to WebAssembly, which does not support the same system calls as a regular version of Python. Therefore, any module that requires access to system libraries or system calls will not work in Pyodide.
:::

- Create a new application and then create a new RunPy query from the query panel.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-python/runpy.png" alt="Import external libraries using RunPy" />

    </div>

- Let's write some code for importing packages. We will first import the micropip which is a package installer for Python and then we will install the `Pandas` and `NumPy` using micropip. **Run** the query to install the packages.
    ```python
    import micropip
    await micropip.install('pandas')
    await micropip.install('numpy')
    ```
    
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-python/installing.png" alt="Import external libraries using RunPy"/>

    </div>
    
:::tip
Enable the **Run this query on application load?** option to make the packages available throughout the application.
:::

## Examples

### Array of random numbers of using NumPy

- Let's create a **RunPy** query that will use **random** module from the **NumPy** package and the query will generate array of random numbers. 
    ```python
    from numpy import random

    x = random.binomial(n=10, p=0.5, size=10)

    print(x)
    ```

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-python/random.gif" alt="Import external libraries using RunPy"/>

    </div>

:::info
You can check the output on the browser's console.
:::

### Parse CSV data

- Let's create a RunPy query that will parse the data from the csv file. In this query we will use `StringIO`, `csv`, and `Pandas` module.
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

- Add a file picker component on the canvas and set a event handler for **On file loaded** event to **Run Query** that we created for parsing the data.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-python/event.png" alt="Import external libraries using RunPy"/>

    </div>

- Finally, let's load a csv file on the file picker and check the output by the RunPy query on the browser console.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-python/console.gif" alt="Import external libraries using RunPy"/>

    </div>
    
---
id: import-external-libraries-using-runjs
title: Import external libraries using RunJS
---

ToolJet allows you to utilize external libraries in your app by importing them using the [RunJS query](/docs/data-sources/run-js).

In this how-to guide, we will import a few JavaScript libraries and use it in the application.

:::tip
You can import any of the available libraries using their **CDN**. Find free CDN of the open source projects at **[jsDelivr](https://www.jsdelivr.com/)**
:::

- Create a new application and then create a new RunPy query from the query panel.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-js/newquery.png" alt="Import external libraries using RunJS" />

    </div>

- Let's write some code for importing libraries. We will first create a function `addScript` that returns a `Promise`, the `Promise` creates a script tag -> sets an attribute -> and eventListener `resolves` if its loaded and `rejects` if there is an error, and then body is appended at the end.
- We are going to import two libraries using their CDNs: **MathJS** and **Flatten**, and display an alert when the libraries are loaded successfully.
    ```js
    function addScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.setAttribute('src', src);
        s.addEventListener('load', resolve);
        s.addEventListener('error', reject);
        document.body.appendChild(s);
    });
    }

    try {
    await addScript('https://cdn.jsdelivr.net/npm/mathjs@11.7.0');
    await addScript('https://cdn.jsdelivr.net/npm/flattenjs@2.1.3/lib/flatten.min.js');

    await actions.showAlert("success", 'Mathjs and Flatten imported')
    
    
    } catch (e) {
    console.log(e);
    }
    ```

- Now, when you hit **create** and then **run** the query, the script will be injected into the DOM. An alert should pop-up with the message **Mathjs and Flatten imported**.
    
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-js/imported.png" alt="Import external libraries using RunJS"/>

    </div>
    
:::tip
Enable the **Run this query on application load?** option to make the libraries available throughout the application as soon as the app is laoded.
:::

## Examples

### Flatten the JSON objects using FlattenJS

- Let's create a new **RunJS** query that will use **Flatten** library(imported in the above section) and the query will flatten the JSON object.
    ```js
    return flatten({
        key1: {
            keyA: 'valueI'
        },
        key2: {
            keyB: 'valueII'
        },
        key3: { a: { b: { c: 2 } } }
    })
    ```
- Save the query, you can either **Preview** the output on the query manager or **Run** the query to check the output on the inspector on the left-sidebar.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-js/flatten.png" alt="Import external libraries using RunJS"/>

    </div>

### Computation using MathJS

- Let's create a new **RunJS** query that will return the result of calculation performed by [atan2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2) method and then divided by [pi](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI).
```js
return math.atan2(3, -3) / math.pi
```

- Save the query, you can either **Preview** the output on the query manager or **Run** the query to check the output on the inspector on the left-sidebar.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/import-js/mathjs.png" alt="Import external libraries using RunJS"/>

    </div>
    
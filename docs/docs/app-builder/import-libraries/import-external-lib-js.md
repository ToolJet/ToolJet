---
id: runjs
title: Using RunJS
---
<div style={{paddingBottom:'24px'}}>

ToolJet allows you to integrate external JavaScript libraries into your application using RunJS queries. This guide walks you through the process of importing and utilizing these libraries effectively.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Choosing Libraries

You can import various JavaScript libraries using their Content Delivery Network (CDN) links. Find the CDN links for your desired open-source projects on [jsDelivr](https://www.jsdelivr.com/). 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Creating a New App and RunJS Query

- Create a new app from the ToolJet Dashboard.
- Once the app is ready, choose ToolJet's deafult **JavaScript** Data Source from the query panel. 

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/create-new-query-v2.png" alt="Create a new RunJS query" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Importing Libraries

Once the query is created, add the following code:

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

```js
// Function to add script dynamically
function addScript(src) {
    return new Promise((resolve, reject) => {
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('src', src);
        scriptTag.addEventListener('load', resolve);
        scriptTag.addEventListener('error', reject);
        document.body.appendChild(scriptTag);
    });
}

try {
    // Importing MathJS
    await addScript('https://cdn.jsdelivr.net/npm/mathjs@11.7.0');

    // Importing FlattenJS
    await addScript('https://cdn.jsdelivr.net/npm/flattenjs@2.1.3/lib/flatten.min.js');

    // Showing a success alert
    await actions.showAlert("success", 'Mathjs and Flatten imported');
} catch (error) {
    console.error(error);
}
```

</div>

After adding the code, click on the **Run** button in the query panel, an alert should pop up with the message "Mathjs and Flatten imported."

:::tip
Enable the **Run this query on application load?** option to make the libraries available throughout the application as soon as the app is loaded.
:::

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/import-successful-v2.png" alt="Import Successful" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Examples

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 1. Flattening JSON Objects using FlattenJS

- Create a new *RunJS* query using the Flatten library (imported earlier) to flatten a JSON object.
- In the code section of the query, add the following code:

```js
return flatten({
    key1: {
        keyA: 'valueI'
    },
    key2: {
        keyB: 'valueII'
    },
    key3: { a: { b: { c: 2 } } }
});
```

- Preview the output in the query manager or click **Run** in the query panel to see the flattened JSON.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/flatten-js-v2.png" alt="Use FlattenJS" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 2. Computation using MathJS

- Create another *RunJS* query utilizing the MathJS library for a calculation.
- In the code section of the query, add the following code:

```js
return math.atan2(3, -3) / math.pi;
```

- Preview the output in the query manager or click **Run** in the query panel to see the result of the calculation.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/math-js-v2.png" alt="Use MathJs" />
</div>

</div>

This guide provides a clear and detailed walkthrough for importing external JavaScript libraries into your ToolJet application.
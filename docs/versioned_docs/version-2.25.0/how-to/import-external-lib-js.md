---
id: import-external-libraries-using-runjs
title: Import external libraries using RunJS
---

ToolJet allows you to integrate external JavaScript libraries into your application using RunJS queries. This guide walks you through the process of importing and utilizing these libraries effectively.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Choosing Libraries

You can import various JavaScript libraries using their Content Delivery Network (CDN) links. Find the CDN links for your desired open-source projects on [jsDelivr](https://www.jsdelivr.com/).

## Creating a new app and runJS query

Start by creating a new application in ToolJet. Then, proceed to create a new RunJS query from the query panel.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/create-new-query.png" alt="Create a new RunJS query" />
</div>

</div>

## Importing Libraries

Here's a step-by-step guide to importing libraries and displaying an alert upon successful import.

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

After creating and running the query, an alert should pop up with the message "Mathjs and Flatten imported."

:::tip
Enable the **Run this query on application load?** option to make the libraries available throughout the application as soon as the app is loaded.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/import-successful.png" alt="Import Successful" />
</div>

</div>

## Examples

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 1. Flattening JSON Objects using FlattenJS

Create a new RunJS query using the Flatten library (imported earlier) to flatten a JSON object.

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

Preview the output in the query manager or run the query to see the flattened JSON.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/flatten-js.png" alt="Use FlattenJS" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 2. Computation using MathJS

Create another RunJS query utilizing the MathJS library for a calculation.

```js
return math.atan2(3, -3) / math.pi;
```

Preview the output, or Run the query to see the result of the calculation.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/import-js/math-js-v2.png" alt="Use MathJs" />
</div>

</div>

This guide provides a clear and detailed walkthrough for importing external JavaScript libraries into your ToolJet application.
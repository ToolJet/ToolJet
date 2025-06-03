---
id: runjs
title: Using RunJS
---


ToolJet allows you to use external JavaScript libraries such as MathJS for calculations or Day.js for working with dates into your application using RunJS queries. This saves you from having to write complex code from scratch. 

This guide walks you through the process of importing and utilizing these libraries effectively.

## Choosing Libraries

You can import various JavaScript libraries using their Content Delivery Network (CDN) links. Find the CDN links for your desired open-source projects on [jsDelivr](https://www.jsdelivr.com/). 

## How to Import Libraries

For example, let's consider two popular libraries: [FlattenJS](https://github.com/davidfig/flattenjs) and [MathJS](https://mathjs.org/) which are used for flattening JSON objects and performing mathematical computations respectively. Let’s walk through importing external libraries step-by-step.

### Create a RunJS Query

Open the query panel and create a new **RunJS** query.

### Add the code snippet below 

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

After adding the code, click on the **Run** button in the query panel, an alert should pop up with the message "Mathjs and Flatten imported."

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/import_library.png" alt="Use FlattenJS" />
:::tip
Enable the **Run this query on application load?** option in the query settings to make the libraries available throughout the application as soon as the app is loaded.
:::

## Use cases

Now that we have successfully imported both libraries, let's explore some use cases where they can be applied.

### Flattening JSON Objects using FlattenJS

Let’s say you have deeply nested API data and need to show it in a flat table UI.

Here’s how to flatten it using flatten():

```js
return flatten({
  user: {
    name: 'John',
    address: {
      city: 'San Francisco',
      zip: 94105
    }
  },
  roles: ['admin', 'editor']
});
```

Preview the output in the query manager or click **Run** in the query panel to see the flattened JSON.


 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/flaten_library.png" alt="Use FlattenJS" />

###  Calculating Monthly Loan EMI 

Let's say you're building a **loan management dashboard** where users input loan details and get the monthly EMI instantly. Instead of manually coding the formula, use **MathJS** to handle the math cleanly and accurately.

#### EMI Formula

 <img className="screenshot-full img-s" src="/img/app-builder/custom-code/emi.png" alt="Use FlattenJS" />

Where:
- P = Principal loan amount  
- r = Monthly interest rate  
- n = Loan tenure in months

```js
const principal = 500000; // Loan amount
const annualRate = 10;    // Annual interest rate in %
const tenure = 60;        // Loan tenure in months

const r = annualRate / 12 / 100; // Monthly interest rate

const numerator = principal * r * math.pow(1 + r, tenure);
const denominator = math.pow(1 + r, tenure) - 1;

const emi = math.round(numerator / denominator, 2);

return `Monthly EMI: ₹${emi}`;
```


---
id: runjs
title: Using RunJS
---


ToolJet allows you to use external JavaScript libraries such as Compromise for natural language processing or PapaParse for parsing CSV data in your application using RunJS queries. This helps you avoid writing complex logic from scratch.

This guide walks you through the process of importing and utilizing these libraries effectively.

## Choosing Libraries

You can import various JavaScript libraries using their Content Delivery Network (CDN) links. Find the CDN links for your desired open-source projects on [jsDelivr](https://www.jsdelivr.com/). 

## How to Import Libraries

Let’s walk through how to import libraries using RunJS. For example, we’ll use:

- [Compromise](https://github.com/spencermountain/compromise): for natural language processing
- [PapaParse](https://www.papaparse.com/): for parsing CSV data

### Create a RunJS Query

Open the query panel and create a new **RunJS** query.

### Add the Following Code Snippet 

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
  await addScript('https://cdn.jsdelivr.net/npm/compromise@13.11.3/builds/compromise.min.js');
  await addScript('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');
  await actions.showAlert("success", "Compromise and PapaParse imported");
} catch (error) {
  console.error(error);
}
```

After adding the code, click on the **Run** button in the query panel. An alert will appear with the message "Compromise and PapaParse imported".

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/import_library.png" alt="Use FlattenJS" />
:::tip
Enable the **Run this query on application load** option in the query settings to make the libraries available throughout the application as soon as the app is loaded.
:::

## Use Cases

Let’s look at how you can apply these libraries in real-world use cases.

### Extracting Action Items from Meeting Notes using Compromise (NLP)

Let's say you are building an internal project management tool where users paste raw meeting notes. You want to auto-extract action items, dates, and team names. You can use the following code to process the notes using NLP:

```js
const notes = nlp("Met with John, Priya, and Marcus from the marketing team on Thursday. Discussed launch strategy for the Q3 campaign. Priya will draft the blog post by next Tuesday. John to prepare budget estimates. Marcus will handle email outreach by Friday. Next sync on July 10th.");

const people = notes.people().out('array');
const actions = notes.sentences().filter(s => s.has('#Verb')).out('array');

return { people, actions };
```

Preview the output in the query manager or click **Run** in the query panel to see the output as shown below.


 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/extract_tags.png" alt="Use compromise" />

###  Bulk Upload Employee Data into an Employee Directory

Let’s say your HR team maintains employee records in spreadsheets and wants a way to import this data quickly into your internal Employee Directory application. You can use the following code to clean up the data:

```js
const csvData = components.filepicker1.file[0].content;

const parsedData = Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true
});

return parsedData;
```

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/csv_parse_js.png" alt="Use Compromise" />

## Built-in JavaScript Libraries 

ToolJet comes with some essential JavaScript libraries preloaded in the RunJS environment, so you don’t need to import them manually:
- [Moment.js](https://momentjs.com/docs/) – for date/time formatting and manipulation
- [Lodash](https://lodash.com/docs/) – for working with arrays, objects, and collections
- [Axios](https://axios-http.com/docs/intro) – for making HTTP requests

You can use these libraries directly in RunJS to simplify your logic, transform data, or integrate with APIs.

Example:

```js
// Format Timestamps for UI Display
const raw = '2025-06-05T15:42:00Z';
return moment(raw).format('MMM D, YYYY, h:mm A');// "Jun 5, 2025, 9:12 PM"

//  Deep Comparison of Records with Lodash
const a = { name: 'Alice', dept: { id: 1, name: 'HR' } };
const b = { name: 'Alice', dept: { id: 1, name: 'HR' } };

return _.isEqual(a, b); // true

// Posting JSON Data with Error Handling
axios.post('https://api.company.com/inventory', {
  name: 'Laptop',
  quantity: 10,
}).then(res => res.data)
  .catch(err => console.error(err.response.data));
```

Use RunJS to easily import and leverage external JavaScript libraries in your ToolJet app for advanced data processing and logic.
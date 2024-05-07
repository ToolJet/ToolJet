---
id: use-url-params-on-load
title: Use URL Parameters on Page Load
---
<div style={{paddingBottom:'24px'}}>

In this guide, we will learn how to use URL parameters at the time of page load. The URL parameters are used to pass data from one page to another. Currently, we can add URL parameters in the following ways:

- From events through the [Switch page](/docs/actions/switch-page) action
- From the [JavaScript code](/docs/actions/switch-page/#switch-page-with-query-params) queries

If a page is opened with URL parameters, you can access them using the `{{globals.urlparams}}`. This object contains all the URL parameters as key-value pairs and specific parameters can be accessed using the key like `{{globals.urlparams.<parameter_name>}}`.

Let's take a look at an example below to understand how to use URL parameters on page load.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Using URL Parameters on Page Load to Execute REST API Queries

Create two pages, `Home` and `Dashboard`. When a new app is created, a page named `Home` is created by default. Create a new page named `Dashboard` from the Pages menu in the left sidebar.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/use-url-params/pages.png" alt="Use URL Parameters on page load" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Home and Dashboard Pages

Add a form component to the `Home` page. The form component will have a text input fields and a button. The text input field will be used to enter the name and the button will be used to navigate to the `Dashboard` page. Let's name the text input field as `email` and the button as `Submit`. 

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/use-url-params/form.png" alt="Use URL Parameters on page load" />
</div>

Select the button and add the event `On click`, select action `Switch page`, and then select the page `Dashboard`. Here, we will also find the option to add URL parameters. Add the URL parameter `email` and set the value to `{{components.form1.data.textinput1.value}}`. This will pass the value of the email input field to the `Dashboard` page as a URL parameter.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/use-url-params/event.png" alt="Use URL Parameters on page load" />
</div>

Now, on clicking the `Submit` button, the `Dashboard` page will be opened with the URL parameter `email` containing the value of the email input field. You can open the Inspector on left sidebar and navigate to the `URL Params` under the `globals` to check the URL parameters.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/use-url-params/urlparams.png" alt="Use URL Parameters on page load" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Queries and Binding Data

In the `Dashboard` page, add two table components. We will be loading the data from two different REST API queries on these tables. 

### Query 1: Get Products

- Create a new REST API query and name it as `products`. We will be using a mock REST API to fetch the data. The URL for the REST API is `https://fakestoreapi.com/products`. Run the query and check the preview to see the returned data.
- Go to the `table1` properties, set the value of table data to `{{queries.products.data}}`. This will bind the data returned from the REST API query to the table.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/use-url-params/table1.png" alt="Use URL Parameters on page load" />
</div>

### Query 2: Get User Details

- Create a new REST API query and name it as `users`. We will be using a mock REST API to fetch the data. The URL for the REST API is `https://jsonplaceholder.typicode.com/users`. Run the query and check the preview to see the returned data.
- Go to the `table2` properties, set the value of table data to `{{queries.users.data}}`. This will bind the data returned from the REST API query to the table.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/use-url-params/table2.png" alt="Use URL Parameters on page load" />
</div>

### Query 3: JavaScript Code To Use URL Parameters

- Create a new JavaScript code query and name it as `urlparams`. We will be using this query to access the URL parameters and to check if the email parameter is present in the URL, then trigger the REST API queries.

```javascript
function waitForURLParams(timeout) {  // Wait for URL parameters to be available
  const check = resolve => {  // Check if URL parameters are available
    if (location.search.length > 0) resolve();  // URL parameters are available
    else setTimeout(_ => check(resolve), timeout);  // Check again after a timeout
  }
  return new Promise(check); // Return a promise that resolves when URL parameters are available
}

async function checkAndRunQuery(timeout) { // Check if URL parameters are available and run the REST API queries
  await waitForURLParams(timeout);  // Wait for URL parameters to be available
  const urlParams = new URLSearchParams(window.location.search);  // Get URL parameters

  if (urlParams.get('email')) {  // Check if email parameter is present in the URL
    await actions.runQuery('products');  // Run the REST API query to get products
    await actions.runQuery('users');  // Run the REST API query to get user details
  } 
  else {
    alert('URL param not found');  // Alert if email parameter is not present in the URL
  }
}

checkAndRunQuery(5000);  // Check if URL parameters are available and run the REST API queries after a timeout of 5 seconds
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Dashboard Page Event Handler

- Finally, go to the Pages menu in the left sidebar and open the menu for the `Dashboard` page.
- Select the option to add Event handler and add a new `On page load`, select the option to `Run query` and select the query `urlparams`. This will trigger the JavaScript code query to check if the email parameter is present in the URL and then run the REST API queries whenever the `Dashboard` page is loaded.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/use-url-params/onpageload.png" alt="Use URL Parameters on page load" />
</div>

Now, whenever the user will enter the email in the `Home` page and click the `Submit` button, the `Dashboard` page will be opened with the URL parameter `email` containing the value of the email input field. The JavaScript code query will check if the email parameter is present in the URL and then run the REST API queries to fetch the data. The data will be displayed in the tables on the `Dashboard` page.

</div>
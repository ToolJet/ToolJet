---
id: variables
title: Create and Manage Variables
---

During application development, managing state and user interactions effectively are crucial for creating a seamless user experience. This involves keeping track of various data points, filtering data based on the user, tracking user preferences, navigation history, and more. In this context, variables and page variables allow developers to store and manage variables within an application dynamically.

## Setting Variables and Page Variables

Setting variables and page variables can be done in two ways - through events or by using **Run JavaScript code** queries. 
- To set variables through events, add a new event handler and select `Set variable` as the action. Under `Action Options` you can define the Key and Value of the variable. Similarly, for page variables you can use the `Set page variable` action. 

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/variables/set-a-variable.png" alt="Set a variable" />
</div>


- To set variable through `Run JavaScript code` query, use the `setVariable(key, value)` function. Use `setPageVariable(key, value)` function for page variables.

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/variables/set-a-variable-js.png" alt="Set a variable through JS" />
</div>

## Example Use-Case for Page Variable:
**Tracking the number of times a user visits a page:**
- Create a `Run JavaScript code` query and enter the below code and name it *countVisits*:

```js 
function incrementPageVisit() {
    if (!page.variables.visitCount) {
        actions.setPageVariable('visitCount', 1);
    } else {
        actions.setPageVariable('visitCount', Number(page.variables.visitCount) + 1);
    }
}

incrementPageVisit();
```

- Add a new page to your application named `Product Listing`.
- Add an `Event Handler` on the newly created page, select `On page load` as the Event and `Run Query` as the Action. Under `Query`, select the *countVisits* query that we created in the previous step. 
- Now, every time a user lands on the `Product Listing` page, the *CountVisits* query will run and the `visitCount` data will be updated.

## Example Use-Case for Variables:
**Preventing the appearance of loading state when the query data is loading:**

You can prevent the appearance of any kind of loading state by filling the Table component with data using a variable. You can update this variable when the data update query runs successfully. 

Below are the steps to achieve this when you are updating the data and don't want the Table component to display a loader.

- Create two queries - *getData* and *updateData*

- Add a `Query Success` event to the *getData* query and select the **setVariable** action to save the returned data in a variable (you will have to define the key and value for this, value will be the returned data i.e. queries.getData.data). Name the variable *loadedData*.

- Enter `{{variables.loadedData}}` under the Table component's `Data` property.

- In the *updateData* query, add two `Query Success` events. The first event should run the *getData* query and the second event should update the variable that you had created in the first step with the data returned by the *getData* query.

Now, the Table will continue to display the data stored in *loadedData*. This prevents any loading indicators from appearing on the Table component when the data is being fetched or updated.

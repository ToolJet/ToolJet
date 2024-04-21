---
id: variables
title: Variables
---

During application development, managing state and user interactions effectively is crucial for creating a seamless user experience. This involves keeping track of various data points, filtering data based on the user, tracking user preferences, navigation history, and session-specific information. In this context, variables and page variables play a pivotal role by allowing developers to store and manage variables within an application dynamically.

## Setting Variables and Page Variables

Setting variables and page variables can be done in two ways - through events or by using **Run JavaScript code** query. 
- To set variables through events, add a new event handler and select `Set variable` as the action. Under `Action Options` you can define the Key and Value of the variable. Similarly for page variables, you can use `Set page variable` action. 
- To set variable through `Run JavaScript code` query, use the `setVariable(key, value)` function and use `setPageVariable(key, value)` function for page variables.

## Example Use-Case for Page Variable:
**Tracking the number of times a user visits a page:**- Create a `Run JavaScript code` query and enter the below code and name it *countVisits*:

```js 
function incrementPageVisit() { 
page.variables.visitCount ? actions.setPageVariable('visitCount', 1) :  actions.setPageVariable('visitCount', Number(page.variables.visitCount)+1)
} 

incrementPageVisit()
```

- Add a new page to your application `Product Listing`.
- Add an `Event Handler` on a page, select `On page load` as the Event and `Run Query` as the Action. Under `Query`, select the *countVisits* query that we created in the previous step. 
No every time a user lands on the `Product Listing` page, the *CountVisits* query will run and the `visitCount` data will be updated.

## Example Use-Case for Variables:
**Preventing the appearance of loading state**
You can prevent the appearing of any kind of loading state by filling the Table component with data using a variable. You can update this variable when the data update query runs successfully. Below are the steps to achieve the same.

- Create two queries - *getData* and *updateData*

- Add a Query Success event to the *getData* query and select the **setVariable** action to save the returned data in a variable (you will have to define the key and value for this, value will be the returned data i.e. queries.getData.data).

- Load the Table data using the variable you have created in the second step.

- In the updateData query, add two Query Success events. First event will run the *getData* query and second event will update the variable that you had created in the first step with the data returned by the *getData* query.

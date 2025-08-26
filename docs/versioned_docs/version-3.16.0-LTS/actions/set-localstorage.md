---
id: set-localstorage
title: Set localStorage
---

# Set localStorage

This action allows you to specify a `key` and its corresponding `value` to be stored in local storage of the browser. Local storage can be useful in a lot of scenarios. Some of the most common use cases of the local storage includes:
- Saving form values so that users don't accidentally lose them if they reload the page
- Storing any kind of data that is not going to be transferred to the database

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Example: Setting a Component Value Based on Local Storage

1. Add **Text Input**, **Button** and **Text** components to the canvas.

    <div style={{textAlign: 'center', marginBotton:'25px'}}>
    <img className="screenshot-full" src="/img/actions/localstorage/add-components.png" alt="Add Components To The Canvas" />
    </div>


2. Select the Button, add a new event handler, and add a `Set local storage` action with `key` set to `localtest` and `value` set to `{{components.textinput1.value}}`. 

    <div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/actions/localstorage/set-local-storage.png" alt="Set Local Storage" />
    </div>

    This will set a local storage value with `localtest` as the key and the value entered in the Text Input component as its value. 

3. Create a `Run JavaScript code` query, and enter the code below: 

    ```js
    return localStorage.getItem("localtest");
    ```
    <div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/actions/localstorage/create-runjs-query.png" alt="Create RunJS Query" />
    </div>

    Click on the **Run** button in the Query Panel. This query will fetch the `localtest` local storage variable that we had set earlier. 

4. Select the **Text** component. Under its `Text` property, enter `{{queries.runjs1.data}}`. Now, the Text component will display the value returned by the `Run JavaScript code` query - the local variable we had set earlier. 
    <div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/actions/localstorage/update-text-component.png" alt="Update Value Of Text Component Based On Local Storage" />
    </div>

5. Select the Button component. Add a new event handler to it, add a `Run query` action, select `runjs1` as the query, and set a debounce of `300`.
    <div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/actions/localstorage/update-text-on-button-click.png" alt="Updating Text On Button Click" />
    </div>

    Now, every time you click on the Button component, it will set the local storage value, and the Text component will display the value set in local storage. 

    :::info
    Debounce field is empty by default, you can enter a numerical value to specify the time in milliseconds after which the action will be performed. ex: `300`
    :::

</div>

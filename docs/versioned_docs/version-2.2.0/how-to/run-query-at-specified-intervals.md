---
id: run-query-at-specified-intervals
title: Run query at specified intervals
---

In this how-to guide, we will learn how to make a query trigger at the specific intervals.

- Let's go to the ToolJet dashboard and **create a new application**
- Once the app builder opens up, drag a **table** component to canvas
- Now, create a new REST API query from the query panel at the bottom of the app builder. We will be using the data from the mock **REST API** and then load the data on the table. Let's create a REST API, choose `GET` method from the dropdown, enter the endpoint `(https://jsonplaceholder.typicode.com/posts)`, name the query `post` and then **save and run** it
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/setinterval/query.png" alt="REST API query" width="600" />

    </div>
- Go to the **Table properties** and add connect the query data to table by adding value to **table data** property which is `{{queries.post.data}}`
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/setinterval/data.png" alt="REST API query" width="300" />

    </div>

- Now, we will create a RunJS query that will first set a variable called `interval` which will include the value returned by the `setInterval()` method that calls a function `countdown` at specified intervals. The countdown function has the code to trigger the `post` query that we created in the previous step.
    
    ```js
    actions.setVariable('interval',setInterval(countdown, 5000));
    function countdown(){
	    queries.post.run()
    }
    ```
  - Or use **async**-**await** in the function, if you're triggering multiple actions:
  ```js
  actions.setVariable('interval',setInterval(countdown, 5000));
  async function countdown(){
    await queries.restapi1.run()
    await queries.restapi2.run()
    await actions.showAlert('info','This is an information')
  }
  ```
  
- Go to the **Advanced** tab of the query, enable `Run query on page load?` this will trigger this RunJS query when the app is loaded. Name the query as `set` and **Save** it. Note that you will have to save the query and not `Save and Run` because doing it will trigger the query and you won't be able to stop the query unless you reload the page or go back to dashboard.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/setinterval/set.png" alt="REST API query" width="700" />

    </div>
- To prevent the query from triggering indefinitely, we will create another RunJS query that will make use of `clearInterval()` method. In this method we will get the value from the variable that we created in `set` query. Save this query as `clear`.
    ```js
    clearInterval(variables.interval)
    ```
- Finally, let's add a **button** on to the canvas and add the **event handler** to the button to run the `clear` query.
- Now, whenever the app will be loaded the **set** query will be triggered and will keep triggering the `post` query at the specified intervals. Whenever the user wants to **stop** the query they can click on the **button** to trigger the **clear** query which will clear the interval.

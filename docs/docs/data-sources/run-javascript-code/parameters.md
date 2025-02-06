---
id: parameters-in-run-javascript-code
title: Parameters in Run JavaScript Code
---
Parameters allow for dynamic control over the JavaScript code execution without altering the core script. This provides flexibility by allowing the same code to execute with different inputs.

Each parameter requires:
- **Name**: Name for the parameter
- **Default value**: The value can be constant strings, numbers and object.

### Steps to Add a Parameter

1. In the RunJS query editor, click the **Parameters +** button to create a new parameter.
2. Provide a **Name** for the parameter.
3. Set a Default **Value**, which can be a string, number, or object.

Once added, the **parameter can be referenced in the code using the syntax**: `parameters.<name>`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/js-param.png" alt="Run JavaScript code" />

</div>

### Displaying a Parameter Value in an Alert Box

Let's create a new parameter named *newAlert* and set the value as object `Displaying the Parameter Value in an Alert Box` and use the alert js method to show the value on the pop-up.

Syntax:
```
alert(parameters.newAlert)
```

When the query is triggered the alert will show the parameters value.

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/param-alert.png" alt="Run JavaScript code" />

### Calling Another Query with Parameters

Parameters can also be used to trigger other queries and pass custom values. Below is an example of how to call one query from another by providing custom parameters.

1. Begin by creating a new RunJS query named *multiply*. 
    - In this query, add the following parameters: 

        - *num1* with a default value of **10**
        - *num2* with a default value of **2**.
    - Add the following JavaScript Code:

    ```javascript
    return parameters.num1 * parameters.num2;
    ```
    - To display the result, place a text component on the canvas and set its text to `{{queries.multiply.data}}`.
    <br/>
    <img className="screenshot-full" src="/img/datasource-reference/custom-javascript/multiply-v2.png" alt="Run JavaScript code" />

2. Now, let's create another RunJS query called *callMultiply*, where we will invoke the *multiply* query created earlier using custom parameter values. Here's the code snippet for *callMultiply*:
 
    ```js
    queries.multiply.run({num1: 20, num2: 7})
    ```
 
    By executing this code within *callMultiply*, we trigger the *multiply* query with specific values for its parameters.
 
    <img className="screenshot-full" src="/img/datasource-reference/custom-javascript/call-multiply-v2.png" alt="Run JavaScript code" />

With this setup, the *multiply* query can be called from other queries, such as *callMultiply*, by providing custom parameter values. This allows you to reuse the *multiply* query with different inputs and display the results accordingly.


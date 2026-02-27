---
id: use-custom-parameters
title: Use Query Parameters
---

Custom parameters in your queries offer a flexible way to introduce variables without directly modifying query parameters. This guide will walk you through creating, utilizing, and calling queries with custom parameters.

### Adding Custom Parameters

1. Open the query panel and select the query you want to add custom parameters to.
2. Navigate to the **Parameters** section in the top bar.
3. Click the **+** button to add a custom parameter.
4. For each parameter, specify:
    - **Name:** Identifier for the parameter.
    - **Default value:** A constant string, number, or object.

<img className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-1.png" alt="How to: use custom parameters" />

### Syntax for Utilizing Parameters

Use `parameters.<identifier>` in your query to employ custom parameters. Note that parameters can only be used within the query where they are defined.

<img  className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-2.png" alt="How to: use custom parameters" />

### Example: Create Row in ToolJetDB with Custom Parameters

Let's assume we have a ToolJetDB table with the following columns: `name`, `email`, and `contact`. We will create a new row in the table using custom parameters.

- Create a new ToolJetDB query, select a table from the dropdown and select the `Create Row` operation.

- Add the following parameters:
  1. **name:** `name` and **value:** `Shubh`
  2. **name:** `email` and **value:** `shubh@email.com`
  3. **name:** `contact` and **value:** `1234567890`

- Add the columns to the query and use the custom parameters to set the values.

  | Column | Value |
  | ------ | ----- |
  | name   | `{{parameters.name}}` |
  | email  | `{{parameters.email}}` |
  | contact| `{{parameters.contact}}` |

  <img className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-3.png" alt="How to: use custom parameters" />

- Finally, execute the query to create a new row in the ToolJetDB table with the values provided in the custom parameters.

### Example: Providing Custom Parameters Using Events

In this example, we will demonstrate how to use custom parameters in a query by providing values from an event. We will use execute a REST API query and on its success, we will execute the ToolJetDB query to create a new row with the response data.

1. **Create a REST API Query:**
   - Method: `GET`
   - URL: `https://reqres.in/api/users?page=2`

2. **Add a Success Event:**
   - Name: `onSuccess`
   - Action: `Run Query`
   - Query: `update-customers`
   - Parameters: The parameters that you have added to the query will automatically be available in the event.
      1. **name:** `{{queries.get-user-data.data.data[0].name}}` This will use the name from the first record of the response data.
      2. **email:** `{{queries.get-user-data.data.data[0].email}}` This will use the email from the first record of the response data.
      3. **contact:** `1234567890` provided as a constant value just for demonstration.

3. **Execute the REST API query and observe the new row created in the ToolJetDB table.**

**Note:** You can also use parameters in JavaScript queries. Learn more about [JS Query Parameter](/docs/data-sources/run-js/#parameters-in-run-javascript-code). 

<img className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-4.png" alt="How to: use custom parameters" />
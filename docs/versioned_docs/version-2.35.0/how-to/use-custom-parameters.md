---
id: use-custom-parameters
title: Use Custom Parameters
---
<div style={{paddingBottom:'24px'}}>

Custom parameters in your queries offer a flexible way to introduce variables without directly modifying query parameters. This guide will walk you through creating, utilizing, and calling queries with custom parameters.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Adding Custom Parameters

1. Open the query panel and select the query you want to add custom parameters to.
2. Navigate to the **Parameters** section in the top bar.
3. Click the **+** button to add a custom parameter.
4. For each parameter, specify:
    - **Name:** Identifier for the parameter.
    - **Default value:** A constant string, number, or object.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/custom-parameters/params.png" alt="How to: use custom parameters" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Syntax for Utilizing Parameters

Use `parameters.<identifier>` in your query to employ custom parameters. Note that parameters can only be used within the query where they are defined.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/custom-parameters/syntax.png" alt="How to: use custom parameters" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example: Create Row in ToolJetDB with Custom Parameters

Let's assume we have a ToolJetDB table with the following columns: `name`, `email`, and `contact`. We will create a new row in the table using custom parameters.

- Create a new ToolJetDB query, select a table from the dropdown and select the `Create Row` operation.

- Add the following parameters:
  1. **name:** `name` and **value:** `Shubh`
  2. **name:** `email` and **value:** `shubh@email.com`
  3. **name:** `contact` and **value:** `4638563845`

  <div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/custom-parameters/params1.png" alt="How to: use custom parameters" />
  </div>

- Add the columns to the query and use the custom parameters to set the values.

  | Column | Value |
  | ------ | ----- |
  | name   | `{{parameters.name}}` |
  | email  | `{{parameters.email}}` |
  | contact| `{{parameters.contact}}` |

  <div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/custom-parameters/params2.png" alt="How to: use custom parameters" />
  </div>

- Finally, execute the query to create a new row in the ToolJetDB table with the values provided in the custom parameters.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example: Providing Custom Parameters Using Events

In this example, we will demonstrate how to use custom parameters in a query by providing values from an event. We will use execute a REST API query and on its success, we will execute the ToolJetDB query to create a new row with the response data.

1. **Create a REST API Query:**
   - Method: `GET`
   - URL: `https://reqres.in/api/users?page=2`

2. **Add a Success Event:**
   - Name: `onSuccess`
   - Action: `Run Query`
   - Query: `Create Row`
   - Parameters: The parameters that you have added to the query will automatically be available in the event.
      1. **name:** `{{queries.getSalesData.data.data[0].name}}` This will use the name from the first record of the response data.
      2. **email:** `{{queries.getSalesData.data.data[0].email}}` This will use the email from the first record of the response data.
      3. **contact:** `4638563845` provided as a constant value just for demonstration.

3. **Execute the REST API query and observe the new row created in the ToolJetDB table.**

**Note:** You can also use parameters in JavaScript queries. Learn more about [JS Query Parameter](/docs/data-sources/run-js/#js-parameters). 

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/custom-parameters/custompara.gif" alt="How to: use custom parameters" />
</div>

</div>

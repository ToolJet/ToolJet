---
id: tooljet-copilot
title: Copilot
---

:::info BETA
Tooljet Copilot is currently available in public beta for organizations.
:::

**ToolJet Copilot** helps you write your queries faster. It uses OpenAI's GPT-3.5 to suggest queries based on your data. 

## Activating Copilot

To access the Copilot, each user, including administrators, can sign up for the waitlist program individually. After signing up, each user will receive a unique API key associated with their account. Only administrators, however, will have the privilege to enable Copilot within the workspace settings. Administrators can navigate to the Copilot section in the workspace settings and toggle on the "Enable Copilot" option using their respective API key.

You can join the waitlist here: **https://tooljet.com/copilot**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/copilot/enable.png" alt="ToolJet Copilot" />

</div>

## Using Copilot

Once activated, the Copilot feature can be accessed while editing any query within the transformations section in the query editor.

For Copilot to operate, it requires a plain English prompt. Copilot possesses the ability to interact with and access components, along with generating code for specific actions related to those components. This capability is made possible by Copilot's awareness of the application's current state.

### Example: Generating a SQL statement 

We will demonstrate the usage of copilot by generating a SQL query to fetch the order details from a PostgreSQL database based on the key provided in the REST API data.

- Let's create a RESTAPI query using this mock api endpoint: https://fakestoreapi.com/users/1
- Enable transformation on the query editor

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/copilot/query.png" alt="ToolJet Copilot" />

</div>

- To generate a SQL query using Copilot, first enter the desired prompt within comments in the transformations code editor. Once the prompt has been entered, simply click the **Generate Code** button, and Copilot will generate the corresponding SQL query.

- Assuming that a PostgreSQL data source is already connected and there are two tables in it, namely `customer` and `orders`, enter the provided prompt in the code editor:

```bash
/*
Assume the data is an object which has email key.
assume we have a database with two tables: "customer" and "orders." The "customer" table has columns such as "customer_id," "customer_name," and "country." The "orders" table has columns such as "order_id," "customer_id," "order_date," and "total_amount."
return a SQL query to retrieve the total order amounts for customers from the email key retrieved from the data, who have placed more than three orders.*/
```

- Click on the "Generate Code" button to generate the SQL query.

- Once the code is generated, add a return statement below the code to return the generated SQL query. The variable name for the query might be different in your generated code.

```bash
return query //the variable might be different in your generated code
```

- Preview the returned SQL statement in the preview block to check if it is correct. Then click on the "Run" button to trigger the query.

- Once the query is executed, create a new PostgreSQL query in SQL mode and use JavaScript to get the data query data dynamically:

```js
{{queries.restapi1.data}}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/copilot/copilot1.gif" alt="ToolJet Copilot" />

</div>

:::caution
While using ToolJet Copilot, it is important to note that the accuracy of the output cannot be guaranteed by the platform. Ultimately, it is your responsibility to assess and evaluate any query before executing it.
:::

If you have feedback or questions about ToolJet Copilot, feel free to join our **[slack community](https://tooljet.com/slack)**.
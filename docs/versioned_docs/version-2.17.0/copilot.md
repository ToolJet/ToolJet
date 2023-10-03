---
id: tooljet-copilot
title: Copilot
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

:::info BETA
ToolJet Copilot is currently in private beta for **Business** and **Enterprise** users only.
:::

**ToolJet Copilot** helps you write your queries faster. It uses OpenAI to suggest queries based on your data. 

## Activating Copilot

To gain access to Copilot, all users, including administrators, can individually sign up for the waitlist program. Upon successful sign up, each user will be issued a distinctive API key linked to their account. However, the exclusive authority to activate Copilot within the workspace settings lies solely with administrators. Administrators can proceed to the Copilot section in the workspace settings, where they can utilize their respective API key to set the "Enable Copilot" toggle option.

You can join the waitlist here: **https://tooljet.com/copilot**

:::info
- Copilot can be used by users who have **permissions to edit** the app with the copilot setup.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/copilot/enable.png" alt="ToolJet Copilot" />

</div>

## Using Copilot

Once activated, the Copilot feature can be accessed while editing any query within the transformations section in the query editor.

Copilot's functionality relies on the provision of clear and concise plain English prompts. It possesses the capability to interact with and retrieve information from various components, enabling it to generate code specific to the desired actions associated with those components. This capability is facilitated by Copilot's comprehensive understanding of the application's present state.

### Token Limit per Workspace

A token is a unit of text that language models like ChatGPT process, such as a word or a character. To ensure fair usage and resource allocation among workspaces, a token limit is implemented. Currently, the token limit is set to **400**. If the token limit is surpassed, the request is declined with the message **"Unable to process request. Max tokens exceeded."**

### Rate-Limiting

To prevent abuse or excessive usage of the Copilot API, rate-limiting measures are in place. The following rules apply:

1. Each user is restricted to a maximum number of requests within a specific time frame.
2. The current rate limit allows for 100 requests per minute per user.
3. If a user surpasses the rate limit, subsequent requests from that user will be rejected.

:::info
When generating an API key, if a workspace has 5 editors, the daily request limit will be 500 (100 requests per editor). Even if the workspace later expands to 10 editors after a week, the maximum number of requests allowed per day will still be 500.
:::

### Example: Generating a SQL statement 

This example demonstrates the usage of copilot by generating a SQL query to fetch the order details from a PostgreSQL database based on the key provided in the REST API data.

- Create a RESTAPI query using this mock api endpoint: https://fakestoreapi.com/users/1
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

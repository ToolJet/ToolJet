---
id: tooljet-copilot
title: Copilot
---

:::info BETA
Tooljet Copilot is currently available in public beta for organizations.
:::

**ToolJet Copilot** helps you write your queries faster. It uses OpenAI's GPT-3.5 to suggest queries based on your data. 

## Activating Copilot

To activate Copilot for a ToolJet workspace, the administrator must go to the **workspace settings**, then the **Copilot** section, and toggle on the "**Enable Copilot**" option. Once Copilot is enabled, an **API key** must be provided in order to activate the feature.

You can join the waitlist here: 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/copilot/enable.png" alt="ToolJet Copilot" />

</div>

## Using Copilot

Once activated, the Copilot feature can be accessed while editing any query within the transformations section in the query editor.

In order for Copilot to function, a plain English prompt must be provided within comments. Copilot is capable of manipulating and accessing components, as well as generating code for component specific actions, as it has context of the current state of the application.

### Example: Generating a SQL statement 

- Create a query, that returns some data. Enable the **Transformation** and select your preferred language from the dropdown.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/copilot/query.png" alt="ToolJet Copilot" />

</div>

- To generate a SQL query using Copilot, first enter the desired prompt within comments in the transformations code editor. Once the prompt has been entered, simply click the **Generate Code** button, and Copilot will generate the corresponding SQL query.

```bash
/*
Assume the data is an object which has country key.
assume we have a database with two tables: "Customers" and "Orders." The "Customers" table has columns such as "customer_id," "customer_name," and "country." The "Orders" table has columns such as "order_id," "customer_id," "order_date," and "total_amount."
return a SQL query string to retrieve the total order amounts for customers from the country key retrieved from the data, who have placed more than three orders.*/
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/copilot/copilot1.gif" alt="ToolJet Copilot" />

</div>

:::caution
While using ToolJet Copilot, it is important to note that the accuracy of the output cannot be guaranteed by the platform. Ultimately, it is your responsibility to assess and evaluate any query before executing it.
:::

If you have feedback or questions about ToolJet Copilot, feel free to join our **[slack community](https://tooljet.com/slack)**.
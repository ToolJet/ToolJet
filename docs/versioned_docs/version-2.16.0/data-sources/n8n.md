---
id: n8n
title: n8n
---

# n8n

ToolJet can trigger n8n workflows using webhook URLs. Please refer [this](https://docs.n8n.io/) to know more about n8n.

## Connection

Go to the data source manager on the left sidebar and click on `+` button to add new data source. Select n8n from the list of available data sources in the modal that pops-up.

n8n webhooks can be called with or without an **Authentication**. You can keep the `Authentication type` as `none` if your webhook didn't have one or if it has one then you can choose the one from the dropdown and provide credentials:

#### Authentication Types
- **Basic Auth**: To connect your n8n webhooks using basic auth you'll need to provide the following credentials:
    - **Username**
    - **Password**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/n8n/basicauth.png" alt="n8n basicauth"  />

</div>

- **Header Auth**: To connect your n8n webhooks using header auth the following fields are required:
    - **Name / Key**
    - **Value**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/n8n/headerauth.png" alt="n8n headerauth"  />

</div>

:::tip
Webhook credentials and instance credentials are different. Please use the credentials that you use with the webhook trigger. Know more: **[Webhook Authentication](https://docs.n8n.io/nodes/n8n-nodes-base.webhook/#:~:text=then%20gets%20deactivated.-,Authentication,-%3A%20The%20Webhook%20node)**.
:::

## Trigger Workflow

Click on `+` button of the query manager at the bottom panel of the editor and the select n8n as the datasource.

You can trigger a workflow with `GET/POST` URL. Choose the request type from the `Methods` dropdown and then provide the required fields:
  - **URL parameters** (Support for GET & POST) `Optional`
  - **Body** (Only for POST URL) `Required`


<img className="screenshot-full" src="/img/datasource-reference/n8n/query.png" alt="n8n query" />


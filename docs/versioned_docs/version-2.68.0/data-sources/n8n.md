---
id: n8n
title: n8n
---

ToolJet can trigger n8n workflows using webhook URLs. Please refer [this](https://docs.n8n.io/) to know more about n8n.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the n8n data source, click on the **+ Add new Data source** button located on the query panel or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

Webhooks in n8n can be configured to operate with or without **Authentication**. If no authentication is required, select `None` as the **Authentication type**. For webhooks that require authentication, choose the appropriate method from the dropdown and provide the corresponding credentials.

### Authentication Types
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

</div>

<div style={{paddingTop:'24px'}}>

## Trigger Workflow

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the database added in the previous step as the data source. 

Once the n8n data source is added, you can trigger a workflow with `GET/POST` URL. 

### GET Method

Choose the GET Method from the dropdown.

#### Optional Parameter:
  - **URL parameters** 

<img className="screenshot-full" src="/img/datasource-reference/n8n/get.png" alt="n8n query" style={{marginBottom:'15px'}} />

### POST Method

Choose the POST Method from the dropdown.

#### Required Parameter:
  - **Body**

#### Optional Parameter:
  - **URL parameters** 

<img className="screenshot-full" src="/img/datasource-reference/n8n/POST.png" alt="n8n query" />

</div>

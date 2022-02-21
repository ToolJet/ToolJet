
# n8n

ToolJet can trigger N8n workflows using webhook URLs. Please Refer [this](https://docs.n8n.io/) to know more about n8n

## Connection

n8n webhooks can be call with or without an **Authentication**. So choose Authentication Type `none` if your wehbook hasn't. if has then, choose Authentication Type and provide Credentails.

#### Authentication Types
- **Basic Auth**

    Required fields :
    - Username
    - Password

- **Header Auth**

    Required fields :
    - Name / Key
    - Value  

:::tip
Webhook credentials and instance credentials are different. Please use the credentials that you use with the webhook trigger. Know more [Webhook authentication]( https://docs.n8n.io/nodes/n8n-nodes-base.webhook/#:~:text=then%20gets%20deactivated.-,Authentication,-%3A%20The%20Webhook%20node ).
:::

## Trigger Workflow

You can trigger a workflow with `GET/POST` URL. So Choose the request type from `Methods` dropdown . Then provide required fields:

- URL parameters (Support for GET & POST) `Optional`
- Body (Only for POST URL) `Required`
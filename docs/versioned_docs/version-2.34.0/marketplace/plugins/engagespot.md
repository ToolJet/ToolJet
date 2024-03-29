---
id: marketplace-plugin-engagespot
title: Engagespot
---

# Engagespot

ToolJet connects to your Engagespot account, allowing you to send notifications, create or update users from within your ToolJet application.

:::info
**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

- Establish a connection to Engagespot by either clicking `+Add new Data source` on the query panel or navigating to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard.

- Enter your Engagespot API key and API secret into their designated fields. To generate user tokens directly from ToolJet, you can optionally provide a signing key.

- Click **Test Connection** to validate your credentials. Click **Save** to store the data source.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/engagespot/engagespot_install.png" alt="Engagespot API Key" />
</div>


:::info
You can change your Engagespot BaseURL by enable custom endpoint.
:::

## Querying Engagespot

Click on `+Add` button of the [query manager](/docs/app-builder/query-panel/#add) and select the data source added in the previous step as the data source. Select the operation that you want to perform, fill in the required parameters and click on **Run** button to run the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/engagespot_query.png" alt="engagespot query" />

</div>

<br/>

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/tutorial/transformations).
:::

## Query operations

You can create query for Engagespot data source to perform several actions such as:
  1. **[Create or Update User](#create-or-update-user)**
  2. **[Send Notification](#send-notification)**
  3. **[Generate User Token](#generate-user-token)** 

### Create OR Update User

  #### Required parameters:
  - **User Identifier** - Unique user identifier.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/create_user.png" alt="engagespot create user" />
</div>
<br/>

:::info
The user profile column accepts any key-value pairs in valid JSON object format.
:::

### Send Notification

  #### Required parameters:
  - **Reciepient** - Unique user identifier. 
  - **Notification Title** - The title for your notification.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/send_notification.png" alt="engagespot send notitication"/>
</div>
<br/>

### Generate User Token

  #### Required parameters:
  - **User Identifier** - Unique user identifier.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/generate_token.png" alt="engagespot generate token" />
</div>
<br/>

:::info
To generate user tokens, ensure you provide a Signing Key when establishing a connection to your Engagespot data source.
:::

### Adding the In-App Inbox element to your Tooljet app
   To set up an In-App Inbox element in your ToolJet application, refer to the [Adding In-App](https://docs.engagespot.co/docs/plugins/tooljet/adding-the-inbox-component) guide.


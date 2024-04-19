---
id: engagespot
title: Engagespot
---

# Engagespot

ToolJet can connect to your Engagespot account and send notifications.

## Connection

To establish a connection with the Engagespot data source, you can either click on the `+Add new Data source` button located on the query panel or navigate to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard.

Enter your Engagespot API key and Engagespot API secret in their respective fields. Optionally, you can specify a signing key if you wish to generate user tokens from ToolJet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/engagespot_install.png" alt="engagespot api key" />

</div>

Click on **Test connection** button to verify if the credentials. Click on **Save** button to save the data source.

:::info
You can change your engagespot BaseURL by enable custom endpoint.
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
  2. **[Send Notification](#read-object)**
  3. **[Generate User Token](#upload-object)** 

### Create OR Update User

  #### Required parameters:
  - **User Identifier** - user unique identifier 

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/create_user.png" alt="engagespot create user" />
</div>
<br/>

:::info
The user profile column will accept any key value pair. please note that it must be always a valid JSON.
:::

### Send Notification

  #### Required parameters:
  - **Reciepient** - user unique identifier 
  - **Notification Title** - The title for your notification

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/send_notification.png" alt="engagespot send notitication"/>
</div>
<br/>

### Generate User Token

  #### Required parameters:
  - **User Identifier** - user unique identifier 

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/marketplace/plugins/engagespot/generate_token.png" alt="engagespot generate token" />
</div>
<br/>

:::warning
For Generating user tokens must add SigningKey while establishing connection with Engagespot Data soucre.
:::

### Adding the In-App Inbox element to your Tooljet app
   If you want to setup an In-App Inbox element in your tooljet app you can  Read [Adding In app](https://docs.engagespot.co/docs/plugins/tooljet/adding-the-inbox-component) and follow the steps.


---
id: zendesk
title: Zendesk
---

ToolJet can connect to Zendesk APIs to read and write data using OAuth 2.0, which helps us to limit an application's access to a user's account.

<div style={{paddingTop:'24px'}}>

## Connection 

To establish a connection with the Zendesk data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Zendesk as the data source.

ToolJet connects to your Zendesk app using :
- **Zendesk Sub-domain**
- **Client ID**
- **Client Secret**

### Authorization Scopes 

You can create a Zendesk data source with one of either of the two permission scopes :
- **Read Only**
- **Read and Write**

:::info
You must first be a verified user to make Zendesk API requests. This is configured in the Admin Center interface in **Apps and integrations > APIs > Zendesk APIs.** For more information, see Security and Authentication in the [Zendesk Support API reference](https://developer.zendesk.com/api-reference/ticketing/introduction/#security-and-authentication) or [check out Zendesk's docs](https://support.zendesk.com/hc/en-us/articles/4408845965210).
:::

</div>

<div style={{paddingTop:'24px'}}>

## Querying Zendesk

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Zendesk** datasource added in previous step.
3. Select the desired operation and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/zendesk/zendesk-v2.gif" alt="ToolJet - Data source - Zendesk" />

</div>


<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[List Tickets](#list-tickets)**
- **[List requested Tickets](#list-requested-tickets)**
- **[Show a Ticket](#show-tickets)**
- **[Update a Ticket](#update-tickets)**
- **[List Users](#list-users)**
- **[Get User](#get-user)**
- **[Search](#search)**


### List Tickets
Lists all the tickets in your Zendesk account.

<img className="screenshot-full" src="/img/datasource-reference/zendesk/list-tickets.png" alt="ToolJet - Data source - Zendesk" />

### List Requested Tickets
Lists all the tickets requested by the user. 

#### Required Parameter
- **User ID** 

<img className="screenshot-full" src="/img/datasource-reference/zendesk/list-requested-tickets.png" alt="ToolJet - Data source - Zendesk" />

### Show Tickets
Gets a ticket's properties with the given ID, though not the ticket comments.

#### Required Parameter
- **Ticket ID** 

<img className="screenshot-full" src="/img/datasource-reference/zendesk/show.png" alt="ToolJet - Data source - Zendesk" />

### Update Tickets
Updates a ticket's properties with the given ID.

#### Required Parameter
- **Ticket ID** 
- **Body**

<img className="screenshot-full" src="/img/datasource-reference/zendesk/update.png" alt="ToolJet - Data source - Zendesk" />

### List Users
Lists all the users in your Zendesk account.

<img className="screenshot-full" src="/img/datasource-reference/zendesk/list-users.png" alt="ToolJet - Data source - Zendesk" />

### Get User
Gets a user's profile with the given ID.

#### Required Parameter
- **User ID** 

<img className="screenshot-full" src="/img/datasource-reference/zendesk/get.png" alt="ToolJet - Data source - Zendesk" />

### Search

The Search Query uses Zendesk's Search API to return tickets, users, and organizations with defined filters.

#### Required Parameter
- **Query** 

Common filters include:
- `type:ticket`
- `type:user`
- `type:organization`
- `type:ticket organization:12345 status:open`

<img className="screenshot-full" src="/img/datasource-reference/zendesk/search.png" alt="ToolJet - Data source - Zendesk" />

</div>
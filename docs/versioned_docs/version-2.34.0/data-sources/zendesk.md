---
id: zendesk
title: Zendesk
---

# Zendesk

ToolJet can connect to Zendesk APIs to read and write data using OAuth 2.0, which helps us to limit an application's access to a user's account.

  - [Connection](#connection)
  - [Querying Zendesk](#querying-zendesk)

## Connection 

ToolJet connects to your Zendesk app using :
- **Zendesk Sub-domain**
- **Client ID**
- **Client Secret**

## Authorization Scopes 

You can create a Zendesk data source with one of either of the two permission scopes :
  1. **Read Only**
  2. **Read and Write**




:::info
You must first be a verified user to make Zendesk API requests. This is configured in the Admin Center interface in **Apps and integrations > APIs > Zendesk APIs.** For more information, see Security and Authentication in the [Zendesk Support API reference](https://developer.zendesk.com/api-reference/ticketing/introduction/#security-and-authentication) or [check out Zendesk's docs](https://support.zendesk.com/hc/en-us/articles/4408845965210).
:::

To connect Zendesk datasource to your ToolJet application, go to the data source manager on the left-sidebar and click on the `+` button. Select Zendesk from the list of available datasources, provide the credentials and click **Connect to Zendesk** and authenticate via OAuth. And click **Save** to save the datasource.

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - Zendesk](/img/datasource-reference/zendesk/zendesk-v2.gif)

</div>

## Operations
1. **[List Tickets](/docs/data-sources/zendesk#list-tickets)**
2. **[List requested Tickets](/docs/data-sources/zendesk#list-requested-tickets)**
3. **[Show a Ticket](/docs/data-sources/zendesk#show-tickets)**
4. **[Update a Ticket](/docs/data-sources/zendesk#update-tickets)**
5. **[List Users](/docs/data-sources/zendesk#list-users)**
6. **[Get Profile](/docs/data-sources/zendesk#get-profile)**
7. **[Search query](/docs/data-sources/zendesk#search-query)**


### List Tickets
Lists all the tickets in your Zendesk account.

### List requested Tickets
Lists all the tickets requested by the user. 

| Fields      | description |
| ----------- | ----------- |
| User ID    | The id of the user  |

### Show Tickets
Gets a ticket's properties with the given ID, though not the ticket comments.

| Fields      | description |
| ----------- | ----------- |
| Ticket ID    | The id of the ticket  |

### Update Tickets
Updates a ticket's properties with the given ID.

| Fields      | description |
| ----------- | ----------- |
| Ticket ID    | The id of the ticket  |
| Body    | The properties and values to update. Example: `{{({ "ticket": {"status": "solved"} })}}` |

### List Users
Lists all the users in your Zendesk account.

### Get Profile
Gets a user's profile with the given ID.

| Fields      | description |
| ----------- | ----------- |
| User ID    | The id of the user  |

### Search Query
The Search Query uses Zendesk's Search API to return tickets, users, and organizations with defined filters.
Common filters include:
- `type:ticket`
- `type:user`
- `type:organization`
- `type:ticket organization:12345 status:open`

| Fields      | description |
| ----------- | ----------- |
| Query    | The search query  |

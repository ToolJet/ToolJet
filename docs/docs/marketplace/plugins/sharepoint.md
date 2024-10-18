---
id: marketplace-plugin-sharepoint
title: Sharepoint
---

ToolJet allows you to connect to Microsoft Sharepoint to perform various operations like managing sites, lists, and items using Microsoft Graph API.

:::info
**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to a Sharepoint data source in ToolJet, you can either click the **+ Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

:::info
You'll need to register your application in Azure Active Directory to get the required credentials. The application needs appropriate Microsoft Graph API permissions.
:::

To connect to Sharepoint, you need the following details:
- **Client ID**
- **Client Secret**
- **Tenant ID**

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/connect.png" alt="Sharepoint Connect" />
</div>

## Querying Sharepoint

1. Click the **+ Add** button in the query manager at the bottom of the editor and select the Sharepoint data source added earlier.
2. Choose the operation you want to perform on your Sharepoint instance.

:::tip
Query results can be transformed using transformations. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**
:::

## Supported Operations

ToolJet supports the following Sharepoint operations:

- **[Get All Sites](#get-all-sites)**
- **[Get Site](#get-site)**
- **[Get Analytics](#get-analytics)**
- **[Get Pages](#get-pages)**
- **[Get Lists](#get-lists)**
- **[Get List Metadata](#get-list-metadata)**
- **[Create List](#create-list)**
- **[Get List Items](#get-list-items)**
- **[Update List Item](#update-list-item)**
- **[Delete List Item](#delete-list-item)**
- **[Add List Item](#add-list-item)**

### Get All Sites

This operation retrieves all available Sharepoint sites. For more details, see the Microsoft Graph API documentation **[here](https://learn.microsoft.com/en-us/graph/api/site-search)**.

#### Required Parameters
None

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/get-sites.png" alt="Get Sites" />
</div>

#### Example Response:
```json
{
  "value": [
    {
      "id": "contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019",
      "name": "Marketing Team Site",
      "description": "Site for marketing team collaboration",
      "createdDateTime": "2021-08-15T10:00:00Z",
      "lastModifiedDateTime": "2023-09-20T15:30:00Z",
      "webUrl": "https://contoso.sharepoint.com/sites/marketing"
    }
  ]
}
```

### Get Site

This operation retrieves information about a specific site.

#### Required Parameters
- **Site ID**: The ID of the site to retrieve

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/get-site.png" alt="Get Site" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
```

#### Example Response:
```json
{
  "id": "contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019",
  "name": "Marketing Team Site",
  "description": "Site for marketing team collaboration",
  "createdDateTime": "2021-08-15T10:00:00Z",
  "lastModifiedDateTime": "2023-09-20T15:30:00Z",
  "webUrl": "https://contoso.sharepoint.com/sites/marketing"
}
```

### Get Analytics

This operation retrieves analytics for a specific site.

#### Required Parameters
- **Site ID**: The ID of the site
- **Time Interval**: Select one:
  - `lastSevenDays`
  - `allTime`

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/get-analytics.png" alt="Get Analytics" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
Time Interval: lastSevenDays
```

#### Example Response:
```json
{
  "itemActivityStats": [
    {
      "startDateTime": "2023-10-10T00:00:00Z",
      "viewCount": 125,
      "editCount": 14,
      "commentCount": 3
    }
  ]
}
```

### Create List

This operation creates a new list in a Sharepoint site.

#### Required Parameters
- **Site ID**: The ID of the site
- **Body**: The list configuration in JSON format

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/create-list.png" alt="Create List" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
Body:
{
  "displayName": "Project Tasks",
  "columns": [
    {
      "name": "TaskName",
      "text": { }
    },
    {
      "name": "DueDate",
      "dateTime": { }
    },
    {
      "name": "Priority",
      "choice": {
        "choices": ["High", "Medium", "Low"]
      }
    }
  ],
  "list": {
    "template": "genericList"
  }
}
```

#### Example Response:
```json
{
  "id": "22f69173-0c1d-4c76-a721-5a31f0bd5af3",
  "displayName": "Project Tasks",
  "list": {
    "template": "genericList"
  },
  "columns": [
    {
      "name": "TaskName",
      "text": {}
    },
    {
      "name": "DueDate",
      "dateTime": {}
    },
    {
      "name": "Priority",
      "choice": {
        "choices": ["High", "Medium", "Low"]
      }
    }
  ]
}
```

### Get List Items

This operation retrieves items from a specific list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/get-items.png" alt="Get Items" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
```

#### Example Response:
```json
{
  "value": [
    {
      "id": "1",
      "fields": {
        "TaskName": "Update Documentation",
        "DueDate": "2023-10-30T00:00:00Z",
        "Priority": "High"
      }
    },
    {
      "id": "2",
      "fields": {
        "TaskName": "Review Code",
        "DueDate": "2023-10-25T00:00:00Z",
        "Priority": "Medium"
      }
    }
  ]
}
```

### Update List Item

This operation updates an existing item in a list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list
- **Item ID**: The ID of the item to update
- **Body**: The updated values in JSON format

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/update-item.png" alt="Update Item" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Item ID: 1
Body:
{
  "TaskName": "Update Documentation",
  "Priority": "Medium",
  "DueDate": "2023-11-15T00:00:00Z"
}
```

#### Example Response:
```json
{
  "id": "1",
  "fields": {
    "TaskName": "Update Documentation",
    "Priority": "Medium",
    "DueDate": "2023-11-15T00:00:00Z"
  }
}
```

### Delete List Item

This operation removes an item from a list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list
- **Item ID**: The ID of the item to delete

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/delete-item.png" alt="Delete Item" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Item ID: 1
```

#### Example Response:
```json
{
  "code": 204,
  "statusText": "No Content",
  "message": "Item having id '1' in List '22f69173-0c1d-4c76-a721-5a31f0bd5af3' has been deleted."
}
```

### Add List Item

This operation adds a new item to a list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list
- **Body**: The new item's data in JSON format

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/sharepoint/add-item.png" alt="Add Item" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Body:
{
  "fields": {
    "TaskName": "Prepare Presentation",
    "Priority": "High",
    "DueDate": "2023-10-30T00:00:00Z"
  }
}
```

#### Example Response:
```json
{
  "id": "3",
  "fields": {
    "TaskName": "Prepare Presentation",
    "Priority": "High",
    "DueDate": "2023-10-30T00:00:00Z"
  }
}
```

:::info
The images referenced in this documentation are placeholders. You'll need to replace them with actual screenshots of the ToolJet interface showing each operation's configuration panel.
:::
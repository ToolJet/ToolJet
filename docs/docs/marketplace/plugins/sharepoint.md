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
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/connect.png" alt="Sharepoint Connect" />
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
- **[Get Pages Of a Site](#get-pages-of-a-site)**
- **[Get All Lists](#get-all-lists)**
- **[Get Metadata Of a List](#get-metadata-of-a-list)**
- **[Create a List](#create-a-list)**
- **[Get Items Of a List](#get-items-of-a-list)**
- **[Update Item Of a List](#update-item-of-a-list)**
- **[Delete Item Of a List](#delete-item-of-a-list)**
- **[Add Item To a List](#add-item-to-a-list)**

### Get All Sites

This operation retrieves all available Sharepoint sites. For more details, see the Microsoft Graph API documentation **[here](https://learn.microsoft.com/en-us/graph/api/site-search)**.

#### Optional Parameters
- **Top**: The number of sites to retrieve
- **Page**: The page number to retrieve

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/get-all-sites.png" alt="Get All Sites" />
</div>

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites",
  "value": [
    {
      "createdDateTime": "2024-09-08T15:54:30Z",
      "id": "tooljetxxxx.sharepoint.com,bcxxxx-4b3a-xxxxxx-dfe229c34311,2a4ac5da-xxx-xxxx-b047-18dece61fb95",
      "lastModifiedDateTime": "2024-08-17T18:50:05Z",
      "name": "appcatalog",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/appcatalog",
      "displayName": "Apps",
      "root": {},
      "siteCollection": {
        "hostname": "tooljetxxxx.sharepoint.com"
      }
    }
  ]
}
```
</details>

### Get Site

This operation retrieves information about a specific site.

#### Required Parameters
- **Site ID**: The ID of the site to retrieve

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/get-site.png" alt="Get Site" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
```

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites/$entity",
  "createdDateTime": "2024-10-22T13:21:10.623Z",
  "description": "Internal DIA Guidelines",
  "id": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb",
  "lastModifiedDateTime": "2024-10-24T13:35:39Z",
  "name": "NewStyle",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle",
  "displayName": "NewStyle",
  "root": {},
  "siteCollection": {
    "hostname": "tooljetxxxx.sharepoint.com"
  }
}
```
</details>

### Get Analytics

This operation retrieves analytics for a specific site.

#### Required Parameters
- **Site ID**: The ID of the site
- **Time Interval**:
  - **Last 7 Days**
  - **All Time**

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/get-analytics.png" alt="Get Analytics" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
Time Interval: Last 7 Days
```

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.itemActivityStat",
  "aggregationInterval": "None",
  "startDateTime": "2024-10-30T00:00:00Z",
  "endDateTime": "2024-11-05T00:00:00Z",
  "isTrending": false,
  "access": {
    "actionCount": 0,
    "actorCount": 0,
    "timeSpentInSeconds": 0
  },
  "incompleteData": {
    "wasThrottled": false,
    "resultsPending": false,
    "notSupported": false
  }
}
```
</details>

### Get Pages Of a Site

This operation retrieves all pages from a specific site.

#### Required Parameters
- **Site ID**: The ID of the site

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/get-pages.png" alt="Get Pages" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
```

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com')/pages",
  "value": [
    {
      "id": "1234-5678-91011",
      "title": "Welcome Page",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/mysite/SitePages/Welcome.aspx",
      "createdDateTime": "2024-01-15T10:00:00Z",
      "lastModifiedDateTime": "2024-01-16T14:30:00Z"
    }
  ]
}
```
</details>

### Get All Lists

This operation retrieves all lists from a specific site.

#### Required Parameters
- **Site ID**: The ID of the site

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/get-lists.png" alt="Get Lists" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
```

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com')/lists",
  "value": [
    {
      "id": "22f69173-0c1d-4c76-a721-5a31f0bd5af3",
      "displayName": "Documents",
      "list": {
        "template": "documentLibrary"
      },
      "createdDateTime": "2024-01-15T10:00:00Z",
      "lastModifiedDateTime": "2024-01-16T14:30:00Z"
    }
  ]
}
```
</details>

### Get Metadata Of a List

This operation retrieves metadata for a specific list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/get-list-metadata.png" alt="Get List Metadata" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
```

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com')/lists/$entity",
  "id": "22f69173-0c1d-4c76-a721-5a31f0bd5af3",
  "displayName": "Project Tasks",
  "list": {
    "template": "genericList",
    "contentTypesEnabled": true,
    "hidden": false
  },
  "columns": [
    {
      "name": "TaskName",
      "text": {}
    },
    {
      "name": "DueDate",
      "dateTime": {}
    }
  ]
}
```
</details>

### Create a List

This operation creates a new list in a Sharepoint site.

#### Required Parameters
- **Site ID**: The ID of the site
- **Body**: The list configuration in JSON format

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/create-list.png" alt="Create List" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
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

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com')/lists/$entity",
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
</details>

### Get Items Of a List

This operation retrieves items from a specific list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/get-items.png" alt="Get Items" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
```

<details>
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com')/lists('22f69173-0c1d-4c76-a721-5a31f0bd5af3')/items",
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
</details>

### Update Item Of a List

This operation updates an existing item in a list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list
- **Item ID**: The ID of the item to update
- **Body**: The updated values in JSON format

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/update-item.png" alt="Update Item" />
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

<details>
<summary>**Response Example**</summary>

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
</details>

### Delete Item Of a List

This operation removes an item from a list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list
- **Item ID**: The ID of the item to delete

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/delete-item.png" alt="Delete Item" />
</div>

#### Example:
```yaml
Site ID: contoso.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Item ID: 1
```

<details>
<summary>**Response Example**</summary>

```json
{
  "code": 204,
  "statusText": "No Content",
  "message": "Item having id '1' in List '22f69173-0c1d-4c76-a721-5a31f0bd5af3' has been deleted."
}
```
</details>

### Add Item To a List

This operation adds a new item to a list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list
- **Body**: The new item's data in JSON format

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/sharepoint/add-item.png" alt="Add Item" />
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

<details>
<summary>**Response Example**</summary>

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
</details>
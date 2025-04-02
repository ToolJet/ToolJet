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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/connect.png" alt="Sharepoint Connect" />
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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-all-sites.png" alt="Get All Sites" />
</div>

<details id="tj-dropdown">
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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-site.png" alt="Get Site" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
```

<details id="tj-dropdown">
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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-analytics.png" alt="Get Analytics" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
Time Interval: Last 7 Days
```

<details id="tj-dropdown">
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

#### Optional Parameters
- **Top**: The number of sites to retrieve
- **Page**: The page number to retrieve

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-pages.png" alt="Get Pages" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
```

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/pages",
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/sites/tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb/pages?$top=1&$skiptoken=UGFnZWQ9VFJVRSZwX0ZpbGVMZWFmUmVmPUV2ZW50UGxhbkhvbWUuYXNweCZwX0lEPTc",
  "value": [
    {
      "@odata.type": "#microsoft.graph.sitePage",
      "@odata.etag": ""{2095ED1D-AC76-4480-BBDC-8D63EBAAE2AF},6"",
      "createdDateTime": "2024-10-22T13:21:33Z",
      "eTag": ""{2095ED1D-AC76-4480-BBDC-8D63EBAAE2AF},6"",
      "id": "2095ed1d-ac76-4480-bbdc-8d63ebaae2af",
      "lastModifiedDateTime": "2024-10-22T13:21:35Z",
      "name": "EventPlanHome.aspx",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/SitePages/EventPlanHome.aspx",
      "title": "Home",
      "pageLayout": "home",
      "thumbnailWebUrl": "https://tooljetxxxx.sharepoint.com/_layouts/15/getpreview.ashx?guidSite=887cb371-e930-4e5b-a726-8d5769e6b946&guidWeb=6d653d09-1613-4663-99ab-1bb72ff6ceeb&guidFile=bb423735-7402-47df-ab2e-729bddfe6f23",
      "promotionKind": "page",
      "showComments": false,
      "showRecommendedPages": false,
      "contentType": {
        "id": "0x0101009D1CB255DA76424F860D91F20E6C4118004CC245E37669F3438CDDEB01FCEAE890",
        "name": "Site Page"
      },
      "createdBy": {
        "user": {
          "displayName": "Oliver Smith",
          "email": "oliver@tooljetxxxx.onmicrosoft.com"
        }
      },
      "lastModifiedBy": {
        "user": {
          "displayName": "Oliver Smith",
          "email": "oliver@tooljetxxxx.onmicrosoft.com"
        }
      },
      "parentReference": {
        "siteId": "887cb371-e930-4e5b-a726-8d5769e6b946"
      },
      "publishingState": {
        "level": "published",
        "versionId": "1.0"
      },
      "reactions": {}
    }
  ]
}
```
</details>

### Get All Lists

This operation retrieves all lists from a specific site.

#### Required Parameters
- **Site ID**: The ID of the site

#### Optional Parameters
- **Page**: The page number to retrieve

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-all-lists.png" alt="Get All Lists" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
Page: 1
```

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists",
  "value": [
    {
      "@odata.etag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
      "createdDateTime": "2024-10-24T11:11:10Z",
      "description": "",
      "eTag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
      "id": "1a64ae23-9cb6-4521-b489-61d558dde9f7",
      "lastModifiedDateTime": "2024-10-24T11:11:17Z",
      "name": "Test_table_query",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query",
      "displayName": "Test_table_query",
      "createdBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "lastModifiedBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "parentReference": {
        "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
      },
      "list": {
        "contentTypesEnabled": false,
        "hidden": false,
        "template": "genericList"
      }
    }
  ]
}
```
</details>

### Get Metadata Of a List

This operation retrieves metadata for a specific list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List Name**: The name of the list, only used if List ID is not provided
- **List ID**: The ID of the list, required if List Name is not provided

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-list-metadata.png" alt="Get List Metadata" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
```

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists/$entity",
  "@odata.etag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
  "createdDateTime": "2024-10-24T11:11:10Z",
  "description": "",
  "eTag": ""1a64ae23-9cb6-4521-b489-61d558dde9f7,11"",
  "id": "1a64ae23-9cb6-4521-b489-61d558dde9f7",
  "lastModifiedDateTime": "2024-11-05T10:27:04Z",
  "name": "Test_table_query",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query",
  "displayName": "Test_table_query",
  "createdBy": {
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "lastModifiedBy": {
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "parentReference": {
    "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
  },
  "list": {
    "contentTypesEnabled": false,
    "hidden": false,
    "template": "genericList"
  },
  "columns@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/columns",
  "columns": [
    {
      "columnGroup": "Custom Columns",
      "description": "",
      "displayName": "USER_NAME",
      "enforceUniqueValues": false,
      "hidden": false,
      "id": "fa564e0f-0c70-4ab9-b863-0177e6ddd247",
      "indexed": false,
      "name": "Title",
      "readOnly": false,
      "required": false,
      "text": {
        "allowMultipleLines": false,
        "appendChangesToExistingText": false,
        "linesForEditing": 0,
        "maxLength": 255
      }
    }
  ],
  "items@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items",
  "items": [
    {
      "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "createdDateTime": "2024-10-24T11:11:11Z",
      "eTag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "id": "1",
      "lastModifiedDateTime": "2024-10-24T11:11:11Z",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query/1_.000",
      "createdBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "lastModifiedBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "parentReference": {
        "id": "036d657d-ed69-4dcc-a669-483ce9788655",
        "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
      },
      "contentType": {
        "id": "0x0100A3D887BE30452F4A9CBA7E684C523E2100098058C6B440D14786561D28914A3EDB",
        "name": "Item"
      },
      "fields@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items('1')/fields/$entity",
      "fields": {
        "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
        "Title": "Null_test",
        "id": "1",
        "AuthorLookupId": "7",
        "EditorLookupId": "7",
        "_UIVersionString": "1.0",
        "Attachments": false,
        "Edit": "",
        "LinkTitleNoMenu": "Null_test",
        "LinkTitle": "Null_test",
        "ItemChildCount": "0",
        "FolderChildCount": "0",
        "_ComplianceFlags": "",
        "_ComplianceTag": "",
        "_ComplianceTagWrittenTime": "",
        "_ComplianceTagUserId": ""
      }
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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/create-list.png" alt="Create List" />
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

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists/$entity",
  "@odata.etag": "f7497bc1-a8e6-49d0-a11c-05b3df1d8d2b,10",
  "createdDateTime": "2024-11-05T10:48:51Z",
  "description": "",
  "eTag": "f7497bc1-a8e6-49d0-a11c-05b3df1d8d2b,10",
  "id": "f7497bc1-a8e6-49d0-a11c-05b3df1d8d2b",
  "lastModifiedDateTime": "2024-11-05T10:48:52Z",
  "name": "Project Tasks",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Project%20Tasks",
  "displayName": "Project Tasks",
  "createdBy": {
    "user": {
      "displayName": "Oliver Smith",
      "email": "oliver@tooljetxxxx.onmicrosoft.com"
    }
  },
  "parentReference": {
    "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
  },
  "list": {
    "contentTypesEnabled": false,
    "hidden": false,
    "template": "genericList"
  }
}
```
</details>

### Get Items Of a List

This operation retrieves items from a specific list.

#### Required Parameters
- **Site ID**: The ID of the site
- **List ID**: The ID of the list

#### Optional Parameters
- **Top**: The number of sites to retrieve
- **Page**: The page number to retrieve

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/get-list-items.png" alt="Get List Items" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Top: 1
Page: 1
```

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items(fields())",
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/sites/tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb/lists/1a64ae23-9cb6-4521-b489-61d558dde9f7/items?$expand=fields&$top=1&$skiptoken=UGFnZWQ9VFJVRSZwX0lEPTE",
  "value": [
    {
      "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "createdDateTime": "2024-10-24T11:11:11Z",
      "eTag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
      "id": "1",
      "lastModifiedDateTime": "2024-10-24T11:11:11Z",
      "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query/1_.000",
      "createdBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "lastModifiedBy": {
        "user": {
          "email": "oliver@tooljetxxxx.onmicrosoft.com",
          "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
          "displayName": "Oliver Smith"
        }
      },
      "parentReference": {
        "id": "036d657d-ed69-4dcc-a669-483ce9788655",
        "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
      },
      "contentType": {
        "id": "0x0100A3D887BE30452F4A9CBA7E684C523E2100098058C6B440D14786561D28914A3EDB",
        "name": "Item"
      },
      "fields@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items('1')/fields/$entity",
      "fields": {
        "@odata.etag": ""12b493eb-2452-451b-84e5-ecba8ec898c8,1"",
        "Title": "Null_test",
        "field_2": 10,
        "field_3": 123.32,
        "field_4": 1,
        "id": "1",
        "ContentType": "Item",
        "Modified": "2024-10-24T11:11:11Z",
        "Created": "2024-10-24T11:11:11Z",
        "AuthorLookupId": "7",
        "EditorLookupId": "7",
        "_UIVersionString": "1.0",
        "Attachments": false,
        "Edit": "",
        "LinkTitleNoMenu": "Null_test",
        "LinkTitle": "Null_test",
        "ItemChildCount": "0",
        "FolderChildCount": "0",
        "_ComplianceFlags": "",
        "_ComplianceTag": "",
        "_ComplianceTagWrittenTime": "",
        "_ComplianceTagUserId": ""
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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/update-item.png" alt="Update Item" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb
List ID: 1a64ae23-9cb6-4521-b489-61d558dde9f7
Item ID: 1
Body:
{
  "TaskName": "Update Documentation",
  "Priority": "Medium",
  "DueDate": "2023-11-15T00:00:00Z"
}
```

<details id="tj-dropdown">
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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/delete-item.png" alt="Delete Item" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Item ID: 1
```

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "code": 204,
  "status": "No Content",
  "message": "Item having id '1' in List '1a64ae23-9cb6-4521-b489-61d558dde9f7' has been deleted."
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
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/sharepoint/add-item.png" alt="Add Item" />
</div>

#### Example:
```yaml
Site ID: tooljetxxxx.sharepoint.com,da60e844-ba1d-49bc-b4d4-d5e36bae9019
List ID: 22f69173-0c1d-4c76-a721-5a31f0bd5af3
Body:
{
  "fields": {
    "Title": "Prepare Presentation"
  }
}
```

<details id="tj-dropdown">
<summary>**Response Example**</summary>

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items/$entity",
  "@odata.etag": ""95d95442-f155-45be-ae85-ef9acf1d35f9,1"",
  "createdDateTime": "2024-11-05T11:40:52Z",
  "eTag": ""95d95442-f155-45be-ae85-ef9acf1d35f9,1"",
  "id": "69",
  "lastModifiedDateTime": "2024-11-05T11:40:52Z",
  "webUrl": "https://tooljetxxxx.sharepoint.com/sites/NewStyle/Lists/Test_table_query/69_.000",
  "createdBy": {
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "lastModifiedBy": {
    "application": {
      "id": "0dc94ee2-9788-443c-8e67-ce714f0fe579",
      "displayName": "Microsoft Graph"
    },
    "user": {
      "email": "oliver@tooljetxxxx.onmicrosoft.com",
      "id": "90ccfd6b-17ea-402b-aa21-1a1799a547d6",
      "displayName": "Oliver Smith"
    }
  },
  "parentReference": {
    "id": "036d657d-ed69-4dcc-a669-483ce9788655",
    "siteId": "tooljetxxxx.sharepoint.com,887cb371-e930-4e5b-a726-8d5769e6b946,6d653d09-1613-4663-99ab-1bb72ff6ceeb"
  },
  "contentType": {
    "id": "0x0100A3D887BE30452F4A9CBA7E684C523E2100098058C6B440D14786561D28914A3EDB",
    "name": "Item"
  },
  "fields@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('tooljetxxxx.sharepoint.com%2C887cb371-e930-4e5b-a726-8d5769e6b946%2C6d653d09-1613-4663-99ab-1bb72ff6ceeb')/lists('1a64ae23-9cb6-4521-b489-61d558dde9f7')/items('69')/fields/$entity",
  "fields": {
    "@odata.etag": ""95d95442-f155-45be-ae85-ef9acf1d35f9,1"",
    "Title": "Prepare Presentation",
    "id": "69",
    "ContentType": "Item",
    "Modified": "2024-11-05T11:40:52Z",
    "Created": "2024-11-05T11:40:52Z",
    "AuthorLookupId": "7",
    "EditorLookupId": "7",
    "_UIVersionString": "1.0",
    "Attachments": false,
    "Edit": "",
    "LinkTitleNoMenu": "Prepare Presentation",
    "LinkTitle": "Prepare Presentation",
    "ItemChildCount": "0",
    "FolderChildCount": "0",
    "_ComplianceFlags": "",
    "_ComplianceTag": "",
    "_ComplianceTagWrittenTime": "",
    "_ComplianceTagUserId": "",
    "AppAuthorLookupId": "3",
    "AppEditorLookupId": "3"
  }
}
```
</details>
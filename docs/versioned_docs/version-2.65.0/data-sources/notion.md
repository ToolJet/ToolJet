---
id: notion
title: Notion
---

ToolJet can connect to a Notion workspace to do operations on notion pages, databases, users and blocks.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Notion data source, click on the **+ Add new Data source** button located on the query panel or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

For integrating Notion with ToolJet we will need the API token. The API token can be generated from your Notion workspace settings. Read the official Notion docs for [Creating an internal integration with notion API](https://www.notion.so/help/create-integrations-with-the-notion-api).

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/notion/api.png" alt="notion api" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Notion

Notion API provides support for:

- **[Database](#querying-notion-database)**
- **[Page](#querying-notion-page)**
- **[Block](#querying-notion-blocks)**
- **[User](#querying-notion-user)**

<img className="screenshot-full" src="/img/datasource-reference/notion/querying.png" alt="notion querying"/>

:::info
**Database ID**, **View ID** and **Page ID** can be found using notion workspace URL.

For example:

URL: `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ`

Here:
- `XXX` is the **Database ID**
- `YYY` is the **View ID**
- `ZZZ` is the **Page ID**

:::

:::tip

Before querying Notion, you must share the database with your integration. Click the share button in your database view, find your integration name select it.

<img className="screenshot-full" src="/img/datasource-reference/notion/share.png" alt="notion share"/>

:::

</div>

<div style={{paddingTop:'24px'}}>

## Querying Notion Database

On database resource you can perform the following operations:

- **[Retrieve a database](#retrieve-a-database)**
- **[Query a database](#query-a-database)**
- **[Create a database](#create-a-database)**
- **[Update a database](#update-a-database)**

<img className="screenshot-full" src="/img/datasource-reference/notion/db_q.png" alt="notion db" style={{marginBottom:'15px'}} />

### Retrieve a Database

This operations retrieves a Database object using the ID specified.

#### Required Parameters:

- **Database ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/db_retrieve.png" alt="notion db retrieve" style={{marginBottom:'15px'}} />

### Query a Database

This operation gets a list of **Pages** contained in the database, filtered and ordered according to the filter conditions and sort criteria provided in the query.

#### Required Parameters:

- **Database ID**

#### Optional Parameters:

- **Filter**
- **Sort**
- **Limit**
- **Start Cursor**

<img className="screenshot-full" src="/img/datasource-reference/notion/db_query.png" alt="notion db query" style={{marginBottom:'15px'}} />

### Create a Database

This operation creates a database as a subpage in the specified parent page, with the specified properties.

#### Required Parameters:

- **Database ID**
- **Page ID**
- **Properties**

#### Optional Parameters:

- **Title**
- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full" src="/img/datasource-reference/notion/db_create.png" alt="notion db create" style={{marginBottom:'15px'}} />

#### Example:
##### Title
```yaml
[
    {
      "type": "text",
      "text": {
        "content": "Project Tasks Database",
        "link": null
      }
    }
]
```

##### Properties
```yaml
{
    "Task Name": {
      "title": {}
    },
    "Due Date": {
      "date": {}
    },
    "Completed": {
      "checkbox": {}
    }
}
```

### Update a Database

This operation updates an existing database as specified by the parameters.

#### Required Parameters:

- **Database ID**

#### Optional Parameters:

- **Title**
- **Properties**
- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full" src="/img/datasource-reference/notion/db_update.png" alt="notion db update" style={{marginBottom:'15px'}} />

#### Example:
##### Title
```yaml
[
    {
      "type": "text",
      "text": {
        "content": "Updated Tasks Database"
      }
    }
]
```

##### Properties
```yaml
{
    "Priority": {
      "select": {
        "options": [
          { "name": "High", "color": "red" },
          { "name": "Medium", "color": "yellow" },
          { "name": "Low", "color": "green" }
        ]
      }
    },
    "Assigned To": {
      "people": {}
    }
}
```

</div>

<div style={{paddingTop:'24px'}}>

## Querying Notion Page

On page resource you can perform the following operations:

- **[Retrieve a page](#retrieve-a-page)**
- **[Create a page](#create-a-page)**
- **[Update a page](#update-a-page)**
- **[Retrieve a page property](#retrieve-a-page-property-item)**
- **[Archive a page](#archive-delete-a-page)**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_q.png" alt="notion page" style={{marginBottom:'15px'}} />

### Retrieve a Page

This operation retrieves a **Page** object using the ID specified.

#### Required Parameters:

- **Page ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_retrieve.png" alt="notion page retrieve" style={{marginBottom:'15px'}} />

### Create a Page

This operation creates a new page in the specified database or as a child of an existing page. If the parent is a database, the property values of the new page in the properties parameter must conform to the parent database's property schema. If the parent is a page, the only valid property is title.

#### Required Parameters:

- **Parent Type**
- **Page/Database ID**
- **Properties**

#### Optional Parameters:
- **Children (Blocks)**
- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_create.png" alt="notion page create" style={{marginBottom:'15px'}} />

#### Example:
```yaml
{
    "Title": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "New Page Title"
          }
        }
      ]
    }
}
```

### Update a Page

This operation updates page property values for the specified page. Properties that are not set via the properties parameter will remain unchanged.

#### Required Parameters:

- **Page ID**
- **Properties**

#### Optional Parameters

- **Icon type**
- **Icon value**
- **Cover type**
- **Cover value**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_update.png" alt="notion page update" style={{marginBottom:'15px'}} />

#### Example:
```yaml
{
    "Title": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "Updated Page Title"
          }
        }
      ]
    },
    "Status": {
      "select": {
        "name": "In Progress"
      }
    }
}
```

### Retrieve a Page Property Item

This operation retrieves a property_item object for a given page ID and property ID. Depending on the property type, the object returned will either be a value or a paginated list of property item values. See Property item objects for specifics.

#### Required Parameter:

- **Page ID**

#### Optional Parameters:

- **Property ID**
- **Limit**
- **Start cursor**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_retrieve_page_property.png" alt="notion page retrieve page property" style={{marginBottom:'15px'}} />

### Archive (delete) a Page

This operation archive or un archive the page specified using Page ID.

#### Required Parameters:

- **Page ID**
- **Archive**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_archive.png" alt="notion page retrieve page property" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying Notion Blocks

The following operations can be performed on the block resource:

- **[Retrieve a block](#retrieve-a-block)**
- **[Append block children](#append-new-block-children)**
- **[Retrieve block children](#retrieve-block-children)**
- **[Update a block](#update-a-block)**
- **[Delete a block](#delete-a-block)**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_q.png" alt="notion block" />

:::info
To get the id for blocks, simply click on the menu icon for the block and click "Copy link". Afterwards, paste the link in the browser and it should look like this: `https://www.notion.so/Creating-Page-Sample-ee18b8779ae54f358b09221d6665ee15#7fcb3940a1264aadb2ad4ee9ffe11b0e` the string after **#** is the block id i.e. `7fcb3940a1264aadb2ad4ee9ffe11b0e`.
:::

### Retrieve a Block

This operation retrieves a **Block** object using the ID specified.

#### Required parameters:

- **Block ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_retrieve.png" alt="notion block retrieve" style={{marginBottom:'15px'}} />

### Append New Block Children

This operation creates and appends new children blocks to the parent block_id specified.

#### Required parameters:

- **Block ID**
- **Children**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_append.png" alt="notion block append" style={{marginBottom:'15px'}} />

### Retrieve Block Children

This operation retrieves a paginated array of child block objects contained in the block using the ID specified.

#### Required parameters:

- **Block ID**

#### Optional Parameters:

- **Limit**
- **Start cursor**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_retrieve_block_children.png" alt="notion block append" style={{marginBottom:'15px'}} />

### Update a Block

This operation updates the content for the specified block_id based on the block type.

#### Required parameters:

- **Block ID**

#### Optional Parameters:

- **Properties**
- **Archive**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_update.png" alt="notion block update" style={{marginBottom:'15px'}} />

#### Example
```yaml
{
    "Title": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "Updated Page Title"
          }
        }
      ]
    },
    "Status": {
      "select": {
        "name": "In Progress"
      }
    }
}
```

### Delete a Block

#### Required Parameters:

- **Block ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_delete.png" alt="notion block delete" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying Notion User

The following operations can be performed on the user notion resource:

- **[Retrieve a user from current workspace](#retrieve-a-user-from-current-workspace)**
- **[Retrieve list of users of a workspace](#retrieve-list-of-users-of-a-workspace)**

<img className="screenshot-full" src="/img/datasource-reference/notion/user_q.png" alt="notion user" style={{marginBottom:'15px'}} />

### Retrieve a User From Current Workspace

This operation retrieves a User using the ID specified.

#### Required Parameters:

- **User ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/user_retrieve_a_user.png" alt="notion user retrieve a user" style={{marginBottom:'15px'}} />

### Retrieve List of Users of a Workspace

This operation returns a paginated list of Users for the workspace.

#### Optional Parameters:

- **Limit**
- **Start cursor**

<img className="screenshot-full" src="/img/datasource-reference/notion/user_list_user.png" alt="notion user list all user" />

[Read more about notion API](https://developers.notion.com/reference/intro)

</div>

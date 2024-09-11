---
id: notion
title: Notion
---

ToolJet can connect to a Notion workspace to do operations on notion pages, databases and blocks.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Notion data source, click on the **+ Add new data source** button located on the query panel or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

For integrating Notion with ToolJet we will need the API token. The API token can be generated from your Notion workspace settings. Read the official Notion docs for [Creating an internal integration with notion API](https://www.notion.so/help/create-integrations-with-the-notion-api).

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/notion/api.png" alt="notion api" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Notion

Notion API provides support for:

- **[Database](#database)**
- **[Page](#page)**
- **[Block](#blocks)**
- **[User](#user)**

<img className="screenshot-full" src="/img/datasource-reference/notion/querying.png" alt="notion querying"/>

:::tip

Before querying Notion, you must share the database with your integration. Click the share button in your database view, find your integration name select it.

<img className="screenshot-full" src="/img/datasource-reference/notion/share.png" alt="notion share"/>

:::

### Database

On database resource you can perform the following operations:

- **[Retrieve a database](#1-retrieve-a-database)**
- **[Query a database](#2-query-a-database)**
- **[Create a database](#3-create-a-database)**
- **[Update a database](#4-update-a-database)**

<img className="screenshot-full" src="/img/datasource-reference/notion/db_q.png" alt="notion db" />

#### 1. Retrieve a Database

This operations retrieves a Database object using the ID specified.

##### Required Parameters:

- **Database ID**: You'll find the Database ID in the url. Suppose this is the example url: `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ` then `XXX` is the database ID, `YYY` is the view ID and `ZZZ` is the page ID.

<img className="screenshot-full" src="/img/datasource-reference/notion/db_retrieve.png" alt="notion db retrieve" />

#### 2. Query a Database

This operation gets a list of **Pages** contained in the database, filtered and ordered according to the filter conditions and sort criteria provided in the query.

##### Required Parameters:

- **Database ID** : You'll find the Database ID in the url. Suppose this is the example url: `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ` then `XXX` is the database ID, `YYY` is the view ID and `ZZZ` is the page ID.

##### Optional Parameters:

- **Filter** : This must be an object of filters
- **Sort** : Array of sort objects
- **Limit** : limit for pagination
- **Start Cursor** : Next object id to continue pagination

<img className="screenshot-full" src="/img/datasource-reference/notion/db_query.png" alt="notion db query" />

#### 3. Create a Database

This operation creates a database as a subpage in the specified parent page, with the specified properties.

##### Required Parameters:

- **Database ID** : You'll find the Database ID in the url. Suppose this is the example url: `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ` then `XXX` is the database ID, `YYY` is the view ID and `ZZZ` is the page ID.
- **Page ID** : Page ID of the parent
- **Properties** : Properties defines the columns in a database

##### Optional Parameters:

- **Title** : Title should be an array of rich_text properties
- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value** : Value of selected icon type
- **Cover type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

<img className="screenshot-full" src="/img/datasource-reference/notion/db_create.png" alt="notion db create" />

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

#### 4. Update a Database

This operation updates an existing database as specified by the parameters.

##### Required Parameters:

- **Database ID**

##### Optional Parameters:

- **Title** : Title should be an array of rich_text properties
- **Properties** : Properties defines the columns in a database
- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value** : Value of selected icon type
- **Cover type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

<img className="screenshot-full" src="/img/datasource-reference/notion/db_update.png" alt="notion db update" />

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

### Page

On page resource you can perform the following operations:

- **[Retrieve a page](#1-retrieve-a-page)**
- **[Create a page](#2-create-a-page)**
- **[Update a page](#3-update-a-page)**
- **[Retrieve a page property](#4-retrieve-a-page-property-item)**
- **[Archive a page](#5-archive-delete-a-page)**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_q.png" alt="notion page" />

#### 1. Retrieve a Page

This operation retrieves a **Page** object using the ID specified.

##### Required Parameters:

- **Page ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_retrieve.png" alt="notion page retrieve" />

#### 2. Create a Page

This operation creates a new page in the specified database or as a child of an existing page. If the parent is a database, the property values of the new page in the properties parameter must conform to the parent database's property schema. If the parent is a page, the only valid property is title.

##### Required Parameters:

- **Parent Type** : A database parent or page parent
- **Page/Database ID**
- **Properties** : Property values of this page

##### Optional Parameters:
- **Children (Blocks)** : Page content for the new page as an array of block objects
- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value**: Value of selected icon type
- **Cover type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

<img className="screenshot-full" src="/img/datasource-reference/notion/page_create.png" alt="notion page create" />

##### Example:
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

#### 3. Update a Page

This operation updates page property values for the specified page. Properties that are not set via the properties parameter will remain unchanged.

##### Required Parameters:

- **Page ID**
- **Properties** : Property values of this page

##### Optional Parameters

- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value**: Value of selected icon type
- **Cover type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

<img className="screenshot-full" src="/img/datasource-reference/notion/page_update.png" alt="notion page update" />

##### Example:
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

#### 4. Retrieve a Page Property Item

This operation retrieves a property_item object for a given page ID and property ID. Depending on the property type, the object returned will either be a value or a paginated list of property item values. See Property item objects for specifics.

##### Required Parameter:

- **Page ID**

##### Optional Parameters:

- **Property ID**
- **Limit**
- **Start cursor**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_retrieve_page_property.png" alt="notion page retrieve page property" />

#### 5. Archive (delete) a Page

This operation archive or un archive the page specified using Page ID.

##### Required parameters:

- **Page ID**
- **Archive**: Dropdown for archive and un archive the page

<img className="screenshot-full" src="/img/datasource-reference/notion/page_archive.png" alt="notion page retrieve page property" />

### Blocks

The following operations can be performed on the block resource:

- **[Retrieve a block](#1-retrieve-a-block)**
- **[Append block children](#2-append-new-block-children)**
- **[Retrieve block children](#3-retrieve-block-children)**
- **[Update a block](#4-update-a-block)**
- **[Delete a block](#5-delete-a-block)**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_q.png" alt="notion block" />

:::info
To get the id for blocks, simply click on the menu icon for the block and click "Copy link". Afterwards, paste the link in the browser and it should look like this: `https://www.notion.so/Creating-Page-Sample-ee18b8779ae54f358b09221d6665ee15#7fcb3940a1264aadb2ad4ee9ffe11b0e` the string after **#** is the block id i.e. `7fcb3940a1264aadb2ad4ee9ffe11b0e`.
:::

#### 1. Retrieve a block

This operation retrieves a **Block** object using the ID specified.

##### Required parameters:

- **Block ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_retrieve.png" alt="notion block retrieve" />

#### 2. Append New Block Children

This operation creates and appends new children blocks to the parent block_id specified.

##### Required parameters:

- **Block ID**
- **Children**: Array of block objects

<img className="screenshot-full" src="/img/datasource-reference/notion/block_append.png" alt="notion block append" />

#### 3. Retrieve Block Children

This operation retrieves a paginated array of child block objects contained in the block using the ID specified.

##### Required Parameters:

- **Block ID**

##### Optional Parameters:

- **Limit**
- **Start cursor**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_retrieve_block_children.png" alt="notion block append" />

#### 4. Update a Block

This operation updates the content for the specified block_id based on the block type.

##### Required Parameters:

- **Block ID**

##### Optional Parameters:

- **Properties**: The block object type value with the properties to be updated
- **Archive**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_update.png" alt="notion block update" />

##### Example
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

#### 5. Delete a Block

##### Required Parameters:

- **Block ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/block_delete.png" alt="notion block delete" />

### User

The following operations can be performed on the user notion resource:

- **[Retrieve a user from current workspace](#1-retrieve-a-user-from-current-workspace)**
- **[Retrieve list of users of a workspace](#2-retrieve-list-of-users-of-a-workspace)**

<img className="screenshot-full" src="/img/datasource-reference/notion/user_q.png" alt="notion user" />

#### 1. Retrieve a User From Current Workspace

This operation retrieves a User using the ID specified.

##### Required Parameters:

- **User ID**

<img className="screenshot-full" src="/img/datasource-reference/notion/user_retrieve_a_user.png" alt="notion user retrieve a user" />

#### 2. Retrieve List of Users of a Workspace

This operation returns a paginated list of Users for the workspace.

##### Optional Parameters:

- **Limit**
- **Start cursor**

<img className="screenshot-full" src="/img/datasource-reference/notion/user_list_user.png" alt="notion user list all user" />

[Read more about notion API](https://developers.notion.com/reference/intro)

</div>

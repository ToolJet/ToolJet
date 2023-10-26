---
id: notion
title: Notion
---

# Notion

ToolJet can connect to a Notion workspace to do operations on notion pages, databases and blocks.

## Connection

To establish a connection with the Notion data source, click on the `+Add new data source` button located on the query panel or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

For integrating Notion with ToolJet we will need the API token. The API token can be generated from your Notion workspace settings. Read the official Notion docs for [Creating an internal integration with notion API](https://www.notion.so/help/create-integrations-with-the-notion-api).

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/notion/api.png" alt="notion api" />

</div>

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

#### 1. Retrieve a database

This operations retrieves a Database object using the ID specified.

##### Required parameters:

- **Database ID**: You'll find the Database ID in the url. Suppose this is the example url: `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ` then `XXX` is the database ID, `YYY` is the view ID and `ZZZ` is the page ID.

<img className="screenshot-full" src="/img/datasource-reference/notion/db_retrieve.png" alt="notion db retreieve" />

#### 2. Query a database

This operation gets a list of **Pages** contained in the database, filtered and ordered according to the filter conditions and sort criteria provided in the query.

##### Required parameters:

- **Database ID** : You'll find the Database ID in the url. Suppose this is the example url: `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ` then `XXX` is the database ID, `YYY` is the view ID and `ZZZ` is the page ID.

##### Optional parameters:

- **Filter** : This must be an object of filters
- **Sort** : Array of sort objects
- **Limit** : limit for pagination
- **Start Cursor** : Next object id to continue pagination

#### 3. Create a database

This operation creates a database as a subpage in the specified parent page, with the specified properties.

##### Required parameters:

- **Database ID** : You'll find the Database ID in the url. Suppose this is the example url: `https://www.notion.so/workspace/XXX?v=YYY&p=ZZZ` then `XXX` is the database ID, `YYY` is the view ID and `ZZZ` is the page ID.
- **Page ID** : Page ID of the parent
- **Properties** : Properties defines the columns in a database

##### Optional parameters:

- **Title** : Title should be an array of rich_text properties
- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value** : Value of selected icon type
- **Icon type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

#### 4. Update a database

This operation updates an existing database as specified by the parameters.

##### Required parameters:

- **Database ID**

##### Optional parameters:

- **Title** : Title should be an array of rich_text properties
- **Properties** : Properties defines the columns in a database
- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value** : Value of selected icon type
- **Icon type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

### Page

On page resource you can perform the following operations:

- **[Retrieve a page](#1-retrieve-a-page)**
- **[Create a page](#2-create-a-page)**
- **[Update a page](#3-update-a-page)**
- **[Retrieve a page property](#4-retrieve-a-page-property-item)**
- **[Archive a page](#5-archive-delete-a-page)**

<img className="screenshot-full" src="/img/datasource-reference/notion/page_q.png" alt="notion page" />

#### 1. Retrieve a page

This operation retrieves a **Page** object using the ID specified.

##### Required parameters:

- **Page ID**

#### 2. Create a page

This operation creates a new page in the specified database or as a child of an existing page. If the parent is a database, the property values of the new page in the properties parameter must conform to the parent database's property schema. If the parent is a page, the only valid property is title.

##### Parameters:

- **Page ID**
- **Properties** : Property values of this page
- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value**: Value of selected icon type
- **Icon type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

#### 3. Update a page

This operation updates page property values for the specified page. Properties that are not set via the properties parameter will remain unchanged.

##### Parameters:

- **Page ID**
- **Parent type**: A database parent or page parent
- **Properties** : Property values of this page
- **Children** : Page content for the new page as an array of block objects
- **Icon type** : Currently notion api accepts two icon options, emoji, external URL
- **Icon value**: Value of selected icon type
- **Icon type** : Currently notion api accepts only external URL
- **Cover value** : Value of selected cover type

#### 4. Retrieve a page property item

This operation retrieves a property_item object for a given page ID and property ID. Depending on the property type, the object returned will either be a value or a paginated list of property item values. See Property item objects for specifics.

##### Parameters:

- **Page ID**
- **Property ID**
- **Limit**
- **Start cursor**

#### 5. Archive (delete) a page

##### Required parameters:

- **Page ID**
- **Archive**: Dropdown for archive and un archive the page

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

#### 2. Append new block children

This operation creates and appends new children blocks to the parent block_id specified.

##### Required parameters:

- **Block ID**
- **Children**: Array of block objects

#### 3. Retrieve block children

This operation retrieves a paginated array of child block objects contained in the block using the ID specified.

##### Required parameters:

- **Block ID**
- **Limit**
- **Start cursor**

#### 4. Update a block

This operation updates the content for the specified block_id based on the block type.

##### Required parameters:

- **Block ID**
- **Properties**: The block object type value with the properties to be updated
- **Archive**

#### 5. Delete a block

##### Required parameters:

- **Block ID**

### User

The following operations can be performed on the user notion resource:

#### 1. Retrieve a user from current workspace

This operation retrieves a User using the ID specified.

<img className="screenshot-full" src="/img/datasource-reference/notion/user_q.png" alt="notion user" />

##### Required parameters:

- **User ID**

#### 2. Retrieve list of users of a workspace

This operation returns a paginated list of Users for the workspace.

##### Required parameters:

- **Limit**
- **Start cursor**

[Read more about notion API](https://developers.notion.com/reference/intro)

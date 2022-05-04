---
id: notion
title: Notion
---
# Notion

ToolJet can connect to a Notion workspace to do operations on notion pages, databases and blocks.
## Connection
We can easily integrate notion with tooljet using just an API token. Read [Create internal integration with notion API](https://www.notion.so/help/create-integrations-with-the-notion-api)

## Querying Notion

Notion API provides api support for database, page, block, user

### Database

- Retrieve a database

  #### **Properties**

    - Database ID

- Query a database

  #### **Properties**

    - Database ID
    - Filter : This must be an object of filters
    - Children : Array of sort objects
    - Limit : limit for pagination
    - Start Cursor : Next object id to continue pagination

- Create a database
    #### **Properties**
    - Database ID
    - Title : Title should be an array of rich_text properties
    - Properties : Properties defines the columns in a database
    - Icon type : Currently notion api accepts two icon options, emoji, external URL
    - Icon value: Value of selected icon type
    - Icon type : Currently notion api accepts only external URL
    - Cover value: Value of selected cover type

- Update a database
  #### **Properties**
    - Database ID
    - Title
    - Properties
    - Icon type
    - Icon value
    - Icon type
    - Cover value

### Page

- Retrieve a page
    #### **Properties**
    - Page ID

- Retrieve a page property item
    #### **Properties**
    - Page ID
    - Property ID
    - Limit
    - Start cursor

- Update a page
    #### **Properties**
    - Page ID
    - Parent type: A database parent or page parent
    - Properties : Property values of this page
    - Children : Page content for the new page as an array of block objects
    - Icon type : Currently notion api accepts two icon options, emoji, external URL
    - Icon value: Value of selected icon type
    - Icon type : Currently notion api accepts only external URL
    - Cover value: Value of selected cover type

- Create a page
    #### **Properties**
    - Page ID
    - Properties : Property values of this page
    - Icon type : Currently notion api accepts two icon options, emoji, external URL
    - Icon value: Value of selected icon type
    - Icon type : Currently notion api accepts only external URL
    - Cover value: Value of selected cover type

- Archive (delete) a page
    #### **Properties**
    - Page ID
    - Archive: Dropdown for archive and un archive the page

  
### Blocks

- Retrieve a block
    #### **Properties**
    - Block ID

- Retrieve block children
    #### **Properties**
    - Block ID
    - Limit
    - Start cursor

- Update a block
    #### **Properties**
    - Block ID
    - Properties: The block object type value with the properties to be updated
    - Archive

- Append new block children
    #### **Properties**
    - Block ID
    - Children: Array of block objects

- Delete a block
    #### **Properties**
    - Block ID

### User

- Retrieve a user from current workspace
    #### **Properties**
    - User ID
    
- Retrieve list of users of a workspace
    #### **Properties**
    - Limit
    - Start cursor

[Read more about notion API](https://developers.notion.com/reference/intro)

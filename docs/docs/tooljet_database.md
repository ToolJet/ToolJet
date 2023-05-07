---
id: tooljet-database
title: ToolJet Database
---

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. ToolJet database require no setup and give you a powerful user interface for managing your data.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/db.png" alt="ToolJet Database" />

</div>

## Enabling the ToolJet Database for your instance

Requires:
- PostgREST server
- Additional configuration for ToolJet server

This feature is only enabled if [`ENABLE_TOOLJET_DB`](/docs/setup/env-vars#enable-tooljet-database--optional-) is set to `true`.

### PostgREST server

PostgREST is a standalone web server that turns your PostgreSQL database directly into queryable RESTful APIs which is utilized for Tooljet Database. This server only talks with ToolJet server and therefore does not have to be publicly exposed.

:::tip
If you have openssl installed, you can run the following command `openssl rand -hex 32` to generate the value for `PGRST_JWT_SECRET`.

If this parameter is not specified then PostgREST refuses authentication requests.
:::

| variable           | description                                     |
| ------------------ | ----------------------------------------------- |
| PGRST_JWT_SECRET   | JWT token client provided for authentication    |
| PGRST_DB_URI       | database connection string for tooljet database |
| PGRST_LOG_LEVEL    | `info`                                          |

:::info
Please make sure that DB_URI is given in the format `postgres://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`
:::

#### Additional ToolJet server configuration


| variable           | description                                  |
| ------------------ | -------------------------------------------- |
| ENABLE_TOOLJET_DB  | `true` or `false`                            |
| TOOLJET_DB         | Default value is `tooljet_db`                |
| TOOLJET_DB_HOST    | database host                                |
| TOOLJET_DB_USER    | database username                            |
| TOOLJET_DB_PASS    | database password                            |
| TOOLJET_DB_PORT    | database port                                |
| PGRST_JWT_SECRET   | JWT token client provided for authentication |
| PGRST_HOST         | postgrest database host                      |


If you intent to make changes in the above configuration. Please refer [PostgREST configuration docs](https://postgrest.org/en/stable/configuration.html#environment-variables).

:::tip
When this feature is enabled, the database name provided for `TOOLJET_DB` will be utilized to create a new database during server boot process in all of our production deploy setups.
Incase you want to trigger it manually, use the command `npm run db:create` on ToolJet server.
:::

## Features

ToolJet database allows you to:

- **[Maintain tables of data](#accessing-tooljet-database)** in a secure database that's only accessible within your ToolJet organization.
- **[Edit, search, filter, sort, and filter](#database-editor)** data using a spreadsheet-like interface.
- **[Quickly build applications and write queries](#querying-data-from-the-tooljet-database)** to interact with the ToolJet Database, just like any other datasource but without any setup.

## Accessing ToolJet Database

Once you log-in to your ToolJet account, from the left sidebar of the dashboard you can navigate to **ToolJet Database**.

The ToolJet Database is available on: **[ToolJet Cloud](https://tooljet.com)**, **[Self-Host](/docs/setup/)**, and **Enterprise Edition**. You can view and manage your database and the data it contains using the **Database editor UI**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/tjdbside.png" alt="ToolJet Database editor" />

</div>

## Database Editor

You can manage the ToolJet Database directly from the Database Editor. ToolJet Database organizes the data into **tables** that can have different structures. All the tables will be listed lexicographically on the left, click on any of the table to view the table data.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/tables.png" alt="ToolJet Database editor"/>

</div>

### Create New Table

For creating a new table in ToolJet Database, click on the **Create New Table** button on the top left corner of the Database editor.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/newtable.png" alt="ToolJet Database editor"/>

</div>

When the **Create New Table** button is clicked, a drawer opens up from the right from where you can enter the details of your new table.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/drawer.png" alt="ToolJet Database editor"/>

</div>

#### For creating a new table, you'll need to:
- Enter a **Table name**
- Add **Columns** (Any one column is required to be set as Primary key)

#### Supported data types
- **varchar**: varchar data type is used to store characters of indefinite length
- **serial**: serial is used to generate a sequence of integers which are often used as the Primary key of a table.
- **int**: It is a numeric data type used to store whole numbers, that is, numbers without fractional components.
- **float**: float is also a numeric data type that is used to store inexact, variable-precision values.
- **boolean**: boolean data type can hold true, false, and null values.

Click on **Create** button to create a new table.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/newtable2.png" alt="ToolJet Database editor" width="500"/>

</div>

### Search Table

You can enter a search term to search through all tables in the database.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/search.png" alt="ToolJet Database editor" />

</div>

### Add column

You can add a new column to the existing table by clicking on the **Add new column** button from the top of the database editor.

A drawer from the right will open up from where you can create a new column by entering the values for the new column such as:
- **Column name**: name of the column (key)
- **Data type**: Check available data types [here](#supported-data-types)
- **Default Value** Any default value for the column (not mandatory)

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/newcolumn2.png" alt="ToolJet Database editor"/>

</div>

### Filter

You can add as many filter as you want into the table by clicking on the **Filter** button present on the top of the database editor.

#### Adding a filter on the table data
- Select a **column** from the Columns dropdown
- Choose an **[operation](#available-operations-are)**
- Enter a **value** for the selected operation

#### Available operations are:
- **equals**
- **greater than**
- **greater than or equal**
- **less than**
- **less than or equal**
- **not equal**
- **like**
- **ilike**
- **match**
- **imatch**
- **in**
- **contains**
- **contained**
- **not**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/filter2.png" alt="ToolJet Database editor" />

</div>

### Sort

To sort the table data, click on the **Sort** button on top, select a **column** from the dropdown, and then choose an order **ascending** or **descending**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/sort2.png" alt="ToolJet Database editor" />

</div>

### Add new row

To add a new row to the existing table data, click on the **Add new row** button. A drawer will open from the right where you can **enter the values** for the new row.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/newrow2.png" alt="ToolJet Database editor" />

</div>

### Edit row

To edit the rows from the ToolJet database dashboard, click on the **Edit row** button. A drawer will open from the right from where first you need to **select the id** of the row to be edited from the dropdown and then you can edit the cell values of the selected row.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/editrow.gif" alt="ToolJet Database editor"  />

</div>

### Delete records

To delete one or many records/rows, select on the checkbox at the right of the record or records that you want to delete. As soon as you select a single record, the button to delete record will appear on the top, click on the **Delete record** button to delete the selected records.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/deleterecord.png" alt="ToolJet Database editor" />

</div>

### Delete column

To delete a particular column, just click on the column name and the **delete** button will appear, click on it to delete the column.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/delcol.png" alt="ToolJet Database editor" />

</div>

### Edit or Delete a table

When you click on the kebab menu (three vertical dots icon) on the right of the table name, you'll get two options: Edit and Delete.
- **Edit** will allow you to rename the table
- **Delete** will allow you to delete the table permanently

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/database/newui/edittable.png" alt="ToolJet Database editor" />

</div>

## Querying data from the ToolJet database

Querying ToolJet database is as easy as querying any other datasource on ToolJet.

- Go to the **query panel**, and click on the **+Add** button to add a new query, and select **Run ToolJetDb query**
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/database/newui/q1.png" alt="ToolJet Database editor" />

    </div>

- Enter the **Name** of the table that you want to query, select an **Operation** from the dropdown, **Create** the query, and then **Run** the query to get the response.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/database/newui/q2.png" alt="ToolJet Database editor" />

    </div>

:::info
- **Preview** button on the query panel returns the query response without executing the query. Once clicked, the response will be displayed on the Preview section of the query panel which can be viewed in JSON or Raw.
- When a new query is created, by default the query name is set to `tooljetdbN` (where N is a number) - you can rename the query by click on the query name or from the left sidebar of query panel.
:::

### Available operations

#### List rows
This operation returns the list of all the records in the table

#### Optional parameters
- **Filter**: Add a filter to the query response by setting a column, operation and value.
- **Sort**: Add a sort to the query response by setting a column and direction.
- **Limit**: Limit the query response. This parameter expects a numerical value. ex: 5

#### Create row
This operation creates a new record in the table

#### Required parameters
- **Columns**: Choose a column from the dropdown and enter a value for the new record.

#### Update row
This operation updates an existing record in the table

#### Required parameter
- **Filter**: Add a condition by choosing a column, an operation, and the value for updating a particular record.

#### Delete row
This operation deletes a record from the table

#### Required parameters
- **Filter**: Add a condition by choosing a column, an operation, and the value for deleting a particular record.

:::info
If you have any other questions or feedback about **ToolJet Database**, please reach us out at hello@tooljet.com or join our **[Slack Community](https://www.tooljet.com/slack)**
:::

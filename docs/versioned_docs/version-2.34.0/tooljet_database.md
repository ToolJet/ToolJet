---
id: tooljet-database
title: ToolJet Database
---

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. ToolJet database require no setup and give you a powerful user interface for managing your data.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/tjdb.png" alt="ToolJet database" />
</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Enabling the ToolJet Database for your instance

Requires:
- PostgREST server
- Additional configuration for ToolJet server

This feature is only enabled if [`ENABLE_TOOLJET_DB`](/docs/setup/env-vars#enable-tooljet-database--optional-) is set to `true`.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### PostgREST Server

PostgREST is a standalone web server that turns your PostgreSQL database directly into queryable RESTful APIs which is utilized for Tooljet Database. This server only talks with ToolJet server and therefore does not have to be publicly exposed.

:::tip
If you have openssl installed, you can run the following command `openssl rand -hex 32` to generate the value for `PGRST_JWT_SECRET`.

If this parameter is not specified then PostgREST refuses authentication requests.
:::

| <div style={{ width:"100px"}}> Variable  </div>         | <div style={{ width:"100px"}}> Description  </div>                                   |
| ------------------ | ----------------------------------------------- |
| PGRST_JWT_SECRET   | JWT token client provided for authentication    |
| PGRST_DB_URI       | database connection string for tooljet database |
| PGRST_LOG_LEVEL    | `info`                                          |

:::info
Please make sure that DB_URI is given in the format `postgres://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`
:::

</div>

#### Additional ToolJet server configuration


| <div style={{ width:"100px"}}> Variable </div>           | <div style={{ width:"100px"}}> Description </div>                                  |
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

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Features

ToolJet database allows you to:

- **[Maintain tables of data](#accessing-tooljet-database)** in a secure database that's only accessible within your ToolJet organization.
- **[Edit, search, filter, sort, and filter](#database-editor)** data using a spreadsheet-like interface.
- **[Quickly build applications and write queries](#querying-data-from-the-tooljet-database)** to interact with the ToolJet Database, just like any other datasource but without any setup.
- **[Export schema](#export-schema)** from the ToolJet Database to a JSON file.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Accessing ToolJet Database

Once you log-in to your ToolJet account, from the left sidebar of the dashboard you can navigate to **ToolJet Database**.

The ToolJet Database is available on: **[ToolJet Cloud](https://tooljet.com)**, **[Self-Host](/docs/setup/)**, and **Enterprise Edition**. You can view and manage your database and the data it contains using the **Database editor UI**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/tjdbside.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Database Editor

You can manage the ToolJet Database directly from the Database Editor. ToolJet Database organizes the data into **tables** that can have different structures. All the tables will be listed lexicographically on the left, click on any of the table to view the table data.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/tables.png" alt="ToolJet database" />
</div>

The sidebar on the left can also be collapsed to give more space to the database editor.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/collapse.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Create New Table

For creating a new table in ToolJet Database, click on the **Create New Table** button on the top left corner of the Database editor.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/new.png" alt="ToolJet database" />
</div>

When the **Create New Table** button is clicked, a drawer opens up from the right from where you can enter the details of your new table.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/newtable.png" alt="ToolJet database" />
</div>

#### For creating a new table, you'll need to:
- Enter a **Table name**
- Add **Columns** (`id` column with `serial` data type is automatically created as the **primary key** of the table)

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Supported Data Types

| <div style={{ width:"100px"}}> Data Type </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Example </div> |
|:--------- |:----------- |:------- |
| **serial**    | **serial** is used to generate a sequence of integers which are often used as the Primary key of a table. Whenever a new table is created in the ToolJet database, a column **id** with the serial data type is automatically created as the **primary key** of the table. | Numbers starting from 1, 2, 3, 4, 5, etc. |
| **varchar**   | **varchar** data type is used to store characters of indefinite length | Any string value |
| **int**       | **int** is a numeric data type used to store whole numbers, that is, numbers without fractional components. | Numbers ranging from -2147483648 to 2147483647 |
| **bigint**    | **bigint** is a numeric data type that is used to store whole numbers, that is, numbers without fractional components. | Numbers ranging from -9223372036854775808 to 9223372036854775807 |
| **float**     | **float** is also a numeric data type that is used to store inexact, variable-precision values. | Any floating-point number, ex: 3.14 |
| **boolean**   | **boolean** data type can hold true, false, and null values. | `true` or `false` |

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/datatypes.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Search Table

Open the Search bar by clicking on the **Search** button and search for a table in the ToolJet database by entering the table name.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/search.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Rename Table

To rename a table, click on the kebab menu icon on the right of the table name and then select the **Rename table** option. A drawer will open from the right from where you can edit the table name.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/rename.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Add New Column

To add a new column on a table, either click on the kebab menu icon on the right of the table name and then select the **Add new column** option or click on the **+** button present at the end of the column header.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/addnewcol.png" alt="ToolJet database" />
</div>

A drawer from the right will open up where you can enter the details for the new column:

- **Column Name**: Enter a unique name for the new column, serving as its key identifier.
- **Data Type**: Choose the appropriate data type for the column from the [available options](#supported-data-types).
- **Default Value**: Specify any default value that should be assigned to the column. Optionally, users can leave this field blank. When a table contains rows and NOT NULL is applied to one of its existing or new columns, specifying a default value becomes compulsory.
- **NULL/NOT NULL**: Use the switch to determine whether the column should allow NULL values or not. By default, the toggle is off, allowing the column to have blank or empty entries. If you turn it on, the column is set to NOT NULL, meaning it can't have blank or empty entries anymore. But, for text columns, even with NOT NULL on, they can still have empty text (like an empty line) but not completely blank entries

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/newcol.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Export Schema

The export schema option allows you to download the selected table schema in a JSON file. This does not export the table data.

While [exporting the app](https://docs.tooljet.com/docs/dashboard#export-app), you can choose to export the app with or without table schema connected to the app.

To export the table schema, click on the three vertical dots icon on the right of the table name and then click on the **Export** option. A JSON file will be downloaded with the table schema.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/export.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Table

To delete a table, click on the three vertical dots icon on the right of the table name and then click on the **Delete** option. A confirmation modal will appear, click on the **Delete** button to delete the table.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/delete.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Edit Column

To edit a column, click on the kebab menu on the column name and select the option to **Edit column**. When you edit the column, the data type cannot be changed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/editcol.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Column

To delete a column, click on the kebab menu on the column name and select the option to **Delete**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/deletecol.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Add New Data

The Add new data button on the top of the table editor allows you to add data to the table. You can either **[Add new row](#add-new-row)** or **[Bulk upload data](#bulk-upload-data)** to add the data to the table.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/addnewdata.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Add New Row

To add a new row on a table, either click on the `Add new data` button on top and then select the **Add new row** option or click on the **+** button present at the bottom left.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/addnewrow.png" alt="ToolJet database" />
</div>

A drawer from the right will open up where the values for the new row can be provided.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/addnewrow2.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Edit Row

To edit a row, hover on the row that you want to edit and the expand icon will appear next to the checkbox of that row. Click on the Expand icon to open the drawer and edit the row.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/expand.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Edit a Cell

1. **Double-Click**: Double-click on the cell you want to edit.
2. **Enter Value**: Input the new value.
3. **Save Changes**: Press "Enter" to save the changes. For boolean-type columns, choose from "True," "False," or "Null" options.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/editcell.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Bulk Upload Data

You can bulk upload data to the ToolJet database by clicking on the **Bulk upload data** button on the top of the database editor. On clicking the button, a drawer will open from the right from where you can upload a **CSV** file. This file is used to upsert records onto the table. If data for id column is missing it will insert new record with the row data else if id is present it will update the corresponding record with the corresponding row data.

From the drawer, users can download the **template CSV file** in which they can enter the data to be uploaded to the ToolJet database's table or format their CSV file in the same way as the template file.

Once the CSV file is ready, click on the file picker to select the file or drag and drop the file in the file picker. Now, click on the **Upload data** button to upload the data to the ToolJet database.

**Requirements**:
- The data types of columns in the CSV file should match those in the ToolJet database table.
- The `id` column with a `serial` data type should not contain duplicate values.

**Limitations**:
- There is a limit of 1000 rows per CSV file that can be uploaded to the ToolJet database.
- The CSV file should not exceed 2MB in size.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/bulk.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Records

To delete one or many records/rows, select on the checkbox at the right of the record or records that you want to delete. As soon as you select a single record, the button to delete record will appear on the top, click on the **Delete record** button to delete the selected records.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/delrows.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Filter

You can add as many filter as you want into the table by clicking on the **Filter** button present on the top of the database editor.

#### Adding a filter on the table data
- Select a **column** from the Columns dropdown
- Choose an **[operation](#available-operations-are)**
- Enter a **value** for the selected operation

#### Available operations are:
- **equals**: This operation is used to check if the value of the column is equal to the value entered in the input field. 
- **greater than**: This operation is used to check if the value of the column is greater than the value entered in the input field. 
- **greater than or equal**: This operation is used to check if the value of the column is greater than or equal to the value entered in the input field. 
- **less than**: This operation is used to check if the value of the column is less than the value entered in the input field.
- **less than or equal**: This operation is used to check if the value of the column is less than or equal to the value entered in the input field. 
- **not equal**: This operation is used to check if the value of the column is not equal to the value entered in the input field. 
- **like**: This operation is used to check if the value of the column is like the value entered in the input field. This operation is case-sensitive. ex: `ToolJet` will not match `tooljet`
- **ilike**: This operation is used to check if the value of the column is like the value entered in the input field. This operation is case-insensitive. ex: `ToolJet` will match `tooljet`
- **match**: This operation is used to check if the value of the column is like the value entered in the input field. This operation is case-sensitive. ex: `ToolJet` will not match `tooljet`. This operation uses regular expressions. ex: `^ToolJet$` will match `ToolJet` but not `ToolJet Inc`. 
- **imatch**: This operation is used to check if the value of the column is like the value entered in the input field. This operation is case-insensitive. This operation uses regular expressions. ex: `^ToolJet$` will match `ToolJet` but not `ToolJet Inc`.
- **in**: This operation is used to check if the value of the column is in the list of values entered in the input field. ex: `1,2,3`
- **contains**: This operation is used to check if the value of the column contains the value entered in the input field. This operation is case-sensitive. ex: `ToolJet` will not match `tooljet`
- **contained**: This operation is used to check if the value of the column is contained in the value entered in the input field. This operation is case-sensitive. ex: `ToolJet` will not match `tooljet`
- **not**: This operation is used to negate the result of the operation selected in the dropdown. ex: `not equals` will return all the records where the value of the column is not equal to the value entered in the input field.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/filter.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Sort

To sort the table data, click on the **Sort** button on top, select a **column** from the dropdown, and then choose an order **ascending** or **descending**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/sort.png" alt="ToolJet database" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Querying Data from the ToolJet Database

Querying ToolJet database is as easy as querying any other datasource on ToolJet.

- Go to the **query panel**, and click on the **+Add** button to add a new query, and select **ToolJet Database**
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/database/newui/qtjdb.png" alt="ToolJet Database editor" />

    </div>

- Select the **table** that you want to query from the dropdown, choose an **operation** from the dropdown, and then enter the required parameters for the selected operation. Click on the **Run** button to execute the query.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/database/newui/qtjdb2.png" alt="ToolJet Database editor" />

    </div>

  :::info
  - **Preview** button on the query panel returns the query response without executing the query. Once clicked, the response will be displayed on the Preview section of the query panel which can be viewed as JSON or Raw.
  - When a new query is created, by default the query name is set to `tooljetdbN` (where N is a number) - you can rename the query by click on the query name or from the left sidebar of query panel.
  :::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Available Operations

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### List Rows
This operation returns all the records from the table

#### Optional Parameters
- **Filter**: Add a condition by choosing a column, an operation, and the value for filtering the records.
- **Sort**: Sort the query response by choosing a column and the order (ascending or descending).
- **Limit**: Limit the number of records to be returned by entering a number.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Create row
This operation creates a new record in the table. You can create a single record or multiple records at once.

#### Required Parameters
- **Columns**: Choose the columns for which you want to add values for the new record and enter the values for the selected columns. You can also add a new column by clicking on the **+Add column** button.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Update Row
This operation updates a record in the table. You can update a single record or multiple records at once.

#### Required Parameter
- **Filter**: Add a condition by choosing a column, an operation, and the value for updating a particular record.
- **Columns**: Choose the columns for which you want to update the values for the selected record and enter the values for the selected columns.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Row
This operation deletes a record in the table. You can delete a single record or multiple records at once.

#### Required Parameters
- **Filter**: Add a condition by choosing a column, an operation, and the value for deleting a particular record.
- **Limit**: Limit the number of records to be deleted by entering a number.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Join Tables

You can join two or more tables in the ToolJet database by using the **Join** operation.

#### Required Parameters
- **From**: In the **From** section, there are the following parameters:
    - **Selected Table**: Select the table from which you want to join the other table. 
    - **Type of Join**: Select the type of join you want to perform. The available options are: `Inner Join`, `Left Join`, `Right Join`, and `Full Outer Join`.
    - **Joining Table**: Select the table that you want to join with the selected table.
    - **On**: Select the column from the **selected table** and the **joining table** on which you want to join the tables. Currently, only `=` operation is supported for joining tables.
    - **AND or OR condition**: You can add multiple conditions by clicking on the **+Add more** button below each join. The conditions can be joined by `AND` or `OR` operation.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/v2-beta/database/newui/join1.png" alt="ToolJet Database editor" />

  </div>

- **Filter**: Add a condition by choosing a column, an operation, and the value for filtering the records. The operations supported are same as the [filter operations](#available-operations-are) for the **List rows** operation.
- **Sort**: Sort the query response by choosing a column and the order (ascending or descending).
- **Limit**: Limit the number of records to be returned by entering a number. 
- **Offset**: Offset the number of records to be returned by entering a number. This parameter is used for pagination.
- **Select**: Select the columns that you want to return in the query response. By default, all the columns are selected.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/v2-beta/database/newui/join2.png" alt="ToolJet Database editor" />

  </div>

:::info
If you have any other questions or feedback about **ToolJet Database**, please reach us out at hello@tooljet.com or join our **[Slack Community](https://www.tooljet.com/slack)**
:::

</div>

</div>
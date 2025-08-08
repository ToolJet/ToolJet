---
id: table-operations
title: Table Operations
---

## Search Table

Open the Search bar by clicking on the **Search** button and search for a table in the ToolJet database by entering the table name.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/search-v2.png" alt="ToolJet database" />

<div style={{paddingTop:'24px'}}>

## Rename Table

To rename a table, click on the kebab menu icon on the right of the table name and then select the **Edit table** option. A drawer will open from the right from where you can edit the table name.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/edit-table-name-v2.png" alt="ToolJet database" />

</div>

<div style={{paddingTop:'24px'}}>

## Add New Column

To add a new column to a table, either click on the kebab menu icon on the right of the table name and then select the **Add new column** option or click on the **+** button present at the end of the column header.

A drawer from the right will open up where you can enter the details for the new column:

- **Column Name**: Enter a unique name for the new column, serving as its key identifier.
- **Data Type**: Choose the appropriate data type for the column from the [available options](/docs/tooljet-db/data-types#supported-data-types). For more information on data types and their associated constraints, see the [Supported Data Types](/docs/tooljet-db/data-types#supported-data-types) and [Permissible Constraints per Data Type](/docs/tooljet-db/data-types#permissible-constraints-per-data-type) sections.
- **Default Value**: Specify any default value that should be assigned to the column. Optionally, users can leave this field blank. When a table contains rows and NOT NULL is applied to one of its existing or new columns, specifying a default value becomes compulsory.
- **Foreign Key Relation**: Click on the toggle to add a foreign key relationship to the column. This will open a menu where you can select the target table and column to reference.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/add-new-column-v2.gif" alt="ToolJet database"/>

</div>

<div style={{paddingTop:'24px'}}>

## Export Schema

The export schema option allows you to download the selected table schema in a JSON file. This does not export the table data or the relationships.<br/>
While exporting the app, you can choose to export the app with or without a table schema connected to the app.<br/>
To export the table schema, click on the three vertical dots icon on the right of the table name and then click on the **Export** option. A JSON file will be downloaded with the table schema.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/export-schema-v2.png" alt="ToolJet database" />

</div>

<div style={{paddingTop:'24px'}}>

## Delete Table

To delete a table, click on the three vertical dots icon on the right of the table name and then click on the **Delete** option. A confirmation modal will appear, click on the **Delete** button to delete the table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-table-v2.png" alt="ToolJet database" />

</div>

<div style={{paddingTop:'24px'}}>

## Edit Column

To edit a column, click on the kebab menu on the column name and select the option to **Edit column**. When you edit the column, the data type cannot be changed.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/edit-column-v2.png" alt="ToolJet database" />

</div>

<div style={{paddingTop:'24px'}}>

## Delete Column

To delete a column, click on the kebab menu on the column name and select the option to **Delete**. You cannot delete a column if it is being used as a primary key. You will have to remove the primary key constraint from the column before deleting it.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-column-v2.png" alt="ToolJet database" />

</div>

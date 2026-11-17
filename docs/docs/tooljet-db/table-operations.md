---
id: table-operations
title: Table Operations
---

Operations that change a table's schema, such as renaming the table or adding, editing, or deleting a column, are made in the development environment. Each change is recorded as a migration in the table's migration history, and is later run in staging and production. See [Migrations](/docs/tooljet-db/migrations/overview) to learn more.

## Available Actions in Each Environment

| Action | Development | Staging and Production |
|:-------|:-----------:|:----------------------:|
| Create or edit a table | ✅ | ❌ |
| Add, edit, or delete a column | ✅ | ❌ |
| Add, edit, or remove a foreign key | ✅ | ❌ |
| Write a SQL migration | ✅ | ❌ |
| Add, edit, or delete rows | ✅ | ✅ |
| Bulk upload or export data | ✅ | ✅ |
| [Seed data with SQL](/docs/tooljet-db/manage-data#seed-data-with-sql) | ✅ | ✅ |

Deleting a table deletes it in every environment. See [Delete Table](#delete-table).

## Confirm a Schema Change

Creating a table records its first migration, `0001`, automatically. For any other change, such as editing a column or adding a foreign key, ToolJet shows a confirmation modal first:

1. Make the change in development and save it.
2. In the confirmation modal, review the **Changes overview**. If applications, modules, or workflows use the table, the modal also shows how many, for example **3 resources depend on this table**. Expand it to see each one and its queries.
3. (Optional) Enter a **Title** for the migration. If it's left blank, ToolJet generates a name, for example `Add column "email"`.
4. (Optional) Click **Add migration** to add a SQL step that runs right after the change, such as filling a new column with values. This option isn't available when dropping a column or removing a foreign key.
5. Click **Run in development**.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-schema-change.png" alt="Schema change confirmation modal with Run in development highlighted" />

The change is applied to the development table and added to the table's migration history with the next number, for example `0002`. A SQL step is recorded as its own migration, right after the change.

:::info
If the change is applied but the SQL step fails, ToolJet shows `Schema change applied; SQL step failed` with the database error. Fix the SQL and click **Run in development** again.
:::

<div style={{paddingTop:'24px'}}>

## Search Table

Open the Search bar by clicking on the **Search** button and search for a table in the ToolJet database by entering the table name.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/search-v2.png" alt="ToolJet database" />

</div>

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

Deleting a table permanently deletes it, and its data, in **every** environment. Tables can be deleted only in development.

ToolJet blocks the deletion if:

- A query in an application, module, or workflow uses the table, including queries in drafts and older versions.
- Another table has a foreign key that references it.

When the deletion is blocked, a dialog such as **Dependent queries found** or **Referencing tables found** lists what's blocking it. Remove those references, and then delete the table.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-delete-table.png" alt="Delete table modal explaining that the table is used by an application" />

</div>

<div style={{paddingTop:'24px'}}>

## Edit Column

To edit a column, click on the kebab menu on the column name and select the option to **Edit column**. Saving the change opens the [schema change confirmation](#confirm-a-schema-change).

<img className="screenshot-full" src="/img/v2-beta/database/ux2/edit-column-v2.png" alt="ToolJet database" />

### Change a Column's Data Type

The **Data type** dropdown in the column editor lists only the types the column can be converted to.

| From | To | What Happens |
|:-----|:---|:-------------|
| int | bigint, float | Applied directly. |
| bigint | float | Applied directly. |
| int, bigint, float, boolean | varchar | ToolJet fills in the SQL step. Every value converts. |
| varchar | int, bigint, float, boolean | ToolJet fills in the SQL step and checks existing values first. |
| varchar | jsonb | ToolJet fills in the SQL step. Values can't be checked in advance. |
| bigint | int | ToolJet fills in the SQL step and checks that values fit the int range. |

When ToolJet checks existing values, it shows how many rows can't be converted. For conversions from varchar, click **Show rows** to see them.

:::warning
The value check covers only the development table. A row in staging or production that can't be converted stops the migration when it [runs there](/docs/tooljet-db/migrations/run-migrations). Check those rows before running the migration, for example with a filter on the table in that environment.
:::

If the column has a default value and ToolJet fills in the SQL step, the step removes the default, because the old default can't be converted. To keep a default, add a new one in the same SQL step.

The type of a primary key, an auto-incrementing (serial) column, or a column in a foreign key can't be changed. For these, and for conversions that aren't listed, such as float to int or any conversion to a date, [write a SQL migration](/docs/tooljet-db/migrations/overview#write-a-sql-migration).

</div>

<div style={{paddingTop:'24px'}}>

## Delete Column

To delete a column, click on the kebab menu on the column name and select the option to **Delete**. You cannot delete a column if it is being used as a primary key. You will have to remove the primary key constraint from the column before deleting it.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-column-v2.png" alt="ToolJet database" />

</div>

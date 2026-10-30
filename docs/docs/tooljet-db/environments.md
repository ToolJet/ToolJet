---
id: environments
title: Environments
---

<PlanBadge type="team" />

Every ToolJet Database table has a separate copy in the development, staging, and production environments. You change a table's schema in development, and ToolJet records each change as a migration. When you're ready, you run those migrations in staging and then in production.

Each environment keeps its own data. Rows you add while building or testing never reach production, and production rows stay untouched while you work on the next schema change.

<div style={{paddingTop:'24px'}}>

## How It Works

- **Schema changes travel as migrations.** Every schema change you make in development is recorded as a numbered migration in the table's history (`0001`, `0002`, and so on). Staging and production pick up a change only when you run its migration there.
- **Data stays in its environment.** Running migrations changes the schema of the target table. It doesn't copy rows between environments.
- **Migrations move in one direction.** Changes go from development to staging, and from staging to production. You can't skip staging.
- **Each table moves on its own.** Migrations are tracked and run per table, so one table can be ahead in staging while another isn't there yet.
- **Applications use the table in their own environment.** A query reads and writes the copy of the table in the environment the application is running in. See [Use Tables in Applications and Workflows](#use-tables-in-applications-and-workflows).

### What You Can Do in Each Environment

| Action | Development | Staging and Production |
|:-------|:-----------:|:----------------------:|
| Create a table | ✅ | ❌ |
| Edit a table or its primary key | ✅ | ❌ |
| Add, edit, or delete a column | ✅ | ❌ |
| Add, edit, or remove a foreign key | ✅ | ❌ |
| Write a SQL migration | ✅ | ❌ |
| Add, edit, or delete rows | ✅ | ✅ |
| Bulk upload data from a CSV file | ✅ | ✅ |
| Seed data with SQL | ✅ | ✅ |
| Export data as CSV | ✅ | ✅ |

Deleting a table removes it from every environment. See [Delete a Table](#delete-a-table).

</div>

<div style={{paddingTop:'24px'}}>

## Switch Environments

The environment switcher is in the header of the **ToolJet Database** page. It shows the selected environment and the latest migration applied to the open table in that environment. Click it and select another environment to view that environment's copy of the table.

The dot next to each environment shows the state of the open table there:

| Dot | Meaning |
|:----|:--------|
| Blue | The table is up to date with every migration. |
| Orange | The table is behind. Some migrations haven't run in this environment yet. |
| Grey | The table doesn't exist in this environment yet. You can't select it until you run the table's migrations there. |

The switcher appears once the workspace has at least one table. Switching environments here only changes what you see on the **ToolJet Database** page. It doesn't change the environment of your applications.

</div>

<div style={{paddingTop:'24px'}}>

## Make Schema Changes

Make every schema change in the development environment. In staging and production, schema controls such as **Create new table**, **Edit table**, **Add new column**, and the column menu are disabled with the message **Schema changes can only be made in the Development environment**.

Creating a table records its first migration automatically. For any other schema change, ToolJet shows a confirmation modal before applying it:

1. Make the change, for example by editing a column or adding a foreign key, and save it.
2. In the modal, review the details:
   - **Title**: A name for the migration. Leave it blank to use a generated name, such as `Add column "email"`.
   - **Changes overview**: The changes that will be applied.
   - **Dependent resources**: The applications, modules, and workflows whose queries use this table. Expand the list to see each resource and its queries.
3. (Optional) Click **Add migration** to add a SQL step that runs right after the change, such as filling a new column with values. Enter a **Description** and the **SQL**. This option isn't available when you delete a column or remove a foreign key.
4. Click **Run in development**.

The change is applied to the development table and added to its migration history.

### Change a Column's Data Type

When you edit a column, the **Data type** dropdown lists only the types the column can be converted to. Some conversions are applied directly, and others are applied with a SQL step that ToolJet writes for you:

| From | To | How It's Applied |
|:-----|:---|:-----------------|
| int | bigint, float | Applied directly. |
| bigint | float | Applied directly. |
| int, bigint, float, boolean | varchar | ToolJet writes the SQL step. Every value converts. |
| varchar | int, bigint, float, boolean, jsonb | ToolJet writes the SQL step and checks existing values first. |
| bigint | int | ToolJet writes the SQL step and checks that existing values fit the int range. |

For conversions that check existing values, ToolJet shows how many rows in the selected environment can't be converted. Click **Show rows** to filter the table to those rows. Values from varchar to jsonb can't be checked in advance.

:::warning
The value check covers only the environment you're viewing. When you later run the migration in staging or production, a row there that can't be converted stops the migration in that environment. Switch to each environment first to check its values.
:::

If the column has a default value, the SQL step drops it, because the old default can't be converted. Set a new default in the same SQL step if you need one.

You can't change the data type of a primary key column, an auto-incrementing (serial) column, or a column that is part of a foreign key. Conversions that aren't listed, such as float to int or any conversion to a date, need a [SQL migration](#write-a-sql-migration).

</div>

<div style={{paddingTop:'24px'}}>

## Write a SQL Migration

Write your own migration for changes the table forms can't make, such as a date conversion with an explicit format or a change to a foreign key column.

1. Open the table in the development environment.
2. Click the **Migration history** icon next to the environment switcher.
3. On the **Development** tab, click **New migration**.
4. Enter a **Title**, an optional **Description**, and the **SQL**.
5. Click **Run in development**.

Refer to tables with placeholders instead of their names:

| Placeholder | Refers To |
|:------------|:----------|
| `{{self}}` | The table you're writing the migration for |
| `{{table.<name>}}` | Another table in the workspace, for example `{{table.orders}}` |

For example, to convert a varchar column that stores dates as `31/12/2026` to a date with time column:

```sql
ALTER TABLE "{{self}}"
  ALTER COLUMN "joined_on" TYPE timestamptz
  USING to_timestamp("joined_on", 'DD/MM/YYYY');
```

A SQL migration follows these rules:

- `CREATE TABLE`, `ALTER TABLE`, and `DROP TABLE` statements must use a placeholder, not a table name.
- Every column the migration adds or changes must use a [supported data type](/docs/tooljet-db/data-types#supported-data-types). Otherwise, the migration is rejected.
- The migration runs as a single transaction. If any statement fails, none of it is applied.
- If the table is locked by other queries for more than 3 seconds, the migration fails. Run it again when the table is less busy.
- Every statement runs again in staging and production when you run the migration there, including data statements such as `UPDATE`.

</div>

<div style={{paddingTop:'24px'}}>

## View Migration History

To open a table's migration history, click the **Migration history** icon next to the environment switcher, or click the switcher and then **View migration history**.

The history has a tab for each environment:

- **Status**: How many migrations this environment is ahead of the next one, for example `Development is 2 migrations ahead of staging`.
- **Migrations**: Every migration of the table, newest first, with its number, name, description, and time. The **Latest** badge marks the newest migration, and the `<Environment> is here` badge marks the last migration applied in an environment that's behind.
- **Pending migrations**: Migrations that haven't run in the selected environment yet are dimmed.
- **SQL**: Click the code icon on a migration to view its SQL.

Migrations can't be edited or deleted. To change something a migration did, write a new one. See [Undo a Migration](#undo-a-migration).

</div>

<div style={{paddingTop:'24px'}}>

## Run Migrations in Staging and Production

Run a table's pending migrations in the next environment when you're ready to move its schema changes forward.

1. Open the table's migration history.
2. Select the tab of the environment that has the changes: **Development** to update staging, or **Staging** to update production.
3. Click **Run in staging** or **Run in production**.
4. Review the migrations that will run and their SQL.
5. (Optional) Click **Download backup** to download the target environment's rows as a CSV file.
6. Click **Run in staging** or **Run in production**.

ToolJet runs every pending migration of the table, in order. The first time you run migrations in an environment, ToolJet creates the table there, with no rows.

:::danger
Migrations can delete data. For example, a migration that drops a column deletes that column's values in the environment it runs in. Download a backup before you run migrations in staging or production.
:::

Keep the following in mind:

- **Foreign keys**: If the table has a foreign key to another table, that table must exist in the target environment first. Otherwise, the run fails with a message such as `Promote "customers" first`.
- **Failures**: Each migration is applied separately. If one fails, the migrations before it stay applied, and the error shows the statement that failed. Fix the cause, for example by correcting rows in that environment or by writing a new migration in development, and run the migrations again. The run continues from the failed migration.
- **Git Sync**: If you use Git Sync with multiple branches, you can run migrations only on the default branch.

</div>

<div style={{paddingTop:'24px'}}>

## Undo a Migration

ToolJet doesn't roll back migrations automatically. To undo a change, [write a SQL migration](#write-a-sql-migration) in development that reverses it, and then run it in staging and production.

A migration can't bring back data that an earlier migration deleted. To restore deleted values, [bulk upload](/docs/tooljet-db/database-editor#bulk-upload-data) them from the backup CSV file.

</div>

<div style={{paddingTop:'24px'}}>

## Add Data to an Environment

Each environment's rows are separate, and you can add or change rows in any environment. Select the environment in the switcher, open the table, and click **Add new data**:

- **Add new row**: Add a single row. See [Add New Row](/docs/tooljet-db/database-editor#add-new-row).
- **Bulk upload data**: Add or update rows from a CSV file. See [Bulk Upload Data](/docs/tooljet-db/database-editor#bulk-upload-data).
- **Seed data with SQL**: Add or change rows with SQL. See [Seed Data With SQL](#seed-data-with-sql).

### Seed Data With SQL

<PlanBadge type="self-hosted" />

Use SQL to add or change rows in the selected environment, for example to load test data into staging.

1. Select the environment in the switcher and open the table.
2. Click **Add new data** > **Seed data with SQL**.
3. Enter the SQL, and click **Seed**.

Refer to the table as `{{self}}`:

```sql
INSERT INTO "{{self}}" ("name", "email")
VALUES ('Jane Doe', 'jane@example.com'), ('John Doe', 'john@example.com');
```

The SQL can only use `SELECT`, `INSERT`, `UPDATE`, and `DELETE` statements on this table. To change the schema, [make a schema change](#make-schema-changes) in development instead. Inserted rows count toward your plan's row limit.

**Seed data with SQL** is hidden when `TJDB_SQL_MODE_DISABLE` is set to `true`.

</div>

<div style={{paddingTop:'24px'}}>

## Export Data as CSV

1. Click the kebab menu next to the table name, and select **Export data as CSV**.
2. Select the environment to export. Each environment shows its latest migration and row count. Environments where the table doesn't exist can't be selected.
3. Click **Export as CSV**.

The file downloads as `<table>-<environment>.csv`. Tables with more than 50,000 rows can take some time to export.

</div>

<div style={{paddingTop:'24px'}}>

## Delete a Table

Deleting a table permanently deletes it and its data in **every** environment. You can delete a table only from the development environment.

ToolJet blocks the deletion when:

- A query in an application, module, or workflow uses the table. This includes queries in draft and older versions. Remove the table from those queries first.
- Another table has a foreign key that references this table. Remove or change that foreign key first.

The **Delete table** modal lists the resources and tables that block the deletion.

</div>

<div style={{paddingTop:'24px'}}>

## Use Tables in Applications and Workflows

ToolJet Database queries use the copy of the table in the environment the application runs in:

- In the app builder, queries use the environment selected in the app builder.
- Released applications use the production environment.

If the table doesn't exist in that environment yet, the query fails with the error `Table "<name>" has no relation in this environment`. Run the table's migrations in that environment to fix it.

When you promote an application, ToolJet checks the tables its queries use:

- If a table doesn't exist in the target environment, the promotion is blocked with a message such as `Promote blocked - table "orders" not available in Staging. Promote the table first.` Run the table's migrations in that environment, then promote the application again.
- If a table exists but is behind on migrations, the application is promoted, and ToolJet shows a warning with the number of pending migrations. Run them from the table's migration history so the application sees the latest schema.

</div>

<div style={{paddingTop:'24px'}}>

## Licensing

Environments for ToolJet Database are part of the [multi-environment](/docs/development-lifecycle/environment/self-hosted/multi-environment) feature.

- **Without multi-environment**: Only the development environment is available. Staging and production are shown as locked in the environment switcher.
- **When the license expires**: Staging and production are locked again. You can still export their data as CSV, but you can't select them, change their rows, or run migrations in them. Queries use the development environment. A query on a table whose data was moved to production during an upgrade fails until you renew the license. See [Upgrade From an Earlier Version](#upgrade-from-an-earlier-version).

</div>

<div style={{paddingTop:'24px'}}>

## Upgrade From an Earlier Version

When you upgrade to a version with ToolJet Database environments, ToolJet places your existing tables as follows:

- **With multi-environment**: Each table's existing data moves to the production environment, so released applications keep using the same rows. Development gets an empty copy of each table with the same schema. Staging gets the table when you first run its migrations there.
- **Without multi-environment**: Each table and its data stay in the development environment.

Each existing table's history starts with a migration named `Create table "<name>"`, plus `Add foreign keys on "<name>"` if the table has foreign keys. These record the table's schema at the time of the upgrade. No SQL is run for them.

</div>

<div style={{paddingTop:'24px'}}>

## Limitations

- ToolJet Database has no environment-level permissions. Users who can edit ToolJet Database can change rows and run migrations in every environment.
- Rows in every environment count toward your plan's row limit.
- When you import an application, its tables are created in the development environment only.
- Git Sync doesn't sync ToolJet Database tables or their migrations.

</div>

## Related

- [Multi-Environment](/docs/development-lifecycle/environment/self-hosted/multi-environment)
- [Database Editor](/docs/tooljet-db/database-editor)
- [Table Operations](/docs/tooljet-db/table-operations)
- [Querying ToolJet Database](/docs/tooljet-db/querying-tooljet-db)

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

---
id: schema-changes
title: Schema Changes and Migrations
---

<PlanBadge type="team" />

Every schema change to a ToolJet Database table is made in the development environment. ToolJet records each change as a migration in the table's migration history, and those migrations are later run in staging and production.

In staging and production, schema controls such as **Create new table**, **Edit table**, and **Add new column** are disabled with the message **Schema changes can only be made in the Development environment**.

## Make a Schema Change

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

## Change a Column's Data Type

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
The value check covers only the development table. A row in staging or production that can't be converted stops the migration when it runs there. Check those rows before running the migration, for example with a filter on the table in that environment.
:::

If the column has a default value and ToolJet fills in the SQL step, the step removes the default, because the old default can't be converted. To keep a default, add a new one in the same SQL step.

The type of a primary key, an auto-incrementing (serial) column, or a column in a foreign key can't be changed. For these, and for conversions that aren't listed, such as float to int or any conversion to a date, write a SQL migration.

## Write a SQL Migration

For changes the table forms can't make, write a SQL migration.

1. Open the table in development.
2. Click the **Migration history** icon next to the environment switcher.
3. On the **Development** tab, click **New migration**.
4. Enter the **SQL**, and optionally a **Title** and **Description**.
5. Click **Run in development**.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-new-migration.png" alt="New migration modal with the SQL editor highlighted" />

Refer to tables with placeholders instead of their names. Use `{{self}}` for the current table, and `{{table.<name>}}` for another table, such as `{{table.orders}}`.

For example, to convert a varchar column that stores dates as `31/12/2026` into a date with time column:

```sql
ALTER TABLE "{{self}}"
  ALTER COLUMN "signup_date" TYPE timestamptz
  USING to_timestamp("signup_date", 'DD/MM/YYYY');
```

SQL migrations follow these rules:

- `CREATE TABLE`, `ALTER TABLE`, and `DROP TABLE` statements must use a placeholder, not a table name.
- Columns must use a [supported data type](/docs/tooljet-db/data-types#supported-data-types).
- The migration runs as one transaction. If any statement fails, none of it is applied.
- If other queries lock the table for more than 3 seconds, the migration fails. Run it again when the table is less busy.
- Every statement, including data statements such as `UPDATE`, runs again in staging and production when the migration is run there.

## View Migration History

Click the **Migration history** icon next to the environment switcher to see every migration of the open table. The migration history has a tab for each environment, showing what has run in development, staging, and production.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-migration-history.png" alt="Migration history drawer with the status highlighted" />

- On the **Development** and **Staging** tabs, the status at the top shows how far ahead the environment is of the next one, for example `Development is 2 migrations ahead of staging`.
- Migrations are listed newest first, with their number, name, and time. Click the code icon on a migration to see its SQL.
- The **Latest** badge marks the newest migration. When staging or production is behind, a badge such as **Staging is here** marks the last migration applied there, and migrations that haven't run yet are dimmed.

Migrations can't be edited or deleted. To change what a migration did, write a new one.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

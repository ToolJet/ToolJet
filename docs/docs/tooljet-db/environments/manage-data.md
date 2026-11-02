---
id: manage-data
title: Manage Data in Each Environment
---

<PlanBadge type="team" />

Each environment has its own rows. Data can be added, changed, and exported in any environment without affecting the others. To work with an environment's data, select it in the environment switcher and open the table.

## Add Data

Click **Add new data** and choose an option:

- **Add new row**: Add a single row. See [Add New Row](/docs/tooljet-db/database-editor#add-new-row).
- **Bulk upload data**: Add or update rows from a CSV file. See [Bulk Upload Data](/docs/tooljet-db/database-editor#bulk-upload-data).
- **Seed data with SQL**: Add or change rows with SQL.

## Seed Data With SQL

<PlanBadge type="self-hosted" />

Use SQL to fill the selected environment's table, for example with test data for staging.

1. Select the environment and open the table.
2. Click **Add new data** > **Seed data with SQL**.
3. Enter the SQL, and click **Seed**.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-add-data.png" alt="Add new data menu with Seed data with SQL highlighted" />

Refer to the table as `{{self}}`:

```sql
INSERT INTO "{{self}}" ("name", "email")
VALUES ('Jane Doe', 'jane@example.com'), ('John Doe', 'john@example.com');
```

Only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` statements on this table are allowed. To change the schema, [make a schema change](./schema-changes.md) in development instead.

**Seed data with SQL** isn't available on ToolJet Cloud, or when `TJDB_SQL_MODE_DISABLE` is set to `true`.

## Export Data as CSV

1. Click the kebab menu next to the table name, and select **Export data as CSV**.
2. Select the environment to export. Each one shows its row count and latest migration.
3. Click **Export as CSV**.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-export-csv.png" alt="Export modal with the environment list highlighted" />

The file downloads as `<table>-<environment>.csv`. Large tables can take a while to export.

## Delete a Table

Deleting a table permanently deletes it, and its data, in **every** environment. Tables can be deleted only in development.

ToolJet blocks the deletion if:

- A query in an application, module, or workflow uses the table, including queries in drafts and older versions.
- Another table has a foreign key that references it.

When the deletion is blocked, a dialog such as **Dependent queries found** or **Referencing tables found** lists what's blocking it. Remove those references, and then delete the table.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-delete-table.png" alt="Delete table modal explaining that the table is used by an application" />

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

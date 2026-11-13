---
id: manage-data
title: Manage Data
---

ToolJet Database tables can be filled with SQL and exported as CSV files. To add or edit rows one at a time, or to bulk upload a CSV file, see [Adding and Modifying Data](/docs/tooljet-db/database-editor#adding-and-modifying-data).

## Data in Each Environment

Each environment keeps its own rows for every table. Seeding, exporting, and other changes to data apply only to the environment selected in the environment switcher, and never affect the other environments. See [ToolJet Database environments](/docs/development-lifecycle/environment/self-hosted/multi-environment#tooljet-database) to learn more.

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

Only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` statements on this table are allowed. To change the schema, use the [table operations](/docs/tooljet-db/table-operations) or [write a SQL migration](/docs/tooljet-db/migrations/overview#write-a-sql-migration) in development instead.

**Seed data with SQL** isn't available on ToolJet Cloud, or when `TJDB_SQL_MODE_DISABLE` is set to `true`.

## Export Data as CSV

1. Click the kebab menu next to the table name, and select **Export data as CSV**.
2. Select the environment to export. Each one shows its row count and latest migration.
3. Click **Export as CSV**.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-export-csv.png" alt="Export modal with the environment list highlighted" />

The file downloads as `<table>-<environment>.csv`. Large tables can take a while to export.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

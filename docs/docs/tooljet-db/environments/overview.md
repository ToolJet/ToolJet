---
id: overview
title: ToolJet Database Environments
sidebar_label: Overview
---

<PlanBadge type="team" />

Every ToolJet Database table has a separate copy in the development, staging, and production environments. Schema changes are made in development, tested, and then moved to staging and production when they're ready.

Each environment keeps its own data. Rows added while building or testing never reach production, and production rows stay untouched while the next change is in progress.

## How It Works

- **Schema changes travel as migrations.** Every schema change made in development is recorded as a numbered migration in the table's migration history (`0001`, `0002`, and so on). Staging and production pick up a change only when its migration is run there.
- **Each table has its own migration history.** It starts at `0001` with the migration that created the table, and its numbers count up independently of other tables. Running one table's migrations in staging doesn't change any other table.
- **Data stays in its environment.** Running migrations never copies rows between environments. Each environment keeps the rows that were added to it.
- **Changes move one step at a time.** Migrations run from development to staging, and from staging to production.
- **Applications use the table in their own environment.** In the app builder, queries use the environment selected in the app builder. Released applications use production.

## Available Actions in Each Environment

| Action | Development | Staging and Production |
|:-------|:-----------:|:----------------------:|
| Create or edit a table | ✅ | ❌ |
| Add, edit, or delete a column | ✅ | ❌ |
| Add, edit, or remove a foreign key | ✅ | ❌ |
| Write a SQL migration | ✅ | ❌ |
| Add, edit, or delete rows | ✅ | ✅ |
| Bulk upload, seed, or export data | ✅ | ✅ |

Deleting a table deletes it in every environment. See [Delete a Table](./manage-data.md#delete-a-table).

## Switch Environments

The environment switcher is in the header of the **ToolJet Database** page. It appears once the workspace has at least one table. Click it and select an environment to view that environment's copy of the table.

<img className="screenshot-full" src="/img/tooljet-db/environments/tjdb-env-switcher.png" alt="Environment switcher showing Development, Staging and Production with their status dots" />

The dot next to each environment shows the state of the open table there:

- **Blue**: The table is up to date.
- **Orange**: The table is behind. Some migrations haven't run there yet.
- **Grey**: The table doesn't exist there yet. It can't be selected until the table's migrations are run in that environment.

Switching environments here only changes the data shown on the **ToolJet Database** page. It doesn't change the environment of any application.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

---
id: infra-level-rollback
title: Infra Level Rollback
---

Infra level rollback allows you to revert your ToolJet deployment to a previous version at the infrastructure level. This is **not recommended for general use** and should only be considered when the current version has breaking changes or bugs that block usage.

:::warning Last Resort — Consult ToolJet Team First
Infra level rollback should only be used as a **last resort**, after consulting with the ToolJet team. Before beginning, ensure you have taken a **complete backup** of your PostgreSQL instance (both PG_DB and TOOLJET_DB) and any relevant configuration.
:::

### When to Use This

Infra level rollback should only be considered in case of a major breakage in app functionality, or an issue with the migrations run during an upgrade.

### Prerequisites

Before beginning an upgrade, make sure of the following, so that a rollback stays possible if something goes wrong:

- **If you are using an external database**, take a full snapshot of the database instance before starting the upgrade.
- **If your database is deployed as a container alongside ToolJet**, the snapshot and restore process will look different — reach out to your infrastructure team for help with this.
- **Note down the version you are upgrading from**, so you know exactly which version to roll back to if needed.

### Rollback Steps

1. Move the deployment back to the previous version's image/tag.
2. Restore the database instance from the snapshot taken before the upgrade.


## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

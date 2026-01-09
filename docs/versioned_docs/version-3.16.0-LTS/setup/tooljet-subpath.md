---
id: tooljet-subpath
title: Deploying ToolJet on a subpath
---

ToolJet can now be deployed at a subpath rather than the root (`/`) of a public domain. Example subpath installation URL: **`http://www.yourcompany.com/apps/tooljet`**

You'll need to setup the following environment variables if ToolJet installation is on a domain subpath:

```bash
TOOLJET_HOST=https://www.yourcompany.com
SUB_PATH=/apps/tooljet/
```

**Environment Variable Details:**

- **TOOLJET_HOST**: The public URL of your domain (e.g., `https://www.yourcompany.com`)
- **SUB_PATH**: The subpath where ToolJet will be accessible. Must include trailing `/` and is applicable only when the server is serving the frontend client (e.g., `/apps/tooljet/`)

For additional environment variables, refer to our [Environment Variables documentation](/docs/setup/env-vars).

## Upgrading to the Latest LTS Version

:::info
If this is a new installation of the application, you may start directly with the latest version. This upgrade guide is only for existing installations.
:::

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [*ToolJet Docker Hub*](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

### Prerequisites for Upgrading

:::warning
**Critical: Backup Your PostgreSQL Instance**

Before starting the upgrade process, perform a **comprehensive backup of your PostgreSQL instance** to prevent data loss. Your backup must include both required databases:

1. **PG_DB** (Application Database) - Contains users, apps, and configurations
2. **TOOLJET_DB** (Internal Database) - Contains ToolJet Database feature data

Ensure both databases are included in your backup before proceeding with the upgrade.
:::

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the latest LTS version.
- **ToolJet 3.0+ Requirement:** Deploying ToolJet Database is mandatory from ToolJet 3.0 onwards. For information about breaking changes, see the [*ToolJet 3.0 Migration Guide*](./upgrade-to-v3.md).

_If you have any questions feel free to join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) or send us an email at support@tooljet.com._

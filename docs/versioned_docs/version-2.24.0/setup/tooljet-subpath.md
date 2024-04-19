---
id: tooljet-subpath
title: Deploying ToolJet on a subpath
---

ToolJet can now be deployed at a subpath rather than the root (`/`) of a public domain. Example subpath installation URL: **`http://www.yourcompany.com/apps/tooljet`**

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

You'll need to setup the following environment variables if ToolJet installation is on a domain subpath:

| variable | value |
| -------- | ---------------------- |
| TOOLJET_HOST | the public URL ( eg: https://www.yourcompany.com )  |
| SERVE_CLIENT | By default, this variable will be unset and the server will serve the client at its `/` end-point. You can set `SERVE_CLIENT` to `false` to disable this behaviour. |
| SUB_PATH | Set a subpath to this variable. The subpath is to be set with trailing `/` and is applicable only when the server is serving the frontend client. ( eg: `/apps/tooljet/` )  |


:::info
See all **[Environment Variables](/docs/setup/env-vars)** here.
:::

## Upgrading to the Latest Version

The latest version includes architectural changes and, hence, comes with new migrations.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest Version:

- It is **crucial to perform a comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Ensure that your current version is v2.23.3-ee2.10.2 before upgrading. 

- Users on versions earlier than v2.23.3-ee2.10.2 must first upgrade to this version before proceeding to the latest version.

For specific issues or questions, refer to our **[Slack](https://tooljet.slack.com/join/shared_invite/zt-25438diev-mJ6LIZpJevG0LXCEcL0NhQ#)**.



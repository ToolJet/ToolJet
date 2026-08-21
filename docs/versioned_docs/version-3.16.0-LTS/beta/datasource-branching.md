---
id: datasource-branching
title: Data Source Branching
---

:::warning BETA
Data Source Branching is currently in beta and not recommended for production use.
:::

With workspace-level branching, data sources are part of the same branch as your apps and modules. Changes to a data source on a feature branch stay isolated on that branch until merged — giving your Git pipeline a complete picture of a feature, including its connection configuration.

Unlike apps and modules, **data sources do not have version control**. There is no draft, saved, or released state for a data source. A data source always reflects its latest configuration on the current branch. When you make a change to a data source on a feature branch and merge that branch, the latest state of the data source becomes the state on main.

## What You Can Do on Each Branch

Data source operations are restricted by branch type:

| Operation | Feature Branch | Main Branch |
|---|---|---|
| Create a data source | ✅ | ❌ |
| Update a data source | ✅ | ❌ |
| Delete a data source | ✅ | ❌ |
| View data sources | ✅ | ✅ |

All create, update, and delete actions must happen on a feature branch. Main branch is read-only for data sources.

:::note
A data source connected to one or more app queries cannot be deleted, regardless of which branch you are on.
:::

## Encrypted Fields and Git

Data source configurations often contain sensitive values — passwords, API keys, connection strings. ToolJet does **not** sync encrypted fields to Git. Since pushing credentials to a Git repository would be a security risk.

The practical consequence is that after pulling a data source from Git to a new instance, any encrypted fields will be empty. The connection will fail until those fields are filled in again manually.

## Using Workspace Constants for Encrypted Fields

[Workspace constants and secrets](/docs/app-builder/custom-code/constants-secrets) let you store sensitive values outside your data source configuration. Instead of entering a raw credential directly into an encrypted field, you reference a constant by name using the `{{constants.name}}` or `{{secrets.name}}` syntax.

When ToolJet detects this syntax in an encrypted field, it syncs the **constant name** to Git — not the value. On the destination instance, the constant's value is already loaded from the instance's own environment, so the data source reconnects automatically without any manual intervention.

**Example**: Instead of entering `my-db-password` directly into the password field of your PostgreSQL data source, you set the field to `{{secrets.pg_password}}`. The string `{{secrets.pg_password}}` goes to Git. On your staging instance, the `pg_password` secret is already configured with the staging database password, so the data source connects correctly when pulled.

### Setting Up Constants Across Instances

For this to work seamlessly, the same constant or secret names must exist on every instance that will receive the data source. The recommended approach is to use **environment variables** to pre-load constants into each ToolJet instance. This way, constants are defined at the infrastructure level and are automatically available on every instance without manual setup.

Refer to the [GitSync environment variables guide](/docs/beta/gitsync-env-vars) for setting up instance-level configuration.

## Restriction on Main Branch

On the main branch, ToolJet enforces an additional rule: **you cannot change a constant reference in an encrypted field**. If you attempt to update a field that currently contains a `{{constants.*}}` or `{{secrets.*}}` reference on the main branch and save, ToolJet will throw an error.

This is because changing a constant reference is a meaningful configuration change — swapping which key a data source uses — and that change must go through a feature branch and pull request like any other tracked change.

To update a constant reference in an encrypted field:
1. Switch to a feature branch.
2. Update the encrypted field with the new constant reference.
3. Commit the change.
4. Merge via pull request.

If you are only filling in an empty encrypted field (for example, after pulling a data source to a new instance where the field arrived blank), you can do that directly without going through a branch.

## Data Source Names Are Unique

Data source names must be unique across your workspace. If you attempt to create a data source with a name that already exists, ToolJet will return a validation error. This is required for branching to work correctly — Git uses the data source name to track and identify it across branches and instances.

## Limitations

- Data sources have no version control. You cannot pin a data source to a specific version in an app.
- Encrypted fields that use plain values (not constants) will always arrive empty after a pull and must be re-entered manually on the destination instance.
- Workspace constants must be set up on each instance independently. They are not synced through Git.
- CRUD operations on data sources are blocked on the main branch.
- Changing a constant reference in an encrypted field on the main branch is blocked and must go through a feature branch.

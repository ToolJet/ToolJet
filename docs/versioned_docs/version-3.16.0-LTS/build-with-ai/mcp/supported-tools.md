---
id: supported-tools
title: Supported Tools
---

:::caution BETA
ToolJet MCP is currently in beta and not recommended for production use.
:::

ToolJet MCP exposes 50 tools to your AI client. You never call these by name: you describe what you want in plain language, and your agent selects the tools it needs. This page is a reference for what your agent is able to do once connected.

For what these add up to in practice, see the [Overview](/docs/build-with-ai/mcp/overview). To connect a client, see [Setup](/docs/build-with-ai/mcp/setup).

## Workspace and Users

| Tool | What it does |
| --- | --- |
| `list_workspaces` | Lists the workspaces your account belongs to. |
| `use_workspace` | Confirms which workspace the connection is acting on. |
| `list_workspace_apps` | Lists the apps in your workspace. |
| `list_workspace_users` | Lists the users in your workspace, with search, filtering, and pagination. |
| `manage_workspace_users` | Invites a user, updates their name, role, or group assignments, and archives or unarchives them. |

## Apps and Pages

| Tool | What it does |
| --- | --- |
| `create_app` | Creates a new app with its first version and home page. |
| `get_app_summary` | Returns a bounded summary of an app's structure. This is the usual way an agent inspects an app. |
| `get_app` | Returns the complete app definition, including every page and component. |
| `get_app_settings` | Reads the app-wide settings on the current editing version. |
| `update_app_settings` | Updates app-wide visual settings, such as the theme applied to an app. |
| `add_pages` | Adds one or more pages to an app. |
| `update_pages` | Renames pages, updates their sidebar metadata, or changes their order. |
| `delete_page` | Deletes a page and the components on it. |

## Components and Layout

| Tool | What it does |
| --- | --- |
| `get_component_catalog` | Lists the components available in ToolJet and the properties each one accepts. |
| `add_components` | Places one or more components on a page. |
| `add_component_batches` | Places complete sets of components across several pages at once. |
| `get_component` | Returns the current configuration of a single placed component. |
| `update_components` | Edits placed components in place, changing only the properties named. |
| `update_layout` | Moves and resizes components without changing their properties. |
| `delete_components` | Removes components from a page. |
| `generate_form_schema` | Builds a ready-to-place Form from an existing ToolJet DB table. |

## Data Sources and Queries

| Tool | What it does |
| --- | --- |
| `list_datasources` | Lists the datasources connected to your workspace. |
| `test_datasource_connection` | Runs ToolJet's own connection test against a connected datasource. |
| `inspect_datasource_schema` | Reads metadata from a connected datasource, such as its schemas and tables. |
| `get_datasource_query_schema` | Returns the request format a given datasource operation expects. |
| `prepare_sql_discovery_queries` | Drafts read-only SQL for exploring a SQL datasource, without creating or running it. |
| `add_queries` | Creates one or more queries against any connected datasource. |
| `update_query` | Changes an existing query. |
| `delete_query` | Deletes a query. |
| `run_query` | Runs an existing query and returns its result. |
| `run_queries` | Runs up to ten existing queries at once and returns their results. |

## ToolJet Database

| Tool | What it does |
| --- | --- |
| `list_tables` | Lists the ToolJet DB tables in your workspace. |
| `get_table_schema` | Returns a table's columns, constraints, defaults, and foreign-key relationships. |
| `create_tables` | Creates one or more ToolJet DB tables. |
| `add_table_column` | Adds a column to an existing table. |
| `drop_table_column` | Removes a column and its stored values. |
| `drop_table` | Deletes a table and all of its rows. |
| `insert_rows_batch` | Adds rows to one or more tables, so a new app has data to show. |

## Events and Interactivity

| Tool | What it does |
| --- | --- |
| `add_events` | Wires behavior to a component, query, or page, such as running a query on click or showing a notification. |
| `list_events` | Lists the event handlers on an app. |
| `update_events` | Changes existing event handlers. |
| `delete_event` | Removes an event handler. |
| `add_query_lifecycles` | Sets up standard success and failure behavior for queries, such as refreshing a table after a record is saved. |

## Validation

| Tool | What it does |
| --- | --- |
| `lint_app_spec` | Dry-runs a planned set of changes and reports problems before anything is written. |
| `apply_app_phase` | Applies a set of changes that `lint_app_spec` has already validated. |
| `validate_app` | Checks a saved app's structure and query configuration without running anything. |
| `get_runtime_info` | Reports the version of the MCP server you are connected to. |

## Permissions

| Tool | What it does |
| --- | --- |
| `manage_app_permissions` | Inspects, sets, or clears who can access a specific page or query within an app. |

## Themes

| Tool | What it does |
| --- | --- |
| `list_app_themes` | Lists the themes available in your workspace. |
| `manage_theme` | Creates, updates, or removes workspace themes. |

## Tools That Require Confirmation

Five tools permanently delete data and cannot run unless your agent passes an explicit confirmation. In practice this means your agent asks you before using them, rather than deciding on its own:

- `delete_page`
- `delete_query`
- `delete_components`
- `drop_table`
- `drop_table_column`

:::note
Confirmation protects against accidental deletion, not against a request you made deliberately. If you ask your agent to drop a table, it will ask once and then do it.
:::

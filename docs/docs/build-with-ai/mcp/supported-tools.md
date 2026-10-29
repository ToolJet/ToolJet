---
id: supported-tools
title: Supported Tools
---

ToolJet MCP exposes 73 tools to your AI client. You never call these by name: you describe what you want in plain language, and your agent selects the tools it needs. This page is a reference for what your agent is able to do once connected.

For what these add up to in practice, see the [Overview](/docs/build-with-ai/mcp/overview). To connect a client, see [Setup](/docs/build-with-ai/mcp/setup).

## Workspace and Users

| Tool | What it does |
| --- | --- |
| `list_workspaces` | Lists the workspaces your account belongs to. |
| `use_workspace` | Confirms which workspace the connection is acting on. |
| `list_workspace_apps` | Lists the apps in your workspace. |
| `list_workspace_users` | Lists the users in your workspace, with search, filtering, and pagination. |
| `manage_workspace_users` | Invites a user, updates their name, role, or group assignments, and archives or unarchives them. |
| `list_workspace_groups` | Lists the workspace's groups, a group's members, its permissions and access rules, and the apps, modules, workflows, and data sources a rule can cover. Requires admin permissions. |
| `manage_workspace_groups` | Creates, renames, duplicates, and deletes custom groups, removes a member from a group, and changes a group's permissions and access rules. |

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

## App Versions

| Tool | What it does |
| --- | --- |
| `list_app_versions` | Lists an app's versions and environments. |
| `create_app_version` | Creates a new draft version by copying an existing version, then opens it in the editor. |
| `update_app_version` | Renames a version or edits its description. |
| `delete_app_version` | Deletes a version that isn't released and opens another version in the editor. It never deletes the released or only version. |
| `switch_app_version` | Opens another version in the editor, so the agent's next changes go to that version. It doesn't release anything. |
| `switch_app_environment` | Opens the same version in another environment without promoting or releasing it. |
| `promote_app_version` | Promotes a version to staging or production. It doesn't release the app. |
| `release_app` | Releases a specific version so it becomes the app's live version, promoting it through environments first when the workspace requires it. |

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
| `generate_edit_contract` | Prepares the field defaults, change events, and save payload for a form that edits an existing record, so only changed fields are sent. |

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
| `verify_page_render` | Renders one page or every page of a built app in a headless browser and reports empty text, placeholder values such as `undefined`, clipped text, and overlapping components. |
| `get_runtime_info` | Reports the version of the MCP server you are connected to. |

## Permissions

| Tool | What it does |
| --- | --- |
| `manage_app_permissions` | Inspects, sets, or clears who can access a specific page, query, or component within an app. |

## Themes

| Tool | What it does |
| --- | --- |
| `list_app_themes` | Lists the themes available in your workspace. |
| `manage_theme` | Creates, updates, or removes workspace themes. |

## Workflows

| Tool | What it does |
| --- | --- |
| `list_workflows` | Lists the workflows in your workspace. |
| `create_workflow` | Creates a new, empty workflow. It doesn't run or publish it, or set up triggers. |
| `get_workflow` | Returns a workflow's nodes, connections, and query settings. |
| `get_workflow_node_catalog` | Lists the workflow node types the agent can add and the settings each one takes. |
| `get_workflow_capabilities` | Lists the node types available for a workflow version and which connected data sources can be used as queries, AI models, or email. |
| `lint_workflow_spec` | Checks a planned set of workflow changes without saving or running anything. |
| `apply_workflow_spec` | Applies workflow changes that `lint_workflow_spec` has already validated. It doesn't run or publish the workflow. |
| `validate_workflow` | Checks a saved workflow's structure without running it. |
| `delete_workflow_node` | Removes a node and its connections from a workflow. |
| `run_workflow` | Runs a workflow version in a selected environment, with real effects such as writes to your data sources. |
| `get_workflow_execution` | Returns the status of a workflow run and the results of its nodes. |

## Tools That Require Confirmation

Six tools permanently delete data and cannot run unless your agent passes an explicit confirmation. In practice this means your agent asks you before using them, rather than deciding on its own:

- `delete_page`
- `delete_query`
- `delete_components`
- `delete_app_version`
- `drop_table`
- `drop_table_column`

These tools also need an explicit confirmation: `release_app`, `promote_app_version`, `manage_workspace_users`, `manage_workspace_groups`, `manage_app_permissions` when it sets or clears access, and `manage_theme` when it deletes a theme.

:::note
Confirmation protects against accidental deletion, not against a request you made deliberately. If you ask your agent to drop a table, it will ask once and then do it.
:::

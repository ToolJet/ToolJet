---
id: workspace-branching
title: Workspace-Level Branching
---

:::warning BETA
Workspace-Level Branching is currently in beta and not recommended for production use.
:::

A branch now spans your entire workspace. When you work on a feature branch, every change you make — across apps, data sources, and modules — stays on that branch together. They commit together, they get reviewed together through a pull request, and they merge together. This ensures your complete feature, including all its dependencies, moves through Git as a single unit.

:::info
Support for workflows in workspace-level branching is coming soon. Themes, custom styles, and constants will follow in future releases.
:::

## How Workspace Branches Work

A workspace branch is a shared working context. When you switch to a branch from any builder — an app, a module, or the data source dashboard — you are on the same branch across all of them. Any changes you make while on that branch are scoped to it until you push them to Git.

**Example**: You create a feature branch called `taylor/inventory-v2`. You then:
- Update a query in the inventory app
- Modify a module the app uses
- Update a data source connection

All three changes live on `taylor/inventory-v2`. When you open a pull request and merge it, everything lands in main together.

## Pushing Changes to Git

Pushing is done **per resource**, from inside each builder or dashboard. There is no single button to push your entire workspace at once.

| Where you push from | What gets pushed |
|:---|:---|
| Inside the app builder | That specific app only |
| Inside the module builder | That specific module only |
| Data source dashboard | All data sources (as a single entity) |

To push from any builder:

1. Make your changes on the current feature branch.
2. Click the **Commit** button in the toolbar.
3. Enter a commit message and click **Commit Changes**.

Repeat this for each resource you changed on the branch before creating a pull request.

:::note
There is no push option from the workspace dashboard. You must enter each builder individually to commit its changes.
:::

## Pulling Changes from Git

Pull behavior depends on where you initiate it — the scope of what gets pulled adjusts automatically based on context.

### Pull from the Workspace Dashboard

Pulling from the app dashboard, module dashboard, or data source dashboard pulls **all resources on that branch** into your workspace at once.

Use this when:
- You are syncing a complete branch across instances
- A teammate has pushed multiple resources and you want to catch up on everything at once

To pull from the dashboard:

1. Go to the workspace dashboard.
2. Click the **Pull Commit** button.
3. All resources on the current branch are updated from Git.

### Pull from Inside a Builder

Pulling from inside the app builder or module builder pulls **only that resource and its direct dependencies**.

When you pull from inside the app builder, ToolJet brings in:
- The app itself
- The pinned module version for each module used in the app
- The associated data sources

Use this when you are testing a specific app on a staging or production instance and only want that app's dependencies, not unrelated resources that may not be ready.

To pull from inside a builder:

1. Open the app or module in its builder.
2. Click the **Pull Commit** button in the toolbar.
3. The resource and its dependencies are updated from Git.

## Importing a Specific App Across Instances

When moving resources between separate ToolJet instances (for example, from your development instance to staging), you often want to bring over a single app at a specific version — not the entire workspace.

Use **Import** for this. Import lets you pull one app, along with its pinned module version and data sources, into a different instance without touching other apps.

**Branch matching is enforced**: You can only import from the same branch type. If you are on the main branch, you can only import apps from main. If you are on a feature branch, you can only import from that same feature branch.

To import an app:

1. On the target instance, go to the workspace dashboard.
2. Click the **Import** option.
3. Select the app to import from the Git repository.
4. Select the version you want to import.
5. Click **Import**.

ToolJet automatically pulls in:
- The selected app at the chosen version
- The module versions pinned to that app version
- The latest state of associated data sources

:::info
Data sources do not have version control, so they are always imported at their latest state on the branch.
:::

## Checking for Remote Versions

When collaborating across a team, a teammate may save a new module or app version on Git that you haven't pulled yet. ToolJet shows you these remotely available versions directly in the version dropdown.

To check for remote versions:

1. Open the app or module builder.
2. Click the version dropdown in the toolbar.
3. Click the **Refresh** button.

ToolJet fetches the latest version list from Git. Versions that exist in Git but are not yet on your local instance appear **grayed out** in the list.

To pull a grayed-out version:

1. Hover over the grayed-out version.
2. Click **Pull**.

ToolJet brings that version into your instance along with its dependent modules and data sources.

## How Merges Land in ToolJet

When a pull request is merged in your Git provider, the changes don't appear automatically in ToolJet. You need to pull them in manually.

Merging a feature branch into main lands changes in the **active draft version** on the main branch. If there is no active draft, create one before pulling.

To pull merged changes into main:

1. Switch to the main branch.
2. Ensure there is an active draft version.
3. Click **Pull Commit** from the dashboard or from inside the relevant builder.

## Limitations

- Push is not available from the workspace dashboard. Each app, module, and the data source dashboard must be pushed individually.
- Rebase is not supported. You cannot pull changes from main into a feature branch. Attempting to import across branches will override the target state rather than merge.
- Workflows are not yet included in workspace-level branching.
- Bulk selection of apps for import is not supported yet. Apps must be imported one at a time.

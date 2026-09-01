---
id: enable-branching
title: Enable Branching
sidebar_label: Enable Branching
---

<PlanBadge type="enterprise" />

Git Sync starts in single-branch mode. Branching is enabled per workspace, and only after a repository connection exists.

## Prerequisites

- **Git Sync configured over HTTPS**, using either GitHub or GitLab. See the [Git Sync Guide](/docs/development-lifecycle/gitsync/overview) to set it up.
- An **Enterprise** plan. Git Sync itself is available on **Team**, but multiple branches require Enterprise. On a Team plan the Branching toggle stays disabled and the workspace runs in single-branch mode.
- The **Admin** or **Super admin** role to turn branching on. Once enabled, builders can create, switch, and manage branches; end users cannot.
- On self-hosted instances: a **Redis** connection, and at least one instance started with `WORKER=true`. Branch creation, pulls, and deletions run as background jobs on this worker. Without one, these actions are queued but never processed.

:::warning
Branching is supported only over Git HTTPS. SSH connections cannot use branching.
:::

## Enable Branching for a Workspace

1. Go to the **Workspace settings** page and open the **Configure git sync** tab.
2. Confirm a repository connection is configured and finalized. The toggle stays disabled until one exists.
3. Turn on the **Branching** toggle. The change saves immediately.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/enable-branching/branching-toggle-settings.png" alt="Branching toggle enabled on the Configure git sync page in Workspace settings" />

You can also open the branch dropdown in the header and select **Enable branching**, which takes you to the same page.

Once branching is enabled, the default branch becomes read-only and your team works on feature branches. See [Managing Branches](/docs/beta/branching/managing-branches) to create your first one.

## Disable Branching

Turn the **Branching** toggle off to return the workspace to single-branch mode. Applications, modules, and datasources can then be created and edited directly on the default branch again.

Existing feature branches are not deleted when branching is disabled, and the branch list shows only the default branch until branching is turned back on.

## License Behavior

If your license no longer covers multiple branches, the toggle is forced off and your workspace reverts to single-branch behavior, even if branching was previously enabled. Only the default branch remains reachable, and git operations are unavailable until the license is renewed or Git Sync is turned off.

The toggle also stays disabled, with an explanatory tooltip, when your plan does not include multiple branches, or when your plan has expired.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

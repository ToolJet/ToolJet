---
id: upgrade-to-v3.21
title: ToolJet 3.21 Migration Guide
slug: /setup/upgrade-to-v3.21/
---

ToolJet 3.21 is the new LTS release. It includes **breaking changes** to environments, GitSync, and the App Builder. This guide lists how each area behaved in the previous LTS, how it behaves in 3.21, and what to do after upgrading.

:::warning Before upgrading
- Back up both PostgreSQL databases, **PG_DB** and **TOOLJET_DB**. Refer to [Upgrading ToolJet to the LTS Version](./upgrade-to-lts.md#prerequisites).
- Upgrade a staging instance first and check your apps before upgrading production.
:::

## Platform Changes

### Environments for Modules, ToolJet Database, and Workflows

| Previous LTS | ToolJet 3.21 | Action required |
| :----------- | :----------- | :-------------- |
| Modules, ToolJet Database, and workflows did not have multiple environments. The single existing environment was used in all environments of an application. | The previous single environment is considered the production environment and is released. | None. Production apps work as before. To continue editing, create a new draft. |

### GitSync

<PlanBadge type="team" />

| Previous LTS | ToolJet 3.21 | Action required |
| :----------- | :----------- | :-------------- |
| GitSync could connect over SSH. | Git SSH is no longer supported. Create a GitHub or GitLab app to connect ToolJet. Support for Bitbucket and Azure is coming soon. | If you use GitHub or GitLab, reconnect GitSync by setting up the app. If you use any other provider, stay on the current LTS until support for your provider is available. |
| The Git repository was a directory structure of apps. | The repository is broken down to individual components and queries, so conflicts are raised only when the same element is edited. | Create a new, empty repository and sync all your apps to it again to continue using GitSync. |
| Multiple draft versions were allowed when GitSync was enabled. | Only one draft version is allowed when GitSync is enabled, because the draft is the tip of `main` and there can be only one tip. | Save all draft versions except one so that the app syncs to Git. |

For step-by-step instructions on connecting a new repository and syncing your applications again, refer to the [GitSync Migration Guide](./gitsync-migration.md).

Refer to [GitHub configuration](../../development-lifecycle/gitsync/connect-to-git-repo/github-config.md), [GitLab configuration](../../development-lifecycle/gitsync/connect-to-git-repo/gitlab-config.md), and [Version Control with Git](../../development-lifecycle/gitsync/versioning.md).

## App Builder Changes

### Mobile Auto Layout (High Severity)

Mobile auto layout has been reworked.

| Previous LTS | ToolJet 3.21 |
| :----------- | :----------- |
| Auto layout runs only in the App Builder's mobile view. Root-level components are moved up to fill gaps, keeping their desktop position and width, and the result is saved. The app renders the saved mobile layout as is. | Every component visible on mobile is stacked full width with 10 px gaps, including inside containers. Components hidden on mobile are left out. The app rebuilds this layout every time it renders auto layout pages, ignoring saved mobile layouts. Opening mobile view in the App Builder overwrites and saves the mobile layout. |

**Action required:**
1. Check every page that has auto layout turned on, on a phone or by adding `?layout=mobile` to the app URL. Auto layout is on by default for pages created since December 2023.
2. If the full-width stacking doesn't work for a page, turn off auto layout for that page in the App Builder's mobile view and arrange the components manually.

Your previous mobile arrangement isn't restored.

### RunJS `queries` Are Live and Read-Only (High Severity)

RunJS now gives you direct access to the values that queries expose.

| Previous LTS | ToolJet 3.21 |
| :----------- | :----------- |
| `queries` in RunJS is a copy taken when the script starts. Values stay stale after `await run()`, and you can assign to it or change it in place. | Fields in `queries` are read-only and always return the latest value, including after `await run()`. Assignments are silently ignored, and changing data in place, for example with `push`, `sort`, or `splice`, is likely to throw an error. Resetting or running a query also clears `error`, `metadata`, `request`, and `response`. |

**Action required:**
- Find RunJS code that assigns to `queries.<name>.*` or changes `queries.<name>.data` in place, and make a copy first:
  ```js
  const rows = [...queries.getUsers.data];
  ```
- If your code relies on the old value after `await queries.getUsers.run()`, store it in a variable before running the query:
  ```js
  const previousRows = queries.getUsers.data;
  await queries.getUsers.run();
  ```

### Modal `open()` Waits for the Modal (Low Severity)

The modal's `open()` now resolves after its children have mounted.

| Previous LTS | ToolJet 3.21 |
| :----------- | :----------- |
| `await components.modal1.open()` resolves immediately with `undefined`, before the modal's children mount. `components` in RunJS is a copy taken when the script starts. | `open()` resolves `true` after the modal finishes opening (up to 1 second), or `false` if the modal closes first. `components` in RunJS always returns the latest value. |

**Action required:**
- Remove workarounds such as a `setTimeout` after `await components.modal1.open()`. Scripts can pause for up to 1 second while the modal opens.
- If a script uses the value returned by `open()`, handle `true` (opened) and `false` (closed before it finished opening).

<br/>

---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

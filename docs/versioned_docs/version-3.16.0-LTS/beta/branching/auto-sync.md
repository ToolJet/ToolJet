---
id: auto-sync
title: Auto-Sync from Repository
sidebar_label: Auto-Sync from Repository
---

Auto-sync keeps ToolJet up to date with your Git repository automatically. Instead of clicking **Pull** after every merge, you register a webhook in your Git provider and ToolJet applies the changes as they happen.

This is especially useful when you run more than one ToolJet instance against the same repository, because a single event updates every connected instance.

## Prerequisites

- Git Sync configured for the workspace, using GitHub or GitLab.
- A paid plan. Auto-sync is unavailable on the basic plan and while a licence is expired.
- Permission to add a webhook to the Git repository.
- `TOOLJET_HOST` set to a URL your Git provider can reach. The webhook URL is derived from it, so an unreachable or incorrect value means events never arrive.

## Events

| Event | Triggers when | Available in |
|:------|:--------------|:-------------|
| **Push** | A version tag is pushed to Git, which happens when you save a version. Syncs that saved version to all connected instances. | Single-branch and multi-branch |
| **Pull request** | A pull request is merged in Git. Pulls the merged changes into all connected instances. | Multi-branch only |
| **Branch delete** | A branch is deleted in Git. Removes it from all connected instances. | Multi-branch only |

:::info
Ordinary commits to a branch do not trigger a sync. Only version tags and merged pull requests do. This keeps in-progress work on a feature branch from being pulled into other instances before it is reviewed.
:::

In single-branch mode, only **Push** is offered, because pull requests and branch deletions are branch operations that do not apply.

## Set Up Auto-Sync

1. Go to the **Workspace settings** page and open the **Configure git sync** tab.
2. Turn on **Auto-sync from repository**. The webhook setup panel opens.
3. Copy the **Payload URL**.
4. Copy the **Secret**. It is shown only once during first-time setup, so save it before closing the panel.
5. Select the events to subscribe to.
6. In your Git repository, create a webhook using the copied URL and secret, and set the content type to `application/json`. Select the same events you chose in ToolJet.
7. Save the configuration in ToolJet.

The payload URL follows this form:

```text
<TOOLJET_HOST>/api/v2/git-sync/webhooks/<provider>/<workspace-id>
```

`<provider>` is `github` or `gitlab`.

:::warning
Events are rejected if the signature does not match the secret. If you regenerate the secret in ToolJet, update the webhook in your Git provider to match, otherwise auto-sync stops silently.
:::

## Change Subscribed Events

1. Go to **Workspace settings > Configure git sync**.
2. Click **Edit webhook** next to the auto-sync event tags.
3. Adjust the selected events and save.

At least one event must remain selected. Closing the panel with unsaved changes prompts you to discard them.

## Review Recent Events

The webhook panel has a **Recent events** tab listing the deliveries ToolJet has received, along with whether each was applied, skipped, or failed. Use it to confirm the webhook is wired up correctly, and to see why an event did not result in a sync.

An event is reported as skipped when it is not actionable, for example a pull request that was opened rather than merged, a branch push, or a change that originated from this instance.

:::info
ToolJet ignores events caused by its own actions, so committing from one instance does not cause that same instance to sync the change back onto itself.
:::

## Delete the Webhook

1. Go to **Workspace settings > Configure git sync**.
2. Click **Edit webhook**, then **Delete webhook**.

Deleting disables auto-sync and invalidates the current secret. Enabling it again requires configuring a new webhook. Remove or update the webhook in your Git repository as well, otherwise it keeps sending deliveries that ToolJet rejects.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

---
id: auto-sync
title: Auto-Sync from Repository
sidebar_label: Auto-Sync from Repository
---

<PlanBadge type="team" />

Auto-sync keeps ToolJet up to date with your Git repository automatically. Instead of clicking **Pull** after every merge, you register a webhook in your Git provider and ToolJet applies the changes as they happen.

This is especially useful when you run more than one ToolJet instance against the same repository, because a single event updates every connected instance.

## Prerequisites

- Git Sync configured for the workspace, using GitHub or GitLab.
- A **Team** plan or higher. Auto-sync does not require Enterprise, so it is available in single-branch mode as well. It is unavailable while a licence is expired.
- The **Admin** or **Super admin** role. Builders and end users cannot configure auto-sync.
- Permission to add a webhook to the Git repository.
- `TOOLJET_HOST` set to a URL your Git provider can reach. The webhook URL is derived from it, so an unreachable or incorrect value means events never arrive.

## Events

Three events are available. Each one has to be subscribed to in two places: in ToolJet, and in the webhook you create in your Git provider. The provider decides what gets delivered, so an event ticked in ToolJet but not in the provider never arrives.

| ToolJet event | Subscribe in GitHub | Subscribe in GitLab | Triggers when |
|:--------------|:--------------------|:--------------------|:--------------|
| **Push** | Pushes | Tag push events | A version tag is pushed to Git, which happens when you save a version. Syncs that saved version to all connected instances. |
| **Pull request** | Pull requests | Merge request events | A pull request is merged in Git. Pulls the merged changes into all connected instances. |
| **Branch delete** | Branch or tag deletion | Not supported | A branch is deleted in Git. Removes it from all connected instances. |

:::info
Ordinary commits to a branch do not trigger a sync. Only version tags and merged pull requests do. This keeps in-progress work on a feature branch from being pulled into other instances before it is reviewed.
:::

In single-branch mode, only **Push** is offered, because pull requests and branch deletions are branch operations that do not apply.

:::warning
GitLab has no branch-deletion event that ToolJet recognises, so a branch deleted in a GitLab repository is not removed from connected instances automatically. Delete it in each instance instead.
:::

## Set Up Auto-Sync

1. Go to the **Workspace settings** page and open the **Configure git sync** tab.
2. Turn on **Auto-sync from repository**. The webhook setup panel opens.

   <img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/auto-sync/auto-sync-webhook-drawer.png" alt="Webhook setup panel showing the payload URL, masked secret, the three subscribable events, and a reminder to set the content type to application/json in GitHub" />

3. Copy the **Payload URL**.
4. Copy the **Secret**. It is shown only once during first-time setup, so save it before closing the panel.
5. Select the events to subscribe to.
6. In your Git repository, create a webhook using the copied URL and secret, and set the content type to `application/json`. Choose the option to select individual events and tick the ones listed in the table above. The default of delivering only push events will not send merges or branch deletions.

   <img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/auto-sync/github-webhook-config.png" alt="GitHub Add webhook form with the payload URL, application/json content type, secret, and individual event selection" />

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

If nothing appears in the list at all, the event never reached ToolJet. Check the delivery log in your Git provider to confirm it was sent and what response it received.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/auto-sync/github-recent-deliveries.png" alt="Recent Deliveries tab of a GitHub webhook, listing delivered push, pull request and delete events" />


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

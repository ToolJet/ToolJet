---
id: personal-workspace
title: Personal Workspaces
---

Personal workspaces give each user a private environment within an instance. Ideal for onboarding, learning ToolJet, or safely prototyping internal tools, they let users build and test without impacting shared workspaces.

Personal Workspaces are an **instance-level** setting that can be toggled on or off by the **super admin** of a ToolJet instance. When enabled, a separate personal workspace is automatically created for each user upon signing up. This includes all sign-up methods configured at the instance level.

### How to Enable or Disable Personal Workspaces

Role Required: **Super Admin**

To manage the personal workspace setting, follow the steps:

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Settings > Manage instance settings**.
(Example URL - `https://app.corp.com/instance-settings/manage-instance-settings`)
4. Locate the **Allow Personal Workspaces** toggle.
5. Enable or disable the feature based on your preference.
6. Save the changes.

<img className="screenshot-full img-full" src="/img/user-management/onboard-user/self-signup/personal-ws.png" alt="Workspace Level Permissions" />

### Behavior Based on Setting

| Setting      | Effect on User Signup |
|--------------|------------------------|
| **Enabled**  | A personal workspace is automatically created for every new user upon signup using any [instance-level login](/docs/user-management/authentication/self-hosted/instance-login) method. |
| **Disabled** | Instance-level self-signup is not allowed in this mode. However, super-admins can enable self-signup at the workspace level, allowing users to sign up directly into specific workspaces. |

:::note
- Personal workspace dependency will be deprecated in the upcoming LTS for instance level sign up.
:::


By managing this feature appropriately, super admins can configure the user experience to suit their organization.
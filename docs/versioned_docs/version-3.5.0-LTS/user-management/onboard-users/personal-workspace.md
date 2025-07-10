---
id: personal-workspace
title: Personal Workspace
---


The personal workspaces feature, designed to give every user their own dedicated workspace environment within an instance and is managed by the super admin of the instance. This feature is particularly useful in environments where users need a private space to build, test, or experiment without affecting shared workspaces.

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
| **Enabled**  | A personal workspace is automatically created for every new user upon signup using any instance-level login method (e.g., email/password, SSO). Note that, to use the instance-level [self-signup](/docs/user-management/onboard-users/self-signup-user) feature, personal workspaces must be enabled.* |
| **Disabled** | No personal workspace is created for users signing up or logging in via instance-level login methods. Access to workspaces must be managed manually by the admin. |


By managing this feature appropriately, super admins can configure the user experience to suit their organization.
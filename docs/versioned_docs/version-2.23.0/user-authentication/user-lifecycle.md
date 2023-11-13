---
id: user-lifecycle
title: User Lifecycle
---

# User Lifecycle

:::info
Check Workspace docs [here](/docs/tutorial/workspace_overview).
:::

### User onboarding

  - User can sign up using the sign up link provided on the login page, user will receive a welcome email with activation link. New workspace will be created for the user.

    <div style={{textAlign: 'center'}}>

    ![ToolJet - Workspace sign up](/img/user-lifecycle/signup-mw.png)

    </div>

  - Users can be added to multiple workspaces. Users can create their own workspaces and manage them.

    <div style={{textAlign: 'center'}}>

    ![ToolJet - Workspace sign up](/img/user-lifecycle/user-mw.png)

    </div>

  - Existing user in active state for a workspace can be invited and on boarded to other workspaces, User will receive an invitation email with join link. If a user does not exist in the system, then they will receive a welcome email to setup the account, user can follow the link and on setup the account, once its done the user will be assigned to the new workspace created for the user.

    <div style={{textAlign: 'center'}}>

    ![ToolJet - Workspace sign up](/img/user-lifecycle/invite-link-mw.png)

    </div>

  - Invited user can onboard through SSO login,  without using an invitation link from the workspace [login page](/docs/user-authentication/general-settings#login-url)

    <div style={{textAlign: 'center'}}>

    ![ToolJet - Workspace accept invite](/img/user-lifecycle/sso-onboard-sw.png)

    </div>

  - If `enable sign up` option in enabled in SSO [general settings](/docs/user-authentication/general-settings#enable-signup) for the workspace, user can setup account through SSO login without an invite from the workspace [login page](/docs/user-authentication/general-settings#login-url)

    <div style={{textAlign: 'center'}}>

    ![ToolJet - Workspace sign up using SSO](/img/user-lifecycle/sso-enable-signup-sw.png)

    </div>

### Archive user
  - User can be archived by workspace admin from using `Manage User` page

    <div style={{textAlign: 'center'}}>

    ![ToolJet -Workspace Archive user](/img/user-lifecycle/archive-user.png)

    </div>

### Unarchive user
  - User can be unarchive by workspace admin from using `Manage User` page

    <div style={{textAlign: 'center'}}>

    ![ToolJet - Single-Workspace Unarchive user](/img/user-lifecycle/unarchive-user-mw.png)

    </div>

  :::info
  Archive or unarchive will not affect user login, user can login and use other workspaces where user is in active state.
  :::

### Switch between workspaces

  <div style={{textAlign: 'center'}}>

  ![ToolJet - Workspace sign up using SSO](/img/user-lifecycle/switch.png)

  </div>


## User status

| Status   | Able to log in   | How to activate                      |
| -------- | ---------------- | ------------------------------------ |
| active   | Yes              |                                      |
| invited  | No (Yes with SSO)| Login through SSO or invitation link |
| archived | No               | Not able to activate. Invite from `Manage Users` page, status will be changed to invited |

## Workspace SSO flow
  - Diagram shows how SSO configurations are chosen in common login page and workspace login page. Instance level SSO is configured in environment variables and Workspace level SSO is configured in respective `Manage SSO` page.

  <div style={{textAlign: 'center'}}>

  ![ToolJet - SSO Flow](/img/user-lifecycle/sso-flow.png)

  </div>

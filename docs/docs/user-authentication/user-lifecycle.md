---
id: user-lifecycle
title: User Lifecycle
---

# User Lifecycle

## Single-Workspace

If no users present in the system, there will be `sign up` option in the login page. User can sign up by entering their email id. Tooljet will be sending a welcome mail with activation URL to the mail id. User can follow the link and onboard to Tooljet.

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace sign up](/img/user-lifecycle/single-ws-signup.png)

</div>

User with admin privilege can invite members

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace invite user](/img/user-lifecycle/user-invite-sw.png)

</div>

Invited user will receive welcome email with activation URL, unregistered user can follow the link and setup Tooljet account

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace accept invite](/img/user-lifecycle/accept-invite-sw.png)

</div>

Invited user can onboard through SSO login, without using an invitation link

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace accept invite](/img/user-lifecycle/sso-onboard-sw.png)

</div>

If `enable signup` option in enabled in SSO general settings, user can setup account through SSO login without an invite

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace sign up using SSO](/img/user-lifecycle/sso-enable-signup-sw.png)

</div>

## Multi-Workspace
User can sign up using sign up link provided in the login page, user will receive a welcome email with activation link. New workspace will be created for the user.

<div style={{textAlign: 'center'}}>

![ToolJet - Multi-Workspace sign up](/img/user-lifecycle/signup-mw.png)

</div>

Users can be added to different workspaces. Users can create their own workspaces and manage

<div style={{textAlign: 'center'}}>

![ToolJet - Multi-Workspace sign up](/img/user-lifecycle/user-mw.png)

</div>

Existing user in active state for a workspace can be invited and on boarded to other workspaces, User will receive an invitation mail with join link. If user not exist in the system, user will receive welcome mail to setup account. It is mandatory to setup account before following the invitation link

<div style={{textAlign: 'center'}}>

![ToolJet - Multi-Workspace sign up](/img/user-lifecycle/invite-link-mw.png)

</div>

Invited user can onboard through SSO login,  without using an invitation link from the workspace [login page](https://docs.tooljet.com/docs/user-authentication/general-settings#login-url)

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace accept invite](/img/user-lifecycle/sso-onboard-sw.png)

</div>

If `enable sign up` option in enabled in SSO [general settings](https://docs.tooljet.com/docs/user-authentication/general-settings#enable-signup) for the workspace, user can setup account through SSO login without an invite from the workspace [login page](https://docs.tooljet.com/docs/user-authentication/general-settings#login-url)

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace sign up using SSO](/img/user-lifecycle/sso-enable-signup-sw.png)

</div>

### Switch between workspaces

<div style={{textAlign: 'center'}}>

![ToolJet - Single-Workspace sign up using SSO](/img/user-lifecycle/switch.png)

</div>


## User status
| Status   | Able to log in   | How to activate                      |
| -------- | ---------------- | ------------------------------------ |
| active   | Yes              |                                      |
| invited  | No (Yes with SSO)| Login through SSO or invitation link |
| archived | No               | Not able to activate. Invite from `Manage Users` page, status will be changed to invited     |
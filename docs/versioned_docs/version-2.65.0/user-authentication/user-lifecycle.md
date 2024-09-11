---
id: user-lifecycle
title: User Lifecycle
---

# User Lifecycle

:::info
Check Workspace docs [here](/docs/tutorial/workspace_overview).
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### User Onboarding

  - User can sign up using the sign up link provided on the login page, user will receive a welcome email with activation link. New workspace will be created for the user.

    <div style={{textAlign: 'center'}}>

      <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/signup-mw.png" alt="ToolJet - Workspace sign up" />

    </div>

  - Users can be added to multiple workspaces. Users can create their own workspaces and manage them.

    <div style={{textAlign: 'center'}}>

    <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/user-mw.png" alt="ToolJet - Workspace sign up" />

    </div>

  - Existing user in active state for a workspace can be invited and on boarded to other workspaces, User will receive an invitation email with join link. If a user does not exist in the system, then they will receive a welcome email to setup the account, user can follow the link and on setup the account, once its done the user will be assigned to the new workspace created for the user.

    <div style={{textAlign: 'center'}}>

    <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/invite-link-mw.png" alt="ToolJet - Workspace sign up" />

    </div>

  - Invited user can onboard through SSO login,  without using an invitation link from the workspace [login page](/docs/user-authentication/general-settings#login-url)

    <div style={{textAlign: 'center'}}>

    <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/sso-onboard-sw.png" alt="ToolJet - Workspace accept invite" />

    </div>

  - If `enable sign up` option in enabled in SSO [general settings](/docs/user-authentication/general-settings#enable-signup) for the workspace, user can setup account through SSO login without an invite from the workspace [login page](/docs/user-authentication/general-settings#login-url)

    <div style={{textAlign: 'center'}}>

    <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/sso-enable-signup-sw.png" alt="ToolJet - Workspace sign up using SSO" />

    </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Archive User
  - User can be archived by workspace admin from using `Manage User` page

    <div style={{textAlign: 'center'}}>

    <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/archive-user.png" alt="ToolJet -Workspace Archive user" />

    </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Unarchive User
  - User can be unarchive by workspace admin from using `Manage User` page

    <div style={{textAlign: 'center'}}>

    <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/unarchive-user-mw.png" alt="ToolJet - Single-Workspace Unarchive user" />

    </div>

  :::info
  Archive or unarchive will not affect user login, user can login and use other workspaces where user is in active state.
  :::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Switch Between Workspaces

  <div style={{textAlign: 'center'}}>

  <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-lifecycle/switch.png" alt="ToolJet - Workspace sign up using SSO" />

  </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>


## User Status

| <div style={{ width:"100px"}}> Status </div>  |  <div style={{ width:"100px"}}> Able to log in </div>  |  <div style={{ width:"100px"}}> How to activate   </div>                   |
| -------- | ---------------- | ------------------------------------ |
| active   | Yes              |                                      |
| invited  | No (Yes with SSO)| Login through SSO or invitation link |
| archived | No               | Not able to activate. Invite from `Manage Users` page, status will be changed to invited |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Workspace SSO Flow
  - Diagram shows how SSO configurations are chosen in common login page and workspace login page. Instance level SSO is configured in environment variables and Workspace level SSO is configured in respective `Manage SSO` page.

  <div style={{textAlign: 'center'}}>

  ![ToolJet - SSO Flow](/img/user-lifecycle/sso-flow.png)

  </div>

</div>

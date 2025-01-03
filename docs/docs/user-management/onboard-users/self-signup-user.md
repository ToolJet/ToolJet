---
id: self-signup-user
title: Self Sign-Up User
---

In ToolJet, the self sign-up feature lets admins enable direct user registration via a sign-up URL, eliminating the need for invitations. For Self-Hosted version the enable sign-up can be done at both instance level and workspace level. 

## Enable Self Sign-Up on Self-Hosted ToolJet

### Instance Level

Role Required: **Super Admin** <br/>

Super admin can enable self sign-up at instance level and whenever a user joins an instance using the self sign-up, a new personal workspace is created for that user and the workspace admin role will be assigned to the user.

### Workspace Level

Role Required: **Workspace Admin** <br/>

Workspace admin can enable self sign-up at workspace level and whenever a user joins a workspace using the self sign-up the end user role will be assigned to the user.

Role Required: **Workspace Admin** <br/>
Follow these steps to enable self sign-up:
1. Go to **Workspace settings > Workspace login**
2. Enter allowed domains that can access the workspace, you can enter multiple domain names separated by comma.
If you don't enter allowed domain then anyone with the login URL can sign-up to the workspace.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/allowed-domain.png" alt="Workspace Level Permissions" />

3. Click on the toggle button for the enable signup, by default enable signup is disabled.
4. Copy the Login URL and share it with the users.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/login-url.png" alt="Workspace Level Permissions" />

Now users will be able to see a sign-up option on the login page.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/login-page.png" alt="Workspace Level Permissions" />

And user can signup from there

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/signup-page.png" alt="Workspace Level Permissions" />


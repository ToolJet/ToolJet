---
id: self-signup-user
title: Sign-Up User
---

In ToolJet, the sign-up feature lets admins enable direct user registration via a sign-up URL, eliminating the need for invitations. For Self-Hosted version, the enable sign-up can be done at both instance level and workspace level. 

## Enable Sign-Up at Instance Level

Role Required: **Super Admin** <br/>

Super admin can enable sign-up at instance level, and whenever a user joins an instance using the self sign-up, a new personal workspace is created for that user and the workspace admin role will be assigned to the user.

Follow the steps to enable sign-up at instance level:

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Settings > Manage instance settings**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/manage-instance-settings`)

3. Ensure that you have allowed personal workspace.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/personal-ws.png" alt="Workspace Level Permissions" />

4. Now, go to **Instance login** tab. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/instance-login`)

5. Enter allowed domains that can access the workspace, you can enter multiple domain names separated by comma. <br/>
If you don't enter allowed domain then anyone with the login URL can sign-up to the workspace.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/sh-allowed-domain.png" alt="Workspace Level Permissions" />

6. Click on the toggle button for the enable signup, by default enable signup is disabled.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/sh-enable-signup.png" alt="Workspace Level Permissions" />

7. Click on the **Save changes** button at the bottom of the page.

Now, the users can signup on the ToolJet deployment URL. <br/>
(Example URL: `https://app.corp.com/signup`)

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/instance-signup.png" alt="Workspace Level Permissions" />

## Enable Sign-Up at Workspace Level

Role Required: **Admin** <br/>

Admin can enable sign-up at workspace level and whenever a user joins a workspace using the self sign-up the end user role will be assigned to the user.

Follow the steps to enable sign-up at workspace level:

1. Go to **Workspace settings > Workspace login**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

2. Enter allowed domains that can access the workspace, you can enter multiple domain names separated by comma. <br/>
If you don't enter allowed domain then anyone with the login URL can sign-up to the workspace.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/allowed-domain.png" alt="Workspace Level Permissions" />

3. Click on the toggle button for the enable signup, by default enable signup is disabled.

4. Click on the **Save changes** button at the bottom of the page.

5. Copy the Login URL and share it with the users.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/login-url.png" alt="Workspace Level Permissions" />

Now users will be able to see a sign-up option on the login page. <br/>
(Example URL: `https://app.corp.com/login/nexus`)

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/login-page.png" alt="Workspace Level Permissions" />

Users can navigate to the sign-up page from there and register themselves.

<img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/signup-page.png" alt="Workspace Level Permissions" />


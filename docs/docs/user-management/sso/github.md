---
id: github
title: GitHub
---

GitHub SSO in ToolJet enables seamless authentication, allowing users to log in with their GitHub credentials. This integration simplifies team access management, enhances security, and streamlines workflows for developers and collaborators.

## Configure GitHub SSO

To enable GitHub Single Sign-on (SSO) for your ToolJet, follow these steps:

Role Required: <br/>
&nbsp;&nbsp;&nbsp;&nbsp; For Instance Level: **Super Admin** <br/>
&nbsp;&nbsp;&nbsp;&nbsp; For Workspace Level: **Admin**

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. For Instance Level: <br/>
Go to **Settings > Instance login**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/instance-login`)

    For Workspace Level: <br/>
    Go to **Workspace Settings > Workspace login**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

3. On the right, you'll see toggles to enable SSO via different clients. All the client toggles are disabled by default. Turn on the toggle in front of GitHub.
    <img className="screenshot-full" src="/img/user-management/sso/github/sso-menu.png" alt="Add user button" />

4. After turning it on, a modal will appear with input fields for parameters such as Host name, Client ID, and Client secret. At the top left of the modal, there is a toggle to enable this modal. Turn it on, and then, without entering any parameters, click on the Save changes button. This will generate a Redirect URL that you will need to utilize in the GitHub Developer settings.
    <img className="screenshot-full" src="/img/user-management/sso/github/github-modal.png" alt="Add user button" />

5. Go to **[GitHub Developer Settings](https://github.com/settings/developers)** and navigate to **OAuth Apps** and create a new OAuth App.
    <img className="screenshot-full" src="/img/user-management/sso/github/oauth-app.png" alt="Add user button" />

6. Enter the **App Name**, **Homepage URL**, and **Authorization callback URL**. The Authorization callback URL should be the generated **Redirect URL** in the ToolJet GitHub manage SSO page. Click on the Register application button to create the OAuth App.
    <img className="screenshot-full" src="/img/user-management/sso/github/oauth-config.png" alt="Add user button" />

7. The **Client ID** will be generated automatically. Generate the **Client Secret** by clicking the **Generate a new client secret** button.
    <img className="screenshot-full" src="/img/user-management/sso/github/github-clientid.png" alt="Add user button" />

8. Open the ToolJet's GitHub SSO settings and enter the obtained **Client ID** and **Client Secret**.
    <img className="screenshot-full" src="/img/user-management/sso/github/config-github.png" alt="Add user button" />

9. If you are using GitHub Enterprise self-hosted, enter the Host Name. The host name should be a URL and should not end with `/`, for example, `https://github.tooljet.com`. If it is not self-hosted, you can skip this field.

10. Finally, click on the **Save changes** button and the GitHub sign-in button will now be available in your ToolJet login screen.

11. Obtain the Login URL from the Instance/Workspace login page.

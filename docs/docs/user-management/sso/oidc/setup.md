---
id: setup
title: OpenID Connect Setup
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

OpenID Connect (OIDC) is an authentication protocol that helps applications verify users' identities using an identity provider. By configuring OIDC with identity providers like **[Azure AD](#)**, **[Google](#)** or **[Okta](#)**, you can set up easy and safe authentication for your users in ToolJet. 

## Configuring OIDC

Follow these steps to enable OIDC in your system:

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

3. On the right, you'll see toggles to enable SSO via different clients. All the client toggles are disabled by default. Turn on the toggle in front of OpenID Connect.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/sso-menu.png" alt="Add user button" />

4. After turning it on, a modal will appear with input fields for parameters such as Name, Client ID, Client secret and Well known URL. At the top left of the modal, there is a toggle to enable this modal. Turn it on, and then, without entering any parameters, click on the Save changes button. This will generate a Redirect URL, which you will need to obtain the credentials from the Identity Provider.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/oidc/config.png" alt="Add user button" />

5. Find and set **Client Id**, **Client Secret**, and **Well Known URL** from your identity provider and click on **Save changes** at the bottom of the modal.

Upon saving, OIDC SSO will be successfully enabled using your configured Identity Provider, allowing your users to seamlessly authenticate via OpenID Connect for enhanced security and ease of use.
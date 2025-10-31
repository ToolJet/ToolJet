---
id: setup
title: OpenID Connect Setup
---

<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

OpenID Connect (OIDC) is an authentication protocol that helps applications verify users' identities using an identity provider. By configuring OIDC with identity providers like **[Azure AD](/docs/user-management/sso/oidc/azuread)**, **[Google](/docs/user-management/sso/oidc/google)** or **[Okta](/docs/user-management/sso/oidc/okta)**, you can set up easy and safe authentication for your users in ToolJet. 

## Grant Type

#### Authorization Code

Choose this when configuring SSO for server-side applications where you can securely store the Client Secret. This is ideal for enterprise setups where ToolJet can safely handle the secret and communicate with your identity provider.

#### Authorization Code with PKCE

Choose this when configuring SSO for public clients like apps running in the browser, mobile apps, or environments where storing a Client Secret securely is not possible. PKCE ensures secure authentication without exposing secrets.

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
    <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/sso-menu.png" alt="Add user button" />

4. After turning it on, a modal will appear with input fields for parameters such as Name, Client ID, and Well known URL. At the top left of the modal, there is a toggle to enable this modal. Turn it on, and then, without entering any parameters, click on the Save changes button. This will generate a Redirect URL, which you will need to obtain the credentials from the Identity Provider.
    <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/config-v2.png" alt="Add user button" />

5. Open the modal again and choose the Grant type. ToolJet supports Authorization Code, which requires a Client ID and Client Secret, and Authorization Code with PKCE, which does not require a Client Secret.

6. After selecting the grant type, provide the Client ID, Client Secret / Code Verifier, and Well-Known URL from your identity provider. Once done, click Save changes at the bottom of the modal.

Upon saving, OIDC SSO will be successfully enabled using your configured Identity Provider, allowing your users to seamlessly authenticate via OpenID Connect for enhanced security and ease of use.
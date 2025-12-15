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

:::info Configuring OIDC with non email identifier
ToolJet also allows you to setup OIDC using non email identifier (for example, an employee ID). To learn more, refer to [this section](/docs/user-management/sso/oidc/setup#configuring-tooljet-oidc-with-non-email-identifier).
:::


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

## Configuring ToolJet OIDC with Non Email Identifier
If you want to authenticate users using a non-email identifier, ToolJet supports this. Under the hood, ToolJet generates a dummy email address for the user, which appears in the Profile settings. User can continue signing in with their non-email identifier without any issues.  
For example, you can allow your team to access your ToolJet instance using their employee ID instead of an email address.

To enable this behavior, set the following environment variables:

- `AUTH_ENABLE_NON_EMAIL_IDENTIFIER=<your_unique_identifier>`

- `AUTH_NON_EMAIL_IDENTIFIER_FIELD=<example.com>`

#### Environment Variables Explained

- `AUTH_ENABLE_NON_EMAIL_IDENTIFIER`  
  This should be set to the name of the unique identifier field returned to ToolJet by your Identity Provider (IdP), such as employee_id, national_id, etc.

- `AUTH_NON_EMAIL_IDENTIFIER_FIELD`  
  This should be set to a domain name. ToolJet uses this domain to generate dummy email addresses for users. For example, if the unique id of a user is *1234* and the **AUTH_NON_EMAIL_IDENTIFIER_FIELD** is set to *tooljet.com*, the dummy email id created will be *1234@tooljet.com*.

**Example: Signing In With Keycloak**  
For this example, we have setup an IdP server using keycloak and setup a ToolJet instance with the following environment variables:

- `AUTH_ENABLE_NON_EMAIL_IDENTIFIER: employee_id`  
- `AUTH_NON_EMAIL_IDENTIFIER_FIELD: organisation.com`

With this setup, employee_id is used as the login identifier for ToolJet. This is named as Employee ID in Keycloak.

- We created a user in our Keycloak server with the following credentials:
  <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/uniqueID/keycloakUser.png" alt="Keycloak User Credentials" />

- We login to our ToolJet instance using Keycloak.
  <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/uniqueID/signInWithKeycloak.png" alt="Sign In with Keycloak" />

- We enter the employee_id instead of email and we are able to login.
  <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/uniqueID/keycloakLogin.png" alt="Sign In with Keycloak" />

- We can see the dummy email in Profile settings.
  <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/uniqueID/userProfile.png" alt="Sign In with Keycloak" />

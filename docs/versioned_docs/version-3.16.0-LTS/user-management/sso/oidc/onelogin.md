---
id: onelogin
title: OneLogin
---

OneLogin can be configured as an identity provider (IdP) using OpenID Connect (OIDC), an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the OneLogin Console. Refer to the **[OIDC Setup](/docs/user-management/sso/oidc/setup)** guide to configure OIDC in your application.

## Generating Client ID and Client Secret on OneLogin Admin Portal

1. Log in to [OneLogin](https://www.onelogin.com/). You'll need a domain for your organisation. You can get one by signing up for a **Free trial** on the home page.

2. Go to the Administration page, then navigate to **Applications > Applications > Add App**.
    <img className="screenshot-full border-none" src="/img/user-management/sso/oidc/onelogin/add_application.png" alt="OneLogin: Add Application"/>

3. In the Find Applications page, search for OpenID Connect (OIDC) and Select OpenId Connect (OIDC).
    <img className="screenshot-full border-none" src="/img/user-management/sso/oidc/onelogin/find_application.png" alt="OneLogin: Find Application"/>

4. Enter the Display Name and keep the default configuration and click on **Save**.

5. You'll need to create your user and add it to the OneLogin application that you just created. In the Naviagtion bar,  go to Users > New User and create a user. After creating the user, open the user profile, go to Applications, and click the + icon to assign the user to the application you just created.
    <img className="screenshot-full border-none" src="/img/user-management/sso/oidc/onelogin/assign_application_1.png" alt="OneLogin: Assign Application to User"/>

6. Select the application you just created and click **Continue**. The user will be added to the application.

At this point, the OneLogin application is ready. Next, you’ll collect the OIDC credentials required to configure ToolJet.

7. Now go to your application > **SSO** and get the Client ID. To get the Client secret, click on **Show client secret**. To get the Well-known configuration URL, click **Well-known Configuration** and copy the URL.
    <img className="screenshot-full border-none" src="/img/user-management/sso/oidc/onelogin/onelogin_configuration.png" alt="OneLogin: Configuration"/>

8. Go to ToolJet > Workspace settings > Workspace login > OpenID Connect > Add provider.

9. Enter the details from step 7 and click Save changes. Then, copy the Redirect URL shown by ToolJet.

10. Go to your OneLogin Application > Configuration > Paste the Redirect URL into the Redirect URIs section and click **Save**.
    <img className="screenshot-full border-none" src="/img/user-management/sso/oidc/onelogin/redirect_url.png" alt="OneLogin: Redirect URL"/>


---
id: tooljet-domain-change
title: ToolJet Domain Change 
---

We're updating our domain from `tooljet.ai` to `tooljet.com`.

## What This Means For You

If your organization uses **Single Sign-On (SSO)** to access ToolJet, you’ll need to update your SSO redirect URLs to continue signing in after the domain change.

- This change is **only applicable to ToolJet Cloud** users.
- If you do **not** update your SSO configuration, **SSO login will stop working** after the domain change.

## How to Fix it

You’ll need to regenerate and update the redirect URL for **each SSO provider** you have configured.

### Steps

1. Log in to ToolJet at **`https://app.tooljet.ai`**.
2. Go to: **Workspace settings → Workspace login**.
3. Under SSO providers (Google, OIDC, SAML, etc.):
   - Click on each configured provider.
   - Copy the new redirect URL 
4. Go to your SSO provider’s admin console (e.g., Google, Okta, Azure AD).
5. Update the redirect/callback URL with the new **`tooljet.com`** URL.
6. Save the changes.
7. Test SSO login to ensure everything is working correctly.

For provider-specific configuration details, refer to your usual **[SSO](/docs/user-management/sso/overview)** setup guides.

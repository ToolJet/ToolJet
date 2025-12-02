---
id: tooljet-domain-change
title: ToolJet Domain Change 
---

We're updating our domain from `tooljet.ai` to `tooljet.com`.

## When is This Happening?

The change will take place at the following times:

- **ET (Eastern Time):** Sunday, November 23, 2025 – 11:00 PM  
- **PT (Pacific Time):** Sunday, November 23, 2025 – 8:00 PM  
- **GMT (Greenwich Mean Time):** Monday, November 24, 2025 – 4:00 AM  
- **IST (Indian Standard Time):** Monday, November 24, 2025 – 9:30 AM  

## What This Means For You

If your organization uses **Single Sign-On (SSO)** to access ToolJet, you’ll need to update your SSO redirect URLs to continue signing in after the domain change.

- This change is **only applicable to ToolJet Cloud** users.
- If you do **not** update your SSO configuration, **SSO login will stop working** after the domain change.

## How to Fix it

You’ll need to regenerate and update the redirect URL for **each SSO provider** you have configured.

### Steps

1. Log in to ToolJet at **`https://app.tooljet.com`**.
2. Go to: **Workspace settings → Workspace login**.
3. Under SSO providers (Google, OIDC, SAML, etc.):
   - Click on each configured provider.
   - Copy the new redirect URL (it will now contain `tooljet.com` instead of `tooljet.ai`).
4. Go to your SSO provider’s admin console (e.g., Google, Okta, Azure AD).
5. Update the redirect/callback URL with the new **`tooljet.com`** URL.
6. Save the changes.
7. Test SSO login to ensure everything is working correctly.

For provider-specific configuration details, refer to your usual **[SSO](/docs/user-management/sso/overview)** setup guides.

## When to Update

To ensure uninterrupted access for your team, **please complete this update by Sunday, November 23, 2025, at 8:00 PM** (aligned with your relevant timezone in the schedule above).

If the redirect URLs are not updated before the domain change window, users relying on SSO will not be able to sign in until the configuration is updated.

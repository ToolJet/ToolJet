---
id: super-admin-login
title: Super Admin Login
---

Super Admin Login is a dedicated login page for self-hosted instances that always works for existing Super Admins, no matter how login or licensing is configured on the instance. Use it whenever the regular login page won't let you in - for example, if password login is disabled and your license has expired, taking SSO down with it.

## Accessing Super Admin Login

Go to the following URL:

```
https://<your-domain>/login/super-admin
```

Enter the email and password of a Super Admin account. A few things to note about this page:

- It only accepts **email and password**. SSO providers (OIDC, SAML, Google, GitHub) aren't available here.
- It only works for accounts with the **Super Admin** role. Any other account is denied.

## Recovering Access If You Don't Remember Your Password

### SMTP Was Configured

If SMTP is set up on your instance, use the standard **Forgot Password** flow:

1. On the login page, click **Forgot Password**.
2. Enter the Super Admin's registered email address and click **Send a reset link**.
3. Check the inbox for that email address and click the reset link to set a new password.

See [Forgot Password](/docs/user-management/profile-management/reset-password#forgot-password) for the detailed steps. This works even if you're the only Super Admin on the instance, since it doesn't depend on another admin account.

### SMTP Was Not Configured

Without SMTP, no reset email can be sent, and **if you're the only Super Admin, or none of the Super Admins remember their password**, run the following command on the ToolJet server to generate a one-time password reset link:

    ```
    npm run reset-superadmin -- --email admin@company.com
    ```

    This looks up the Super Admin by email and prints a single-use password reset link:

    ```
    ✓ Super admin found: John Doe (admin@company.com)
    ✓ Reset token generated.

    Share this link with the user:
    https://<TOOLJET_HOST>/reset-password?token=<uuid>

    The link is single-use. Run this command again if needed.
    ```

    Share the printed link with the Super Admin so they can open it and set a new password. The link can only be used once - run the command again if you need a new one.

    :::info
    If the `TOOLJET_HOST` environment variable isn't set on the server, the command prints the raw reset token instead. In that case, construct the reset URL manually as `https://<your-domain>/reset-password?token=<token>`.
    :::
---
id: password-login
title: Password Login
---

## Enable Password Login

Password login is a method of user authentication where user can login using their email and password. This method is enabled by default for all workspaces. User with admin privilege can enable/disable it.

- Go to **Workspace Settings** > **SSO** > **General Settings**.

- Under **General Settings** section, toggle **Password Login** to enable/disable it.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/sso/general/password-login-new.png" alt="General Settings: Password login" />

</div>

## Retry limits

The user password authentication method will be disabled after predefined numbers of wrong password attempts. This feature can be disabled using setting `DISABLE_PASSWORD_RETRY_LIMIT` to `true` in environment variables. Number of retries allowed will be 5 by default, it can be override by `PASSWORD_RETRY_LIMIT` environment variable.

## Reset Password

There are two ways through which a user can reset their password. The first method is where user can reset their password by themselves. The second method is where a **Super Admin** can reset password for a user.

### 1. Forgot Password

- On the login page, click on the **Forgot Password**.
- Enter the registered email address associated with the account and then click on the **Send a reset link** button.
- Receive a password reset link via email.
- Click on the link to be directed to the password reset page.
- Follow the prompts to set a new password.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/sso/general/forgot-password.png" alt="General Settings: Reset Password" />

</div>

### 2. **Super Admin**

- Reach out to the **[Super Admin](/docs/Enterprise/superadmin)** of the workspace.
- The **Super Admin** can reset the password for the user from the **Settings** > **All Users** section.
- Select the user for whom the password needs to be reset.
- Click on the kebab icon(three dots) on the right side of the user's name and select **Reset Password**.
- A modal will appear with two options to reset the password: **Automatically generate a password** and **Create password**.

#### Automatically Generate Password

- Selecting this option will automatically generate a new password for the user.
- Click on the **Reset** button to reset the password and the new password will be displayed in the modal.
- Super Admin can copy this password and provide it to the user securely.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/sso/general/auto-password.png" alt="General Settings: Reset Password" />

</div>

#### Create Password

- Selecting this option will allow the Super Admin to create a new password for the user.
- Enter the new password and click on the **Reset** button.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/sso/general/create-password.png" alt="General Settings: Reset Password" />

</div>
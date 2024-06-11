---
id: workspace-login
title: Workspace Login
---

## Accessing Workspace Login

To access the Workspace Login, navigate to the ToolJet dashboard and click on the gear icon (⚙️) located at the bottom of the left sidebar. From the dropdown, select `Workspace Settings` and then select the `Workspace Login` tab. Workspace login/SSO can be configured by both workspace admins and super admins.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/workspace-settings/login-sso-v2.png" alt="Workspace settings" />
</div>

## Workspace login state: Enabled/Inherited

The workspace login state can be either `Enabled` or `Inherited`. When the workspace login state is `Enabled`, it overrides the instance login configurations, including allowed domains, enable sign-up toggle, and password login toggle. Workspace admins can separately choose to enable or disable the SSO options of the workspace.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/workspace-settings/enabled-v2.png" alt="Workspace settings" />
</div>

When the workspace login state is `Inherited`, the workspace login settings are inherited from the instance login settings. The workspace login settings are disabled, and the workspace admins cannot change the SSO settings. Only super admins can change the SSO settings from the instance login settings.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/workspace-settings/inherited.png" alt="Workspace settings" />
</div>

## Configuring Workspace Login

### Allowed Domains

The allowed domains field is used to specify the domains that are allowed to access the workspace. If the allowed domains field is empty, all domains are allowed to access the workspace. If the allowed domains field is not empty, only the specified domains are allowed to access the workspace. The allowed domains field can be a comma-separated list of domains.

### Login URL

Login URL is automatically generated and can be used to login directly to the workspace. The login URL is unique to the workspace and can be shared with the users to access the workspace.

### Enable Sign-up

The enable sign-up toggle is used to enable or disable the sign-up option for the workspace. If the enable sign-up toggle is enabled, new users can sign up for the workspace. If the enable sign-up toggle is disabled, new users cannot sign up for the workspace.

## Password Login

Password login is a method of user authentication where user can login using their email and password. This option is enabled by default. If the password login toggle is disabled, users can only login to the workspace using the SSO options.

### Retry limits

The user password authentication method will be disabled after predefined numbers of wrong password attempts. This feature can be disabled using setting `DISABLE_PASSWORD_RETRY_LIMIT` to `true` in environment variables. Number of retries allowed will be 5 by default, it can be override by `PASSWORD_RETRY_LIMIT` environment variable.

### Reset Password

There are two ways through which a user can reset their password. The first method is where user can reset their password by themselves. The second method is where a **Super Admin** can reset password for a user.

#### 1. Forgot Password

- On the login page, click on the **Forgot Password**.
- Enter the registered email address associated with the account and then click on the **Send a reset link** button.
- Receive a password reset link via email.
- Click on the link to be directed to the password reset page.
- Follow the prompts to set a new password.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/general/forgot-password-v2.png" alt="Workspace settings" />
</div>

#### 2. **Super Admin**

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
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/general/auto-password.png" alt="Workspace settings" />
</div>

#### Create Password

- Selecting this option will allow the Super Admin to create a new password for the user.
- Enter the new password and click on the **Reset** button.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/general/create-password.png" alt="Workspace settings" />
</div>

---
id: reset-password
title: Reset Password
---

There are two ways through which a user can reset their password. The first method is where user can reset their password by themselves. The second method is where a **Super Admin** can reset password for a user.

## Forgot Password

1. On the login page, click on the **Forgot Password**.
2. Enter the registered email address associated with the account and then click on the **Send a reset link** button.
3. Receive a password reset link via email.
4. Click on the link to be directed to the password reset page.
<img className="screenshot-full" src="/img/sso/general/forgot-password.png" alt="General Settings: Reset Password" />

## Super Admin Reset Password


When password login is enabled, and if a user forgets their password or it needs to be updated, the super admin can easily reset the password for any user in the instance by following these steps:

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Settings > All Users**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/all-users`)

3. Spot the user for whose the password needs to be reset.

4. Click on the kebab icon (three dots) on the right side of the user's name and select **Reset Password**.

5. A modal will appear with two options to reset the password:

    a. **Automatically Generate Password**: Selecting this option will automatically generate a new password for the user. <br/>
    b. **Create Password**: Selecting this option will allow the Super Admin to create a new password for the user.

<img className="screenshot-full" src="/img/sso/general/auto-password.png" alt="General Settings: Reset Password" />


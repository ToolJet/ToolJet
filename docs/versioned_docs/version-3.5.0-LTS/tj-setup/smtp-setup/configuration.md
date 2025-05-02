---
id: configuration
title: Configuration
---

This feature is exclusive to self-hosted ToolJet, allowing you to configure a custom SMTP email server. This feature allows you to choose your own email server, which helps to seamlessly send emails for various purposes, including invitations, password reset requests, and notifications. 

There are two ways to setup your email server in ToolJet:
1. **[Using the GUI](#configuration-using-gui)**: This method involves directly entering SMTP settings into the ToolJet interface, which is suitable for simpler setups.
2. **[With environment variables](#configuration-with-environment-variables)**: This method utilizes environment variables for configuring the email server. It offers enhanced flexibility and security, making it particularly suitable for managing sensitive credentials in production environments.

Both methods are designed to ensure that your ToolJet instance can send emails as needed, depending on your setup preferences and security requirements.

<div style={{paddingTop:'24px'}}>

## Prerequisites

Before you begin, ensure you have:
- Super Admin access to ToolJet
- SMTP server details from your email service provider

</div>

:::info
If you have upgraded from a version prior to v2.62.0, the SMTP variables in your .env file will automatically be mapped to the UI.
:::

<div style={{paddingTop:'24px'}}>

## Configuration Using GUI

1. Navigate to the **Settings** section in ToolJet.
2. Select the **Email protocol (SMTP)** tab.
3. Toggle the switch to enable **Email protocol (SMTP)**.
4. Configure the following fields: <br/>
    | Field         | Description              | Example                           |
    |---------------|--------------------------|-----------------------------------|
    | Host          | SMTP server hostname     | smtp.gmail.com                    |
    | Port          | SMTP server port number  | 587                               |
    | User          | SMTP account username    | hello@johndoe.tech                |
    | Password      | SMTP account password    | a13d0sd344                        |
    | Sender's email| Email address of the sender | hello@johndoe.tech             |

5. Click **Save changes** to apply the new SMTP configuration.
    <img className="screenshot-full" src="/img/enterprise/smtp/configuration-v2.png" alt="SMTP     Configuration Without Environment Variables" />

</div>

<div style={{paddingTop:'24px'}}>

## Configuration With Environment Variables

ToolJet allows you to configure SMTP settings using environment variables. You can enable a toggle in the Email protocol (SMTP) settings to apply or fetch the configuration directly from your .env file.

<img className="screenshot-full img-l" style={{ marginBottom:'15px' }} src="/img/enterprise/smtp/configuration-v2-env.png" alt="SMTP Configuration Without Environment Variables" />

**Example Environment Variables**:<br/>

    ```javascript
    DEFAULT_FROM_EMAIL=hello@tooljet.io
    SMTP_USERNAME=your-username
    SMTP_PASSWORD=your-password
    SMTP_DOMAIN=smtp.mailgun.org 
    SMTP_PORT=587
    SMTP_SSL=false
    SMTP_DISABLED=false
    ```

- For new installations, if SMTP is configured in the .env file, the **Apply configuration from environment variables** toggle will be turned on by default.
- When the toggle is enabled, the SMTP settings fields in the UI will be populated with values from the environment variables and will be read-only.
- Disabling the toggle allows you to manually enter or edit SMTP settings directly in the UI.

</div>

---
id: smtp-configuration
title: SMTP Configuration
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

# Configuring SMTP

ToolJet uses SMTP (Simple Mail Transfer Protocol) to send emails for various purposes, including invitations and password reset requests. This guide will walk you through the process of configuring SMTP settings in ToolJet.
## Prerequisites

Before you begin, ensure you have:
- Admin access to ToolJet
- SMTP server details from your email service provider

:::info
If you have upgraded from a version prior to v2.62.0, the SMTP variables in your .env file will automatically be mapped to the UI.
For versions v2.62.0 and later, SMTP configuration will no longer be picked up from the .env file for Enterprise Edition. You must configure SMTP through the UI. You can safely remove these variables from your .env file after ensuring that the configuration is properly set up in the UI.

For Community Edition, SMTP configuration will still be managed via environment variables.
:::

## Configuration

1. Navigate to the **Settings** section in ToolJet.
2. Select the **Email protocol (SMTP)** tab.
3. Toggle the switch to enable **Email protocol (SMTP)**.
4. Configure the following fields:

<div style={{textAlign: 'center', paddingBottom: '24px'}}>
<img className="screenshot-full" src="/img/enterprise/smtp/configuration.png" alt="SMTP Configuration" />
</div>
| Field         | Description              | Example                           |
|---------------|--------------------------|-----------------------------------|
| Host          | SMTP server hostname     | smtp.gmail.com                    |
| Port          | SMTP server port number  | 587                               |
| User          | SMTP account username    | example@gmail.com/b2313d02f4f4jb  |
| Password      | SMTP account password    | a13d0sd344                        |
| Sender's email| Email address of the sender | example@gmail.com              |

5. Click **Save changes** to apply the new SMTP configuration.

## Commonly Used Email Providers

Here are some general settings for the most commonly used email providers:

| Provider           | Host                 | Port             | Username      | Password  | Sender's email |
|--------------------|----------------------|------------------|---------------|-----------|----------------|
| Gmail              | smtp.gmail.com       | 587 or 465 (SSL) | Email         | Password  | Email          |
| Yahoo Mail         | smtp.mail.yahoo.com  | 465 (SSL)        | Email         | Password  | Email          |
| Outlook.com/Hotmail| smtp.office365.com   | 587 or 465 (SSL) | Email         | Password  | Email          |
| Zoho Mail          | smtp.zoho.com        | 587 or 465 (SSL) | Email         | Password  | Email          |
| SendGrid           | smtp.sendgrid.net    | 587 or 465 (SSL) | apikey        | API key   | Email          |
| Mailgun            | smtp.mailgun.org     | 587 or 465 (SSL) | SMTP username | Password  | Email          |

:::info
For SendGrid and Mailgun, the sender's email can be different from the username, subject to the provider's verification requirements. The username for SendGrid is **apikey**, and the password is your API key. For Mailgun, you usually use a specific SMTP username and password provided by Mailgun, not your regular email credentials.
:::
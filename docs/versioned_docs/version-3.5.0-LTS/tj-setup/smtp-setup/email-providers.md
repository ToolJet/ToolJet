---
id: email-providers
title: Commonly Used Email Providers
---

Here are some general settings for the most commonly used email providers:

| Provider           | Host                 | Port             | Username      | Password  | Sender's email |
|--------------------|----------------------|------------------|---------------|-----------|----------------|
| Gmail              | smtp.gmail.com       | 587 or 465 (SSL) | Email         | Password  | Email          |
| Yahoo Mail         | smtp.mail.yahoo.com  | 465 (SSL)        | Email         | Password  | Email          |
| Outlook.com/Hotmail| smtp.office365.com   | 587 or 465 (SSL) | Email         | Password  | Email          |
| Zoho Mail          | smtp.zoho.com        | 587 or 465 (SSL) | Email         | Password  | Email          |
| SendGrid           | smtp.sendgrid.net    | 587 or 465 (SSL) | apikey        | API key   | Email          |
| Mailgun            | smtp.mailgun.org     | 587 or 465 (SSL) | SMTP username | Password  | Email          |


## SendGrid

To configure SendGrid, use **`apikey`** as the username and the generated API key as the password.

<img className="screenshot-full img-l" src="/img/enterprise/smtp/sendgrid-config.png" alt="SMTP Configuration Without Environment Variables" />

#### Steps to Generate API Key
1. Log in to your [SendGrid](https://sendgrid.com/en-us) account.

2. Navigate to the [API Keys](https://app.sendgrid.com/settings/api_keys) page under Settings.

3. Generate a new API key for SMTP usage.
    <img className="screenshot-full" src="/img/enterprise/smtp/sendgrid-api.png" alt="SMTP Configuration Without Environment Variables" />

## Mailgun

Mailgun provides specific credentials for SMTP configuration.
1. Retrieve the **SMTP username** from the SMTP Credentials tab in the Domain Settings page.

2. Use the password associated with your Mailgun account to authenticate the SMTP connection.
    <img className="screenshot-full" src="/img/enterprise/smtp/mailgun-cred.png" alt="SMTP Configuration Without Environment Variables" />

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

For SendGrid you have to use **`apikey`** as your username and the actual API Key as the password.

<img className="screenshot-full" src="/img/enterprise/smtp/sendgrid-config.png" alt="SMTP Configuration Without Environment Variables" />

You can generate the SendGrid API Key by logging in in the SendGrid and going to API Key Section.

<img className="screenshot-full" src="/img/enterprise/smtp/sendgrid-api.png" alt="SMTP Configuration Without Environment Variables" />



:::info
For **SendGrid** and **Mailgun**, the sender's email can be different from the username, subject to the provider's verification requirements. The username for SendGrid is **apikey**, and the password is your API key. For Mailgun, you can check the SMTP credentials tab under Domain settings.

<img className="screenshot-full" src="/img/enterprise/smtp/mailgun-cred.png" alt="SMTP Configuration Without Environment Variables" />

:::

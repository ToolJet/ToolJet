---
id: smtp
title: SMTP Configuration
---

# Configuring SMTP

ToolJet uses SMTP (Simple Mail Transfer Protocol) to send emails for various purposes, including invitations and password reset requests. This guide will walk you through the process of configuring SMTP settings in ToolJet.

## Prerequisites

Before you begin, ensure you have:
- Admin access to ToolJet
- SMTP server details from your email service provider

The SMTP configuration details like host and port can usually be obtained from your email service provider. Here are some general settings for the most commonly used email providers:

| Provider | Host | Port | Username | Password |
|----------|------|------|----------|----------|
| Gmail | smtp.gmail.com | 587 or 465 (SSL) | Email | Password |
| Yahoo Mail | smtp.mail.yahoo.com | 465 (SSL) | Email | Password |
| Outlook.com/Hotmail | smtp.office365.com | 587 or 465 (SSL) | Email | Password |

## Configuration

1. Navigate to the **Settings** section in ToolJet.
2. Select the **SMTP** tab.
3. Toggle the switch to enable SMTP Settings.
4. Configure the following fields:

<div style={{textAlign: 'center', paddingBottom: '24px'}}>
<img className="screenshot-full" src="/img/enterprise/smtp/configuration.png" alt="SMTP Configuration" />
</div>
   | Field    | Description          | Example           |
   |----------|----------------------|-------------------|
   | Host     | SMTP server hostname | smtp.gmail.com    |
   | Port     | SMTP server port number | 587            |
   | User     | SMTP account username| example@gmail.com |
   | Password | SMTP account password| a13d0sd344        |

5. Click **Save changes** to apply the new SMTP configuration.
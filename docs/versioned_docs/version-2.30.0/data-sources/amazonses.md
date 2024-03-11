---
id: amazonses
title: Amazon SES
---

# Amazon SES

ToolJet can connect to your Amazon SES account to send emails.

## Connection
To add a new Amazon SES API datasource, click the **Datasource manager** icon on the left-sidebar of the app builder and click on the `Add datasource` button, then select Amazon SES from the modal that pops up.

ToolJet requires the following to connect to Amazon SES:

- **Region**
- **Access key**
- **Secret key**

It is recommended to create a new IAM user for the database so that you can control the access levels of ToolJet.

Click on the 'Save' button to save the data source.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/amazonses/connection.png" alt="Amazon SES" width="600" />

</div>

## Supported operations
1.  Email service

### Email service
Required parameters:
- Send email to
- Send email from
- Subject
- Body as text


Optional parameters:
- Body as HTML
- CC Addresses
- BCC Addresses


:::info
**Send mail to** - accepts an array/list of emails separated by comma.
For example:
`{{["dev@tooljet.io", "admin@tooljet.io"]}}`.

**Send mail from** - accepts a string.
For example: `admin@tooljet.io`
:::

:::tip
**Send a single email to multiple recipients** - The `Send mail to` field can contain an array of recipients, which will send a single email with all of the recipients in the field.
:::

:::info Note
Query should be saved before running.
:::

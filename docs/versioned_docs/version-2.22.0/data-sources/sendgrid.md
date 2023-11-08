---
id: sendgrid
title: SendGrid
---

# SendGrid

ToolJet can connect to your SendGrid account to send emails.

<img class="screenshot-full" src="/img/datasource-reference/sendgrid/sendgrid-datasource.png" alt="ToolJet - Data source - SendGrid" height="420" />

:::info
The SendGrid API Datasource supports for interaction with the mail endpoint of the [SendGrid v3 API](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication).
:::

## Connection
To add a new SendGrid API datasource, click the **Datasource manager** icon on the left-sidebar of the app builder and click on the `Add datasource` button, then select SendGrid API from the modal that pops up.
 
Enter your **SendGrid API key** in the "API key" field.

:::tip
SendGrid API key is required to create an SendGrid datasource on ToolJet. You can generate API key by visiting [SendGrid account page](https://app.sendgrid.com/settings/api_keys). 
:::

Click on the 'Save' button to save the data source.

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

<img class="screenshot-full" src="/img/datasource-reference/sendgrid/sendgrid-query.jpg" alt="ToolJet - Query SendGrid" height="420"/>

:::info
**Send mail to** - accepts an array/list of emails separated by comma.
For example:
`{{["dev@tooljet.io", "admin@tooljet.io"]}}`.

**Send mail from** - accepts a string.
For example: `admin@tooljet.io`
:::

:::tip
**Send a single email to multiple recipients** - The `Send mail to` field can contain an array of recipients, which will send a single email with all of the recipients in the field. 

**Send multiple individual emails to multiple recipients** - set <b>Multiple recipients</b> field to `{{true}}` and the `Send mail to` field will be split into multiple emails and send to each recipient.
:::


:::note
NOTE: Query should be saved before running.
:::

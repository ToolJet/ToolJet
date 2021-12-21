---
sidebar_position: 11
---

# SendGrid

ToolJet can connect to your SendGrid account to send emails.

<img class="screenshot-full" src="/img/datasource-reference/sendgrid/sendgrid-datasource.png" alt="ToolJet - Datasource SendGrid" height="420" />

:::info
The SendGrid API Datasource supports for interaction with the mail endpoint of the [SendGrid v3 API](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication).
:::

## Connection
To add a new SendGrid API datasource, click the Datasource manager icon on the left-sidebar of the app builder and click on the `Add datasource` button, then select SendGrid API from the modal that pops up.
 
Enter your **SendGrid API key** in the "API key" field.

:::tip
SendGrid API key is required to create an SendGrid datasource on ToolJet. You can generate API key by visiting [SendGrid account page](https://app.sendgrid.com/settings/api_keys). 
:::

Click on the 'Save' button to save the datasource.




## Sending Emails
Required parameters: 
- Send Mail To
- Send Mail From 
- Email Subject
- Body as Text


Optional parameters:
- Body as Html

<img class="screenshot-full" src="/img/datasource-reference/sendgrid/sendgrid-query.jpg" alt="ToolJet - Query SendGrid" height="420"/>

:::info
**Send Mail To** - accepts a list of emails separated by comma.
For example:
`{{["dev@tooljet.io", "admin@tooljet.io"]}}`.
:::

:::tip
**Send a Single email to Multiple Recipients** - The `Send Mail To` field can contain an array of recipients, which will send a single email with all of the recipients in the `Send Mail To` field. 

**Send Multiple individual emails to Multiple Recipients** - set <b>Multiple Recipients</b> field to true and the `Send Mail to` field will be split into multiple emails and send to each recipient.
:::


:::note
NOTE: Query should be saved before running.
:::
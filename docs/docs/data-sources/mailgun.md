---
sidebar_position: 11
---

# MailGun

ToolJet can connect to your MailGun account to send emails.

<img class="screenshot-full" src="/img/datasource-reference/mailgun/mailgun-datasource.png" alt="ToolJet - Data source - MailGun" height="420" />

:::info
The MailGun API Datasource supports for interaction with the mail endpoint of the [MailGun API](https://documentation.mailgun.com/en/latest/api-intro.html#authentication-1).
:::

## Connection
To add a new MailGun API datasource, click the **Datasource manager** icon on the left-sidebar of the app builder and click on the `Add datasource` button, then select MailGun API from the modal that pops up.

Enter your **MailGun API key** in the "API key" field.

:::tip
MailGun API key is required to create an MailGun datasource on ToolJet. You can generate API key by visiting [MailGun account page](https://app.mailgun.com/app/account/security/api_keys).
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

<img class="screenshot-full" src="/img/datasource-reference/MailGun/MailGun-query.jpg" alt="ToolJet - Query MailGun" height="420"/>

:::info
**Send mail to** - accepts a single email id.
For example:
`{{"dev@tooljet.io"}}`.

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

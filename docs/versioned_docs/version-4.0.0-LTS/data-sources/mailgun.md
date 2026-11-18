---
id: mailgun
title: Mailgun
---

ToolJet can connect to your Mailgun account to send emails.

:::info
The Mailgun API Datasource supports for interaction with the mail endpoint of the [Mailgun API](https://documentation.mailgun.com/en/latest/api-intro.html#authentication-1).
:::

## Connection

To establish a connection with the **Mailgun** data source, click on the **+ Add new data source** button located on the query panel or navigate to the [Data Sources](/docs/data-sources/overview) page from the ToolJet dashboard.

ToolJet requires the following to connect to your Mailgun:
- **Domain**: Your Mailgun sending domain. ToolJet sends email through this domain.
- **Api key**

Optionally, turn on **EU hosted** if your Mailgun account is hosted in the EU. ToolJet then sends requests to `https://api.eu.mailgun.net` instead of `https://api.mailgun.net`.

<img class="screenshot-full img-full" src="/img/datasource-reference/mailgun/mailgun-datasource-v3.png" alt="ToolJet - Data source connection - Mailgun" />

:::tip
Mailgun API key is required to create an Mailgun datasource on ToolJet. You can generate API key by visiting [Mailgun account page](https://app.mailgun.com/app/account/security/api_keys).
:::

## Supported Operations

### Email Service

#### Required parameters:

- **Send mail to**
- **Send mail from**
- **Subject**
- **Body as text**

#### Optional parameters:

- **Body as HTML**

<img class="screenshot-full img-full" src="/img/datasource-reference/mailgun/query-v4.png" alt="ToolJet - Data source - Mailgun Query" />

:::info
**Send mail to** - accepts an array of email addresses, even for a single recipient.
For example:
`{{["dev@tooljet.io"]}}`.

**Send mail from** - accepts a string.
For example: `admin@tooljet.io`
:::

:::tip
**Multiple recipients** - Add each address to the **Send mail to** array, for example `{{["dev@tooljet.io", "admin@tooljet.io"]}}`.
:::
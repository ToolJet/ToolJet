---
id: sendgrid
title: SendGrid
---

ToolJet can connect to your SendGrid account to send emails.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the SendGrid datasource, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to your SendGrid database:
- **SendGrid API key**

<img class="screenshot-full" src="/img/datasource-reference/sendgrid/sendgrid-datasource-v2.png" alt="ToolJet - Data source - SendGrid" />

:::info
The SendGrid API Datasource supports for interaction with the mail endpoint of the [SendGrid v3 API](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication).
:::

</div>

<div style={{paddingTop:'24px'}}>

## Querying SendGrid

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **SendGrid** datasource added in previous step.
3. Select **Email service** from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

### Email Service

#### Required Parameters 
- **Multiple recipients**
- **Send email to**
- **Send email from** 
- **Subject**
- **Body as text**


#### Optional Parameter
- **Body as HTML**

<img class="screenshot-full" src="/img/datasource-reference/sendgrid/sendgrid-query-v3.png" alt="ToolJet - Query SendGrid"/>

<details>
<summary>**Example Values**</summary>

```yaml
Send mail to: {{["dev@tooljet.io", "admin@tooljet.io"]}} 
Send mail from: admin@tooljet.io
Subject: Hello from ToolJet 👋
Body as text: Hello User!
Body as HTML: <h2> Hello User! </h2>
```
</details>

<details>
<summary>**Example Response**</summary>

```json
[
  {
    "statusCode": 202,
    "body": "",
    "headers": {
      "server": "nginx",
      "date": "Tue, 11 Mar 2025 03:22:39 GMT",
      "content-length": "0",
      "connection": "close",
      "x-message-id": "Ch7SJ6iLSxGz7aaABeSiSw",
      "access-control-allow-origin": "https://sendgrid.api-docs.io",
      "access-control-allow-methods": "POST",
      "access-control-allow-headers": "Authorization, Content-Type, On-behalf-of, x-sg-elas-acl",
      "access-control-max-age": "600",
      "x-no-cors-reason": "https://sendgrid.com/docs/Classroom/Basics/API/cors.html",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "content-security-policy": "frame-ancestors 'none'",
      "cache-control": "no-cache",
      "x-content-type-options": "no-sniff",
      "referrer-policy": "strict-origin-when-cross-origin"
    }
  },
  ""
]
```
</details>

:::tip
**Send a single email to multiple recipients** - The `Send mail to` field can contain an array of recipients, which will send a single email with all of the recipients in the field. 

**Send multiple individual emails to multiple recipients** - set <b>Multiple recipients</b> field to `{{true}}` and the `Send mail to` field will be split into multiple emails and send to each recipient.
:::

</div>
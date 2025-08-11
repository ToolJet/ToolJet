---
id: amazonses
title: Amazon SES
---

ToolJet can connect to your Amazon SES account to send emails.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **Amazon SES** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to Amazon SES:

- **Region**
- **Authentication**
- **Access key**
- **Secret key**

**Note:** It is recommended to create a new IAM user for the database so that you can control the access levels of ToolJet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/amazonses/connection-v2.png" alt="Amazon SES" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Amazon SES

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Amazon SES** datasource added in previous step.
3. Select **Email service** as operation from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/amazonses/operations.png" alt="Amazon SES" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operation

### Email service

#### Required parameters:
- **Send email to**
- **Send email from**
- **Subject**
- **Body**


#### Optional parameters:
- **CC Addresses**
- **BCC Addresses**

<img className="screenshot-full" src="/img/datasource-reference/amazonses/email-service.png" alt="Amazon SES" />


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

</div>
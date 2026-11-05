---
id: amazonses
title: Amazon SES
---

ToolJet can connect to your Amazon SES account to send emails.

## Connection

To establish a connection with the **Amazon SES** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to Amazon SES:

- **Authentication**: **Use IAM Access Keys**, **Use AWS Instance Credentials**, or **Use AWS ARN Role**.
- **Region**
- **Access key** and **Secret key**: Required only when **Authentication** is **Use IAM Access Keys**.
- **Role ARN**: Required only when **Authentication** is **Use AWS ARN Role**, e.g. `arn:aws:iam::123456789012:role/role-name`. ToolJet assumes this role through AWS STS using the credentials available to the ToolJet server, so the server's AWS identity must be allowed to assume it.

**Use AWS Instance Credentials** and **Use AWS ARN Role** authenticate through your AWS environment, so you don't supply IAM access keys.

**Note:** It is recommended to create a new IAM user for the database so that you can control the access levels of ToolJet.

<img className="screenshot-full img-full" src="/img/datasource-reference/amazonses/connection-v2.png" alt="Amazon SES" />

## Querying Amazon SES

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Amazon SES** datasource added in previous step.
3. Select **Email service** as operation from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full img-full" src="/img/datasource-reference/amazonses/awsSES-listops.png" alt="Amazon SES" />

## Supported Operation

### Email service

#### Required parameters:
- **Send mail to**
- **Send mail from**
- **Subject**
- **Body**


#### Optional parameters:
- **CC mail to**
- **BCC mail to**

<img className="screenshot-full img-full" src="/img/datasource-reference/amazonses/ses-query.png" alt="Amazon SES" />


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

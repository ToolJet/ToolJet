---
id: amazonses
title: Amazon SES
---

# Amazon SES

ToolJet can connect to your Amazon SES account to send emails.

## Connection
To add a new Amazon SES API datasource, click the **Datasource manager** icon on the left-sidebar of the app builder and click on the `Add datasource` button, then select Amazon SES from the modal that pops up.

ToolJet supports connecting to DynamoDB using **IAM credentials** or **AWS Instance Profile**. If you are using *IAM credentials*, you will need to provide the following details:

- **Region**
- **Access key**
- **Secret key**

It is recommended to create a new IAM user for the database so that you can control the access levels of ToolJet.

To connect to DynamoDB using *AWS Instance Profile*, select the **Use AWS Instance Profile**. This will use the IAM role attached to the EC2 instance where ToolJet is running.
To access the metadata service of an ECS container and the EC2 instance, we use the WebIdentityToken parameter which is obtained from a successful login with an identity provider.

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
- Body as text or HTML


Optional parameters:
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

---
id: smtp
title: SMTP
---

# SMTP

The SMTP datasource facilitates the connection between ToolJet applications and email servers, enabling the apps to send emails.

## Connection

To connect to an SMTP server, the following credentials are typically required:

- **Host** 
- **Port** 
- **Username**
- **Password**

:::tip Finding configuration details:
The SMTP configuration details like host and port can usually be obtained from your email service provider. Here are some general settings for the most commonly used email providers:
- **Gmail**: `Host`: smtp.gmail.com; `Port`: 587 or 465 (SSL); `Username`: your full Gmail email address; `Password`: your Gmail password.
- **Yahoo Mail**: `Host`: smtp.mail.yahoo.com; `Port`: 465 (SSL); `Username`: your Yahoo Mail email address; `Password`: your Yahoo Mail password.
- **Outlook.com/Hotmail**: `Host`: smtp.office365.com; `Port`: 587 or 465 (SSL); `Username`: your Outlook.com/Hotmail email address; `Password`: your Outlook.com/Hotmail password.

Before saving the configuration, it's possible to test the connection by clicking the "Test Connection" button.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/smtp/connect.png" alt="smtp connect" />

</div>

## Querying SMTP

To create a query for sending an email, follow these steps:

1. Open the query panel located at the bottom panel of the editor.
2. Click the `+Add` button on the left to create a new query.
3. Select `SMTP` from the global datasource.
4. Provide the following properties:
 - **From** `required` : Email address of the sender
 - **From Name** : Name of the sender
 - **To** `required` : Recipient's email address
 - **CC mail to** : Email address of the recipients that will receive a copy of the email, and their email addresses will be visible to other recipients.
 - **BCC mail to** : Email address of the recipients that will receive a copy of the email but the email addressed will be hidden to other recipients.
 - **Subject** : Subject of the email.
 - **Body** : You can enter the body text of the email in either raw text or html format, in their respective fields.
 - **Attachments** : You can add attachments to an SMTP query by referencing the file from the File Picker component in the attachments field.

For instance, you can set the `Attachments` field value to `{{ components.filepicker1.file }}` or pass an object `{{ name: 'filename.jpg', dataURL: '......' }}` to include attachments.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/smtp/querysmtp.png" alt="smtp connect" />

</div>

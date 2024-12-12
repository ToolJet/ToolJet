---
id: smtp
title: SMTP
---

The SMTP datasource facilitates the connection between ToolJet applications and email servers, enabling the apps to send emails.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the SMTP data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview/)** page from the ToolJet dashboard and choose SMTP as the data source.

ToolJet requires the following to connect to SMTP server:

- **Host** 
- **Port** 
- **Username**
- **Password**

### Finding Configuration Details

The SMTP configuration details like host and port can usually be obtained from your email service provider. Here are some general settings for the most commonly used email providers:

- **Gmail**
    - **Host**: smtp.gmail.com
    - **Port**: 587 or 465 (SSL)
    - **Username**: Your Full Gmail Address
    - **Password**: Your Gmail Password

- **Yahoo Mail**
    - **Host**: smtp.mail.yahoo.com
    - **Port**: 465 (SSL)
    - **Username**: Your Yahoo Email Address
    - **Password**: Your Yahoo Mail Password

- **Outlook.com/Hotmail**
    - **Host**: smtp.office365.com
    - **Port**: 587 or 465 (SSL)
    - **Username**: your Outlook.com/Hotmail email address
    - **Password**: your Outlook.com/Hotmail password.


<img className="screenshot-full" src="/img/datasource-reference/smtp/connect-v2.png" alt="smtp connect" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying SMTP

To create a query for sending an email, follow these steps:

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **SMTP** datasource added in previous step.
3. Enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

#### Required Parameter
 - **From**: Email address of the sender.
 - **To**: Recipient's email address.
 - **Subject** : Subject of the email.
 - **Body** : You can enter the body text of the email in either raw text or html format, in their respective fields.
 
#### Optional Parameter
 - **From Name** : Name of the sender.
 - **CC mail to** : Email address of the recipients that will receive a copy of the email, and their email addresses will be visible to other recipients.
 - **BCC mail to** : Email address of the recipients that will receive a copy of the email but the email addressed will be hidden to other recipients.
 - **Attachments** : You can add attachments to an SMTP query by referencing the file from the File Picker component in the attachments field.
    - For instance, you can set the `Attachments` field value to `{{ components.filepicker1.file }}` or pass an object `{{ name: 'filename.jpg', dataURL: '......' }}` to include attachments.

<img className="screenshot-full" src="/img/datasource-reference/smtp/querysmtp-v2.png" alt="smtp connect" />

</div>

---
id: mailtrap
title: Mailtrap
---

ToolJet can connect to your Mailtrap account to send emails through the [Mailtrap Email API](https://api-docs.mailtrap.io/), either to real recipients or into a Mailtrap Sandbox inbox for testing.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **Mailtrap** data source, click on the **+ Add new data source** button located on the query panel or navigate to the [Data Sources](/docs/data-sources/overview) page from the ToolJet dashboard.

ToolJet requires the following to connect to Mailtrap:
- **API token**: generate one on the [Mailtrap API tokens](https://mailtrap.io/settings/api-tokens) page.
- **Sending stream**:
  - **Transactional**: individual, user-triggered emails.
  - **Bulk**: marketing or high-volume emails.
  - **Sandbox (testing)**: emails are captured in a Sandbox inbox and never delivered.
- **Sandbox inbox ID**: required only for the Sandbox stream. It is the number in the inbox URL on the [Mailtrap Sandboxes](https://mailtrap.io/sandboxes/projects) page.

<img className="screenshot-full" src="/img/datasource-reference/mailtrap/mailtrap-datasource.png" alt="ToolJet - Data source - Mailtrap" />

Click **Test connection** to verify the API token.

:::info
Transactional and Bulk streams require the sender address to belong to a verified sending domain in Mailtrap.
:::

When **Sandbox (testing)** is selected, the **Sandbox inbox ID** field appears:

<img className="screenshot-full" src="/img/datasource-reference/mailtrap/mailtrap-datasource-sandbox.png" alt="ToolJet - Data source - Mailtrap Sandbox" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

### Send email

#### Required parameters:

- **From email**
- **To**
- **Subject**
- **Body as text** or **Body as HTML**

#### Optional parameters:

- **From name**
- **CC**, **BCC**, **Reply to**
- **Category**: groups emails in Mailtrap stats.
- **Attachments**
- **Custom variables**: a JSON object attached to the email and returned in webhooks.
- **Headers**: a JSON object of custom email headers.

<img className="screenshot-full" src="/img/datasource-reference/mailtrap/mailtrap-send-email.png" alt="ToolJet - Query Mailtrap - Send email" />

### Send email using template

Sends an email using a template created in Mailtrap. The subject and body come from the template.

#### Required parameters:

- **From email**
- **To**
- **Template UUID**

#### Optional parameters:

- **From name**
- **CC**, **BCC**, **Reply to**
- **Template variables**: a JSON object, for example `{ "user_name": "John" }`. To use values from your app, write it as an expression, for example `{{ { "user_name": components.textinput1.value } }}`, where `textinput1` is a Text Input component in the app.
- **Attachments**
- **Custom variables**

<img className="screenshot-full" src="/img/datasource-reference/mailtrap/mailtrap-send-template.png" alt="ToolJet - Query Mailtrap - Send email using template" />

:::tip
**Recipients** (To, CC, BCC) accept a single email, `Name <email>`, a comma-separated list, or an array such as `{{["dev@tooljet.io", { "email": "ops@tooljet.io", "name": "Ops" }]}}`.

**Attachments** accept the files from a File Picker component, for example `{{components.filepicker1.files}}`, or an array of `{ "filename", "content" (base64), "type" }` objects.
:::

The query returns the Mailtrap API response, for example `{ "success": true, "message_ids": ["..."] }`.

</div>

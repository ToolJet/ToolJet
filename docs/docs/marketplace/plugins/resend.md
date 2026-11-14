---
id: marketplace-plugin-resend
title: Resend
---

The Resend plugin allows you to integrate your ToolJet applications with the Resend email API to send transactional and marketing emails, manage domains, maintain audience contact lists, and schedule broadcasts.

:::note
Before following this guide, ensure that you have completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect Resend to ToolJet, you will need:
- **API Key**: Your secret API key from the Resend Dashboard.

:::info Generating an API Key
- Navigate to the [Resend Dashboard](https://resend.com/api-keys).
- Click on **Create API Key**.
- Provide a name, select appropriate permissions (Full Access or Sending Access), and copy the generated key.
:::

## Supported Operations

### Send Email
Sends a single transactional or marketing email with HTML/text body, cc/bcc, attachments, and scheduling options.

#### Parameters:
- **From Email** (Required): The sender email address (e.g., `Acme <onboarding@resend.dev>`).
- **To Email(s)** (Required): Recipient email address or comma-separated list.
- **Subject** (Required): Subject of the email.
- **HTML Body**: HTML version of the message.
- **Plain Text Body**: Plain text version of the message.
- **CC**: CC recipient email address(es).
- **BCC**: BCC recipient email address(es).
- **Reply-To**: Custom reply-to address.
- **Scheduled At**: Natural language (e.g., `in 1 hour`) or ISO 8601 timestamp.
- **Attachments**: JSON array of attachment objects with filename and content or path.

### Send Batch Emails
Sends up to 100 emails in a single batch request.

#### Parameters:
- **Batch Emails Array** (Required): JSON array of email payload objects.

### Get Email
Retrieves the details, status, and delivery metrics of a previously sent email.

#### Parameters:
- **Email ID** (Required): The unique ID of the email.

### Update Scheduled Email
Updates the schedule time for a queued email.

#### Parameters:
- **Email ID** (Required): The unique ID of the scheduled email.
- **New Scheduled At** (Required): Updated schedule timestamp.

### Cancel Scheduled Email
Cancels a scheduled email before it is sent.

#### Parameters:
- **Email ID** (Required): The unique ID of the scheduled email to cancel.

### List Domains
Retrieves all domains configured in your Resend account.

### Create Domain
Registers a new domain in Resend for sending emails.

#### Parameters:
- **Domain Name** (Required): Name of the domain (e.g., `example.com`).
- **Region**: Region for the domain (`us-east-1`, `eu-west-1`, `sa-east-1`, `ap-northeast-1`).

### Verify Domain
Initiates DNS verification for a domain.

#### Parameters:
- **Domain ID** (Required): The unique ID of the domain.

### List Contacts
Lists all contacts in an audience.

#### Parameters:
- **Audience ID** (Required): The unique ID of the audience.

### Create Contact
Adds a new contact to an audience.

#### Parameters:
- **Audience ID** (Required): The unique ID of the audience.
- **Email Address** (Required): The contact's email address.
- **First Name**: Contact's first name.
- **Last Name**: Contact's last name.
- **Unsubscribed**: Subscription status (`false` for subscribed, `true` for unsubscribed).

### Update Contact
Updates an existing contact's details in an audience.

#### Parameters:
- **Audience ID** (Required): The audience ID.
- **Contact ID** (Required): The contact ID to update.
- **First Name**: Updated first name.
- **Last Name**: Updated last name.
- **Unsubscribed**: Updated subscription status.

### Delete Contact
Removes a contact from an audience.

#### Parameters:
- **Audience ID** (Required): The audience ID.
- **Contact ID** (Required): The contact ID to delete.

### Create Broadcast
Creates an email broadcast to send to an audience.

#### Parameters:
- **Audience ID** (Required): Audience ID.
- **From Email** (Required): Sender email address.
- **Subject** (Required): Broadcast subject line.
- **HTML Content**: HTML version of the broadcast.
- **Broadcast Name**: Internal name for the broadcast.

### Send Broadcast
Sends a previously created broadcast either immediately or at a scheduled time.

#### Parameters:
- **Broadcast ID** (Required): The broadcast ID.
- **Scheduled At**: Optional schedule timestamp.

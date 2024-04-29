---
id: marketplace-plugin-plivo
title: Plivo
---

You can integrate your ToolJet application with Plivo for SMS functionality.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To use the Plivo plugin, you need the following credentials:
- **Auth Token**
- **Auth ID**

:::info Generating Auth Token/ID
- Navigate to the Plivo Console (https://www.plivo.com/)
- In the console, you will see your auth ID and auth token listed under the "API" section.
- If you don't see your auth ID and auth token, you can generate new ones by clicking on the "Generate New Auth ID/Token" button.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/plivo/connection-v2.png" alt="Configuring Plivo In ToolJet" />

</div>

## Supported Queries

### Send SMS

You can use the Send SMS operation to send an SMS to a specified mobile number.

#### Required Parameters: 

- **To Number**
- **From Number**
- **Body**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/plivo/sendsms-v2.png" alt="Send SMS Using plivo" />

</div>
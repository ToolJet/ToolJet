---
id: marketplace-plugin-plivo
title: Plivo
---

ToolJet can connect to Plivo account to send SMS.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/plivo/plivoadd.gif" alt="Marketplace: plivo" />

</div>

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

For connecting to plivo, following credentials are required:
- **Auth Token**:
- **Auth ID**: 

:::info Generating Auth Token/ID
- Navigate to the Plivo Console (https://www.plivo.com/)
- In the console, you will see your auth ID and auth token listed under the "API" section.
- If you don't see your auth ID and auth token, you can generate new ones by clicking on the "Generate New Auth ID/Token" button.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/plivo/connection.png" alt="Marketplace: plivo" />

</div>

## Supported queries

### Send SMS

The specified mobile number will receive the SMS upon execution of this query.

#### Required parameters: 

- **To Number**: 
- **From Number**: 
- **Body**: 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/plivo/sendsms.png" alt="Marketplace: plivo" />

</div>
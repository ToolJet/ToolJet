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

### Make Call
You can use the Make Call operation to place an outbound voice call using Plivo's Voice API. When the call is answered, Plivo requests the Answer URL for Plivo XML instructions to control the call.

#### Required Parameters:
- **From Number**
- **To Number**
- **Answer URL** — the URL Plivo requests for call instructions (Plivo XML) once the call is answered.

#### Optional Parameters:
- **Answer Method** — the HTTP method Plivo uses to request the Answer URL. Defaults to `POST`.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/marketplace/plugins/plivo/makecall-v2.png" alt="Make Call Using plivo" />
</div>

#### Example response

A successful call setup returns Plivo's call metadata, for example:
\`\`\`json
{
  "message": "call fired",
  "request_uuid": "...",
  "api_id": "..."
}
\`\`\`

If a required field (From Number, To Number, or Answer URL) is missing or the Answer Method is invalid, the query fails with a validation error before reaching Plivo — for example, `"Answer URL is required"` — distinguishing setup/config errors from SMS-only failures, which instead surface directly from Plivo's API response.
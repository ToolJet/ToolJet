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

<img className="screenshot-full" src="/img/marketplace/plugins/plivo/connection-v3.png" alt="Configuring Plivo In ToolJet" />

</div>

## Supported Operations

### Send SMS

You can use the Send SMS operation to send an SMS to a specified mobile number.

#### Required Parameters: 

- **To Number**
- **From Number**
- **Body**

<img className="screenshot-full" src="/img/marketplace/plugins/plivo/sendsms-v3.png" alt="Send SMS Using plivo" />

<details>
<summary>**Response Example**</summary>

```json
{
  "apiId": "2e2f16be-d4cd-4dc7-b1c5-4442942a2ab8",
  "message": "message(s) queued",
  "messageUuid": [
    "8cf5108b-484b-42e3-b6b9-640d4288c322"
  ]
}
```

</details>
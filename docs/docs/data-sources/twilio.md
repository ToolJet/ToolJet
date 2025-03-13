---
id: twilio
title: Twilio
---

ToolJet can connect to Twilio account to send sms.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Twilio data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Twilio as the data source.

ToolJet requires the following to connect to Twilio:
- **Auth Token**
- **Account SID**
- **Messaging Service SID**

You can get the **Auth Token and Account SID** on the dashboard of your Twilio account.

<img className="screenshot-full" src="/img/datasource-reference/twilio/auth.png" alt="ToolJet - Data source - Twilio" />

For **Messaging Service SID**, you'll need to create a messaging service first from the Services under Messaging in the left-sidebar.

<img className="screenshot-full" src="/img/datasource-reference/twilio/sid.png" alt="ToolJet - Data source - Twilio" />

Provide the **Auth Token**, **Account SID**, and **Messaging Service SID** in the Twilio datasource configuration.

<img className="screenshot-full" src="/img/datasource-reference/twilio/connect-v3.png" alt="ToolJet - Data source - Twilio" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying Twilio

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Twilio** datasource added in previous step.
3. Select **Send SMS** from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

</div>

<div style={{paddingTop:'24px'}}>

## Supported operations

### Send message

This operation will send the specified message to specified mobile number.

#### Required Parameters
- **To Number:** The recipient's phone number.
- **Body:** The message you want to send to the recipient.

<img className="screenshot-full" src="/img/datasource-reference/twilio/sms-v3.png" alt="ToolJet - Data source - Twilio" />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
    "To Number": "+156..."
    "Body": "Hello Welcome, ToolJet is at your service!"
```
</details>
<details>
<summary>**Example Response**</summary>
```json
    body:"Hello Welcome, ToolJet is at your service!"
    numSegments:"0"
    direction:"outbound-api"
    from:null
    to:"+156..."
    dateUpdated:"2025-03-06T06:31:14.000Z"
    price:null
    errorMessage:null
    "..."
```
</details>
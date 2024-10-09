---
id: slack
title: Slack
---

ToolJet can connect to your Slack workspace to send messages. 

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **Slack** datasource, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<img className="screenshot-full" src="/img/datasource-reference/slack/connect-v2.png" alt="Slack datasource: ToolJet"/>

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/slack/authorize-v2.png" alt="Slack datasource: ToolJet"/>

</div>

:::note
The App (which credentials are provided) needs to be installed in the workspace to use the Slack data source, and it needs to be added to the channel where you want to post the message.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Querying Slack

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Slack** datasource added in previous step.
3. Select the desired operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/slack/operations.png" alt="Slack datasource: ToolJet"/>

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

1. **[List Members](#list-members)**
2. **[Send Message](#send-message)**
3. **[List Messages From a Channel](#list-messages)**

### List Members

This operation will return the data of all the members in your slack workspace.

<img className="screenshot-full" src="/img/datasource-reference/slack/listmembers-v2.png" alt="Slack datasource: ToolJet" style={{marginBottom:'15px'}}/>

### Send Message

This operation will send/post the message to a specified channel or posting to direct messages (also known as DMs or IMs) in your slack workspace.

#### Required Parameters
- **Channel**
- **Message**

<img className="screenshot-full" src="/img/datasource-reference/slack/sendmessage-v2.png" alt="Slack datasource: ToolJet" style={{marginBottom:'15px'}}/>

### List Messages

This operation will get the messages from a specified channel.

#### Required Parameters
- **Channel**
- **Limit**
- **Next Cursor**

<img className="screenshot-full" src="/img/datasource-reference/slack/listmessages-v2.png" alt="Slack datasource: ToolJet"/>

</div>

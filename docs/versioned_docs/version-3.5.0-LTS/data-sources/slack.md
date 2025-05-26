---
id: slack
title: Slack
---

ToolJet supports integration with your Slack workspace, enabling you to automate and interact with Slack directly from your applications. By connecting Slack as a datasource, you can perform operations such as sending messages to channels, retrieving message history, and more.

## Connection

ToolJet offers two ways to connect with Slack:
- [Custom Slack App](#custom-slack-app): Offers full control over permissions, OAuth scopes, and configuration.
- [ToolJet Slack App](#tooljet-slack-app): Provides a quick setup where you just need to authorize it with your Slack workspace, and no need to manually configure OAuth scopes. This option is available only in ToolJet Cloud.

### Custom Slack App

1. Add a new **Slack** data source in ToolJet.
2. Select **Custom slack app** from the dropdown and copy the Redirect URL displayed at the bottom.
    <img className="screenshot-full img-m" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/custom-slack-app.png" alt="Slack datasource: ToolJet"/>
3. Visit the [Slack API](https://api.slack.com/apps) dashboard and click on **Create New App** button.
4. Select **From scratch** in the modal, enter the App Name, and choose your workspace from the dropdown. <br/>
    <img className="screenshot-full img-s" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-api.png" alt="Slack datasource: ToolJet"/>
5. Click **Create App**. You will be redirected to the App Credentials page where you can find the Client ID, Client Secret, and other credentials.
6. From the left navigation bar, go to the **OAuth & Permissions** tab and add the Redirect URL you copied from ToolJet under Redirect URLs. Click Save URLs.
7. In the same tab, scroll down to Scopes and add the necessary OAuth scopes, including the mandatory scopes required by ToolJet (as mentioned on the Slack Data Source configuration page).
8. Return to the ToolJet Slack Data Source configuration page and enter the Client ID and Client Secret obtained in step 5.
9. Click **Connect to Slack**. You will be redirected to Slack to authorize the app for your workspace. <br/>
    <img className="screenshot-full img-l" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-auth.png" alt="Slack datasource: ToolJet"/>
10. After authorization, click **Save data source** in ToolJet. This will add a new Slack bot to your workspace.
11. Optionally, customize the bot’s profile (icon, name, description, etc.) from the Slack API page.

### ToolJet Slack App

You can use the ToolJet Slack App to quickly set up and test Slack integration. This is available only in ToolJet Cloud.

1. Add a new Slack Data Source in ToolJet.
2. Select **ToolJet Slack App** from the dropdown and copy the Redirect URI displayed at the bottom.
    <img className="screenshot-full img-l" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/tj-slack-app.png" alt="Slack datasource: ToolJet"/>
3. Click **Connect to Slack**.
4. You will be redirected to Slack to authorize the app and add the Redirect URL automatically.
5. After authorization, click **Save data source** in ToolJet. This will add a new Slack bot to your workspace.

## Querying Slack

1. Create a new query from the query panel at the bottom.
2. Select the **Slack** datasource.
3. Select the desired operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/slack/operations-v2.png" alt="Slack datasource: ToolJet"/>

## Supported Operations

### List Members

This operation will return the list and data of all the members in your slack workspace.

<img className="screenshot-full" src="/img/datasource-reference/slack/listmembers-v3.png" alt="Slack datasource: ToolJet"/>

### Send Message

This operation will send/post the message to a specified channel or posting to direct messages (also known as DMs or IMs) in your slack workspace.

#### Required Parameters
- **Channel**
- **Message**

<img className="screenshot-full" src="/img/datasource-reference/slack/sendmessage-v3.png" alt="Slack datasource: ToolJet"/>

### List Messages

This operation will get the messages from a specified channel.

#### Required Parameters
- **Channel**

#### Optional Parameters
- **Limit**
- **Next Cursor**

<img className="screenshot-full" src="/img/datasource-reference/slack/listmessages-v3.png" alt="Slack datasource: ToolJet"/>
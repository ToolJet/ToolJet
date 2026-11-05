---
id: slack
title: Slack
---

ToolJet supports integration with your Slack workspace, enabling you to automate and interact with Slack directly from your applications. By connecting Slack as a datasource, you can perform operations such as sending messages to channels, retrieving message history, and more.

## Connection

ToolJet offers the following ways to connect with Slack:
- [Custom Slack App](#custom-slack-app): Offers full control over permissions, OAuth scopes, and configuration.
- [ToolJet Slack App](#tooljet-slack-app): Provides a quick setup where you just need to authorize it with your Slack workspace, and no need to manually configure OAuth scopes. This option is available only in ToolJet Cloud.
- [Use Environment Variables](#use-environment-variables): Available on self-hosted ToolJet. Uses the Slack app credentials set in the `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` environment variables.

Choose the option from the **Slack app** dropdown on the data source configuration page.

### Custom Slack App

1. Add a new **Slack** data source in ToolJet.
2. Select **Custom slack app** from the dropdown and copy the Redirect URL displayed at the bottom. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/custom-slack-connect.png" alt="Slack datasource: ToolJet"/>
3. Visit the [Slack API](https://api.slack.com/apps) dashboard and click on **Create New App** button. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-app.png" alt="Slack datasource: ToolJet"/>
4. Select **From scratch** in the modal, enter the App Name, and choose your workspace from the dropdown. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-api.png" alt="Slack datasource: ToolJet"/>
5. Click **Create App**. You will be redirected to the App Credentials page where you can find the Client ID, Client Secret, and other credentials. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/creds.png" alt="Slack datasource: ToolJet"/>
6. From the left navigation bar, go to the **OAuth & Permissions** tab and add the Redirect URL you copied from ToolJet under Redirect URLs. Click Save URLs. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/oauth.png" alt="Slack datasource: ToolJet"/>
7. In the same tab, scroll down to Scopes and add the OAuth scopes that ToolJet requests. See [Permission Scopes](#permission-scopes).
8. Return to the ToolJet Slack Data Source configuration page and enter the Client ID and Client Secret obtained in step 5.
9. Click **Connect to Slack**. You will be redirected to Slack to authorize the app for your workspace. <br/>
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/slack-auth.png" alt="Slack datasource: ToolJet"/>
10. After authorization, click **Save data source** in ToolJet. This will add a new Slack bot to your workspace.
11. Optionally, customize the bot’s profile (icon, name, description, etc.) from the Slack API page.

After successful configuration, a new bot will appear in your Slack workspace. You can add this bot to different channels to perform operations from ToolJet.

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/slack.png" alt="Slack datasource: ToolJet"/>

### ToolJet Slack App

You can use the ToolJet Slack App to quickly set up and test Slack integration. This is available only in ToolJet Cloud.

1. Add a new Slack Data Source in ToolJet.
2. Select **ToolJet Slack App** from the dropdown and copy the Redirect URI displayed at the bottom.
    <img className="screenshot-full img-full" style={{ marginTop:'15px' }} src="/img/datasource-reference/slack/tooljet-slack-connect.png" alt="Slack datasource: ToolJet"/>
3. Click **Connect to Slack**.
4. You will be redirected to Slack to authorize the app and add the Redirect URL automatically.
5. After authorization, click **Save data source** in ToolJet. This will add a new Slack bot to your workspace.

### Use Environment Variables

On self-hosted ToolJet, you can store your Slack app's credentials in environment variables instead of in the data source.

1. Create a Slack app as described in steps 3–7 of [Custom Slack App](#custom-slack-app), using the **Redirect URI** shown on the Slack data source configuration page.
2. Set `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` to the app's Client ID and Client Secret. See [Environment Variables](/docs/setup/env-vars#slack).
3. Add a new Slack data source, select **Use environment variables** from the **Slack app** dropdown, and click **Connect to Slack**.
4. After authorization, click **Save data source** in ToolJet.

### Permission Scopes

ToolJet always requests these scopes, which are listed under **Authorize** on the data source configuration page:

`users:read`, `channels:read`, `groups:read`, `im:read`, `mpim:read`, `channels:history`, `groups:history`, `im:history`, `mpim:history`

Select the **chat:write** option to also request `chat:write`, which lets your apps send messages to users and channels.

## Querying Slack

1. Create a new query from the query panel at the bottom.
2. Select the **Slack** datasource.
3. Select the desired operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.
<img className="screenshot-full img-full" src="/img/datasource-reference/slack/listops-v3.png" alt="Slack datasource: ToolJet"/>

## Supported Operations

### List Members

This operation will return the list and data of all the members in your slack workspace.

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/list-mem-v4.png" alt="Slack datasource: ToolJet"/>

### Send Message

This operation will send/post the message to a specified channel or posting to direct messages (also known as DMs or IMs) in your slack workspace.

#### Required Parameters
- Channel
- Message

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/send-msg-v4.png" alt="Slack datasource: ToolJet"/>

### List Messages

This operation will get the messages from a specified channel.

#### Required Parameters
- Channel

#### Optional Parameters
- Limit
- Next Cursor

<img className="screenshot-full img-full" src="/img/datasource-reference/slack/list-mems-lim-v4.png" alt="Slack datasource: ToolJet"/>
---
id: marketplace-overview
title: 'Marketplace: Overview'
---

ToolJet Marketplace allows users to enhance their workspaces by adding custom plugins (data sources) tailored to their unique requirements. This functionality facilitates the seamless integration of user-created plugins with ToolJet.

<img className="screenshot-full img-full" src="/img/marketplace/overview/marketplace-v3.png" alt="Marketplace Overview" />

## Installing a Plugin

To navigate to the Marketplace page, click on the settings icon on the bottom left of the dashboard, and click on **Marketplace** from the selection menu.

The Marketplace page will contain two tabs: **Installed** and **Marketplace**. 

Under the **Marketplace** tab, you will see a list of all the available plugins that can be installed on the workspace. To install a plugin, click on the **Install** button on the plugin's card. Once the installation is complete, the status will change from Install to **Installed**.

<img className="screenshot-full img-full" src="/img/marketplace/overview/allplugins-v3.png" alt="List of All Plugins" /> 

## Using Marketplace Plugins

You can access any installed plugins by following these steps:

- Navigate to the **Data sources** tab in the dashboard.
- Scroll down to **Plugins**.

You can now see the list of installed marketplace plugins that you can configure as data sources.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/overview/installed-plugins-v2.png" alt="Installed plugins" />

- After successfully configuring a plugin, you can access it when trying to add a new query from the Query Panel.

## Removing a Plugin

:::caution
If you remove a plugin, all the queries associated with it will be eliminated from the applications.
:::

To remove a plugin, follow these steps:
- Click on the settings icon on the bottom left of the dashboard, and click on `Marketplace` from the selection menu.
- On the `Installed` page, click on the `Remove` button of the related plugin that you wish to remove.

## Available Plugins

<div style={{ display: 'flex' }} >

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/anthropic.svg" alt="Installed plugins" /> <br/>
[Anthropic](/docs/marketplace/plugins/marketplace-plugin-anthropic)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/Redshift.svg" alt="Installed plugins" /> <br/>
[AWS Redshift](/docs/marketplace/plugins/marketplace-plugin-awsredshift)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/textract.svg" alt="Installed plugins" /> <br/>
[AWS Textract](/docs/marketplace/plugins/marketplace-plugin-textract)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/lambda.svg" alt="Installed plugins" /> <br/>
[AWS Lambda](/docs/marketplace/plugins/marketplace-plugin-aws-lambda)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/cohere.svg" alt="Installed plugins" /> <br/>
[Cohere](/docs/marketplace/plugins/marketplace-plugin-cohere)
</center>
</div>

</div>

<div style={{ display: 'flex' }} >

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/engagespot.svg" alt="Installed plugins" /> <br/>
[Engagespot](/docs/marketplace/plugins/marketplace-plugin-engagespot)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/Redshift.svg" alt="Installed plugins" /> <br/>
[AWS Redshift](/docs/marketplace/plugins/marketplace-plugin-awsredshift)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/textract.svg" alt="Installed plugins" /> <br/>
[AWS Textract](/docs/marketplace/plugins/marketplace-plugin-textract)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/lambda.svg" alt="Installed plugins" /> <br/>
[AWS Lambda](/docs/marketplace/plugins/marketplace-plugin-aws-lambda)
</center>
</div>

<div style = {{ width:'40px' }} > </div>

<div style = {{ width:'15%' }} >
<center> 
<img style = {{ width:'80px' }} className="screenshot-full img-s" src="/img/marketplace/logo/cohere.svg" alt="Installed plugins" /> <br/>
[Cohere](/docs/marketplace/plugins/marketplace-plugin-cohere)
</center>
</div>

</div>


- **[GitHub](/docs/marketplace/plugins/marketplace-plugin-github)**
- **[Google Calendar](/docs/marketplace/plugins/marketplace-plugin-googlecalendar)**
- **[HarperDB](/docs/marketplace/plugins/marketplace-plugin-harperdb)**
- **[Hugging Face](/docs/marketplace/plugins/marketplace-plugin-hugging_face)**
- **[Jira](/docs/marketplace/plugins/marketplace-plugin-jira)**
- **[Mistral AI](/docs/marketplace/plugins/marketplace-plugin-mistral_ai)**
- **[OpenAI](/docs/marketplace/plugins/marketplace-plugin-openai)**
- **[Pinecone](/docs/marketplace/plugins/marketplace-plugin-pinecone)**
- **[Plivo](/docs/marketplace/plugins/marketplace-plugin-plivo)**
- **[Pocketbase](/docs/marketplace/plugins/marketplace-plugin-pocketbase)**
- **[Portkey](/docs/marketplace/plugins/marketplace-plugin-portkey)**
- **[PrestoDB](/docs/marketplace/plugins/marketplace-plugin-Presto)**
- **[Qdrant](/docs/marketplace/plugins/marketplace-plugin-qdrant)**
- **[Salesforce](/docs/marketplace/plugins/marketplace-plugin-salesforce)**
- **[Sharepoint](/docs/marketplace/plugins/marketplace-plugin-sharepoint)**
- **[Supabase](/docs/marketplace/plugins/marketplace-plugin-supabase)**
- **[Weaviate](/docs/marketplace/plugins/marketplace-plugin-weaviate)**

:::info For Plugin Developers
Refer to the **[Plugin Development guide](/docs/contributing-guide/marketplace/marketplace-setup)** to learn how to create plugins for the ToolJet Marketplace.
:::

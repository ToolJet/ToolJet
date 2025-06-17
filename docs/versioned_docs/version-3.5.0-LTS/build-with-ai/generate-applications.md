---
id: generate-applications
title: Generate Applications
---

This guide explains how to quickly generate and modify business applications using ToolJet. You can create an app from scratch with a single prompt or enhance an existing app with AI-powered assistance.

:::warning
If you are a self-hosted user, please configure the configuratoins mentioned under the [Self-hosted Configuration](/docs/build-with-ai/generate-applications#self-hosting-configuration) section below.
:::

## Creating Application
To create an application, follow these steps:

1. **Enter a prompt** – Describe the business application you want to build in the prompt input on the dashboard.
<div style={{textAlign: 'center',  marginBottom:'15px'}}>

<img className="screenshot-full img-full" src="/img/tooljet-ai/prompt.png" alt="tooljet generate apps " />
 
</div>

:::info
The platform features a two-phase interface: an AI-first chat interface for building your initial application, followed by a visual editor for making detailed customizations and refinements. This approach matches the right tool to the right task, letting AI handle the heavy lifting while giving you direct control when you need precision.
:::

2. **App generation** – In this stage, you’ll witness the full AI-driven app creation process. It begins with ToolJet analyzing your prompt and generating a list of specifications based on your prompt. These specifications include details like navigation structure, core features, and design requirements. You can review and edit each specification before proceeding.
<div style={{textAlign: 'center',  marginBottom:'15px'}}>

<img className="screenshot-full img-full" src="/img/tooljet-ai/specs.png" alt="tooljet generate apps " />
 
</div>
Once confirmed, ToolJet sets up the database schema for the app. Using [ToolJet Database](/docs/tooljet-db/tooljet-database), it automatically creates the necessary tables and columns based on your prompt.

<div style={{textAlign: 'center',  marginBottom:'15px'}}>

<img className="screenshot-full img-full" src="/img/tooljet-ai/db.png" alt="tooljet generate apps " />
 
</div>

After the schema is ready, ToolJet begins generating the full application layout, components, and logic.

3. **Generated Application** – Once the app is generated, it opens in ToolJet’s visual editor. You can customize the app further using drag-and-drop editing or continue refining it using the AI chat assistant.

<div style={{textAlign: 'center',  marginBottom:'15px'}}>

<img className="screenshot-full img-full" src="/img/tooljet-ai/generated.png" alt="tooljet generate apps " />
 
</div>

## Modifying Application

You can modify any application in ToolJet with AI assitance, whether it's a newly created app or an existing one. You can update components and queries within your application with just a prompt. 

For example, if you want add a button in your app you can write a prompt for the same.
<div style={{textAlign: 'center',  marginBottom:'15px'}}>

<img className="screenshot-full img-full" src="/img/tooljet-ai/modify.png" alt="tooljet generate apps " />
 
</div>


## Self-hosting configuration
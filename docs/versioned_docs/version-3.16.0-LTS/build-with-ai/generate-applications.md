---
id: generate-applications
title: Generate Applications
---

This guide explains how to quickly generate and modify business applications using ToolJet. You can create an app from scratch with a single prompt or enhance an existing app with AI-powered assistance.

## Creating Application
To create an application, follow these steps:

1. **Enter a prompt** – Describe the business application you want to build in the prompt input on the dashboard.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/prompt.png" alt="tooljet generate apps" />
2. **Accept or modify requirements** – After submitting your prompt, a new app will be created, and you’ll be taken to the App Builder, where a specs files will be generated including list of features, navigation, etc. 
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/specs.png" alt="tooljet generate apps" />
    After reviewing the specs thoroughly, you can either accept or modify these specs before moving to the next step.
3. **Design Layout** - Once you accept the specs then a Design Layout will be generated, you can either accept it or modify it in the visual builder.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/ui.png" alt="tooljet generate apps" />
4. **Select Data Source** - After approving the design layout, you need to select the data source, ToolJet AI Builder currently supports two data sources - PostgreSQL and MongoDB.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/ds.png" alt="tooljet generate apps" />
5. **Database Schema** - After selecting the data source you can approve or modify the database schema.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/schema.png" alt="tooljet generate apps" />
6. **App Generation** – Once you confirm all the requirements then a fully fucntional app will be generated.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/app.png" alt="tooljet generate apps" />

## Modifying Application

You can modify any application in ToolJet with AI assistance, whether it's a newly created app or an existing one. You can update components and queries within your application with just a prompt. 
<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/modify.png" alt="tooljet generate apps" />

## Limitations

ToolJet AI supports generating queries with [RunJS](/docs/data-sources/run-js) and the following data sources:

- [Postgres](/docs/data-sources/postgresql/)
- [MongoDB](/docs/data-sources/mongodb)
---
sidebar_position: 1
---

# Introduction

ToolJet is an **open-source low-code framework** to build and deploy internal tools quickly. You can connect to your data sources such as databases ( PostgreSQL, MongoDB, MySQL, Elasticsearch, Firestore, DynamoDB and more ), API endpoints ( ToolJet supports importing OpenAPI spec & OAuth2 authorization) and external services ( Stripe, Slack, Google Sheets, etc ) and use pre-built UI widgets to build internal tools.

<img class="screenshot-full" src="/img/tutorial/adding-widget/table.gif" alt="ToolJet - Table component" height="420"/>

## How ToolJet works

ToolJet has just 3 fundamental principles to build apps:

- **Connect to data sources:** Connect to your existing data sources such as PostgreSQL, MySQL, Firestore, Stripe, Google Sheets and more.
- **Build queries:** ToolJet comes with query builders for all supported data sources. You can also use JS code to transform the query results.
- **Customise widgets:** Widgets are the UI components that can be edited using ToolJet's visual app builder. Widgets have events such as onClick, onRowSelected etc.

ToolJet binds together the data sources, queries and widgets to convert business logic into apps. 

Here is a video explaining how to build a Redis GUI using ToolJet in 3 minutes:

## Getting Started

These resources will help you to quickly build and deploy apps using ToolJet:

- **[Setup](/docs/setup/architecture)** - Learn how to setup ToolJet locally using docker.
- **[Basic Tutorial](/docs/tutorial/creating-app)** - Learn how to build simple UI and connect to data sources.
- **[Deploy](/docs/contributing-guide/setup/docker)** - Learn how to deploy TooLjet on Heroku, Kubernetes, etc 

The references for datasources and widgets:

- [Datasource Reference](/docs/data-sources/redis)
- [Widget Reference](/docs/widgets/table)

## Help and Support
We have extensively documented the features of ToolJet, but in case you are stuck, please feel to mail us: hello@tooljet.io. 
If you have found a bug, please create a GitHub issue for the same. 

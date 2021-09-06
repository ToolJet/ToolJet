---
sidebar_position: 1
---

# Introduction

ToolJet is an **open-source no-code framework** to build and deploy custom internal tools. ToolJet can connect to your data sources such as databases ( PostgreSQL, MongoDB, MySQL, Elasticsearch, Firestore, DynamoDB, Redis and more ), API endpoints ( ToolJet supports OAuth2 authorization ) and external services ( Stripe, Slack, Google Sheets, airtable and more ). Once the data sources are connected, ToolJet can run queries on these data sources to fetch and update data. The data fetched from data sources can be visualised and modified using the UI widgets such as tables, charts, forms, etc. 

<img class="screenshot-full" src="/img/introduction.gif" alt="ToolJet - introduction" height="420"/>

## How ToolJet works

ToolJet has just 3 fundamental principles to build apps:

- **Connect to data sources:** Connect to your existing data sources such as PostgreSQL, MySQL, Firestore, Stripe, Google Sheets, API endpoints, etc.
- **Build queries:** ToolJet comes with query builders for all supported data sources. ToolJet also supports the use of custom JavaScript code to transform the query results.
- **Customise widgets:** Widgets are the UI components that can be edited using ToolJet's visual app builder ( Eg: tables, charts, forms, etc ) Widgets have events such as `on click`, `on row selected`, `on page changed`, etc. Every UI widget has a dark version. 

ToolJet binds together the data sources, queries and widgets to convert business logic into custom applications.
## Getting Started

These resources will help you to quickly build and deploy apps using ToolJet:

- **[Setup](/docs/deployment/architecture)** - Learn how to setup ToolJet locally using docker.
- **[Basic Tutorial](/docs/tutorial/creating-app)** - Learn how to build simple UI and connect to data sources.
- **[Deploy](/docs/contributing-guide/setup/docker)** - Learn how to deploy ToolJet on Heroku, Kubernetes, etc 

The references for datasources and widgets:

- [Datasource Reference](/docs/data-sources/redis)
- [Widget Reference](/docs/widgets/table)

## Help and Support
We have extensively documented the features of ToolJet, but in case you are stuck, please feel to mail us: hello@tooljet.io. 
If you have found a bug, please create a GitHub issue for the same. Also, feel free to join our [slack community](https://join.slack.com/t/tooljet/shared_invite/zt-r2neyfcw-KD1COL6t2kgVTlTtAV5rtg).

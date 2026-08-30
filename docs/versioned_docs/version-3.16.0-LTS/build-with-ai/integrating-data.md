---
id: integrating-data
title: Integrating Data
---

ToolJet AI can read and understand your existing database schema to build applications with queries and data bindings already configured. Internal tools are often built to solve the problem of scattered data, information spread across multiple databases, APIs, and services. By connecting your real data sources, you can build on top of your existing data and create production-ready applications with AI rather than just prototypes with mock data.

## How It Works

When you provide a prompt, ToolJet AI first reads it for data information — data source names, data source types, and table names. Whatever it finds is used to pre-fill the corresponding step, so you approve it instead of selecting it from scratch. If your prompt carries no data information, the AI asks how you want to proceed before continuing.

A typical flow looks like this:

**Prompt → Data Clarification → Spec Doc → Select System of Record → Entity Mapping → App Generation**

How many of these steps you actually see depends on how much data information your prompt carries:

- **Data named in plain text** — The matching data source and tables are pre-filled for you to approve. The AI always asks for confirmation here, since a typed name can contain a typo or match more than one data source in the workspace.
- **Data referenced with `@`** — The selection is explicit and therefore deterministic, so no confirmation is needed and those steps are skipped. See [@mention in AI Chat](/docs/build-with-ai/referencing-app-resources) for the full list of flows.

The exact sequence can vary based on the kind of prompt you provide or how you progress through each step.

:::note Data Privacy
ToolJet AI generates applications from your table schema rather than your data. However, during discovery we cannot guarantee that it will not read data within your tables, as discovery is not deterministic and depends on the underlying model you select. See the [privacy policy](/docs/build-with-ai/privacy) for details.
:::

## Choosing How to Start

When the AI needs more information about your data, it asks you to pick one of the following:

| <div style={{ width:"150px"}}> Option </div> | What happens |
|:--- |:--- |
| **Existing database with tables** | The application is built on tables that already exist. The AI scans the data source for relevant tables only if you haven't named any, or if some of the tables it needs are still missing. |
| **Existing database, no tables** | The flow starts with the spec doc, then asks which data source the new tables should be created in, and presents the schema for your approval. |
| **Sample data** | All data steps are skipped and the flow moves directly to the spec doc. |

## Building With Existing Data

### Starting With Existing Data

1. **Enter a prompt**: Describe the application you want to build in the prompt input on the dashboard. Naming your data source or tables here - or [@mentioning](/docs/build-with-ai/referencing-app-resources) them - lets the AI pre-fill or skip the steps below.
2. **Choose your data**: If the AI needs clarification, it asks how you want to proceed. Select **existing database with tables**.
3. **Review the spec doc**: The AI generates a specification document outlining the features, navigation, and requirements. Review and approve it.
4. **Select system of record**: Choose the data source your application will be built on. You can select only one data source, so this step refers to your core data source — your system of record. If you named a data source in your prompt, it is pre-filled and you only need to approve it. <br/>
    <img style={{marginTop:'15px'}} className="screenshot-full img-s"  src="/img/tooljet-ai/integrate-data/choose-ds.png" alt="Choose Your DS" />
5. **Review entity mapping**: The AI reads your database tables, then presents a mapping of entities to the relevant tables. Tables you named in your prompt are pre-filled and take precedence. Review and approve the mapping. <br/>
    <img style={{marginTop:'15px'}} className="screenshot-full img-s"  src="/img/tooljet-ai/integrate-data/entity-mapping.png" alt="Entity Mapping" />
6. **App generation**: The AI generates the final application with all queries and data bindings configured against your real data.

### Starting Without Existing Tables

If you have a database connected but no tables to build on yet, select **existing database, no tables**. The flow starts with the spec doc instead of data selection:

1. **Review the spec doc**: The AI generates the specification document first.
2. **Select a data source**: Choose the data source the new tables should be created in.
3. **Approve the schema**: The AI proposes a schema for the tables it needs. Review and approve it.
4. **App generation**: The AI creates the tables and generates the application against them.

### Starting With Sample Data and Connecting Later

If you start with sample data, you can connect your existing data sources at any time:

1. **Generate with sample data**: Build your application using sample data first.
2. **Prompt to connect data**: Enter a prompt in the AI chat asking to connect your application to real data.
3. **Select system of record**: Choose the data source you want to connect. As in a fresh build, naming or [@mentioning](/docs/build-with-ai/referencing-app-resources) the data source in your prompt pre-fills or skips this step.
4. **Review entity mapping**: The AI maps your application's entities to the relevant tables. If there's missing information, the AI will ask whether it should update the schema or create new tables as needed.
5. **Approve and regenerate**: Once you approve the mapping, the AI regenerates the application with real data bindings.

## Entity Mapping

Entity mapping is the step where the AI shows you which database tables it will use for each entity in your application.

Entity mapping applies to **databases only**. A database schema determines how the application gets built, so the mapping needs your review. Data sources that expose endpoints instead of tables — such as OpenAPI and third-party integrations — skip this step, since an application may need a large number of endpoints whose behaviour you already know.

An entity can use more than one table. For example, an *Orders* entity might pull from both an `orders` table and an `order_items` table.

If you named tables in your prompt, those tables take precedence and are pre-filled in the mapping. The AI still scans the data source to check whether any additional tables are needed.

You can modify the entity mapping before approving it:

- View the complete list of tables available in your database.
- Search for a specific table by name.
- Add or remove tables for any entity.

## Limitations

- Currently, only the following data sources are supported:

    <div style={{ display: 'flex' }} >

    <div style = {{ width:'40%' }} >

    - PostgreSQL
    - MongoDB
    - OpenAPI
    - Gmail
    - Google Calendar

    </div>

    <div style = {{ width:'5%' }} > </div>

    <div style = {{ width:'40%' }} >

    - HubSpot
    - OpenAI
    - ServiceNow
    - Quickbooks
    - Databricks

    </div>

    </div>

- Currently, ToolJet AI can connect to only one data source per application. 

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

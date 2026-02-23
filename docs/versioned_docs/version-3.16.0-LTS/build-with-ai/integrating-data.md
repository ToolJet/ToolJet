---
id: integrating-data
title: Integrating Data
---

ToolJet AI can read and understand your existing database schema to build applications with queries and data bindings already configured.

## How It Works

When you provide a prompt, ToolJet AI asks whether you want to use your existing data or proceed with sample data. If you choose existing data, the AI reads through your database tables or API endpoints to identify the entities relevant to your application. It then presents an **entity mapping** for your approval before generating the final application.

The overall flow is:

**Prompt → Spec Doc → Select Data Source → Entity Mapping → App Generation**

Since the data layer is already connected, the AI skips the layout-only step with dummy data and generates the final application directly with real data bindings.

## Building With Existing Data

### Starting With Existing Data

1. **Enter a prompt**: Describe the application you want to build in the prompt input on the dashboard.
2. **Choose your data**: The AI will ask if you have an existing data source or want to proceed with sample data. Select **existing data**. <br/>
    <img style={{marginTop:'15px'}} className="screenshot-full img-s"  src="/img/tooljet-ai/integrate-data/choose-data.png" alt="Choose Your Data" />
3. **Review the spec doc**: The AI generates a specification document outlining the features, navigation, and requirements. Review and approve it.
4. **Select data source**: Choose data source needed for your application. You can select only one data sources. <br/>
    <img style={{marginTop:'15px'}} className="screenshot-full img-s"  src="/img/tooljet-ai/integrate-data/choose-ds.png" alt="Choose Your DS" />
5. **Review entity mapping**: The AI reads your database tables and API endpoints, then presents a mapping of entities to the relevant tables. Review and approve the mapping. <br/>
    <img style={{marginTop:'15px'}} className="screenshot-full img-s"  src="/img/tooljet-ai/integrate-data/entity-mapping.png" alt="Entity Mapping" />
6. **App generation**: The AI generates the final application with all queries and data bindings configured against your real data.

### Starting With Sample Data and Connecting Later

If you start with sample data, you can connect your existing data sources at any time:

1. **Generate with sample data**: Build your application using sample data first.
2. **Prompt to connect data**: Enter a prompt in the AI chat asking to connect your application to real data.
3. **Select data source**: Choose the data source you want to connect.
4. **Review entity mapping**: The AI maps your application's entities to the relevant tables. If there's missing information, the AI will ask whether it should update the schema or create new tables as needed.
5. **Approve and regenerate**: Once you approve the mapping, the AI regenerates the application with real data bindings.

### Using Detailed Technical Prompts

If your initial prompt includes enough technical detail (e.g., specific table names, schema references, or data source information), the AI can skip the confirmation step and directly generate the spec doc, since it already knows you're working with existing data.

1. **Enter a detailed prompt**: Include specifics about your data structure and requirements.
2. **Review the spec doc**: Approve or modify the generated specifications.
3. **Select data source**: Choose the relevant data source for the application.
4. **Review entity mapping**: Approve or modify the entity-to-table mapping.
5. **App generation**: The final application is generated with real data bindings.

## Entity Mapping

Entity mapping is the step where the AI shows you which database tables or API data sources it will use for each entity in your application.

- **For databases** — The mapping shows the specific table names that will be used for each entity.
- **For APIs (OpenAPI)** — The mapping shows the data source name.

An entity can use more than one table. For example, an *Orders* entity might pull from both an `orders` table and an `order_items` table.

### Modifying Entity Mapping

You can modify the entity mapping before approving it:

- View the complete list of tables available in your database.
- Search for a specific table by name.
- Add or remove tables for any entity.

## Limitations

- Database support is currently limited to **PostgreSQL** and **MongoDB**.
- API support is limited to **OpenAPI** specifications.
- You can only connect to one data source at a time.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

---
id: tooljet-database
title: Overview
---

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. ToolJet database require no setup and gives you a powerful user interface for managing your data.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/tjdb-v2.png" alt="ToolJet database" />
</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Enabling the ToolJet Database for your instance

Requires:
- PostgREST server
- Additional configuration for ToolJet server

This feature is only enabled if [`ENABLE_TOOLJET_DB`](/docs/setup/env-vars) is set to `true`.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### PostgREST Server

PostgREST is a standalone web server that turns your PostgreSQL database directly into queryable RESTful APIs which is utilized for ToolJet Database. This server only communicates with the ToolJet server and therefore does not need to be publicly exposed.

:::tip
If you have openssl installed, you can run the 
command `openssl rand -hex 32` to generate the value for `PGRST_JWT_SECRET`.

If this parameter is not specified, then PostgREST refuses authentication requests.
:::

| <div style={{ width:"100px"}}> Variable  </div>         | <div style={{ width:"100px"}}> Description  </div>                                   |
| ------------------ | ----------------------------------------------- |
| PGRST_JWT_SECRET   | JWT token client provided for authentication    |
| PGRST_DB_URI       | database connection string for tooljet database |
| PGRST_LOG_LEVEL    | `info`                                          |

:::info
Please make sure that DB_URI is given in the format `postgres://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`
:::

</div>

#### Additional ToolJet server configuration


| <div style={{ width:"100px"}}> Variable </div>           | <div style={{ width:"100px"}}> Description </div>                                  |
| ------------------ | -------------------------------------------- |
| ENABLE_TOOLJET_DB  | `true` or `false`                            |
| TOOLJET_DB         | Default value is `tooljet_db`                |
| TOOLJET_DB_HOST    | database host                                |
| TOOLJET_DB_USER    | database username                            |
| TOOLJET_DB_PASS    | database password                            |
| TOOLJET_DB_PORT    | database port                                |
| PGRST_JWT_SECRET   | JWT token client provided for authentication |
| PGRST_HOST         | postgrest database host                      |


If you intend to make changes in the above configuration. Please refer [PostgREST configuration docs](https://postgrest.org/en/stable/configuration.html#environment-variables).

:::tip
When this feature is enabled, the database name provided for `TOOLJET_DB` will be utilized to create a new database during server boot process in all of our production deploy setups.
In case you want to trigger it manually, use the command `npm run db:create` on ToolJet server.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Features

ToolJet database allows you to:

- **Maintain tables of data** in a secure database that's only accessible within your ToolJet organization.
- **Edit, search, filter, sort, and filter** data using a spreadsheet-like interface.
- **Quickly build applications and write queries** to interact with the ToolJet Database, just like any other datasource but without any setup.
- **Export schema** from the ToolJet Database to a JSON file.
- Uniquely identify each record in a table using **Primary Keys**, ensuring data integrity and enabling efficient querying and indexing.
- Establish relationships between tables using **Foreign Keys**, allowing you to create associations based on the Primary Key of one table and maintain referential integrity.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Accessing ToolJet Database

Once you log-in to your ToolJet account, from the left sidebar of the dashboard you can navigate to **ToolJet Database**.

The ToolJet Database is available on: **[ToolJet Cloud](https://tooljet.ai)**, **[Self-Host](/docs/setup/)**, and **Enterprise Edition**. You can manage your database and its data using the **Database editor UI**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/tjdbside-v2.png" alt="ToolJet database" />
</div>

</div>



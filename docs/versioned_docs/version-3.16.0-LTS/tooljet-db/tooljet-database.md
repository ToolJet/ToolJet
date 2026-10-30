---
id: tooljet-database
title: ToolJet Database Overview
sidebar_label: Overview
---

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. ToolJet database require no setup and gives you a powerful user interface for managing your data.

<img className="screenshot-full img-full" src="/img/tjdb/preview.png" alt="ToolJet Database" />

## Features

ToolJet database allows you to:

- **Maintain tables of data** in a secure database that's only accessible within your ToolJet organization.
- **Edit, search, filter, sort, and filter** data using a spreadsheet-like interface.
- **Use the SQL editor** to write and execute complex SQL queries directly on your ToolJet database, providing more advanced data manipulation and retrieval capabilities.
- **Quickly build applications and write queries** to interact with the ToolJet Database, just like any other datasource but without any setup.
- **Export schema** from the ToolJet Database to a JSON file.
- Uniquely identify each record in a table using **Primary Keys**, ensuring data integrity and enabling efficient querying and indexing.
- Establish relationships between tables using **Foreign Keys**, allowing you to create associations based on the Primary Key of one table and maintain referential integrity.

## Accessing ToolJet Database

Once you log-in to your ToolJet account, from the left sidebar of the dashboard you can navigate to **ToolJet Database**.

The ToolJet Database is available on both **[ToolJet Cloud](https://tooljet.com)** and **[Self Hosted](/docs/setup/)** deployment. You can manage your database and its data using the **Database editor UI**.

<img className="screenshot-full img-m" src="/img/tjdb/tjdb-panel.png" alt="ToolJet database" />

## Table and Row Limits

Your ToolJet license can set a maximum number of ToolJet Database tables and rows. If your license doesn't set these limits, you can create unlimited tables and rows.

- **What counts:** The table limit counts the tables in the current workspace. The row limit counts rows across all tables combined: in the current workspace on ToolJet Cloud, and in every workspace on the instance on self-hosted ToolJet.
- **Close to the limit:** When you've used 90% of either limit, a banner in the Database editor shows how many tables and rows you've used.
- **Table limit reached:** The **Create new table** button is disabled, and creating a table fails with *You have reached your workspace's maximum limit for ToolJet Database tables.*
- **Row limit reached:** Adding rows fails with *You've reached your limit of rows in ToolJet database tables. Upgrade for more.* This applies to the Database editor, CSV bulk upload, **Create row** and **Bulk upsert with primary key** queries, and `INSERT` statements in the SQL editor. A bulk upload stops when it reaches the limit.

Updating and deleting existing rows still works when you've reached the row limit.

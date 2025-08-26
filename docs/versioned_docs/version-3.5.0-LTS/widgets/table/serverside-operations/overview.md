---
id: overview
title: Overview
---

This guide explains how to perform server side operations on a table component in ToolJet. Most databases support server side operations, but the specific implementation may vary by database. This guide uses PostgreSQL as the data source to demonstrate the process.

<div style={{paddingTop:'24px'}}>

## Server Side v/s Client Side

Server side operations refer to tasks executed on the server, such as data fetching, filtering, sorting, and pagination. Server side operations use server resources, efficiently handling large datasets and ensuring faster load times for users. In contrast, client side operations are performed in the user's browser or application, which may lead to performance issues with large datasets as all data is first fetched and then processed locally. Server side operations offer better scalability and performance, especially for resource-intensive tasks.

### When to Use Sever Side Operations?

1. Handling Large Datasets
2. Security and Data Integrity
3. Complex Business Logic

### When to Use Client Side Operations?

1. Real-time Interactivity
2. Reduced Server Load
3. Offline Capabilities

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

The following server side operations can be performed on a Table in ToolJet:

- [Search](/docs/widgets/table/serverside-operations/search/)
- [Sort](/docs/widgets/table/serverside-operations/sort/)
- [Filter](/docs/widgets/table/serverside-operations/filter/)
- [Pagination](/docs/widgets/table/serverside-operations/pagination/)

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/serverside-operations.png" alt="Serverside Operations Present for Table Component in ToolJet" />

</div>
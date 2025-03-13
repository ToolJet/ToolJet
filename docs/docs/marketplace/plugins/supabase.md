---
id: marketplace-plugin-supabase
title: Supabase
---

# Supabase

ToolJet connects to your Supabase database, allowing you to directly interact with your  Supabase back-end from within your ToolJet application.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

- To connect to Supabase you need to have the Project URL and Service Role Secret. You can find these credentials in your API Settings on the Supabase dashboard. Make sure to copy the Service Role Secret key. This key has the ability to bypass Row Level Security.

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/api_settings.png" alt="Supabase API Settings" />


- Establish a connection to Supabase by either clicking `+Add new Data source` on the query panel or navigating to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard.

- Enter your Project URL and Service Role Secret into their designated fields.

- Click **Test Connection** to validate your credentials. Click **Save** to store the data source.

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/supabase_install-v2.png" alt="Supabase Install" />

## Querying Supabase

- To perform queries on Supabase in ToolJet, click the **+Add** button in the [query manager](/docs/app-builder/query-panel/#query-manager) located at the bottom panel of the editor.
- Select the previously configured Supabase datasource.

- In the Operation dropdown, select the desired operation type. ToolJet currently [supports](#supported-operations) five query types for Supabase interactions.

- Enter the table name and other required parameters for the selected operation and click on **Run** button to run the query.

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/tutorial/transformations).
:::

## Supported Operations

You can create query for Supabase data source to perform several operations such as:
  1. **[Get Rows](#get-rows)**
  2. **[Create Row(s)](#create-rows)**
  3. **[Update Row(s)](#update-rows)** 
  4. **[Delete Row(s)](#delete-rows)** 
  5. **[Count Rows](#count-rows)** 

### Get Rows

  #### Required parameters:
  - **Table** - Database table name.



  #### Optional Parameters:
  - **Where** - Filter rows based on a condition.
  - **Sort** - Sort rows based on a column.
  - **Limit** - Limit the number of rows returned.

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/get_rows-v2.png" alt="Get Rows" />

<details>
<summary>**Example Values**</summary>

```yaml
Table: comments
Where: likes , Greater Than , 90
Sort: created_at , Ascending 
Limit: 2
```

</details>

<details>
<summary>**Example Response**</summary>

```yaml
[
  {
    "id": 1,
    "created_at": "2025-02-12T08:50:25.780412+00:00",
    "likes": 99,
    "content": "CFBR!"
  },
  {
    "id": 4,
    "created_at": "2025-02-12T11:34:26.624735+00:00",
    "likes": 108,
    "content": "Saved!"
  }
]
```
</details>

### Create Row(s)

  #### Required parameters:
  - **Table** - Database table name.
  - **Body** - Data to be inserted into the table. It should be an array of object(s).

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/create_rows-v2.png" alt="Create Rows" />

<details>
<summary>**Example Values**</summary>

```yaml
Table: comments
Body: [
  {"content": "CFBR!", "likes": 96},
  {"content": "Reposted!", "likes": 54}
]
```

</details>

<details>
<summary>**Example Response**</summary>

```yaml
created: true
```
</details>

### Update Row(s)

  #### Required parameters:
  - **Table** - Database table name.
  - **Columns** - Column name and value to be updated.


  #### Optional Parameters:
  - **Where** - Update rows based on a condition. If not provided, all rows will be updated.

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/update_rows-v2.png" alt="Update Rows" />

<details>
<summary>**Example Values**</summary>

```yaml
Table: comments
Where: likes , Greater Than , 100
Column: likes , 50
```

</details>

<details>
<summary>**Example Response**</summary>

```yaml
[
  {
    "id": 4,
    "created_at": "2025-02-12T11:34:26.624735+00:00",
    "likes": 50,
    "content": "Saved!"
  }
]
```
</details>

### Delete Row(s)

  #### Required parameters:
  - **Table** - Database table name.
  - **Where** - Delete rows based on a condition.

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/delete_rows-v2.png" alt="Delete Rows" />

<details>
<summary>**Example Values**</summary>

```yaml
Table: comments
Where: likes , Greater Than , 100
```

</details>

<details>
<summary>**Example Response**</summary>

```yaml
deleted: true
```
</details>

### Count Rows

  #### Required parameters:
  - **Table** - Database table name.



  #### Optional Parameters:
  - **Where** - Filter rows based on a condition.

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/count_rows-v2.png" alt="Count Rows" />

<details>
<summary>**Example Values**</summary>

```yaml
Table: comments
Where: likes , Greater Than , 60
```

</details>

<details>
<summary>**Example Response**</summary>

```yaml
count: 2
```
</details>

<br/>
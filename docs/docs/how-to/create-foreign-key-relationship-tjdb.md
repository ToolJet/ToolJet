---
id: create-foreign-key-relationship-tjdb
title: Creating Foreign Key Relationships in ToolJet Database
---
<div style={{paddingBottom:'24px'}}>

ToolJet Database now supports foreign key constraints. This allows you to establish links between data in different tables. This guide will walk you through the process of creating a foreign key relationship in the ToolJet Database, along with an example to illustrate the concept.

## What is a Foreign Key Relationship?

A foreign key relationship is a constraint that links one or more columns in a table (the source table) to the unique constraint key column(s) in another table (the target table). It ensures that the values in the foreign key column(s) of the source table match the values in the primary key or unique constraint column(s) of the target table.<br/>
By creating a foreign key relationship, you can maintain data integrity and prevent the insertion or modification of records that would violate the relationship between the tables.

## Creating a Foreign Key Relationship
To create a foreign key relationship in the ToolJet Database, follow these steps:

1. **Create the Source and Target Tables**: Ensure that both the source and target tables exist. The target table should have a defined primary key or unique constraint column(s).

2. **Open the Source Table**: Open the source table where you want to create the foreign key relationship.

3. **Add a Foreign Key Column**: If the source table doesn't already have a column to serve as the foreign key, add a new column with an appropriate data type that matches the primary key or unique constraint column(s) in the target table.

4. **Define the Foreign Key Relationship**: Click on the **+ Add Relation** button under the Foreign Key Relation section for the desired Source table.
   - In the **Source** section, select the column from the source table that will act as the foreign key.
   - In the **Target** section, select the target table and the column that serves as the primary key or unique constraint.
   - Choose the desired action to be performed when the referenced row is updated or deleted (e.g., CASCADE, RESTRICT, SET NULL, SET DEFAULT).

5. **Save Changes**: Click on the **Save Changes** button to create the foreign key relationship.

## Example: Creating a Foreign Key Relationship

Let's consider an example where we want to create a foreign key relationship between the `Orders` and `Customers` tables in an e-commerce application.

First, create the following two tables in the ToolJet Database:

**Customers**

| Column Name | Data Type | Primary Key    | Null | Unique  |
|-------------|-----------|:--------------:|:------:|:--------:|
| customer_id | int       | ✅             | ❌    | ✅      |
| name        | varchar   | ❌             | ❌    | ❌      |
| email       | varchar   | ❌             | ❌    | ✅      |

**Orders**

| Column Name  | Data Type | Primary Key    | Null | Unique  |
|--------------|-----------|:--------------:|:------:|:--------:|
| order_id     | int       |  ✅            | ❌    | ✅      |
| customer_id  | int       |  ❌            | ❌    | ❌      |
| order_date   | varchar   |  ❌            | ❌    | ❌      |
| total_amount | float     |  ❌            | ❌    | ❌      |

We want to create a foreign key relationship between the `customer_id` column in the `Orders` table and the `customer_id` column in the `Customers` table.

1. **Define the Foreign Key Relationship**
   - Edit the `Orders` table.
   - Click on the **+ Add Relation** button under the Foreign Key Relation section.
   - In the **Source** section, select the `customer_id` column.
   - In the **Target** section, select the `Customers` table and the `customer_id` column.
   - Choose the desired action, for example, **RESTRICT** to prevent deleting a customer that has associated orders.

3. **Save Changes**: Click the **Save Changes** button to create the foreign key relationship.

Now, whenever you try to insert or update a record in the `Orders` table, the `customer_id` value must correspond to an existing `customer_id` value in the `Customers` table. This is also prevent you from deleting a customer that has associated orders. This ensures that orders are always associated with a valid customer, maintaining data integrity and consistency.

</div>


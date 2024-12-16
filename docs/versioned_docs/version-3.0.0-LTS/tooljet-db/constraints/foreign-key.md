---
id: foreign-key
title: Foreign Key
---

A foreign key relation refers to linking one column or set of columns of the current table with one column or set of columns in an existing table. This relationship establishes a connection between the two tables, enabling the current source table to reference the existing target table. While creating a Foreign Key relationship, you can select the desired [action](#foreign-key-actions) to be performed on the source row when the referenced(target) row is updated or deleted.

<div style={{paddingTop:'24px'}}>

## Constraints
- The target table must contain a column having the same data type as the column in the source table.
- The column that has to be referenced in the target table must have Unique constraint explicitly.
- The target table must already exist before adding the Foreign Key relationship in the source table.

## Limitations
- Self-references are not allowed i.e. Target table and Source table cannot be the same.
- No foreign key can be created with a column of serial data type in the source table.
- No foreign key can be reference a column in target table that is a part of its composite Primary key.

## Exception
- The foreign key created with a column having integer data type in the source table can also reference a column of serial data type in the target table.

</div>

<div style={{paddingTop:'24px'}}>

## Creating Foreign Key

While creating/editing a table(target), you will be able to add one or more than one Foreign Keys referencing the column(s) of other existing(source) tables.
To create a Foreign Key relationship, follow these steps:

 - Create or edit an existing table.
 - Click on the `+ Add Relation` button under the Foreign key relation section.
 - The table which is being created/edited is the source table.
 - Under the source section, select the desired column from the dropdown menu.
 - Under the target section, select the desired target table and Column from the dropdown menu.
 - Under the Actions section, select the desired action to be performed when the referenced row is updated or deleted.
 - Click on the `Create` button to create the Foreign Key relationship.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/create-fk.gif" alt="ToolJet database"/>

</div>

<div style={{paddingTop:'24px'}}>

## Foreign Key Actions

When creating a foreign key relationship, ToolJet Database lets you choose from several actions to be performed on the source row when the referenced row in the target table is updated or deleted.

### On Update

| Option | Description |
| --- | --- |
| Restrict (default) | Restrict any updates on target table if any referenced row is being updated. |
| Cascade | Any updates in referenced row in target table will show up in the source table as well. |
| Set NULL | Any updates in referenced row in target table will set it's instances in the source table as NULL. |
| Set to Default | Any updates referenced row in target table will set it's instances in the source table as default value of foreign key column of source table. |

### On Delete

| Option | Description |
| --- | --- |
| Restrict (default) | Restrict any deletion on target table if any referenced row is being updated. |
| Cascade | Any deletion of referenced row in target table will delete the row having it's instance in the source table as well. |
| Set NULL | Any deletion of referenced row in target table will set it's instances in the source table as NULL. |
| Set to Default | Any deletion of referenced row in target table will set it's instances in the source table as default value of foreign key column of source table. |

</div>

<div style={{paddingTop:'24px'}}>

## Referential Integrity

The foreign key constraint ensures referential integrity between the source and target tables. This constraint enforces that the foreign key column in the source table has one of the unique values present in the foreign key column in the target table. <br/>
- When creating a new row in the source table the column with the foreign key relation will have a dropdown with the unique values present in the target table. This ensures that the data in the source table is always consistent with the data in the target table. 
- On the bottom of the dropdown, there is a button to **Open referenced table** which will take you to the target table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/create-new-row-fk.png" alt="ToolJet database" />

- When editing the value of a foreign key cell in an existing row of the source table, the dropdown will show the unique values present in the target table. This ensures that even when the data in the source table is being updated, it is always consistent with the data in the target table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/edit-row-fk.png" alt="ToolJet database" />

### Example

Let's consider an example where we want to create a foreign key relationship between the `Orders` and `Customers` tables in an e-commerce application.

First, create the following two tables in the ToolJet Database:

**Customers**

| Column Name | Data Type | Primary Key    | Not Null | Unique   |
|-------------|-----------|:--------------:|:--------:|:--------:|
| customer_id | int       | ✅             | ✅        | ✅       |
| name        | varchar   | ❌             | ✅        | ❌       |
| email       | varchar   | ❌             | ✅        | ✅       |

**Orders**

| Column Name  | Data Type | Primary Key    | Not Null | Unique   |
|--------------|-----------|:--------------:|:--------:|:--------:|
| order_id     | int       |  ✅            | ✅        | ✅       |
| customer_id  | int       |  ❌            | ✅        | ❌       |
| order_date   | varchar   |  ❌            | ✅        | ❌       |
| total_amount | float     |  ❌            | ✅        | ❌       |

We want to create a foreign key relationship between the `customer_id` column in the `Orders` table and the `customer_id` column in the `Customers` table.

1. **Define the Foreign Key Relationship**
   - Edit the `Orders` table.
   - Click on the **+ Add Relation** button under the Foreign Key Relation section.
   - In the **Source** section, select the `customer_id` column.
   - In the **Target** section, select the `Customers` table and the `customer_id` column.
   - Choose the desired action, for example, **RESTRICT** to prevent deleting a customer that has associated orders.

2. **Save Changes**: Click the **Save Changes** button to create the foreign key relationship.

Now, whenever you try to insert or update a record in the `Orders` table, the `customer_id` value must correspond to an existing `customer_id` value in the `Customers` table. This is also prevent you from deleting a customer that has associated orders. This ensures that orders are always associated with a valid customer, maintaining data integrity and consistency.

</div>
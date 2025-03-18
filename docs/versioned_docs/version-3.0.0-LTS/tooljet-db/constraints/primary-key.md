---
id: primary-key
title: Primary Key
---

ToolJet Database supports both single field and composite primary keys.

<div style={{paddingTop:'24px'}}>

## Creating Single Field Primary Key

When creating a new table, an `id` column with the `serial` data type is automatically generated to serve as the primary key. However, you can designate any other column as the primary key if desired. The primary key column can be of any supported data type except Boolean.
The constraints for the primary key column ensure the integrity and uniqueness of the primary key, which is essential for properly identifying and referencing records within the table. To create a single field primary key, follow these steps:

 - Create or edit an existing table.
 - Check the **Primary** checkbox on the column which you want to set as the primary key. 
 - This will automatically add the primary key constraint to the column.
 - Click on the **Create** button to create the table.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/single-field-pk.gif" alt="ToolJet database"/>

### Constraints
- The primary key column cannot contain null values.
- The primary key column must have unique values across all rows.

### Limitations
- Every table must have at least one primary key.
- The primary key column cannot have the Boolean data type.

</div>

<div style={{paddingTop:'24px'}}>

## Creating Composite Primary Key

You have the option to convert an existing primary key column into a composite primary key, consisting of two or more columns.
By utilizing a composite primary key, you can uniquely identify records based on multiple column values, providing greater flexibility and control over your data structure. To create a composite primary key, follow these steps:

 - Create or edit an existing table.
 - Check the **Primary** checkbox on multiple columns to set them as the composite primary key. 
 - This will automatically add the primary key constraint to the selected columns.
 - Click on the **Save changes/Create** button to update/create the table.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/v2-beta/database/ux2/composite-pk.gif" alt="ToolJet database"/>

### Constraints
- None of the composite key columns can contain null values.
- The combination of values across all composite key columns must be unique for each row in the table.

### Limitation
- The composite key columns cannot be of the Boolean data type.

</div>

<div style={{paddingTop:'24px'}}>

## Modifying Primary Key

After creating a table, you can designate any column as the primary key, provided it adheres to the required constraints. If the chosen column already contains data, the existing values must comply with the primary key constraints. However, you cannot update or modify the primary key of a target table if it is currently being referenced as a foreign key in any other source tables. To modify the primary key, follow these steps:

 - Edit an existing table.
 - Check the **Primary** checkbox on the column which you want to set as the primary key.
 - This will automatically add the primary key constraint to the column.
 - Uncheck the **Primary** checkbox on the existing primary key column. The primary key constraints will still stay in place for this column but are no longer necessary.
 - Click on the **Save changes** button to update the table.

<img className="screenshot-full" src="/img/v2-beta/database/ux2/modify-pk.gif" alt="ToolJet database"/>

</div>

<div style={{paddingTop:'24px'}}>

## Deleting Primary Key

An existing primary key column can be deleted through the **Edit Table** panel. To delete the primary key column, follow these steps:

- Edit an existing table.
- Select a different column to serve as the new primary key for the table.
- Once the new primary key column is designated, you can proceed to the existing primary key column.
- Uncheck the **Primary** checkbox for the existing primary key column to remove its primary key status.
- After removing the primary key constraint, you can delete this column from the table.

You cannot delete a Primary Key of a target table if it is being used as a foreign key in any source table(s).

<img className="screenshot-full" src="/img/v2-beta/database/ux2/delete-pk.gif" alt="ToolJet database"/>

</div>
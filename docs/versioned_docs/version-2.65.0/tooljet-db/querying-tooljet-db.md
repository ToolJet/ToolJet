---
id: querying-tooljet-db
title: Querying Data
---

Querying the ToolJet database is as easy as querying any other data source on ToolJet.

- Go to the **Query panel**, and click on the **+Add** button to add a new query, and select **ToolJet Database**.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/v2-beta/database/newui/qtjdb.png" alt="ToolJet Database editor" />
</div>

- Select the table you want to query and the operation from the dropdown, then enter the required parameters for the selected operation. Click on the **Run** button to execute the query.<br/>
The selected operation should adhere to the column constraints of the selected table.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/v2-beta/database/newui/qtjdb2.png" alt="ToolJet Database editor" />
</div>


<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Available Operations

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### List Rows
This operation returns all the records from the table.

#### Optional Parameters
- **Filter**: Add a condition by choosing a column, an operation, and the value for filtering the records.
- **Sort**: Sort the query response by choosing a column and the order (ascending or descending).
- **Limit**: Limit the number of records to be returned by entering a number.
- **Aggregate**: Perform calculations on a set of values and return a single result.
  - Available functions: Count, Sum
  - Limitations:
    - Sum only for numeric columns.
    - Count only for non-null values.
<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/v2-beta/database/newui/aggregate.png" alt="ToolJet Database editor" />
</div>

- **Group By**: Group rows with the same values in specified columns.
  - Can only be used after adding at least one aggregate condition.
  - Select one or more columns to group by.
  - Results are grouped based on unique combinations of values in selected columns.
<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/v2-beta/database/newui/group-by.png" alt="ToolJet Database editor" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Create row
This operation creates a new record in the table. You can create a single record or multiple records at once.

#### Required Parameters
- **Columns**: Choose the columns, add values for the new record, and enter the values. You can also add a new column by clicking on the **+Add column** button.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Update Row
This operation updates a record in the table. You can update a single record or multiple records at once.

#### Required Parameter
- **Filter**: Add a condition by choosing a column, an operation, and the value for updating a particular record.
- **Columns**: Choose the columns, update the values for the selected record, and enter the values.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Row
This operation deletes a record in the table. You can delete a single record or multiple records at once.

#### Required Parameters
- **Filter**: Add a condition by selecting a column, an operation, and the value to delete a specific record.
- **Limit**: Limit the number of records to be deleted by entering a number.

</div>

## Modifying Tables with Foreign Key Constraints

When you are creating, updating, or deleting records in a table that has a foreign key constraint, you need to ensure that the foreign key constraint is not violated. 
- If you are trying to create/update a new row in the source table, you need to ensure that the foreign key value exists in the target table. Otherwise, the operation will fail with an error message.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/violate-fk.gif" alt="ToolJet database"/>
</div>

- Similarly, if you are trying to delete a row in the target table, you need to ensure that the foreign key value is not being referenced in the source table.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Join Tables

You can join two or more tables in the ToolJet database by using the **Join** operation.

#### Required Parameters
- **From**: In the From section, the following parameters are available:
    - **Selected Table**: Select the table from which you want to join the other table. 
    - **Type of Join**: Select the type of join you want to perform. The available options are: `Inner Join`, `Left Join`, `Right Join`, and `Full Outer Join`.
    - **Joining Table**: Select the table that you want to join with the selected table. If the selected table has a foreign key relationship(s) with other tables, those tables will be listed with a foreign key icon next to their name.
    - **On**: Select the column from the **selected table** and the **joining table** on which you want to join the tables. Currently, only `=` operation is supported for joining tables. If the selected table and the joining table have a foreign key relationship, both the columns will be auto-populated in the **On** dropdown.
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/join-on-fk-v2.gif" alt="ToolJet database"/>
</div>
    - **AND or OR condition**: You can add multiple conditions by clicking on the **+Add more** button below each join. The conditions can be joined by `AND` or `OR` operation.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/v2-beta/database/newui/join1.png" alt="ToolJet Database editor" />

  </div>

- **Filter**: Add a condition by choosing a column, an operation, and the value for filtering the records. The operations supported are same as the [filter operations](/docs/tooljet-db/database-editor#available-operations-are) for the **List rows** operation.
- **Sort**: Sort the query response by choosing a column and the order (ascending or descending).
- **Limit**: Limit the number of records to be returned by entering a number. 
- **Offset**: Offset the number of records to be returned by entering a number. This parameter is used for pagination.
- **Select**: Select the columns that you want to return in the query response. By default, all the columns are selected.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/v2-beta/database/newui/join2.png" alt="ToolJet Database editor" />
</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Mapping Date with Time Column to Table Component

The date with time column stores data in the ISO 8601 format. When querying a table with a date with time column, the column is displayed in the ISO 8601 format by default. To display the date with time column in a more readable format in the Table Component, follow these steps:

1. Connect the query to the Table Component and navigate to its properties panel.
2. In the Columns section, select the column that stores the date with time.
3. Change the column type from String to **Date Picker**.
4. In the **Parse format** section, enable the **Parse in unix timestamp** and **Unix timestamp** options as needed.
5. Under the date format section, toggle on the **Enable date** and **Enable time** options accordingly.
6. In the transformation field, the `{{cellValue}}` variable contains the ISO 8601 formatted date. Convert it to a Date object using `{{new Date(cellValue)}}`, then format the Date object to meet your requirements.


<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/v2-beta/database/newui/date-with-time-column.png" alt="ToolJet Database Date" />
</div>

</div>



:::info
If you have any other questions or feedback about **ToolJet Database**, please reach us out at hello@tooljet.com or join our **[Slack Community](https://www.tooljet.com/slack)**
:::

</div>

</div>
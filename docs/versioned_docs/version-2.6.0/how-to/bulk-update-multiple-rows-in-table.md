---
id: bulk-update-multiple-rows
title: Bulk update multiple rows in table
---

# Bulk update multiple rows in table

Currently, the datasources in ToolJet have operation for **bulk update(GUI mode)** but that only works for changes made in the single row. We will soon be adding a new operation for bulk updating the multiple rows but for now we can bulk update multiple rows by creating a Custom JS query.

In this guide, We have assumed that you have successfully connected the data source. For this guide, we will be using the PostgreSQL data source as an example database, currently, this workaround can be used only for PostgreSQL and MySQL.

## 1. Create a query to get the data from the database

Let's create the query that will be getting the data from the database:

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/postgres1.png)

</div>

## 2. Display the data on the table

- Drag a **Table** widget on the canvas and click on its handle to open the properties on the left sidebar
- Edit the **Table data** field value and enter **`{{queries.postgresql1.data}}`**

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/showData.png)

</div>

## 3. Make the columns editable

- Go to the **Columns**, Add or edit columns section and enter the **Column Name** that you want to display on the table and the **Key** name. Key is the name of the column in your database.
- Enable the toggle for **Make editable** for the columns that you want to be editable.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/columns.png)

</div>

## 4. Enable bulk update options for table widget

- Go to the **Options** section and enable the **Show update buttons**. Enabling this will add two buttons - **Save Changes** and **Discard Changes** at the bottom of the table, only when any cell in the table is edited.
- You can also enable highlight selected row.(**Optional**)

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/options.png)

</div>

## 5. Create a Custom JS query

We will create a new Custom JS query(**runjs1**) that will generate SQL query for updating multiple rows.

```js
const uniqueIdentifier = "id";
const cols = Object.values(components.table1.changeSet).map((col, index) => {
	return {
		col: Object.keys(col),
		[uniqueIdentifier]: Object.values(components.table1.dataUpdates)[index][uniqueIdentifier],
		values: Object.values(col),
	};
});

const sql = cols.map((column) => {
	const { col, id, values } = column;
	const cols = col.map((col, index) => `${col} = '${values[index]}'`);
	return `UPDATE users SET ${cols.join(", ")} WHERE id = '${id}';`;
});

return sql;
```

:::info
Here the **Unique identifier** is **id**, this is the column name that is used to identify the row in the database.
Update the **Unique identifier** if you are using a different column name.
Update **table1** with the name of the table you are using.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/runjs1.png)

</div>

## 6. Create an Update query

Let's create a new PostgreSQL query and name it `update`. In **SQL mode**, enter `{{queries.runjs1.data.join(' ')}}` and **Save** it.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/update.png)

</div>

## 7. Creating a flow for queries

- Click on the handle of the **Table** widget to open its properties
- Go to the **Events**, and add a handler
- Select **Bulk Update** in Events, **Run Query** in Actions, and then select the **runjs1** query in Query. Now whenever a user will edit the table and hit the **Save Changes** button runjs1 will run.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/event.png)

</div>

- Now, go to the **Advanced** tab of **runjs1** and add a handler to run update query for **Query Success** Event. Now whenever the runjs1 query will be run - the update operation will be performed on the database.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Bulk update multiple rows in table](/img/how-to/bulk-update-multiple/success.png)

</div>

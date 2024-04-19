---
id: use-form-component
title: Use Form Component
---

In this guide, we'll create a simple app that uses a **[Form](/docs/widgets/form)** component to add records to a database. We'll use **[ToolJet Database](/docs/tooljet-database)** as our data source. 

## 1. Create a Table in ToolJet Database 
- Create a table named *products* in ToolJet Database. 
- Create three columns - `name`, `quantity` and `price`. 
- Add some sample data to the table.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/use-form/database-table.png" alt="Database Table" width="100%" />
</div>

## 2. Create the UI
- Create a new app and drag and drop a **[Table](/docs/widgets/table)** component on the canvas.
- Drop a **[Form](/docs/widgets/form)** next to it.
- Since we have three columns in the database, let's update the Form with one **[Text Input](/docs/widgets/text-input)** for `name` and two **[Number Inputs](/docs/widgets/text-input)** for `quantity` and `price`.
- Name the three input fields on the form as - *nameInput*, *quantityInput* and *priceInput*. Name the button as *submitButton*.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/use-form/user-interface.png" alt="User Interface" width="100%" />
</div>
<i>Naming the components can help in easily identifying or referring individual components when there are a large number of components in the app</i>. 

## 3. Load the Table Component With Data

- Click on the Add button in the **[Query Panel](/docs/app-builder/query-panel/)**, select ToolJet Database
- Rename the query to *getProducts*
- Choose *products* as Table name, List rows as Operations
- Enable `Run this query on application load?` to automatically run the query when the app starts
- Click on Run to fetch data
- Click on the Table component to open its properties panel on the right. Under the `Data` property, paste the below code:
```js
{{queries.getProducts.data}}
```
<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/use-form/load-data.png" alt="Table with Data" width="100%" />
</div>

## 4. Write Data Using the Form Component 
- Click on the Add button in the Query Panel, select ToolJet Database
- Select *products* as Table name, Create row as Operations
- Rename the query to *addProduct*
- Click on Add Column and add three columns - **name**, **quantity** and **price**
- Enter code below for **name**, **quantity** and **price** column keys:

```js
{{components.form.data.nameInput.value}}
{{components.form.data.quantityInput.value}}
{{components.form.data.priceInput.value}}
```

To ensure the Table component updates with new data after adding products, trigger the *getProducts* query following each *addProduct* query execution. Here's how:

- Click on **New event handler** in the *addProduct* query to add a new event.
- For the new event, leave the event as Query Success, set Run Query as the Action and choose *getProducts* as the Query.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/how-to/use-form/refresh-table.png" alt="Refresh Table" width="100%" />
</div>

<i>This process refreshes the Table component with the latest data from the database.</i>
<br/>
<br/>

- Next, click on the Form component and set `Button To Submit Form` as *submitButton*. 
- Add a **New event handler** to the Form component. Keep On submit as Event, Run Query as Action and select *addProduct* as the Query.

<div style={{textAlign: 'center', marginBottom: '15px'}}>
    <img className="screenshot-full" src="/img/how-to/use-form/write-data-query.png" alt="Table with Data" width="100%" />
</div>

Now if you enter the product data on the form and click on Submit. The `addProduct` query will run and the entered data will be written to the `products` table in the ToolJet Database.

<div style={{textAlign: 'center', marginBotton: '15px', marginTop: '15px'}}>
    <img className="screenshot-full" src="/img/how-to/use-form/final-preview.png" alt="Final Preview" width="100%" />
</div>
<br/>

In this how-to guide, we have explored a practical application of the Form component in ToolJet. You can apply the same principles for a variety of use cases that requires data input from the end-user.
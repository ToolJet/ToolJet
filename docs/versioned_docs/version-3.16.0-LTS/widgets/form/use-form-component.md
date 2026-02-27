---
id: use-form-component
title: Using Form Component
---

In this guide, we’ll build a simple app using the **[Form](/docs/widgets/form)** component to:

- Add records to **[ToolJet Database](/docs/tooljet-db/tooljet-database/)**
- Validate user inputs
- Add conditional form behaviour
- Refresh data automatically after submission

### Step 1: Create a Table in ToolJet Database

Create a table named _products_ with the following columns:

- `name` (varchar)
- `category` (varchar)
- `quantity` (int)
- `price` (int)
- `supplier_email` (varchar)
- `rating` (int)
- `low_stock_note` (varchar)

Add a few sample rows to the table.

### Step 2: Create a Query to Fetch Data

1. Open the **Query Panel** and click **Add** to create a new query. Select **ToolJet Database** as the datasource.
2. Select _products_ as the Table name and **List rows** as the Operation.
3. Rename the query to _fetchData_.
4. Enable `Run this query on application load?` so the data loads automatically when the application starts.

    <img className="screenshot-full img-l" src="/img/how-to/use-form/v2/fetchData.png" alt="fetchData Query" />

### Step 3: Create the UI

1. Create a new application.
2. Drag a **[Table](/docs/widgets/table)** component onto the canvas.
3. Set the Table's **Data** property to:

   ```js
   {{queries.fetchData.data;}}
   ```

4. Drag a **[Modal](/docs/widgets/modal)** component above the Table.

    <img className="screenshot-full img-full" src="/img/how-to/use-form/v2/ui.png" alt="User Interface" />

### Step 4: Create the Form

1. Drag a **[Form](/docs/widgets/form)** component inside the **Modal**.
2. Disable the **Header** and **Footer** of the Form from its Properties panel since the Modal already provides these.
3. In the **Generate form from** field, select the _fetchData_ query.
4. Adjust the field mapping as needed and click **Generate form**.

    <img className="screenshot-full img-m" src="/img/how-to/use-form/v2/generateForm.png" alt="Generate Form" />

5. Adjust the Form layout as needed.
6. Add two buttons to the Modal's footer : _Cancel_ and _Add_.

    <img className="screenshot-full img-full" src="/img/how-to/use-form/v2/formUI.png" alt="Form UI" />

### Step 5: Insert Data Using the Form

Create a new query to write form data to the database:

- Name: _addProduct_
- Operation: **Create row**
- Table: _products_

Map each column to its corresponding form field:

```js
name            → {{components.form.formData.name}}
category        → {{components.form.formData.category}}
quantity        → {{components.form.formData.quantity}}
price           → {{components.form.formData.price}}
rating          → {{components.form.formData.rating}}
low_stock_note  → {{components.form.formData.low_stock_note}}
supplier_email  → {{components.form.formData.supplier_email}}
```

<img className="screenshot-full img-full" src="/img/how-to/use-form/v2/addProduct.png" alt="addProduct Query" />

### Step 6: Connect Events and Refresh Data

**Refresh the Table after a successful insert:**

1. Select the _addProduct_ query and go to **Settings**.
2. Click **New event handler** and configure:

   - Event: _Query Success_
   - Action: _Run Query_
   - Query: _fetchData_

    <img className="screenshot-full img-full mt-10" src="/img/how-to/use-form/v2/eventHandler1.png" alt="Refresh Table" />

**Run the query when the user clicks Add:**

1. Select the _Add_ button in the Modal footer.
2. Click **New event handler** and configure:

   - Event: _On click_
   - Action: _Run Query_
   - Query: _addProduct_

    <img className="screenshot-full img-full mt-10" src="/img/how-to/use-form/v2/eventHandler2.png" alt="Submit" />

Submitting the form now inserts a new row into the _products_ table and immediately refreshes the **Table** component with the latest data.

### Step 7: Add Validations

1. **Make Fields Mandatory**
   Multiple fields are already marked as mandatory from the form generation step. To also make _category_ mandatory, select the _category_ input component and enable the **Make this field mandatory** toggle. ToolJet displays an error if the user tries to submit the form with any of these fields empty.

2. **Validate Email Format**
   Select the _supplier_email_ input component and navigate to its **Validation** property. Select **Regex** and enter:

   ```js
   {{/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(components.form.formData.supplier_email) ? '' : 'Enter a valid email address'}}
   ```

   This regex pattern checks the email format and returns an error message when the input doesn't match.

### Step 8: Add Conditional Fields

You can show or hide fields based on user input using the **Visibility** property. For example, the _low_stock_note_ field is only relevant when the quantity entered is low.

Select the _low_stock_note_ input component, click **fx** next to its **Visibility** property, and enter:

```js
{{components.form.formData.quantity < 10;}}
```

The _low_stock_note_ field now only appears when the quantity is below 10, prompting the user to add a note about the stock status.

### Step 9: Disable Submit Until Form Is Valid

Select the _Add_ button in the Modal footer and set its **Disable** property to:

```js
{{!components.form.isValid;}}
```

The Form component's `isValid` property returns `true` only when all visible child components pass their validations. This keeps the button disabled until mandatory fields are filled and custom validations like the email check pass.

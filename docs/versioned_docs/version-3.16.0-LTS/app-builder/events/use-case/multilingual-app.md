---
id: multilingual-app
title: Multilingual App
---

This guide demonstrates how to build a multilingual application in ToolJet using ToolJet Database, App Variables, and component bindings. You'll create a simple Employee Directory app where users can switch between multiple languages and see the interface update instantly.

:::note
Before you begin, ensure that:

- You have access to a ToolJet workspace.
- You have permission to create applications and ToolJet Database tables.
:::

## Overview 

This application implements multilingual support using ToolJet Database, App Variables, event handlers, and dynamic component bindings. Translation strings are stored in **ToolJet Database** table and retrieved using a query. The currently selected language is maintained in an **App Variable**. UI components dynamically resolve the appropriate translation based on the value of this variable.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/app-overview.png" alt="Multilingual App Overview"/>

Here are the steps on how to create your application in ToolJet.

### Step 1: Create a New Application

Click on the **Create new app** from the Dashboard. Name your application as **Multilingual App**.

### Step 2: Create Table and Add Records

Create a ToolJetDB table to store translation strings for all supported languages. 

- Name your table as `translations`.
- Create following columns with the type **varchar**.
    - key
    - en
    - es
    - fr
    - ja
    - de

Once the table has been created, add translation records for the UI elements used in the application.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/translations-table.png" alt="ToolJetDB table"/>

### Step 3: Create a Query

- Open the **Query Panel** and create a new query. Select **ToolJet Database** as the data source, choose the translations table, and name the query `getTranslations`.
- Select the operation as **List Rows**.
- In the query settings, enable **Run this query on application load**.

### Step 4: Create an Employee Data Table

Create another ToolJet Database table to store employee records. 

- Name your table as `employees`.
- Create the following columns:

| Column Name | Type |
|------|-------------|
| id | Serial | 
| name | Varchar | 
| department | Varchar | 
| status | Varchar | 
| address | Varchar | 
| email | Varchar | 

Once the table has been created, add records to the table.

After populating the table, navigate back to the App Builder to create a query that retrieves employee data from the `employees` table.

- Create another query from **Query Builder** to fetch `employees` table. Name the query as `getEmployees`. 
- Select the operation as **List Rows**.
- In the query settings, enable **Run this query on application load**.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/employees-table.png" alt="Employees table"/>

### Step 5: Add Language Selector

Add a Dropdown component onto the canvas. Name it as `languageDropdown`. It allows users to switch between supported languages.

### Step 6: Create an App Variable and Add Event Handlers

To enable language switching across the application, you'll use an App Variable named `currentLanguage` to store the selected language. Since App Variables are created when they are first referenced, you'll create and update this variable using event handlers.
 
#### Set a Default Language
- Click the page name under Pages and Navigation to open Page Settings. Then click on **+** for a new event handler, select **On page load** as the event, and **Set variable** as the action.

- Set the key as `currentLanguage` and value as `en`.

This initializes the application in English when the page loads.

#### Update Variable When Language Changes
- Add an **event handler** to the `languageDropdown` component, on select the event, set action as `Set variable`.

- Set the key as `currentLanguage` and value as `{{components.languageDropdown.value}}`.

<img className="screenshot-full img-l" src="/img/app-builder/events/multilingual-app/event-handler.png" alt="Dropdown Event Handler"/>

### Step 7: Add Company Branding, Title, and Description

Create a header section using a Container component. Inside the container: 

- Add two **Image** components to display the pictures.

  **Company logo** : You can use any royalty-free image for the company logo. For example, set the Image URL property of the first Image component to:

  ```javascript
  https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg
  ```

  **User Card** : Use the second Image component to display a user avatar. Then add a Text component beside it to display the user's name.

- Add two **Text** components onto the canvas. 

  **Title** : Set the data of the first Text component to:

  ```javascript
  {{
  queries.getTranslations.data.find(
    row => row.key === "title"
  )?.[variables.currentLanguage]
  }}
  ```

  **Description** :  Set the data of the second Text component to:
  ```javascript
  {{
  queries.getTranslations.data.find(
    row => row.key === "description"
  )?.[variables.currentLanguage]
  }}
  ```
The displayed text automatically updates whenever the selected language changes.

### Step 8 : Bind Data and Localize Headers

In this step, you'll bind employee data and dynamically translate table headers.

- Drag a Table component onto the canvas. In the Data property, bind the query response to `{{queries.getEmployees.data}}`.
- To display translated column names, update the column labels using values from the `translations` table.

| Column | Label |
|---------|---------|
| Name | `{{queries.getTranslations.data.find(row => row.key === "name")?.[variables.currentLanguage]}}` |
| Department | `{{queries.getTranslations.data.find(row => row.key === "department")?.[variables.currentLanguage]}}` |
| Status | `{{queries.getTranslations.data.find(row => row.key === "status")?.[variables.currentLanguage]}}` |
| Address | `{{queries.getTranslations.data.find(row => row.key === "address")?.[variables.currentLanguage]}}` |
| Email | `{{queries.getTranslations.data.find(row => row.key === "email")?.[variables.currentLanguage]}}` |

The table data remains unchanged, while the column headers automatically update based on the selected language.

### Step 9 : Add an Employee Creation Modal

Add a button into the container, labeled **Add Employee** and configure it to open a Modal component. Inside the modal, add the following fields with the text input component for the employee details: **Name, Department, City, Email and Status**. 

Next, Add two buttons to the modal:

- **Add Employee** – Creates a new employee record.
- **Cancel** – Closes the modal without saving changes.

#### Create an Employee Creation Query
Create a ToolJet Database query named `addEmployee`.

- Select the operation as **Create Rows** and add columns as shown in the image. 
- Add an event handler, set action to **Run Query** select `addEmployee` as the query.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/add-employee-query.png" alt="query builder"/>

#### Add Employee Deletion

Create another ToolJet Database query named `deleteEmployee`.

- Select the operation as **Delete Rows** to delete the employee record from the `employees` table.
- Add an event handler, set action to **Run Query** and select `deleteEmployee` as the query.

By these, you can create and delete employee records while continuing to experience dynamic language switching throughout the application.

This application enables users to switch between **multiple languages** and view localized content across the interface, including titles, descriptions, table headers, and actions. The application also includes company branding and employee management features.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/translated-app.png" alt="tranlasted app overview"/>

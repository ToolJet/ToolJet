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

### Step 7: Add App title and Description

Add two text components onto the canvas. 

**Title**
- Set the data of the first Text component to:

```javascript
{{
queries.getTranslations.data.find(
  row => row.key === "title"
)?.[variables.currentLanguage]
}}
```

**Description**
- Set the data of the second Text component to:
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

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/translated-app.png" alt="tranlasted app overview"/>

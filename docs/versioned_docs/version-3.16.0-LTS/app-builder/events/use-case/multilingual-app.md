---
id: multilingual-app
title: Build a Multilingual Employee Directory App
---

This guide demonstrates how to build a multilingual application in ToolJet using ToolJet Database, App Variables, and component bindings. You'll create a simple Employee Directory app where users can switch between multiple languages and see the interface update instantly.

## Overview 

This application implements a database-driven localization architecture that separates translation resources, application state, and presentation logic.

Translation strings are stored in a **ToolJet Database** table and retrieved when the application loads. The currently selected language is maintained using an **App Variable**. UI components dynamically resolve the appropriate translation based on the active language.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/app-overview.png" alt="Multilingual App Overview"/>

## Application Architecture

This application consists of three primary layers.

### Translation Layer

The `translations` table acts as a localization repository. Each row represents a translatable key, while each language is stored in a dedicated column.

This approach allows new languages to be introduced by simply adding additional columns and translation values.

### State Management Layer

The selected language is stored in the `currentLanguage` App Variable.

Whenever the user changes the language, the variable is updated and all bound components automatically re-evaluate their expressions.

### Presentation Layer

UI components reference translation keys rather than hardcoded text. At runtime, each component resolves the appropriate value from the translation dataset based on the currently selected language.

This keeps localization logic centralized and avoids maintaining **language-specific** UI components.

## Implementing Localization

### Store Translation Resources

Create a ToolJet Database table to store translation keys and localized values.

The guide uses English, Spanish, French, German, and Japanese, but the same approach can be extended to support any number of languages.

Create the following columns with the type **varchar** in the ToolJet Database.

| key | en | es | fr | ja | de |
|-----|----|----|----|----|----|

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/translations-table.png" alt="ToolJetDB table"/>

### Load Translation Data

Create a query that loads translation resources when the application starts. Loading translations during initialization ensures that localized content is immediately available to all components.

- Name the query as `getTranslations`.

- Select the operation as **List Rows**.

- In the query settings, enable **Run this query on application load**.

The query loads data from the `translations` table when the application starts, making localized content available to all UI components.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/get-translations-query.png" alt="get translations query builder"/>

### Manage Language State

Configure **event handlers** to initialize the default language when the application loads and update the active language whenever a user selects a different option from the language selector.

- Add a Dropdown component and name it as  `languageDropdown`.

- Add an event handler, on select the event, set action as `Set variable`.

- Set the key as `currentLanguage` and value as `{{components.languageDropdown.value}}`.

<img className="screenshot-full img-l" src="/img/app-builder/events/multilingual-app/event-handler.png" alt="Dropdown Event Handler"/>

### Create Business Data

In addition to translation resources, the application requires business data to demonstrate localization. Employee records are displayed in a **Table** component and serve as the application's business data. This demonstrates how localized interface elements can coexist with non-localized application data.

- Create a ToolJet Database table and name it as `employees`.

- Create the following columns:

| Column Name | Type |
|------|-------------|
| id   | Serial      | 
| name | Varchar     | 
| department | Varchar | 
| status | Varchar   | 
| address | Varchar  | 
| email | Varchar    | 

- After populating the table, retrieve the employees data by creating another query named `getEmployees`. 

- Select the operation as **List Rows**.

- In the query settings, enable **Run this query on application load**.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/employees-table.png" alt="Employees table"/>

:::note
Only interface elements are translated in this example. Employee records remain unchanged regardless of the selected language.
:::

### Bind Localized Content

Instead of hardcoding labels, titles, descriptions, and column headers, bind component properties to values from the translation dataset.

Whenever the selected language changes, the interface automatically updates without requiring page reloads or additional queries.

- Drag a Table component onto the canvas. In the Data property, bind the query response to `{{queries.getEmployees.data}}`.

- To display the translated column names, update the column labels using values from the `translations` table.

| Column | Label |
|---------|---------|
| Name | `{{queries.getTranslations.data.find(row => row.key === "name")?.[variables.currentLanguage]}}` |
| Department | `{{queries.getTranslations.data.find(row => row.key === "department")?.[variables.currentLanguage]}}` |
| Status | `{{queries.getTranslations.data.find(row => row.key === "status")?.[variables.currentLanguage]}}` |
| Address | `{{queries.getTranslations.data.find(row => row.key === "address")?.[variables.currentLanguage]}}` |
| Email | `{{queries.getTranslations.data.find(row => row.key === "email")?.[variables.currentLanguage]}}` |

The completed application allows users to switch between **multiple languages** and view localized content across the interface, including titles, descriptions, table headers, and actions. 

This approach centralizes translation management, introduces additional languages and can be combined with ToolJet's dynamic bindings to build scalable multilingual experiences.

<img className="screenshot-full img-full" src="/img/app-builder/events/multilingual-app/translated-app.png" alt="tranlasted app overview"/>

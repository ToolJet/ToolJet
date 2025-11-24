---
id: import-export-modules
title: Import and Export Modules
---


ToolJet allows you to export and import modules, making it easy to share, reuse, or migrate modules across different workspaces. 

This guide walks you through the steps to export an existing module and import it into another workspace.

## Exporting Modules

- Navigate to the **Modules** tab from the dashboard.
- Click on the menu icon of the module card you want to export.
- Click on the **Export module** button.

  <img className="screenshot-full img-m" src="/img/app-builder/modules/export-module-card.png" alt="Export Module Button" />

- The selected module will be exported as a JSON file.

- This file will include all the components, logic, queries, and properties defined within the module. 

Once downloaded, you can use this file to import the module into any other ToolJet workspace.


## Importing Modules

- Navigate to the **Modules** tab.
- Click on the menu icon next to the **Create new module** button in the top right corner.


  <img className="screenshot-full img-l" src="/img/app-builder/modules/import-module.png" alt="Import Module Button" />


- Choose the module JSON file that you previously exported.

Once imported, the module will appear in your modules list and can be used across your applications.


## Module Behavior During Application Import and Export

**Import**:

- When you import an application, the platform automatically checks for any existing modules with matching names in your workspace or instance. If a module with the same name already exists, the imported application connects to the existing module, avoiding duplication. 
- However, if no matching module is found, the platform creates a new module from the imported JSON file. 
- This approach ensures that your application imports smoothly while maintaining consistency and preventing redundant modules.

**Export**:

- When you export an application, all associated modules linked to the application are automatically included in the export. 
- This ensures that any reusable components or features built as modules are preserved and can be seamlessly imported along with the app into any other workspace.
---
id: importing-exporting-applications
title: Applications
---

This documentation explains the process of exporting and importing applications in ToolJet.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exporting Applications

- Navigate to the dashboard.
- Click on the settings icon located in the top right corner of the application.
- Click on the **Export app** button.

You can also export an app from the app builder. Open **Global settings** from the left sidebar and click **Export app**.

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/export-app-button-v2.png" alt="Export App Button" />
</div>

- In the **Select a version to export** dialog, select a version under **Current Version** or **Other Versions**.
- Click **Export All** to export all versions of the application, or **Export selected version** to export only the selected version. The app downloads as a JSON file.
- **Export ToolJet table schema** is selected by default. It also exports the schemas of the ToolJet Database tables used by the application: the tables used by the selected version's queries for **Export selected version**, and all tables for **Export All**. When you import the application into a workspace, these ToolJet Database tables are also created.


<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/export-options-v2.png" alt="Export App Options" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Importing Applications

- Navigate to the dashboard.
- Click on the ellipses on the **Create new app** button and select `Import`.

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/import-button-v2.png" alt="Import App Button" />
</div>

- After clicking on `Import`, choose the relevant JSON file that you previously downloaded during the application export process.


<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/select-app-to-import.png" alt="Select App To Import" />
</div>

</div>

## Module Behavior During Application Import and Export

**Import**:

- When you import an application, the platform automatically checks for any existing modules with matching names in your workspace or instance. If a module with the same name already exists, the imported application connects to the existing module, avoiding duplication. 
- However, if no matching module is found, the platform creates a new module from the imported JSON file. 
- This approach ensures that your application imports smoothly while maintaining consistency and preventing redundant modules.

**Export**:

- When you export an application, all associated modules linked to the application are automatically included in the export. 
- This ensures that any reusable components or features built as modules are preserved and can be seamlessly imported along with the app into any other workspace.
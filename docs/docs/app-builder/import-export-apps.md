---
id: importing-exporting-applications
title: Import and Export Applications
---

This documentation explains the process of exporting and importing applications in ToolJet.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exporting Applications

- Navigate to the dashboard.
- Click on the settings icon located in the top right corner of the application.
- Click on the **Export app** button.

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/export-app-button-v2.png" alt="Export App Button" />
</div>

- If you select `Export All`, all the versions of the application will be exported in JSON format. If you select `Export selected version`, only the selected version will be exported in JSON format. 
- Ticking the `Export ToolJet table schema` checkbox will also export the related ToolJet Database table schemas with your application. In this case, when you import the application in a workspace, the related ToolJet Database tables will also be created.

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

## Additional Details

### Exporting Applications

When exporting an application, you have the option to include the ToolJet Database table schemas. This is useful if your application relies on specific database tables and you want to ensure that these tables are recreated when the application is imported into another workspace.

### Importing Applications

When importing an application, ToolJet will automatically create any necessary ToolJet Database tables if the export included the table schemas. This ensures that the application will function correctly in the new workspace without requiring additional setup.

### Export and Import Limitations

- **Data Sources**: The export and import process does not include data source configurations. You will need to manually configure any data sources required by the application after importing it.
- **Environment Variables**: Environment variables are not included in the export. You will need to set up any required environment variables in the new workspace.
- **File Uploads**: Any files uploaded to the application are not included in the export. You will need to manually upload any necessary files after importing the application.

### Best Practices

- **Version Control**: Use version control to keep track of changes to your applications. This makes it easier to manage different versions and revert to previous versions if needed.
- **Testing**: Thoroughly test your application after importing it into a new workspace to ensure that all functionality is working as expected.
- **Documentation**: Keep detailed documentation of your application's setup and configuration. This will make it easier to set up the application in a new workspace and troubleshoot any issues that arise.

For more detailed information on exporting and importing applications, refer to the [ToolJet Documentation](https://docs.tooljet.com).

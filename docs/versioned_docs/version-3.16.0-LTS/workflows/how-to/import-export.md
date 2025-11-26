---
id: import-export
title: Import or Export Workflows
---

<div style={{display:'flex',justifyContent:"start",alignItems:"center",gap:"8px"}}>

<div className="badge badge--self-hosted heading-badge" >   
 <span>Self Hosted</span>
</div>

</div>

ToolJet supports exporting workflows as JSON files and importing them into any ToolJet workspace.

## Exporting Workflows

To export a workflow from your ToolJet workspace:
1. Navigate to the **Workflows** tab from the dashboard.
2. Click on the kebab menu (three vertical dots) at the top-right corner of the workflow you want to export.
3. Select **Export Workflow** from the menu. A `.json` file containing the workflow configuration will be downloaded to your system.
    <img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/workflows/import-export/export.png" alt="Navigate to Workflow Section" />

This file can later be imported into any ToolJet workspace to replicate the same workflow setup.

## Importing Workflows

To import a workflow from your ToolJet workspace:
1. Navigate to the **Workflows** tab from the dashboard.
2. Click on the kebab menu (three vertical dots) next to the **Create new workflow** button and select **Import from device**.
    <img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/workflows/import-export/import.png" alt="Navigate to Workflow Section" />
3. Choose the `.json` file of the workflow you want to import from your local system.
4. Click **Import workflow** button to complete the import process.
    <img style={{marginTop:'15px'}} className="screenshot-full img-s" src="/img/workflows/import-export/import-modal.png" alt="Navigate to Workflow Section" />

Once imported, the workflow will appear in your workspace and can be edited or triggered like any other workflow.
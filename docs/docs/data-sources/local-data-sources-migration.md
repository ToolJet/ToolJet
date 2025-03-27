---

id: local-data-sources-migration  
title: Local Data Sources Migration Guide

---

Starting with ToolJet version 3.0.0, **Local Data Sources** have been fully discontinued. These were deprecated in earlier versions, and now support for them has been completely removed. This guide will help you migrate your queries that were connected to Local Data Sources to the new **Data Sources**.

## Migration Process for Existing ToolJet 3.0.0 Users

After upgrading to ToolJet 3.0.0, any queries connected to Local Data Sources will display an error message indicating that the Local Data Source is no longer supported. Follow these steps to resolve this issue:

## Step-by-Step Migration Guide:

### 1. Identify Queries with Errors:
   1. Navigate to the app where you were using Local Data Sources.
   2. Expand the Query Manager.
   3. Look for queries showing an error message related to Local Data Sources. These queries will only display the error message and the rest of content will be hidden.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full img-full" src="/img/datasource-reference/v3-migration/query-error.png" alt="Identify Queries with Errors"/>
</div>

### 2. Create a New Data Source:
   1. Navigate to the **Data Sources** section.
   2. Create a new Data Source of the same type (e.g., if you were using a PostgreSQL Local Data Source, create a PostgreSQL Data Source).
   3. Fill in the correct required details and save the new Data Source.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full img-full" src="/img/datasource-reference/v3-migration/create-new-data-source.png" alt="Create a New Data Source"/>
</div>

### 3. Reconnect Your Queries:
   1. Return to your app where the queries were previously using Local Data Sources.
   2. Open the query that was showing an error.
   3. You will see a dropdown under the **Source** field.
   4. Select the newly created Data Source of the same type from the dropdown.
   5. Your query will now be reconnected and functional.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full img-full" src="/img/datasource-reference/v3-migration/query-reconnection.png" alt="Reconnect Query with Data Source"/>
</div>

### 4. Test Your Queries:
   1. Run each updated query to ensure everything is working as expected.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full img-full" src="/img/datasource-reference/v3-migration/test-queries.png" alt="Test Your Queries"/>
</div>
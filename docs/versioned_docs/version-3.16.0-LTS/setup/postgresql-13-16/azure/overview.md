---
id: overview
title: Azure PostgreSQL 13 to 16 Upgrade
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This comprehensive guide covers upgrading your Azure Database for PostgreSQL Flexible Server from version 13 to 16 and configuring SSL connections for ToolJet across different Azure deployment methods: Azure Kubernetes Service (AKS) and Azure Container Instances.

## Pre Requisites

- Existing ToolJet deployment with PostgreSQL 13 on Azure Database for PostgreSQL Flexible Server
- Azure Database for PostgreSQL Flexible Server 13 instance
- Administrative access to your deployment environment
- Backup of your existing database
- Azure CLI (`az`) installed and configured
- Appropriate Azure RBAC permissions for PostgreSQL operations

## Critical Safety Measures and Testing Strategy

**NOTE**: Before upgrading your production database, follow this comprehensive safety and testing approach:

### Phase 1: Production Database Point-in-Time Restore Testing

1. Create Production Database Point-in-Time Restore

    <Tabs>

        <TabItem value="portal" label="Using Azure Portal"> 

            1. Navigate to **Azure Database for PostgreSQL Flexible Server** in the Azure Portal
            2. Select your production PostgreSQL 13 instance
            3. Click **Restore** in the toolbar
            4. Select **Point-in-time restore**
            5. Configure restore settings:
                - **Server name**: `production-pg13-test-restore`
                - **Restore point**: Choose a recent timestamp (within the last 7 days)
                - **Location**: Same as production (or different for isolation)
                - **Compute + storage**: Same as production (or smaller for testing)
                - **Networking**: Same VNet configuration as production
            6. Click **Review + create**
            7. Click **Create**
            8. Wait for restoration completion (10-30 minutes depending on database size)

        </TabItem>

        <TabItem value="CLI" label="Using Azure CLI"> 
                        
            ```bash
            # Create a point-in-time restore of your production database for testing
            az postgres flexible-server restore \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --source-server your-production-server \
            --restore-time "2024-12-01T10:00:00Z" \
            --location eastus

            # Monitor restore progress
            az postgres flexible-server show \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --query "state"
            ```

        </TabItem>

    </Tabs>

2. Enable Required Extensions (For New Database Instances)

    :::note
    If you're creating a new database instance for testing instead of using a point-in-time restore, you'll need to enable the required extensions that ToolJet depends on.
    :::

    <Tabs>

        <TabItem value="portal" label="Using Azure Portal"> 

            1. **Navigate to your test database instance**:
                - Go to **Azure Database for PostgreSQL Flexible Server** → **Servers**
                - Select your database instance
            2. **Enable Extensions**:
                - Go to **Settings** → **Server parameters**
                - Search for **azure.extensions**
                - In the **Value** field, add the following extensions (comma-separated):
                    ```
                    citext,pg_cron,pgcrypto,uuid-ossp
                    ```
                - Click **Save**
                - Wait for the server to restart (this may take a few minutes)

        </TabItem>

        <TabItem value="CLI" label="Using Azure CLI"> 
       
            ```bash
            # Enable required extensions for ToolJet
            az postgres flexible-server parameter set \
            --resource-group your-resource-group \
            --server-name production-pg13-test-restore \
            --name azure.extensions \
            --value "citext,pg_cron,pgcrypto,uuid-ossp"
            ```

        </TabItem>

    </Tabs>

3. **Verify Extensions** (after server restart):
   ```bash
   # Connect to database and verify extensions are available
   psql "postgresql://username:password@production-pg13-test-restore.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT name FROM pg_available_extensions WHERE name IN ('citext', 'pg_cron', 'pgcrypto', 'uuid-ossp') ORDER BY name;"
   ```

:::note 
Point-in-time restores automatically inherit the extensions configuration from the source server, so this step is typically only needed for new database instances.
:::

4. Upgrade Test Database to PostgreSQL 16

    <Tabs>

        <TabItem value="portal" label="Using Azure Portal"> 

            :::note
            [Azure PostgreSQL Flexible Server Major Version Upgrade Guide](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-perform-major-version-upgrade?tabs=portal-major-version-upgrade)
            :::

            1. **Navigate to your test restore instance**:
                - Go to **Azure Database for PostgreSQL Flexible Server** → **Servers**
                - Select your test restore: `production-pg13-test-restore`
            2. **Verify server is ready**:
                - Ensure server status shows **Available**
                - Check that there are no ongoing operations
            3. **Start the upgrade process**:
                - In the **Overview** section, look for the **Upgrade** option
                - Click **Upgrade**
                - Alternatively, go to **Settings** → **Server parameters** and look for upgrade options
            4. **Choose database version**:
                - **Current version** will show: PostgreSQL 13
                - **Target version**: Select **PostgreSQL 16**
                - Review the upgrade notes:
                    - ⚠️ **The major version upgrade action is irreversible**
                    - Server name remains unchanged after upgrade
                    - Minor version will be the most recent supported
            5. **Confirm upgrade**:
                - Review all settings and warnings
                - Click **Upgrade** to begin the process
            6. **Monitor upgrade progress**:
                - Wait for upgrade completion (15-45 minutes depending on database size)
                - Server status will show **Updating** during upgrade
                - Verify **PostgreSQL version** shows **16.x** in server details once complete

        </TabItem>

        <TabItem value="CLI" label="Using Azure CLI"> 
       
            ```bash
            # Upgrade the test restore to PostgreSQL 16
            az postgres flexible-server upgrade \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --version 16

            # Monitor upgrade progress
            az postgres flexible-server show \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --query "{name:name,state:state,version:version}"
            ```

        </TabItem>

    </Tabs>

### Phase 2: Staging Environment Testing

:::warning
Before upgrading your production database, you MUST thoroughly test the upgrade process and application functionality in a staging environment using the restored and upgraded test database.
:::

5. Deploy Staging ToolJet Instance
    1. **Set up staging environment** using your preferred deployment method:
        - **Azure Kubernetes Service (AKS)**: Follow AKS deployment section below
        - **Azure Container Instances**: Follow Azure Container deployment section below
    2. **Configure staging to use the upgraded test database**:
        - Update your configuration files (.env, ConfigMaps, deployment templates, etc.)
        - Use the test database connection details: `production-pg13-test-restore.postgres.database.azure.com`
        - Configure SSL requirements as detailed in your deployment method section

6. Comprehensive Staging Testing <br/>
    **Test all critical functionality:**

    1. **Application Startup**:
        ```bash
        # Verify ToolJet starts successfully (adjust command based on deployment method)
        # AKS: kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # ACI: az container logs --resource-group rg --name tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        ```
    2. **Database Connectivity Testing**:
        ```bash
        # Test connection to upgraded database
        psql "postgresql://username:password@production-pg13-test-restore.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT version();"
        # Should show: PostgreSQL 16.x
        ```
    3. **Feature Testing Checklist**:
        - [ ] User login and authentication
        - [ ] Workspace creation and access  
        - [ ] Application building and editing
        - [ ] Data source connections
        - [ ] Query execution and data display
        - [ ] User management and permissions
        - [ ] Application deployment and sharing
        - [ ] API functionality
        - [ ] File uploads and downloads
        - [ ] Email notifications (if configured)
    4. **Performance Testing**:
        - Monitor response times for common operations
        - Check query performance improvements
        - Verify memory usage is stable
        - Test with realistic data volumes
    5. **SSL Connection Validation**:
        - Verify no SSL connection errors in logs
        - Test that `PGSSLMODE=require` works correctly
        - Confirm secure connections are established

### Phase 3: Production Upgrade Planning

7. Document Findings and Plan Production Upgrade

    1. **Create test results document**:
        ```
        PostgreSQL 16 Upgrade Test Results - Azure
        =========================================
        
        Test Environment:
        - Database: production-pg13-test-restore (PITR from production)
        - ToolJet Version: [version]
        - Deployment Method: [AKS/Azure Container Instances]
        - Test Date: [date]
        - Azure Region: [region]
        
        Functionality Test Results:
        - User Authentication: ✅ Working
        - Workspace Access: ✅ Working  
        - Application Building: ✅ Working
        - Data Sources: ✅ Working
        - SSL Connectivity: ✅ Working with PGSSLMODE=require
        - [Add all test results...]
        
        Performance Observations:
        - Query Response Time: [improvement/same/degradation]
        - Application Load Time: [timing]
        - Memory Usage: [stable/issues]
        - CPU Usage: [stable/issues]
        
        Issues Found: [None / List any issues]
        
        Recommended Production Upgrade: ✅ Proceed / ❌ Needs fixes
        ```
    2. **Plan production maintenance window**:
        ```bash
        # Based on staging test results, plan for:
        # - Database upgrade time: ~15-45 minutes (depending on size)
        # - Application configuration updates: ~5-10 minutes  
        # - SSL connection verification: ~5 minutes
        # - Testing and verification: ~10-15 minutes
        # Total estimated downtime: 35-75 minutes
        ```

### Phase 4: Production Upgrade Execution

8. Communicate and Execute Production Upgrade

    1. **User Communication Requirements**:
        - **Inform all users** about the planned maintenance window
        - **Provide alternate contact methods** during downtime
        - **Set status page updates** if available
    2. **Execute production upgrade** following the exact same steps as tested in staging

### Additional Safety Measures

#### Rollback Strategy
:::warning
**The major version upgrade action is irreversible** according to Azure documentation.
:::

Preparation for rollback (**MUST be done before upgrade**):

1. **Create a Point-in-Time Restore backup** before upgrade:
   - Keep original PostgreSQL 13 server available (don't delete immediately)
   - Ensure recent backups are available for restoration
   - Document exact restore point timestamp

If issues are discovered during production upgrade:

1. Restore to new server from backup
    ```bash
    # Restore from backup to a new server
    az postgres flexible-server restore \
    --resource-group your-resource-group \
    --name emergency-restore-server \
    --source-server your-production-server \
    --restore-time "2024-12-01T10:00:00Z"

    # Update ToolJet configuration to point to emergency restore server
    ```
2. Use pre-upgrade Point-in-Time Restore
    - If you created a PITR backup before upgrade, restore from that point
    - Update ToolJet application configuration to use the restored server
    - Resume operations on PostgreSQL 13 until issues are resolved

#### Post-Upgrade Monitoring

1. Azure Portal Monitoring:
    1. Go to **Azure Database for PostgreSQL Flexible Server** → Your database
    2. Click on **Monitoring** tab
    3. Watch these metrics:
        - **CPU percentage**
        - **Memory percentage**
        - **Active connections**
        - **Read/Write IOPS**
        - **Network In/Out**
2. Application Monitoring (adjust commands based on deployment method):
    ```bash
    # Check application logs
    # AKS: kubectl logs deployment/tooljet -n tooljet --tail=50
    # ACI: az container logs --resource-group rg --name tooljet --tail 50

    # Verify database version
    psql "postgresql://user:pass@server.postgres.database.azure.com:5432/db?sslmode=require" -c "SELECT version();"
    ```

#### Cleanup After Successful Upgrade

After 1-2 weeks of stable operation:

1. **Delete test restore server**:
   ```bash
   # Delete the test restore instance
   az postgres flexible-server delete \
     --resource-group your-resource-group \
     --name production-pg13-test-restore
   ```
2. **Review backup retention settings**: Ensure automated backups are configured appropriately

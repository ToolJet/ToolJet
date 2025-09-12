---
id: overview
title: GCP PostgreSQL 13 to 16 Upgrade
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This comprehensive guide covers upgrading your Google Cloud SQL PostgreSQL from version 13 to 16 and configuring SSL certificates for ToolJet across different GCP deployment methods: Docker on GCE, Google Kubernetes Engine (GKE), and Google Cloud Run.

## Pre Requisites

- Existing ToolJet deployment with PostgreSQL 13 on Google Cloud SQL
- Google Cloud SQL PostgreSQL 13 instance
- Administrative access to your deployment environment
- Backup of your existing database
- Google Cloud SDK (`gcloud`) installed and configured
- Appropriate IAM permissions for Cloud SQL operations

## Critical Safety Measures and Testing Strategy

⚠️ **MANDATORY**: Before upgrading your production database, follow this comprehensive safety and testing approach:

### Phase 1: Production Database Clone Testing

1. Create Production Database Clone

    <Tabs>

        <TabItem value="console" label="Google Cloud Console"> 

            1. Navigate to **Cloud SQL** in the Google Cloud Console
            2. Select your production PostgreSQL 13 instance
            3. Click **Create Clone**
            4. Configure clone settings:
                - **Clone ID**: `production-pg13-clone-test`
                - **Description**: `Test clone for PostgreSQL 16 upgrade testing`
                - **Region**: Same as production (or different for isolation)
                - **Zone**: Same as production or different
                - **Machine type**: Same as production (or smaller for testing)
                - **Storage**: Keep same settings as production
            5. Click **Create Clone**
            6. Wait for clone creation (10-30 minutes depending on database size)

        </TabItem>

        <TabItem value="CLI" label="GCloud CLI"> 

            ```bash
            # Create a clone of your production database for testing
            gcloud sql instances clone production-instance-id \
            production-pg13-clone-test \
            --async

            # Monitor clone creation progress
            gcloud sql operations list \
            --instance=production-pg13-clone-test \
            --limit=5
            
            # Wait for clone to be ready
            gcloud sql instances describe production-pg13-clone-test \
            --format="value(state)"
            ```

        </TabItem>

    </Tabs>

2. Upgrade Test Database to PostgreSQL 16

    <Tabs>

        <TabItem value="console" label="Google Cloud Console"> 

            1. **Navigate to your test clone instance**:
                - Go to **Cloud SQL** → **Instances**
                - Select your test clone: `production-pg13-clone-test`
            2. **Start the upgrade process**:
                - Click **Edit** (or the **Upgrade** button if visible in the Instance info section)
                - You'll see a dialog asking "Go to instance upgrade page?"
                - Click **Go to upgrade page**
            3. **Choose database version**:
                - You'll be taken to the "Upgrade database version" page
                - The page will show:
                    - **Current database version**: PostgreSQL 13
                    - **Database version to upgrade**: Dropdown menu
                - Select **PostgreSQL 16** from the dropdown
                - Click **Continue**
            4. **Review and confirm upgrade**:
                - Review the upgrade summary
                - The system will show important notes:
                    - Cloud SQL will create a backup for you to safeguard your data
                    - It's always a good idea to take your own pre-upgrade backup too
                    - Review important post-upgrade steps including running ANALYZE
                - Click **Upgrade instance** to start the process
            5. **Monitor upgrade progress**:
                - Wait for upgrade completion (15-45 minutes depending on database size)
                - Instance status will show "MAINTENANCE" during upgrade
                - Verify **Database version** shows **PostgreSQL 16** in instance details once complete

        </TabItem>

        <TabItem value="CLI" label="GCloud CLI"> 

            ```bash
            # Upgrade the test clone to PostgreSQL 16
            gcloud sql instances patch production-pg13-clone-test \
            --database-version=POSTGRES_16 \
            --async

            # Monitor upgrade progress
            gcloud sql operations list \
            --instance=production-pg13-clone-test \
            --limit=5

            # Verify upgrade completion
            gcloud sql instances describe production-pg13-clone-test \
            --format="value(databaseVersion)"
            ```

        </TabItem>

    </Tabs>

### Phase 2: Staging Environment Testing

3. Deploy Staging ToolJet Instance

    1. **Set up staging environment** using your preferred deployment method:
        - **Docker on GCE**: Follow Docker deployment section below
        - **GKE**: Follow GKE deployment section below  
        - **Cloud Run**: Follow Cloud Run deployment section below
    2. **Configure staging to use the upgraded test database**:
        - Update your configuration files (.env, ConfigMaps, etc.)
        - Use the test database connection details
        - Configure SSL certificates as detailed in your deployment method section

4. Comprehensive Staging Testing <br/>
    **Test all critical functionality:**

    1. **Application Startup**:
        ```bash
        # Verify ToolJet starts successfully (adjust command based on deployment method)
        # Docker on GCE: sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # GKE: kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # Cloud Run: gcloud logging read "resource.type=cloud_run_revision" --limit=50 | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        ```
    2. **Database Connectivity Testing**:
        ```bash
        # Test connection to upgraded database
        psql "postgresql://username:password@test-db-ip:5432/database" -c "SELECT version();"
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
    5. **SSL Certificate Validation**:
        - Verify no SSL connection errors in logs
        - Test secure connections work properly
        - Confirm certificate chain validation

### Phase 3: Production Upgrade Planning

5. Document Findings and Plan Production Upgrade

    1. **Create test results document**:
        ```
        PostgreSQL 16 Upgrade Test Results - GCP
        ========================================
        
        Test Environment:
        - Database: production-pg13-clone-test (cloned from production)
        - ToolJet Version: [version]
        - Deployment Method: [Docker on GCE/GKE/Cloud Run]
        - Test Date: [date]
        - GCP Region: [region]
        
        Functionality Test Results:
        - User Authentication: ✅ Working
        - Workspace Access: ✅ Working  
        - Application Building: ✅ Working
        - Data Sources: ✅ Working
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
        # - SSL certificate setup: ~5 minutes
        # - Testing and verification: ~10-15 minutes
        # Total estimated downtime: 35-75 minutes
        ```

### Phase 4: Production Upgrade Execution

6. Communicate and Execute Production Upgrade
    1. **User Communication Requirements**:
        - **Inform all users** about the planned maintenance window
        - **Provide alternate contact methods** during downtime
        - **Set status page updates** if available
    2. **Execute production upgrade** following the exact same steps as tested in staging

### Additional Safety Measures

#### Rollback Strategy

If issues are discovered during production upgrade:

1. Point back to original database (Fastest)
    - Create a read replica of the original PostgreSQL 13 database before upgrade
    - Keep original database stopped but not deleted
    - Update ToolJet configuration to point back to original database
    - Promote read replica to standalone instance if needed
2. Restore from automated backup
    1. Using Google Cloud Console
        1. Go to **Cloud SQL** → **Instances** → Your database
        2. Click on **Backups** tab
        3. Find the most recent backup before upgrade
        4. Click **Restore**
        5. Choose to restore to a new instance or current instance
    2. Using gcloud CLI
        ```bash
        # List available backups
        gcloud sql backups list --instance=your-instance-id

        # Restore from specific backup
        gcloud sql backups restore BACKUP_ID \
        --restore-instance=your-instance-id \
        --backup-instance=your-instance-id
        ```

#### Post-Upgrade Monitoring

1. Google Cloud Console Monitoring
    1. Go to **Cloud SQL** → **Instances** → Your database
    2. Click on **Monitoring** tab
    3. Watch these metrics:
        - **CPU utilization**
        - **Memory utilization**
        - **Database connections**
        - **Read/Write operations**
        - **Network bytes sent/received**
2. Application Monitoring (adjust commands based on deployment method):
    ```bash
    # Check application logs
    # Docker on GCE: sudo journalctl -u tooljet | tail -50
    # GKE: kubectl logs deployment/tooljet -n tooljet --tail=50
    # Cloud Run: gcloud logging read "resource.type=cloud_run_revision" --limit=50

    # Verify database version
    psql "postgresql://user:pass@db-ip:5432/db" -c "SELECT version();"
    ```

#### Cleanup After Successful Upgrade

After 1-2 weeks of stable operation:
1. Using Google Cloud Console:
    1. **Delete test clone**: Go to **Cloud SQL** → Select `production-pg13-clone-test` → **Delete**
    2. **Review backup retention**: Ensure automated backups are configured appropriately
2. Using gcloud CLI
    ```bash
    # Delete the test clone instance
    gcloud sql instances delete production-pg13-clone-test

    # Verify backup configuration
    gcloud sql instances describe your-production-instance \
    --format="value(settings.backupConfiguration)"
    ```
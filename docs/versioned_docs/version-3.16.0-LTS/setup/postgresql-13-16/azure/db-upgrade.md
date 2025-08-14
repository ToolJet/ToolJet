---
id: db-upgrade
title: Database Upgrade Process
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Follow these steps to upgrade the database:

## Step 1: Prepare for Upgrade

Ensure you have recent backups and verify backup configuration:

### Using Azure Portal

1. Navigate to **Azure Database for PostgreSQL Flexible Server** → **Servers**
2. Select your PostgreSQL 13 instance
3. Go to **Settings** → **Backup and restore**
4. Verify **Automated backup retention period** (recommend 7-35 days)
5. Note the backup schedule and ensure recent backups exist

### Using Azure CLI

```bash
# Verify backup configuration
az postgres flexible-server show \
  --resource-group your-resource-group \
  --name your-server-name \
  --query "backup"

# Create an on-demand backup (if needed)
az postgres flexible-server backup \
  --resource-group your-resource-group \
  --name your-server-name \
  --backup-name pre-upgrade-backup-$(date +%Y%m%d)
```

## Step 2: Upgrade Azure PostgreSQL to 16

### Using Azure Portal (Recommended)

1. **Navigate to PostgreSQL Flexible Server**:
   - Go to **Azure Portal** → **Azure Database for PostgreSQL Flexible Server**
2. **Select Your Database Instance**:
   - Click on your PostgreSQL 13 database instance
3. **Verify Server Status**:
   - Ensure server status is **Available**
   - Verify no ongoing maintenance operations
4. **Start Upgrade Process**:
   - In the **Overview** section, look for upgrade notifications or **Upgrade** button
   - Click **Upgrade**
5. **Choose Database Version**:
   - **Current version** will show: PostgreSQL 13.x
   - **Target version**: Select **PostgreSQL 16**
   - Review important upgrade notes:
     - ⚠️ **The major version upgrade action is irreversible**
     - Server name remains unchanged after upgrade
     - Minor version will be set to the most recent supported
6. **Confirm and Execute**:
   - Review all settings and implications
   - Click **Upgrade** to begin the process
7. **Monitor Upgrade Progress**:
   - Server status will show **Updating** during upgrade
   - Upgrade typically takes 15-45 minutes depending on database size
   - Wait for status to return to **Available**
   - Verify **PostgreSQL version** shows **16.x** in server details

### Using Azure CLI

```bash
# Upgrade your Azure PostgreSQL Flexible Server to version 16
az postgres flexible-server upgrade \
  --resource-group your-resource-group \
  --name your-server-name \
  --version 16

# Monitor upgrade progress
az postgres flexible-server show \
  --resource-group your-resource-group \
  --name your-server-name \
  --query "{name:name,state:state,version:version}"
```

## Step 3: SSL Configuration (Required)

:::note
Azure Database for PostgreSQL Flexible Server requires SSL connections. The environment variable `PGSSLMODE=require` is mandatory for connecting to Azure PostgreSQL databases.
:::

Azure PostgreSQL Flexible Server automatically handles SSL/TLS encryption. No additional certificate files are required, but you must configure your application to require SSL connections.

---
id: db-upgrade
title: Database Upgrade Process
---
Follow these steps to upgrade the database:

## Step 1: Prepare for Upgrade

Ensure you have a recent backup and enable point-in-time recovery:

### Using Google Cloud Console

1. Navigate to **Cloud SQL** → **Instances**
2. Select your PostgreSQL 13 instance
3. Click **Edit**
4. Under **Backup**:
   - Enable **Automated backups**
   - Enable **Point-in-time recovery**
5. Click **Save**

### Using gcloud CLI

```bash
# Create an on-demand backup before upgrade
gcloud sql backups create \
  --instance=your-instance-id \
  --description="Pre-upgrade backup before PostgreSQL 16 migration"

# Enable point-in-time recovery if not already enabled
gcloud sql instances patch your-instance-id \
  --backup-start-time=03:00 \
  --enable-point-in-time-recovery
```

## Step 2: Upgrade Cloud SQL PostgreSQL to 16

### Using Google Cloud Console (Recommended)

**Following the console workflow from the screenshots:**

1. **Navigate to Cloud SQL**:
   - Go to **Google Cloud Console** → **Cloud SQL** → **Instances**
2. **Select Your Database Instance**:
   - Click on your PostgreSQL 13 database instance
3. **Access the Upgrade Interface**:
   - Look for **Database version upgrades are available** notification
   - Click **Upgrade** next to this notification
   - OR click **Edit** and look for upgrade options
   - When prompted "Go to instance upgrade page?", click **Go to upgrade page**
4. **Choose Database Version**:
   - On the "Upgrade database version" page:
     - **Current database version** will show: PostgreSQL 13
     - In **Database version to upgrade** dropdown, select: **PostgreSQL 16**
   - Important notes displayed:
     - Review documentation to ensure your system is ready
     - Test on a clone first (you should have done this!)
     - Cloud SQL will create a backup automatically
     - Take your own pre-upgrade backup as well
   - Click **Continue**
5. **Review and Confirm**:
   - Review the upgrade summary
   - Important post-upgrade steps are shown (run ANALYZE to refresh database statistics)
   - Click **Upgrade instance** to begin
6. **Monitor Upgrade Progress**:
   - The instance status will show "MAINTENANCE" 
   - Upgrade typically takes 15-45 minutes depending on database size
   - Wait for status to return to "RUNNABLE"
   - Verify **Database version** shows **PostgreSQL 16** in instance details

### Using gcloud CLI

```bash
# Upgrade your Cloud SQL instance to PostgreSQL 16
gcloud sql instances patch your-instance-id \
  --database-version=POSTGRES_16 \
  --async

# Monitor the operation
gcloud sql operations list --instance=your-instance-id --limit=5

# Check instance status
gcloud sql instances describe your-instance-id \
  --format="value(state,databaseVersion)"
```

## Step 3: SSL Certificate Configuration (Optional)

:::note
Google Cloud SQL automatically handles SSL encryption and certificate validation. SSL certificates are only required if you have specific custom SSL configurations or use client certificates for authentication.
:::

For most standard deployments, you can skip this step and proceed directly to your deployment configuration.

**If you need custom SSL certificate configuration:**

```bash
# Download the Google Cloud SQL server CA certificate
gcloud sql ssl-certs list --instance=your-instance-id

# Download the server CA certificate
gcloud sql ssl-certs describe server-ca-cert \
  --instance=your-instance-id \
  --format="value(cert)" > server-ca.pem

# Verify the certificate file
head -5 server-ca.pem
# Should show: -----BEGIN CERTIFICATE-----
```

**Alternative method using curl:**
```bash
# Download Google Cloud SQL CA certificates
curl -o server-ca.pem https://dl.google.com/cloudsql/cloud-sql-ca-cert.pem

# Verify the certificate file
head -5 server-ca.pem
```

---
id: db-upgrade
title: Database Upgrade Process
---

Follow these steps to upgrade the database:

## Step 1: Prepare for Upgrade
Create a snapshot of your PostgreSQL 13 database before upgrading:

### Using AWS Console
1. Navigate to **RDS Console** → **Databases**
2. Select your PostgreSQL 13 instance
3. Click **Actions** → **Take snapshot**
4. Enter snapshot name: `pre-upgrade-snapshot-YYYYMMDD`
5. Click **Take snapshot**

### Using AWS CLI
```bash
aws rds create-db-snapshot \
  --db-instance-identifier your-db-instance \
  --db-snapshot-identifier pre-upgrade-snapshot-$(date +%Y%m%d)
```

## Step 2: Upgrade RDS PostgreSQL to 16.9

### Using AWS Console (Recommended)

1. **Navigate to RDS Console**:
   - Go to **AWS Console** → **RDS** → **Databases**
2. **Select Your Database Instance**:
   - Click on your PostgreSQL 13 database instance
3. **Modify Database Engine**:
   - Click the **Modify** button
   - In the **Engine options** section, find **Engine version**
   - Select **16.9** from the dropdown menu
4. **Review Modification Settings**:
   - Scroll down to **Scheduling of modifications**
   - Choose **Apply immediately** for immediate upgrade, or
   - Choose **Apply during the next scheduled maintenance window**
5. **Apply Changes**:
   - Click **Continue**
   - Review the summary of modifications
   - Click **Modify DB instance**
6. **Monitor Upgrade Progress**:
   - The instance status will show "modifying"
   - Upgrade typically takes 10-30 minutes depending on database size
   - Wait for status to return to "available"

### Using AWS CLI

```bash
# Upgrade your RDS instance to PostgreSQL 16.9
aws rds modify-db-instance \
  --db-instance-identifier your-db-instance \
  --engine-version 16.9 \
  --apply-immediately
```

## Step 3: Download Required SSL Certificate
```bash
# Download the global CA bundle from AWS
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# OR using curl
curl -O https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Verify the certificate file
head -5 global-bundle.pem
# Should show: -----BEGIN CERTIFICATE-----
```

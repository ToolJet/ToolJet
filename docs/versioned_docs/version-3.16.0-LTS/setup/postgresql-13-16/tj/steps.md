<!-- removing this for now we might need to add this back later - 02/09/25 -->

---
id: steps
title: Steps
---

## Step 1: Download and Prepare the Script

```bash
# Navigate to your ToolJet directory
cd /path/to/your/tooljet-directory

# Download the upgrade script
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/upgrade_postgres_13_to_16.sh

# Make the script executable
chmod +x upgrade_postgres_13_to_16.sh

# Verify the script
ls -la upgrade_postgres_13_to_16.sh
```

## Step 2: Pre-Upgrade Verification

```bash
# Check current PostgreSQL version
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Verify container health
docker-compose ps

# Check disk space (you need at least 2x your postgres_data size)
du -sh postgres_data
df -h .

# Test database connectivity
docker-compose exec postgres psql -U postgres -l
```

## Step 3: Run the Upgrade Script

```bash
# Start the upgrade process
./upgrade_postgres_13_to_16.sh
```

#### What the Script Does:

#### **Phase 1: Preparation (Steps 1-3)**
    1. **Environment Validation**: Checks Docker, files, and prerequisites
    2. **Configuration Extraction**: Reads database settings from `.env`
    3. **Backup Directory Setup**: Creates organized backup structure

#### **Phase 2: Data Protection (Steps 4-5)** 
    4. **Database Backup**: Creates compressed database dumps
    5. **Volume Backup**: Copies entire `postgres_data` directory

#### **Phase 3: System Update (Steps 6-8)**
    6. **Service Shutdown**: Safely stops all containers
    7. **Docker Compose Update**: Changes postgres:13 → postgres:16
    8. **User Confirmation**: **CRITICAL DECISION POINT**

#### **Phase 4: Upgrade Execution (Steps 9-11)**
    9. **Data Directory Handling**: Renames old data, creates new directory
    10. **PostgreSQL 16 Startup**: Starts new container and restores data
    11. **Service Verification**: Starts all services and verifies functionality

## Step 4: User Confirmation Point

When you reach Step 8, you'll see:
```
⚠️  CRITICAL STEP ⚠️

The script is about to rename the postgres_data folder to prepare for PostgreSQL 16.
The old data will be preserved as: postgres_data_old_pg13_TIMESTAMP

📋 Backup Summary:
  ✅ Database dump: backups/pg_backup_13_TIMESTAMP.dump (XXX MB)
  ✅ Volume backup: backups/postgres_data_backup_TIMESTAMP (XXX MB)
  ✅ Compose backup: docker-compose.yml.bak.TIMESTAMP

🔄 Next steps:
  1. Rename postgres_data to postgres_data_old_pg13_TIMESTAMP
  2. Start PostgreSQL 16 with fresh data directory
  3. Restore data from backups

⚡ This process is reversible using the backups!

Are you ready to proceed? Type 'YES' to continue:
```

**Type `YES` only if:**
- All backups are created successfully
- You have sufficient disk space
- You're prepared for the downtime
- You understand this is the point of no return

## Step 5: Monitor the Upgrade

The script will show detailed progress:
```bash
[INFO] Step 9/11: Data directory handling
[SUCCESS] Renamed postgres_data to postgres_data_old_pg13_20250807_174523
[SUCCESS] Created empty postgres_data directory for PostgreSQL 16

[INFO] Step 10/11: PostgreSQL 16 startup and data restoration
[SUCCESS] PostgreSQL 16.x is running successfully
[INFO] Restoring database from backup...
[SUCCESS] Database restoration completed

[INFO] Step 11/11: Service startup and verification
[SUCCESS] All services started successfully
[SUCCESS] ✅ All verification checks passed!
```

## Step 6: Post-Upgrade Verification

After successful completion, verify your system:

```bash
# Check PostgreSQL version
docker-compose exec postgres psql -U postgres -c "SELECT version();"
# Should show: PostgreSQL 16.x

# Verify all services are running
docker-compose ps

# Check application logs
docker-compose logs tooljet | tail -20

# Test ToolJet application in browser
curl http://localhost:8082/health
```

## Role Fix Mode (Standalone)

If you encounter role-related errors after upgrade:

```bash
# Fix missing workspace roles
./upgrade_postgres_13_to_16.sh --fix-roles
```

**This mode will:**
1. Scan for missing roles in error logs
2. Identify workspace schemas needing roles
3. Create missing roles with proper permissions
4. Restart services to clear connection cache

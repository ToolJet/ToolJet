<!-- removing this for now we might need to add this back later - 02/09/25 -->

---
id: troubleshooting
title: Troubleshooting Guide
---

## Common Issues and Solutions

### Issue 1: "Docker is not running"
**Solution:**
```bash
# Start Docker service
sudo systemctl start docker
# or on macOS: Open Docker Desktop

# Verify Docker is running
docker info
```

### Issue 2: "Insufficient disk space"
**Solution:**
```bash
# Check disk usage
df -h
du -sh postgres_data

# Clean up Docker (if safe)
docker system prune

# Free up space or move to larger disk
```

### Issue 3: "PostgreSQL failed to start"
**Solution:**
```bash
# Check container logs
docker-compose logs postgres

# Common issues:
# - Port 5432 already in use
# - Corrupted data directory
# - Permission issues

# Stop other PostgreSQL instances
sudo systemctl stop postgresql
```

### Issue 4: "Role does not exist" errors
**Solution:**
```bash
# Use the role fix mode
./upgrade_postgres_13_to_16.sh --fix-roles

# Or manually check roles
docker-compose exec postgres psql -U postgres -c "SELECT rolname FROM pg_roles WHERE rolname LIKE 'user_%';"
```

### Issue 5: "Backup file is empty"
**Solution:**
```bash
# Check PostgreSQL connectivity
docker-compose exec postgres pg_isready -U postgres

# Verify database exists
docker-compose exec postgres psql -U postgres -l

# Check .env file configuration
cat .env | grep PG_
```

## Emergency Rollback Procedures

**If Upgrade Fails Mid-Process:**

1. **Automatic Cleanup**: The script automatically attempts rollback on failure

2. **Manual Rollback**:
   ```bash
    # Stop all services
    docker-compose down

    # Restore original docker-compose.yml
    cp docker-compose.yml.bak.TIMESTAMP docker-compose.yml

    # Restore original data directory
    rm -rf postgres_data
    mv postgres_data_old_pg13_TIMESTAMP postgres_data

    # Start services
    docker-compose up -d

    # Verify restoration
    docker-compose exec postgres psql -U postgres -c "SELECT version();"
    ````

3. **Restore from Volume Backup**:
    ```bash
    # If data directory is corrupted
    rm -rf postgres_data
    cp -r backups/postgres_data_backup_TIMESTAMP postgres_data

    # Start services
    docker-compose up -d
    ```


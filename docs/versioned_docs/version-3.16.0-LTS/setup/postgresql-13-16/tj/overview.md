<!-- removing this for now we might need to add this back later - 02/09/25 -->

---
id: overview
title: ToolJet PostgreSQL 13 to 16 Upgrade Script Guide
---

This guide covers the safe upgrade of ToolJet's in-built PostgreSQL from version 13 to version 16 using the automated upgrade script. This script is specifically designed for **Docker deployments with in-built PostgreSQL** as described in the [ToolJet Docker setup documentation](/docs/setup/docker).

:::caution
This script is **ONLY** for ToolJet Docker deployments using the in-built PostgreSQL container (postgres:13). **Do NOT use this script if you're using external PostgreSQL** or cloud databases.
:::

## When to Use This Script

### Use This Script If

- You're running ToolJet with Docker Compose
- Your setup uses the **in-built PostgreSQL container** (postgres:13)
- Your `docker-compose.yml` contains `image: postgres:13`
- You want to upgrade to PostgreSQL 16 for better performance and feature

### Do Not Use This Script If

- You're using external PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- You're using ToolJet Cloud
- Your setup uses AMI, ECS, or Kubernetes deployments
- You're already running PostgreSQL 16

## Prerequisites and Safety Measures

### Critical Safety Requirements

1. **Complete System Backup**
    ```bash
    # Create a full backup of your ToolJet directory
    cp -r /path/to/your/tooljet-directory /path/to/backup/tooljet-backup-$(date +%Y%m%d)

    # Backup your .env file separately
    cp .env .env.backup.$(date +%Y%m%d)

    # Backup docker-compose.yml
    cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d)
    ```
        1. **VM-Level Backup (If Running in Virtual Machine)** <br/>
            :::important
            **HIGHLY RECOMMENDED: Take a VM snapshot/backup before proceeding**
            :::

            If your ToolJet Docker setup is deployed in a VM (AWS EC2, Google Compute Engine, Azure VM, VMware, etc.):
            - **For cloud VMs**: Use your cloud provider's snapshot feature (AWS EBS snapshots, GCP disk snapshots, Azure VM snapshots, etc.)
            - **For local VMs**: Use your hypervisor's snapshot feature (VMware vSphere, VirtualBox, Hyper-V, etc.)

            **Benefits of VM-level backup:**
            - **Complete system restore** capability in case of catastrophic failure
            - **Instant rollback** to exact pre-upgrade state
            - **Operating system and all dependencies** preserved
            - **Network and security configurations** maintained

        2. **Test on Staging First** <br/>
        **CRITICAL RECOMMENDATION**: Before upgrading production, test the upgrade process on a staging/development environment:

            **Staging Environment Setup:**
            1. **Create a copy of your production environment**:
                - **Option 1**: Clone your VM using your cloud provider's or hypervisor's snapshot/cloning feature
                - **Option 2**: Copy your ToolJet directory (including the `postgres_data` folder) to a separate test server with production data
            2. **Run the upgrade script on staging**:
                ```bash
                cd /path/to/staging-tooljet
                ./upgrade_postgres_13_to_16.sh
                ```
            3. **Verify staging upgrade success**:
                - Test all ToolJet functionality
                - Verify all workspaces work correctly
                - Check performance and stability
                - Document any issues encountered
            4. **Apply lessons learned to production**:
                - Note any specific configurations needed
                - Estimate actual downtime required
                - Prepare for any edge cases discovered

        **Staging Benefits:**
        - **Risk-free testing** of the upgrade process
        - **Accurate time estimation** for production upgrade
        - **Issue identification** before production impact
        - **Team confidence** in the upgrade process

2. **System Requirements**
    - **Free disk space**: At least 2x your current `postgres_data` folder size
    - **Memory**: Minimum 4GB available RAM during upgrade
    - **Time window**: Plan for 30-60 minutes of downtime
    - **Docker**: Docker and Docker Compose must be running
    - **Permissions**: User must have sudo/admin rights

3. **Pre-Flight Checklist**
    - [ ] ToolJet is currently working normally
    - [ ] All users have been notified of planned downtime
    - [ ] Recent application backup has been tested
    - [ ] No critical operations are running
    - [ ] Docker containers are healthy: `docker-compose ps`
    - [ ] Sufficient disk space available: `df -h`

### Environment Validation

#### Required Files Check
```bash
# Verify you're in the correct directory
ls -la
# Should show: docker-compose.yml, .env, postgres_data/

# Check current PostgreSQL version
docker-compose exec postgres psql -U postgres -c "SELECT version();"
# Should show: PostgreSQL 13.x
```

#### Container Status Check
```bash
# All containers should be running
docker-compose ps

# Check PostgreSQL container specifically
docker-compose logs postgres | tail -10
```

## Script Features and Capabilities

### Safety Features
- **Comprehensive backups**: Database dumps, volume copies, and configuration files
- **Atomic operations**: All-or-nothing upgrade approach
- **Rollback capability**: Automatic cleanup on failure with restore instructions
- **Data preservation**: Zero data loss design with multiple backup layers
- **Role management**: Automatic detection and recreation of workspace roles

### Technical Capabilities
- **Cross-platform**: Works on macOS and Linux
- **Progress tracking**: 11-step process with detailed logging
- **Error handling**: Comprehensive error detection and recovery
- **Role fixing**: Standalone mode to fix role issues post-upgrade
- **Verification**: Multi-layer verification of upgrade success


## Performance Benefits of PostgreSQL 16

After upgrading, you should experience:
- 20-30% better query performance
- Improved memory management
- Better connection handling
- Enhanced security features
- More efficient indexing

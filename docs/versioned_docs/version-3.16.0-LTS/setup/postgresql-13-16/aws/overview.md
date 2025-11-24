---
id: overview
title: AWS PostgreSQL 13 to 16.9 Upgrade
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This comprehensive guide covers upgrading your AWS RDS PostgreSQL from version 13 to 16.9 and configuring SSL certificates for ToolJet across different deployment methods: Docker, AMI, ECS, and EKS.

## Pre Requisites
- Existing ToolJet deployment with PostgreSQL 13
- AWS RDS PostgreSQL 13 instance 
- Administrative access to your deployment environment
- Backup of your existing database

## Critical Safety Measures and Testing Strategy

⚠️ **MANDATORY**: Before upgrading your production database, follow this comprehensive safety and testing approach:

### Phase 1: Production Database Snapshot and Clone Testing

1. **Create Production Database Snapshot**
    
    <Tabs>

        <TabItem value="CLI" label="Using AWS CLI"> 

            ```bash
            # Create a snapshot of your production database
            aws rds create-db-snapshot \
            --db-instance-identifier your-production-db \
            --db-snapshot-identifier production-pg13-snapshot-$(date +%Y%m%d-%H%M)
            
            # Wait for snapshot completion
            aws rds wait db-snapshot-completed \
            --db-snapshot-identifier production-pg13-snapshot-$(date +%Y%m%d-%H%M)
            ```

        </TabItem>

        <TabItem value="Console" label="Using AWS Console"> 

            1. Navigate to **RDS Console** → **Databases**
            2. Select your production PostgreSQL 13 instance
            3. Click **Actions** → **Take snapshot**
            4. Enter snapshot identifier: `production-pg13-snapshot-YYYYMMDD-HHMM`
            5. Add description: `Pre-upgrade snapshot for PostgreSQL 16.9 testing`
            6. Click **Take snapshot**
            7. Wait for snapshot status to show **Available** (5-15 minutes)

        </TabItem>

    </Tabs>

2. **Create Test Database from Snapshot**
    
    <Tabs>

        <TabItem value="CLI" label="Using AWS CLI"> 

            ```bash
            # Restore snapshot to a new test database instance
            aws rds restore-db-instance-from-db-snapshot \
            --db-instance-identifier test-db-pg13-clone \
            --db-snapshot-identifier production-pg13-snapshot-$(date +%Y%m%d-%H%M) \
            --db-instance-class db.t3.medium \
            --availability-zone your-az \
            --no-publicly-accessible
            ```

        </TabItem>

        <TabItem value="Console" label="Using AWS Console"> 

            1. Go to **RDS Console** → **Snapshots**
            2. Find your snapshot: `production-pg13-snapshot-YYYYMMDD-HHMM`
            3. Select the snapshot and click **Actions** → **Restore snapshot**
            4. Configure the restored database:
                - **DB instance identifier**: `test-db-pg13-clone`
                - **DB instance class**: `db.t3.medium` (or same as production)
                - **Storage**: Keep default settings from snapshot
                - **Availability Zone**: Same as production
                - **VPC security groups**: Same as production (for testing)
                - **Public accessibility**: **No** (for security)
            5. Click **Restore DB instance**
            6. Wait for status to show **Available** (10-20 minutes)

        </TabItem>

    </Tabs>

3. **Upgrade Test Database to PostgreSQL 16.9**
    
    <Tabs>

        <TabItem value="CLI" label="Using AWS CLI"> 

            ```bash
            # Upgrade the cloned test database
            aws rds modify-db-instance \
            --db-instance-identifier test-db-pg13-clone \
            --engine-version 16.9 \
            --apply-immediately
            
            # Monitor upgrade progress
            aws rds describe-db-instances \
            --db-instance-identifier test-db-pg13-clone \
            --query 'DBInstances[0].DBInstanceStatus'
            ```

        </TabItem>

        <TabItem value="Console" label="Using AWS Console"> 

            1. Go to **RDS Console** → **Databases**
            2. Select your test database: `test-db-pg13-clone`
            3. Click **Modify**
            4. In **Engine options**:
                - **Engine version**: Select `16.9`
            5. In **Scheduling of modifications**:
                - Select **Apply immediately**
            6. Click **Continue**
            7. Review changes and click **Modify DB instance**
            8. Wait for modification to complete (15-30 minutes)
            9. Verify **Engine version** shows `16.9` in database details

        </TabItem>

    </Tabs>

### Phase 2: Staging Environment Testing

4. **Deploy Staging ToolJet Instance**

    1. **Set up staging environment** using your preferred deployment method:
        - **Docker**: Follow Docker deployment section below
        - **AMI**: Follow AMI deployment section below  
        - **ECS**: Follow ECS deployment section below
        - **EKS**: Follow EKS deployment section below
    2. **Configure staging to use the upgraded test database**:
        - Update your configuration files (.env, task definitions, etc.)
        - Use the test database endpoint: `test-db-pg13-clone.xxxxxxxxxx.your-region.rds.amazonaws.com`
        - Configure SSL certificates as detailed in your deployment method section

5. **Comprehensive Staging Testing** <br/>
    **🔍 Test all critical functionality:**

    1. **Application Startup**:
        ```bash
        # Verify ToolJet starts successfully (adjust command based on deployment method)
        # Docker: docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # AMI: sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # ECS: aws logs filter-log-events --log-group-name /ecs/tooljet --filter-pattern "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # EKS: kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        ```
    2. **Database Connectivity Testing**:
        ```bash
        # Test connection to upgraded database (adjust based on deployment)
        psql "postgresql://username:password@test-db-endpoint:5432/database?sslmode=require" -c "SELECT version();"
        # Should show: PostgreSQL 16.9
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
    5. **SSL Certificate Validation**:
        - Verify no SSL connection errors in logs
        - Test secure connections work properly

### Phase 3: Production Upgrade Planning

6. **Document Findings and Plan Production Upgrade**

    1. **Create test results document**:
        ```
        PostgreSQL 16.9 Upgrade Test Results
        ===================================
        
        Test Environment:
        - Database: test-db-pg13-clone (cloned from production)
        - ToolJet Version: [version]
        - Deployment Method: [Docker/AMI/ECS/EKS]
        - Test Date: [date]
        
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
        
        Issues Found: [None / List any issues]
        
        Recommended Production Upgrade: ✅ Proceed / ❌ Needs fixes
        ```
    2. **Plan production maintenance window**:
        ```bash
        # Based on staging test results, plan for:
        # - Database upgrade time: ~15-30 minutes
        # - Application configuration updates: ~5-10 minutes  
        # - SSL certificate setup: ~5 minutes
        # - Testing and verification: ~10-15 minutes
        # Total estimated downtime: 35-60 minutes
        ```

### Phase 4: Production Upgrade Execution

7. **Communicate and Execute Production Upgrade**

    1. **User Communication Requirements**:
        - **Inform all users** about the planned downtime in advance
    2. **Execute production upgrade** following the exact same steps as tested in staging

### Additional Safety Measures

#### Rollback Strategy
If issues are discovered during production upgrade:

1. Point back to original database (Fastest)
    - Update ToolJet configuration to use original PostgreSQL 13 database
    - Keep original database running until upgrade is fully verified
2. Restore from snapshot <br/>
    **Using AWS Console:**
    1. Go to **RDS Console** → **Snapshots**
    2. Find: `production-pg13-snapshot-YYYYMMDD-HHMM`
    3. Click **Actions** → **Restore snapshot**
    4. Use original database identifier
    5. Restore with same configuration as original

#### Post-Upgrade Monitoring

1. AWS Console Monitoring:
    1. Go to **RDS Console** → **Databases** → Your database
    2. Click on **Monitoring** tab
    3. Watch these metrics:
        - **Database connections**
        - **CPU utilization** 
        - **Read/Write IOPS**
        - **Database connection failures**
2. Application Monitoring (*adjust commands based on deployment method*):
    ```bash
    # Check application logs
    # Docker: docker-compose logs tooljet | tail -50
    # AMI: sudo journalctl -u tooljet | tail -50
    # ECS: aws logs tail /ecs/tooljet
    # EKS: kubectl logs deployment/tooljet -n tooljet --tail=50

    # Verify database version
    psql "postgresql://user:pass@endpoint:5432/db?sslmode=require" -c "SELECT version();"
    ```

#### Cleanup After Successful Upgrade

After 1-2 weeks of stable operation:

- Using AWS Console:
    1. **Delete test database**: Go to **RDS Console** → Select `test-db-pg13-clone` → **Actions** → **Delete**
    2. **Keep production snapshot**: Retain for disaster recovery (can be automated to delete after 30 days)
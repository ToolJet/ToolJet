---
id: lockbox-master-key-rotation
title: Lockbox Master Key Rotation
---

<div className="badge badge--self-hosted">
  <span>Self Hosted</span>
</div>


This guide explains how to securely rotate the `LOCKBOX_MASTER_KEY` in your self-hosted ToolJet deployment.

## What is Lockbox Master Key?

The `LOCKBOX_MASTER_KEY` is a master encryption key that ToolJet uses to encrypt sensitive data stored in your PostgreSQL database. It uses **AES-256-GCM** encryption with **HKDF-SHA384** key derivation. Periodic key rotation is an important security practice to maintain data protection and meet compliance requirements.

## Prerequisites

Before starting the key rotation process, ensure you have:

- **Database user with read/write access** - The `PG_USER` must have read and write permissions to perform database transactions
- **Application downtime planned** - ToolJet must be stopped from incoming traffic during rotation
- **Database backup** - Full PostgreSQL backup (script will prompt for confirmation)
- **Old key available** - Current `LOCKBOX_MASTER_KEY` value (you'll be prompted to enter it)
- **New key generated** - A new hexadecimal key (see generation instructions below)
- **Staging environment tested** - Test the rotation with `--dry-run` flag first

:::tip Important
Always test the rotation process in a staging environment before performing it in production.
:::

## Generating a New Key

Generate a cryptographically secure 256-bit key using OpenSSL:

```bash
# Generate a new key
openssl rand -hex 32

# Example output:
cc41792c28a7ecd2e2c84089d25eb40e2f2e28660ca4a20a9d8d3a7df26b5776
```

:::info
Store this new key securely. You'll update your environment configuration with it.
:::

## Rotation Procedure

:::info Deployment Support
Key rotation is available for all deployment types:
- **Docker Compose**, **Kubernetes**, **AWS EC2/Traditional Server** - Run rotation script directly in your environment
- **AWS ECS**, **Azure Container Instances**, **Google Cloud Run** - Run rotation via Docker from your local machine
:::

### Preparation Steps

1. **Notify users** - Inform users of the upcoming maintenance window
2. **Stop incoming traffic** - Ensure no writes occur during rotation
3. **Backup database** - Create a full PostgreSQL backup
4. **Update environment variable** - Set `LOCKBOX_MASTER_KEY` to your new key value
5. **Keep old key accessible** - You'll be prompted to enter it during rotation

<details id="tj-dropdown">
    <summary>Docker Compose Deployment</summary>

```bash
# Step 1: Stop the application
docker-compose down

# Step 2: Backup database (use your backup method)

# Step 3: Update .env file with NEW key
nano .env
# Update: LOCKBOX_MASTER_KEY=<new-key>

# Step 4: Run rotation in dry-run mode (test first)
docker-compose run --rm server npm run rotate:keys:prod -- --dry-run

# When prompted, enter your OLD key (current production key):
# Please enter the old key: <old-key-here>

# Step 5: If dry-run succeeds, run actual rotation
docker-compose run --rm server npm run rotate:keys:prod

# Step 6: Restart application
docker-compose up -d

# Step 7: Verify logs for errors
docker-compose logs -f server
```

</details>

<details id="tj-dropdown">
    <summary>Kubernetes Deployment</summary>

```bash
# Step 1: Scale down deployment
kubectl scale deployment tooljet --replicas=0 -n tooljet

# Step 2: Backup database (use your backup method)

# Step 3: Update secret with new key
kubectl edit secret tooljet-secrets -n tooljet
# Update LOCKBOX_MASTER_KEY with new key (base64 encoded: echo -n '<new-key>' | base64)

# Step 4: Scale up single pod for rotation
kubectl scale deployment tooljet --replicas=1 -n tooljet

# Step 5: Run rotation (dry-run first)
kubectl exec -it deployment/tooljet -n tooljet -- npm run rotate:keys:prod -- --dry-run

# When prompted, enter OLD key

# Step 6: Run actual rotation
kubectl exec -it deployment/tooljet -n tooljet -- npm run rotate:keys:prod

# Step 7: Scale deployment back up
kubectl scale deployment tooljet --replicas=3 -n tooljet

# Step 8: Verify logs
kubectl logs -f deployment/tooljet -n tooljet
```

</details>

<details id="tj-dropdown">
    <summary>AWS EC2 / Traditional Server Deployment</summary>

```bash
# Step 1: Stop ToolJet service
sudo systemctl stop nest

# Step 2: Backup database (use your backup method)

# Step 3: Update .env file with NEW key
cd ~/app
nano .env
# Update: LOCKBOX_MASTER_KEY=<new-key>

# Step 4: Run rotation (dry-run first)
npm run rotate:keys:prod -- --dry-run

# When prompted, enter OLD key

# Step 5: Run actual rotation
npm run rotate:keys:prod

# Step 6: Restart service
sudo systemctl start nest

# Step 7: Check service status and logs
sudo systemctl status nest
journalctl -u nest -f
```

</details>

<details id="tj-dropdown">
    <summary>Serverless Deployments (AWS ECS, Azure Container Instances, GCP Cloud Run)</summary>

For serverless deployments, run the rotation script from your local machine using Docker. This approach works by connecting directly to your cloud database.

#### Prerequisites

- Docker installed on your local machine
- Database connection details (host, port, credentials)
- Network access to your database from your machine
- New LOCKBOX_MASTER_KEY generated

#### General Steps

**Step 1: Stop incoming traffic**
- Scale your service to 0 replicas or enable maintenance mode

**Step 2: Backup your database**
- Use your cloud provider's backup tools

**Step 3: Create a `.env` file with your database credentials and new key**

```bash
cat > rotation.env << EOF
PG_HOST=your-database-host.com
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
EOF
```

**Step 4: Run rotation using Docker (dry-run first)**

```bash
docker run -it --rm \
  --env-file rotation.env \
  tooljet/tooljet:ee-lts-latest \
  npm run rotate:keys:prod -- --dry-run
```

When prompted, enter your OLD key (current production key).

**Step 5: Run actual rotation** (remove `--dry-run`):

```bash
docker run -it --rm \
  --env-file rotation.env \
  tooljet/tooljet:ee-lts-latest \
  npm run rotate:keys:prod
```

**Step 6: Update your deployment** with the new LOCKBOX_MASTER_KEY and restart the service.

#### AWS ECS + RDS

**Database Access:**
- Temporarily allow your IP in RDS security group
- Use RDS endpoint as `PG_HOST`
- SSL is enabled by default for RDS

**Example `.env` file:**
```bash
PG_HOST=tooljet-db.abc123.us-east-1.rds.amazonaws.com
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
```

Then run: `docker run -it --rm --env-file rotation.env tooljet/tooljet:ee-lts-latest npm run rotate:keys:prod`

**After rotation:**
1. Update ECS task definition with new `LOCKBOX_MASTER_KEY` secret
2. Deploy new task definition
3. Scale service back up
4. Remove your IP from security group

#### Azure Container Instances + Azure Database for PostgreSQL

**Database Access:**
- Add your IP to Azure Database firewall rules temporarily
- Use Azure Database hostname as `PG_HOST`
- SSL is required for Azure Database

**Example `.env` file:**
```bash
PG_HOST=tooljet-db.postgres.database.azure.com
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user@tooljet-db
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
```

Then run: `docker run -it --rm --env-file rotation.env tooljet/tooljet:ee-lts-latest npm run rotate:keys:prod`

**After rotation:**
1. Update container instance environment variables with new `LOCKBOX_MASTER_KEY`
2. Restart container instance
3. Remove your IP from firewall rules

#### GCP Cloud Run + Cloud SQL

**Option 1: Using Cloud SQL Proxy** (Recommended)

Start Cloud SQL proxy locally:
```bash
cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432
```

Create `.env` file for localhost:
```bash
PG_HOST=localhost
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
```

Run rotation:
```bash
docker run -it --rm \
  --network="host" \
  --env-file rotation.env \
  tooljet/tooljet:ee-lts-latest \
  npm run rotate:keys:prod
```

**Option 2: Using Public IP**

- Enable public IP for Cloud SQL instance
- Add your IP to authorized networks
- Create `.env` file with Cloud SQL public IP as `PG_HOST`

**After rotation:**
1. Update Cloud Run service environment variables with new `LOCKBOX_MASTER_KEY`
2. Deploy new revision
3. Remove temporary network access

</details>

## Understanding the Rotation Process

The rotation script performs the following steps automatically:

1. **Validates new key** - Checks that `LOCKBOX_MASTER_KEY` in .env is properly formatted
2. **Prompts for old key** - Secure interactive prompt for your current production key
3. **Tests both keys** - Verifies both keys can encrypt and decrypt test data
4. **Backup confirmation** - Prompts for manual confirmation that database backup exists
5. **Database connection** - Establishes connection to PostgreSQL database
6. **Verification** - Decrypts sample data with new key to confirm success

:::note Transaction Safety
All tables are rotated in a **single atomic database transaction**. If any error occurs during rotation, all changes are automatically rolled back and your database remains unchanged. This ensures data integrity and prevents partial encryption states.
:::

## Verification After Rotation

### Check Application Logs

After restarting the application, monitor logs for any decryption errors

```bash
# Docker Compose
docker-compose logs -f server

# Systemd service
journalctl -u nest -f

# Kubernetes
kubectl logs -f deployment/tooljet -n tooljet
```

:::warning
If you see any decryption errors in the logs, **immediately stop the application** and follow the rollback procedure.
:::

### Success Indicators

Rotation was successful if:
- Application starts without errors
- No decryption errors in logs
- All data sources connect successfully
- SSO authentication works (if configured)
- Organization constants are accessible
- ToolJet Database queries execute (if used)
- User profiles display correctly

## Rollback Procedure

:::warning Critical
Only perform rollback if critical errors occur after rotation. This requires restoring the database backup.
:::

### When to Rollback

Perform an emergency rollback if:
- Application fails to start after rotation
- Persistent decryption errors in logs
- Data source connections failing
- SSO authentication broken
- Users cannot access data or features

:::note Important
Store the old encryption key securely for **24-48 hours** after rotation in case emergency rollback is needed. After this period, if rotation is successful, the old key can be permanently deleted.
:::

## Security Best Practices

- **Never commit keys to version control** - Always use .env files or secrets management systems
- **Store old key securely** - Keep in encrypted password manager for emergency rollback
- **Test in staging first** - Always use `--dry-run` flag before production rotation

:::tip Secrets Management
For enterprise deployments, integrate ToolJet with a secrets management system:
- **AWS**: Use AWS Secrets Manager with automatic rotation
- **Azure**: Use Azure Key Vault with managed identities
- **GCP**: Use Google Secret Manager with Workload Identity
- **HashiCorp**: Use Vault with dynamic secrets
- **Kubernetes**: Use External Secrets Operator with your cloud provider
:::

## Frequently Asked Questions

<details id="tj-dropdown">
    <summary>How long does key rotation take?</summary>

Rotation time depends on your database size:

- **Small databases** (&lt;1,000 encrypted rows): 1-2 minutes
- **Medium databases** (1,000-10,000 rows): 2-5 minutes
- **Large databases** (&gt;10,000 rows): 5-15 minutes

The **--dry-run** mode takes approximately the same time as actual rotation since it processes all data (but rolls back instead of committing).

**Tip**: Run **--dry-run** first to get an accurate time estimate for your deployment.

</details>

<details id="tj-dropdown">
    <summary>Can I rotate keys without downtime?</summary>

No. The application **must be stopped from incoming traffic** during key rotation to prevent:

- Write operations using the old key during rotation
- Data inconsistency between old and new encrypted data
- Partial encryption states
- Race conditions between rotation and application writes

You must plan for a **maintenance window**. The downtime is typically:
- Rotation time + application restart time
- Usually 5-10 minutes for small to medium deployments
- Can be longer for large databases

</details>

<details id="tj-dropdown">
    <summary>What happens if rotation fails halfway?</summary>

The rotation script uses a **database transaction** for safety. If any error occurs:

All changes are **automatically rolled back** Database remains in **original state** with old encryption **No data is lost or corrupted**. You can **retry** after fixing the issue (wrong key, database connection, etc.)

</details>

<details id="tj-dropdown">
    <summary>How do I verify the rotation was successful?</summary>

Verify rotation success with these checks:

1. Script shows **ROTATION COMPLETED SUCCESSFULLY** message
2. Application starts without errors
3. No decryption errors in logs for 24 hours
4. Test data sources connect successfully
5. SSO login works (if configured)
6. Organization constants are accessible
7. ToolJet Database queries work (if used)
8. User profiles display correctly

If all checks pass, the database backup can be deleted after 24-48 hours.

</details>

<details id="tj-dropdown">
    <summary>Can I automate key rotation?</summary>

While the rotation script can be run non-interactively, it's **not recommended** for most organizations due to:

**Challenges:**
- Script requires interactive old key input (security feature to prevent key exposure)
- Backup confirmation prompt required
- Application downtime coordination needed
- Risk of automated failure without human oversight

**For automation (advanced users only):**
- Modify script to accept old key via secure environment variable
- Implement automatic backup verification
- Ensure monitoring and alerting for failures

**Recommendation**: Manual rotation with proper testing and oversight is safer for most organizations. The security benefits of careful manual rotation outweigh automation convenience.

</details>

<details id="tj-dropdown">
    <summary>Does rotation affect ToolJet Cloud users?</summary>

**No.** Key rotation is **only for self-hosted deployments**.

Self-hosted users must perform manual key rotation as documented in this guide.

</details>

<details id="tj-dropdown">
    <summary>What if I lose the old key during rotation?</summary>

If you lose the old encryption key:

**Cannot decrypt existing data** - Data encrypted with old key is unrecoverable without it
**Cannot perform rotation** - Rotation requires both old and new keys

**Prevention:**
- Store LOCKBOX_MASTER_KEY in encrypted password manager (1Password, LastPass, Bitwarden)
- Maintain secure backup of .env file in encrypted storage
- Use secrets management system (AWS Secrets Manager, Vault) with backup/recovery
- Document key location in runbook for disaster recovery

**If key is lost:**
- Check encrypted password manager
- Check secure .env backups
- Check secrets management system
- Check with team members who have access
- If truly lost and no backup exists, database restoration from backup may be required

</details>

--------

## Support

If you encounter issues during migration:

- **Community**: Join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- **Email**: hello@tooljet.com
- **GitHub Issues**: [Report bugs](https://github.com/ToolJet/ToolJet/issues)
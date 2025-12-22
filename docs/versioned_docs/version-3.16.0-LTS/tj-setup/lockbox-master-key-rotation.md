---
id: lockbox-master-key-rotation
title: LOCKBOX_MASTER_KEY Rotation
---

<div className="badge badge--self-hosted">
  <span>Self Hosted</span>
</div>


This guide explains how to securely rotate the `LOCKBOX_MASTER_KEY` in your self-hosted ToolJet deployment.

## What is LOCKBOX_MASTER_KEY?

The `LOCKBOX_MASTER_KEY` is a master encryption key that ToolJet uses to encrypt sensitive data stored in your PostgreSQL database. It uses **AES-256-GCM** encryption with **HKDF-SHA384** key derivation. Periodic key rotation is an important security practice to maintain data protection and meet compliance requirements.

## When to Rotate Keys

### Recommended Rotation Frequency

- **Standard security**: Annually
- **High-security environments**: Every 90 days

### Mandatory Rotation Scenarios

You **must** rotate the LOCKBOX_MASTER_KEY when:

- **Key exposure or suspected compromise** - If the key is accidentally exposed in logs, code repositories, or to unauthorized personnel
- **Employee departure** - When an employee with access to the key leaves the organization
- **Security incident** - After any security breach or incident affecting your infrastructure
- **Security audit findings** - If an audit identifies the need for key rotation
- **Compliance mandates** - When required by security frameworks or regulations

:::warning
Never rotate keys during peak usage hours. Plan for a maintenance window as the application must be stopped during rotation.
:::

## Prerequisites

Before starting the key rotation process, ensure you have:

- **Super Admin access** - Required for database operations and script execution
- **Application downtime planned** - ToolJet must be completely stopped during rotation
- **Database backup** - Full PostgreSQL backup (script will prompt for confirmation)
- **Old key available** - Current `LOCKBOX_MASTER_KEY` value (you'll be prompted to enter it)
- **New key generated** - A new 64-character hexadecimal key (see generation instructions below)
- **Staging environment tested** - Test the rotation with `--dry-run` flag first

:::tip
Always test the rotation process in a staging environment before performing it in production.
:::

## Generating a New Key

Generate a cryptographically secure 256-bit key (64 hexadecimal characters) using OpenSSL:

```bash
# Generate a new key
openssl rand -hex 32

# Example output:
# 81a591705f8fea18d4f459e9ee07a2c61c4d53a0a5de7fb5c8d1245b134f500b
```

:::info
The key must be exactly 64 hexadecimal characters (0-9, a-f, A-F). Store this new key securely - you'll update your environment configuration with it.
:::

## Rotation Procedure

### Preparation Steps

1. **Notify users** - Inform users of the upcoming maintenance window
2. **Stop ToolJet application** - Ensure no writes occur during rotation
3. **Backup database** - Create a full PostgreSQL backup
4. **Update environment variable** - Set `LOCKBOX_MASTER_KEY` to your new key value
5. **Keep old key accessible** - You'll be prompted to enter it during rotation

### Docker Compose Deployment

```bash
# Step 1: Stop the application
docker-compose down

# Step 2: Backup database (use your backup method)

# Step 3: Update .env file with NEW key
nano .env
# Update: LOCKBOX_MASTER_KEY=<new-key-64-hex-chars>

# Step 4: Run rotation in dry-run mode (test first)
docker-compose run --rm server npm run rotate:keys -- --dry-run

# When prompted, enter your OLD key (current production key):
# Please enter the old key: <old-key-here>

# Step 5: If dry-run succeeds, run actual rotation
docker-compose run --rm server npm run rotate:keys

# Step 6: Restart application
docker-compose up -d

# Step 7: Verify logs for errors
docker-compose logs -f server
```

### Kubernetes Deployment

```bash
# Step 1: Scale down deployment to stop application
kubectl scale deployment tooljet --replicas=0 -n tooljet

# Step 2: Backup database (use your backup method)

# Step 3: Update secret with NEW key
kubectl edit secret tooljet-secrets -n tooljet
# Update LOCKBOX_MASTER_KEY with new key (base64 encoded)
# echo -n '<new-key>' | base64

# Step 4: Run rotation job (dry-run first)
kubectl run key-rotation --rm -it \
  --image=tooljet/tooljet:latest \
  --env="LOCKBOX_MASTER_KEY=<new-key>" \
  --namespace=tooljet \
  --command -- npm run rotate:keys -- --dry-run

# When prompted, enter OLD key

# Step 5: Run actual rotation
kubectl run key-rotation --rm -it \
  --image=tooljet/tooljet:latest \
  --env="LOCKBOX_MASTER_KEY=<new-key>" \
  --namespace=tooljet \
  --command -- npm run rotate:keys

# Step 6: Scale deployment back up
kubectl scale deployment tooljet --replicas=3 -n tooljet

# Step 7: Verify logs
kubectl logs -f deployment/tooljet -n tooljet
```

### AWS EC2 / Traditional Server Deployment

```bash
# Step 1: Stop ToolJet service
sudo systemctl stop nest

# Step 2: Backup database (use your backup method)

# Step 3: Update .env file with NEW key
cd ~/app
nano .env
# Update: LOCKBOX_MASTER_KEY=<new-key-64-hex-chars>

# Step 4: Run rotation (dry-run first)
npm run rotate:keys -- --dry-run

# When prompted, enter OLD key

# Step 5: Run actual rotation
npm run rotate:keys

# Step 6: Restart service
sudo systemctl start nest

# Step 7: Check service status and logs
sudo systemctl status nest
journalctl -u nest -f
```

## Understanding the Rotation Process

The rotation script performs the following steps automatically:

1. **Validates new key** - Checks that `LOCKBOX_MASTER_KEY` in .env is properly formatted (64 hex chars)
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

After restarting the application, monitor logs for any decryption errors:

```bash
# Docker Compose
docker-compose logs -f server

# Systemd service
journalctl -u nest -f

# Kubernetes
kubectl logs -f deployment/tooljet -n tooljet
```

Look for error messages such as:
- `Decryption failed`
- `Invalid key`
- `Authentication tag mismatch`
- `Could not decrypt`

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

## Rollback Procedure (Emergency Recovery)

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

Follow these security practices when rotating encryption keys:

- **Never commit keys to version control** - Always use .env files or secrets management systems
- **Store old key securely** - Keep old key in encrypted password manager for 24-48 hours for emergency rollback
- **Limit key access** - Only Super Admins should have access to `LOCKBOX_MASTER_KEY`
- **Use secrets management** - For production, use AWS Secrets Manager, HashiCorp Vault, Azure Key Vault, or similar
- **Audit key changes** - Document who performed rotation, when, and why in your security logs
- **Test in staging first** - Always use `--dry-run` flag and test in non-production environment
- **Plan maintenance window** - Rotate during low-traffic periods to minimize user impact
- **Monitor post-rotation** - Watch application logs for 24 hours after rotation to catch any issues early
- **Rotate regularly** - Set calendar reminders for annual or quarterly rotation
- **Document the process** - Keep internal documentation of your rotation procedures and emergency contacts

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

The `--dry-run` mode takes approximately the same time as actual rotation since it processes all data (but rolls back instead of committing).

**Tip**: Run `--dry-run` first to get an accurate time estimate for your deployment.

</details>

<details id="tj-dropdown">
    <summary>Can I rotate keys without downtime?</summary>

No. The application **must be stopped** during key rotation to prevent:

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

All changes are **automatically rolled back**
Database remains in **original state** with old encryption
**No data is lost or corrupted**
You can **retry** after fixing the issue (wrong key, database connection, etc.)

The transaction ensures atomicity - either all 5 tables are rotated successfully, or none are rotated. There's no "partial rotation" state.

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
- Use CI/CD with encrypted secret injection
- Ensure monitoring and alerting for failures

**Recommendation**: Manual rotation with proper testing and oversight is safer for most organizations. The security benefits of careful manual rotation outweigh automation convenience.

</details>

<details id="tj-dropdown">
    <summary>Does rotation affect ToolJet Cloud users?</summary>

**No.** Key rotation is **only for self-hosted deployments**.

ToolJet Cloud users benefit from:
- **Automated key rotation** - Managed by ToolJet Cloud infrastructure
- **Zero-downtime rotation** - No maintenance windows required
- **Compliance-aligned schedules** - Automatic rotation per security best practices
- **SOC 2 Type II compliance** - Enterprise-grade key management

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

<details id="tj-dropdown">
    <summary>Can I rotate keys for specific tables only?</summary>

**No.** The rotation script processes **all 5 encrypted tables** in a single operation:

1. credentials
2. org_environment_constant_values
3. sso_configs
4. organization_tjdb_configurations
5. user_details

**Why all tables?**
- LOCKBOX_MASTER_KEY is the **master key** for all encrypted data
- All tables use derived keys from the same master key
- Partial rotation would create inconsistent encryption states
- Single transaction ensures atomicity across all tables

</details>

--------

## Support

If you encounter issues during migration:

- **Community**: Join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- **Email**: hello@tooljet.com
- **GitHub Issues**: [Report bugs](https://github.com/ToolJet/ToolJet/issues)
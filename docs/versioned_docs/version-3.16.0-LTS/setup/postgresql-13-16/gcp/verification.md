---
id: verification
title: Verification and Troubleshooting
---

## Verification Steps

### Docker on GCE

```bash
sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
sudo docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### GKE

```bash
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Cloud Run

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tooljet" \
  --filter="textPayload:TOOLJET APPLICATION STARTED SUCCESSFULLY" \
  --limit=10
```

### Database Version Verification

```bash
psql "postgresql://username:password@your-cloud-sql-ip:5432/database" -c "SELECT version();"
```

## Common Issues and Solutions

### Certificate Not Found

**Symptoms**: `ENOENT: no such file or directory, open '/certs/server-ca.pem'`

**Solutions**:
1. Verify certificate path and file permissions
2. Check volume mounts in Kubernetes/Docker configurations
3. Ensure Secret Manager permissions for Cloud Run

### SSL Connection Errors

**Symptoms**: `SELF_SIGNED_CERT_IN_CHAIN` or `certificate verify failed`

**Solutions**:
1. Verify SSL connections work properly
2. Ensure certificate file is readable by the application
3. Check that the certificate is the correct Cloud SQL CA certificate
4. Consider using Cloud SQL Proxy for automatic SSL handling

### Cloud SQL Connection Timeout

**Symptoms**: Connection timeouts or refused connections

**Solutions**:
1. Check Cloud SQL instance's authorized networks
2. Verify VPC/firewall rules
3. Ensure Cloud SQL instance is in RUNNABLE state
4. Check if Private IP is configured correctly

#### Issue: Authentication Errors

**Symptoms**: `password authentication failed for user`

**Solutions**:
1. Verify database credentials
2. Check if user exists and has proper permissions
3. Confirm database name is correct
4. Test connection from Cloud Shell

## Manual Connection Testing

```bash
# Test Cloud SQL connection with SSL from Cloud Shell
gcloud sql connect your-instance-id --user=postgres --database=your-database

# Test from local machine with SSL
psql "postgresql://username:password@your-cloud-sql-ip:5432/database" -c "SELECT version();"

# Test using Cloud SQL Proxy locally
./cloud-sql-proxy your-project-id:your-region:your-instance-id &
psql "postgresql://username:password@127.0.0.1:5432/database" -c "SELECT version();"
```


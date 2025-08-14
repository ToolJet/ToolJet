---
id: verification
title: Verification and Troubleshooting
---

## Verification Steps

### Docker

```bash
docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### AMI

```bash
sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### ECS

```bash
aws logs filter-log-events \
  --log-group-name /ecs/tooljet \
  --filter-pattern "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Kubernetes EKS

```bash
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

## Common Issues and Solutions

### Certificate Not Found

**Symptoms**: `ENOENT: no such file or directory`

**Solution**: Verify certificate path and permissions

### Still Getting SSL Errors

**Symptoms**: `SELF_SIGNED_CERT_IN_CHAIN`

**Solutions**:
1. Verify `NODE_EXTRA_CA_CERTS` is correctly set
2. Ensure certificate file is readable
3. Restart the application after configuration changes

### Database Connection Fails

**Solutions**:
1. Check RDS security groups
2. Verify database credentials
3. Test connection manually

## Manual Connection Test

```bash
# Test PostgreSQL connection with SSL
psql "postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/database?sslmode=require&sslrootcert=/path/to/global-bundle.pem"
```
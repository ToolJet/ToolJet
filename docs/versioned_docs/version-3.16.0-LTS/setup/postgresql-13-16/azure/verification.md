---
id: verification
title: Verification and Troubleshooting
---

## Verification Steps

### AKS

```bash
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Azure Container Instances

```bash
az container logs --resource-group your-rg --name tooljet-container | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Database version verification

```bash
psql "postgresql://username:password@your-server.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT version();"
```

## Common Issues and Solutions

### SSL Connection Required

**Symptoms**: `connection requires SSL` or `SSL is required`

**Solutions**:
1. Ensure `PGSSLMODE=require` is set in environment variables
2. Verify the connection string includes `?sslmode=require`
3. Check that Azure PostgreSQL Flexible Server has SSL enforcement enabled

### Authentication Errors

**Symptoms**: `password authentication failed for user`

**Solutions**:
1. Verify database credentials are correct
2. Check if the user exists and has proper permissions
3. Confirm database name is correct
4. Test connection from Azure Cloud Shell

### Network Connectivity

**Symptoms**: Connection timeouts or connection refused

**Solutions**:
1. Check Azure PostgreSQL Flexible Server firewall rules
2. Verify VNet/subnet configuration if using private networking
3. Ensure Azure PostgreSQL server is in **Available** state
4. Check NSG (Network Security Group) rules

### Container Startup Failures

**Symptoms**: Container fails to start or restart loops

**Solutions**:
1. Check container logs for detailed error messages
2. Verify all required environment variables are set
3. Ensure adequate CPU/memory resources are allocated
4. Test database connectivity separately

## Manual Connection Testing

```bash
# Test Azure PostgreSQL connection from Azure Cloud Shell
az postgres flexible-server connect \
  --name your-server-name \
  --admin-user your-username \
  --database-name your-database

# Test from local machine with SSL
psql "postgresql://username:password@your-server.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT version();"

# Test using Azure CLI with psql
az postgres flexible-server execute \
  --name your-server-name \
  --admin-user your-username \
  --admin-password your-password \
  --database-name your-database \
  --querytext "SELECT version();"
```

---
id: container
title: Azure Container Instances Setup
---

For Azure Container Instances deployment, follow the comprehensive setup guide in the ToolJet documentation which includes detailed Azure CLI commands, ARM templates, and configuration options.

### Important Environment Variables for PostgreSQL 16

When configuring your Azure Container Instance, ensure you include these critical environment variables:

```bash
# Required environment variables for Azure PostgreSQL connection
PG_HOST=your-server.postgres.database.azure.com
PG_PORT=5432
PG_DB=your-database-name
PG_USER=your-username
PGSSLMODE=require  # MANDATORY for Azure PostgreSQL
```

```bash
# Secure environment variables (use --secure-environment-variables)
PG_PASS=your-password
```

:::warning
The `PGSSLMODE=require` environment variable is mandatory for Azure PostgreSQL connections. Azure Container Instances automatically handles SSL/TLS encryption when this variable is set.
:::

### Verification

After deployment, verify your container is running and connecting to the upgraded PostgreSQL 16 database:

```bash
# View container logs to verify successful startup
az container logs --resource-group your-rg --name tooljet-container | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"

# Test database connectivity
curl http://your-container-fqdn:3000/api/health
```

**Reference**: [ToolJet Azure Container Setup Documentation](https://docs.tooljet.ai/docs/setup/azure-container)

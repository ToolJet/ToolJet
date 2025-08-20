---
id: aks
title: Azure Kubernetes Service (AKS) 
---

For Azure Kubernetes Service (AKS) deployment, follow the comprehensive setup guide in the ToolJet documentation which includes detailed Kubernetes manifests, Helm charts, and configuration options.

### Important Environment Variables for PostgreSQL 16

When configuring your AKS deployment, ensure you include these critical environment variables in your deployment configuration:

```bash
# Required environment variables for Azure PostgreSQL connection
PG_HOST=your-server.postgres.database.azure.com
PG_PORT=5432
PG_DB=your-database-name  
PG_USER=your-username
PGSSLMODE=require  # MANDATORY for Azure PostgreSQL
```

```bash
# Secure environment variables (store in Kubernetes secrets)
PG_PASS=your-password
```

:::warning
The `PGSSLMODE=require` environment variable is mandatory for Azure PostgreSQL connections. This ensures secure SSL/TLS encrypted connections are established.
:::

### Verification

After deployment, verify your AKS deployment is running and connecting to the upgraded PostgreSQL 16 database:

```bash
# Check logs for successful startup
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"

# Verify database connectivity
kubectl exec -it deployment/tooljet -n tooljet -- \
  psql "postgresql://username:password@your-server.postgres.database.azure.com:5432/database?sslmode=require"
```

**Reference**: [ToolJet Kubernetes AKS Setup Documentation](https://docs.tooljet.ai/docs/setup/kubernetes-aks)

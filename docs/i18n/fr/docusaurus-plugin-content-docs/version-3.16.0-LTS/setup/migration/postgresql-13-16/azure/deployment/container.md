---
id: container
title: Configuration Azure Container Instances
slug: /setup/postgresql-13-16/azure/deployment/container/
---

Pour un déploiement sur Azure Container Instances, suivez le guide de configuration complet de la documentation ToolJet, qui inclut des commandes Azure CLI détaillées, des modèles ARM et des options de configuration.

### Variables d'environnement importantes pour PostgreSQL 16

Lors de la configuration de votre instance de conteneur Azure, veillez à inclure ces variables d'environnement essentielles :

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
La variable d'environnement `PGSSLMODE=require` est obligatoire pour les connexions Azure PostgreSQL. Azure Container Instances gère automatiquement le chiffrement SSL/TLS lorsque cette variable est définie.
:::

### Vérification

Après le déploiement, vérifiez que votre conteneur fonctionne et se connecte correctement à la base de données PostgreSQL 16 mise à niveau :

```bash
# View container logs to verify successful startup
az container logs --resource-group your-rg --name tooljet-container | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"

# Test database connectivity
curl http://your-container-fqdn:3000/api/health
```

**Référence** : [Documentation de configuration ToolJet Azure Container](https://docs.tooljet.com/docs/setup/azure-container)

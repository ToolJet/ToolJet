---
id: aks
title: Azure Kubernetes Service (AKS)
slug: /setup/postgresql-13-16/azure/deployment/aks/
---

Pour un déploiement sur Azure Kubernetes Service (AKS), suivez le guide de configuration complet de la documentation ToolJet, qui inclut des manifestes Kubernetes détaillés, des charts Helm et des options de configuration.

### Variables d'environnement importantes pour PostgreSQL 16

Lors de la configuration de votre déploiement AKS, veillez à inclure ces variables d'environnement essentielles dans votre configuration de déploiement :

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
La variable d'environnement `PGSSLMODE=require` est obligatoire pour les connexions Azure PostgreSQL. Cela garantit l'établissement de connexions chiffrées SSL/TLS sécurisées.
:::

### Vérification

Après le déploiement, vérifiez que votre déploiement AKS fonctionne et se connecte correctement à la base de données PostgreSQL 16 mise à niveau :

```bash
# Check logs for successful startup
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"

# Verify database connectivity
kubectl exec -it deployment/tooljet -n tooljet -- \
  psql "postgresql://username:password@your-server.postgres.database.azure.com:5432/database?sslmode=require"
```

**Référence** : [Documentation de configuration ToolJet Kubernetes AKS](https://docs.tooljet.com/docs/setup/kubernetes-aks)

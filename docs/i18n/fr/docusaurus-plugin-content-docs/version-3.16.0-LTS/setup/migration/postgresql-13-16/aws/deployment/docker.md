---
id: docker
title: Docker
slug: /setup/postgresql-13-16/aws/deployment/docker/
---

### 1. Mettre à jour docker-compose.yaml

Ajoutez uniquement le montage de volume

```yaml
services:
tooljet:
  # ... other configuration
  volumes:
    - /path/to/global-bundle.pem:/certs/global-bundle.pem
```

### 2. Mettre à jour le fichier .env

```bash
# Database connection settings
PG_HOST=your-rds-endpoint.region.rds.amazonaws.com
PG_USER=postgres
PG_PASS=your-password
PG_DB=your-database-name
PG_PORT=5432

# SSL Configuration
PGSSLMODE=require

# Critical SSL certificate configuration
NODE_EXTRA_CA_CERTS=/certs/global-bundle.pem
```

### 3. Appliquer les modifications

```bash
# Restart containers
docker-compose down
docker-compose up -d

# Verify SSL connection
docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

**Référence** : [Documentation de configuration Docker de ToolJet](https://docs.tooljet.com/docs/setup/docker)

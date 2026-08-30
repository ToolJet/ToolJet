---
id: docker
title: Docker
slug: /setup/postgresql-13-16/gcp/deployment/docker/
---

### 1. Se connecter en SSH à votre instance GCE

```bash
# SSH into your Compute Engine instance
gcloud compute ssh your-instance-name --zone=your-zone
```

### 2. Mettre à jour docker-compose.yaml

```yaml
services:
  tooljet:
    # ... other configuration
    environment:
      # Database connection settings
      - PG_HOST=your-cloud-sql-ip
      - PG_USER=postgres
      - PG_PASS=your-password
      - PG_DB=your-database-name
      - PG_PORT=5432
      # SSL is automatically handled by Cloud SQL
```

### 3. Appliquer les modifications

```bash
# Restart containers
sudo docker-compose down
sudo docker-compose up -d

# Verify SSL connection
sudo docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

**Référence** : [ToolJet Docker Setup Documentation](https://docs.tooljet.com/docs/setup/docker)

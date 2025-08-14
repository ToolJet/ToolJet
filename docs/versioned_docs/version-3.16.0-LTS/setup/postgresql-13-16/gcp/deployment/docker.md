---
id: docker
title: Docker
---

### 1. SSH Into Your GCE Instance

```bash
# SSH into your Compute Engine instance
gcloud compute ssh your-instance-name --zone=your-zone
```

### 2. Update docker-compose.yaml

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

### 3. Apply Changes

```bash
# Restart containers
sudo docker-compose down
sudo docker-compose up -d

# Verify SSL connection
sudo docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

**Reference**: [ToolJet Docker Setup Documentation](https://docs.tooljet.ai/docs/setup/docker)

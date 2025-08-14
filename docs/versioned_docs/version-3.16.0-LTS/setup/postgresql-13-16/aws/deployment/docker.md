---
id: docker
title: Docker
---

### 1. Update docker-compose.yaml

Add volume mount only

```yaml
services:
tooljet:
    # ... other configuration
    volumes:
    - /path/to/global-bundle.pem:/certs/global-bundle.pem
```

### 2. Update .env file

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

### 3. Apply Changes

```bash
# Restart containers
docker-compose down
docker-compose up -d

# Verify SSL connection
docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

**Reference**: [ToolJet Docker Setup Documentation](https://docs.tooljet.ai/docs/setup/docker)

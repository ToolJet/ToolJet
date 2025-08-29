---
id: ami
title: AMI
---

### 1. Download Certificate on AMI Instance

```bash
# SSH into your AMI instance
ssh user@your-ami-instance

# Create certs directory if it doesn't exist
sudo mkdir -p /path/to/certs/

# Download the global CA bundle directly on the instance
cd /path/to/certs/
sudo wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# OR using curl
sudo curl -O https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Set proper permissions
sudo chmod 644 /path/to/certs/global-bundle.pem

# Verify the certificate file
head -5 global-bundle.pem
```

### 2. Update Environment Configuration

```bash
# Edit the environment file
sudo nano /path/to/.env

# Add/update these variables
PG_HOST=your-rds-endpoint.region.rds.amazonaws.com
PGSSLMODE=require
NODE_EXTRA_CA_CERTS=/path/to/certs/global-bundle.pem
```

### 3. Restart ToolJet Application

```bash
# Restart ToolJet using the setup script
cd /app/tooljet
sudo ./setup_app
```

**Reference**: [ToolJet AMI Setup Documentation](https://docs.tooljet.ai/docs/setup/ami)

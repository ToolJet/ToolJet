---
id: gke
title: Google Kubernetes Engine
---

### Step 1: Create ConfigMap for Database Configuration

:::note 
SSL certificate secrets are not required for standard GCP Cloud SQL connections as SSL is handled automatically.
:::

```yaml
# db-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: tooljet-db-config
  namespace: tooljet
data:
  PG_HOST: "your-cloud-sql-ip"
  PG_PORT: "5432"
  PG_DB: "your-database-name"
  PG_USER: "postgres"
```

```bash
# Apply the ConfigMap
kubectl apply -f db-config.yaml
```

### Step 2: Update ToolJet Deployment

```yaml
# tooljet-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tooljet
  namespace: tooljet
spec:
  template:
    spec:
      containers:
      - name: tooljet
        image: tooljet/tooljet:latest
        envFrom:
        - configMapRef:
            name: tooljet-db-config
        - secretRef:
            name: tooljet-secrets  # Your existing secrets
        env:
        - name: PG_PASS
          valueFrom:
            secretKeyRef:
              name: tooljet-db-secrets
              key: postgres-password
        ports:
        - containerPort: 3000
          name: http
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Reference**: [ToolJet Kubernetes GKE Setup Documentation](https://docs.tooljet.ai/docs/setup/kubernetes-gke)

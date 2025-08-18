---
id: cloud-run
title: Cloud Run
---

### Step 1: Deploy to Cloud Run

:::note
SSL certificates are not required for Cloud Run with Cloud SQL as SSL connections are handled automatically.
:::

**Method A: Using gcloud CLI**
```bash
# Deploy to Cloud Run with direct database connection
gcloud run deploy tooljet \
  --image=tooljet/tooljet:latest \
  --platform=managed \
  --region=your-region \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --set-env-vars="PG_HOST=your-cloud-sql-ip,PG_PORT=5432,PG_DB=your-database-name,PG_USER=postgres" \
  --set-secrets="PG_PASS=db-password:latest"
```

**Method B: Using YAML configuration**

Create `service.yaml`:
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: tooljet
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: tooljet/tooljet:latest
        resources:
          limits:
            memory: 2Gi
            cpu: 2000m
        env:
        - name: PG_HOST
          value: "your-cloud-sql-ip"
        - name: PG_PORT
          value: "5432"
        - name: PG_DB
          value: "your-database-name"
        - name: PG_USER
          value: "postgres"
        - name: PG_PASS
          valueFrom:
            secretKeyRef:
              name: db-password
              key: password
        ports:
        - containerPort: 3000
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

```bash
# Deploy using YAML
gcloud run services replace service.yaml --region=your-region
```

### Step 2: Alternative - Using Cloud SQL Proxy with Cloud Run (Recommended)

**Cloud Run with built-in Cloud SQL connection:**
```bash
# Deploy Cloud Run service with Cloud SQL connector
gcloud run deploy tooljet \
  --image=tooljet/tooljet:latest \
  --platform=managed \
  --region=your-region \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --add-cloudsql-instances=your-project-id:your-region:your-instance-id \
  --set-env-vars="PG_HOST=/cloudsql/your-project-id:your-region:your-instance-id,PG_PORT=5432,PG_DB=your-database-name,PG_USER=postgres" \
  --set-secrets="PG_PASS=db-password:latest"
```

This approach uses Google's Cloud SQL Unix domain socket, which is automatically encrypted and doesn't require SSL certificates.

**Reference**: [ToolJet Google Cloud Run Setup Documentation](https://docs.tooljet.ai/docs/setup/google-cloud-run)

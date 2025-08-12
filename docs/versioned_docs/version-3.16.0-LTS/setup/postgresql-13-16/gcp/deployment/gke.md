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

### Step 3: Alternative - Using Cloud SQL Proxy (Recommended)

**Option A: Cloud SQL Proxy Sidecar Pattern**
```yaml
# tooljet-deployment-with-proxy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tooljet
  namespace: tooljet
spec:
  template:
    spec:
      serviceAccountName: tooljet-gsa  # Service account with Cloud SQL Client role
      containers:
      - name: tooljet
        image: tooljet/tooljet:latest
        env:
        - name: PG_HOST
          value: "127.0.0.1"  # Connect through proxy
        - name: PG_PORT
          value: "5432"
        - name: PG_DB
          value: "your-database-name"
        - name: PG_USER
          value: "postgres"
        - name: PG_PASS
          valueFrom:
            secretKeyRef:
              name: tooljet-db-secrets
              key: postgres-password
        ports:
        - containerPort: 3000
      - name: cloud-sql-proxy
        image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
        args:
        - "--structured-logs"
        - "--port=5432"
        - "your-project-id:your-region:your-instance-id"
        securityContext:
          runAsNonRoot: true
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

**Create the necessary service account and bind IAM roles:**
```bash
# Create Google Service Account for Cloud SQL access
gcloud iam service-accounts create tooljet-cloudsql \
  --description="Service account for ToolJet Cloud SQL access" \
  --display-name="ToolJet Cloud SQL SA"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:tooljet-cloudsql@your-project-id.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Create Kubernetes service account
kubectl create serviceaccount tooljet-gsa -n tooljet

# Bind Google Service Account to Kubernetes Service Account
gcloud iam service-accounts add-iam-policy-binding \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:your-project-id.svc.id.goog[tooljet/tooljet-gsa]" \
  tooljet-cloudsql@your-project-id.iam.gserviceaccount.com

# Annotate Kubernetes service account
kubectl annotate serviceaccount tooljet-gsa -n tooljet \
  iam.gke.io/gcp-service-account=tooljet-cloudsql@your-project-id.iam.gserviceaccount.com
```

### Step 4: Apply Configuration and Verify

```bash
# Apply the deployment
kubectl apply -f tooljet-deployment.yaml  # or tooljet-deployment-with-proxy.yaml

# Check deployment status
kubectl rollout status deployment/tooljet -n tooljet

# Verify pods are running
kubectl get pods -n tooljet

# Check logs
kubectl logs deployment/tooljet -n tooljet -c tooljet

# Test database connectivity
kubectl exec -it deployment/tooljet -n tooljet -- \
  psql "postgresql://postgres:password@your-db-ip:5432/database"
```

### Step 5: Using Helm (if applicable)

```yaml
# values.yaml for Helm deployment
image:
  repository: tooljet/tooljet
  tag: latest

env:
  PG_HOST: "your-cloud-sql-ip"
  PG_PORT: "5432"
  PG_DB: "your-database-name"
  PG_USER: "postgres"

secrets:
  PG_PASS: "your-encrypted-password"

extraVolumes:
  - name: ssl-certs
    secret:
      secretName: cloud-sql-ssl-cert

extraVolumeMounts:
  - name: ssl-certs
    mountPath: /certs
    readOnly: true

# Optional: Cloud SQL Proxy configuration
cloudSqlProxy:
  enabled: true
  image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
  instanceConnectionName: "your-project-id:your-region:your-instance-id"
  serviceAccount: tooljet-gsa

workloadIdentity:
  enabled: true
  serviceAccountName: tooljet-gsa
  gcpServiceAccountEmail: "tooljet-cloudsql@your-project-id.iam.gserviceaccount.com"
```

```bash
# Install using Helm
helm upgrade --install tooljet ./tooljet-helm-chart \
  --namespace tooljet \
  --create-namespace \
  --values values.yaml
```

**Reference**: [ToolJet Kubernetes GKE Setup Documentation](https://docs.tooljet.ai/docs/setup/kubernetes-gke)

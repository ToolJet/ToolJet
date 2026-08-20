---
id: cloud-run
title: Cloud Run
slug: /setup/postgresql-13-16/gcp/deployment/cloud-run/
---

### Étape 1 : Déployer sur Cloud Run

:::note
Les certificats SSL ne sont pas nécessaires pour Cloud Run avec Cloud SQL, car les connexions SSL sont gérées automatiquement.
:::

**Méthode A : Utilisation de la CLI gcloud**

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

**Méthode B : Utilisation d'une configuration YAML**

Créez `service.yaml` :

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

**Référence** : [ToolJet Google Cloud Run Setup Documentation](https://docs.tooljet.com/docs/setup/google-cloud-run)

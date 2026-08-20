---
id: gke
title: Google Kubernetes Engine
slug: /setup/postgresql-13-16/gcp/deployment/gke/
---

### Étape 1 : Créer une ConfigMap pour la configuration de la base de données

:::note
Les secrets de certificat SSL ne sont pas nécessaires pour les connexions Cloud SQL standard de GCP, car SSL est géré automatiquement.
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

### Étape 2 : Mettre à jour le déploiement ToolJet

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
                name: tooljet-secrets # Your existing secrets
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

**Référence** : [ToolJet Kubernetes GKE Setup Documentation](https://docs.tooljet.com/docs/setup/kubernetes-gke)

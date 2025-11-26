---
id: eks
title: Kubernetes EKS
---

### 1. Create ConfigMap for SSL Certificate

```yaml
# ssl-cert-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rds-ssl-cert
  namespace: tooljet
data:
  global-bundle.pem: |
    -----BEGIN CERTIFICATE-----
    # Paste the entire content of global-bundle.pem here
    -----END CERTIFICATE-----
```

```bash
# Apply the ConfigMap
kubectl apply -f ssl-cert-configmap.yaml
```

### 2. Update ToolJet Deployment

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
        env:
        - name: PG_HOST
          value: "your-rds-endpoint.region.rds.amazonaws.com"
        - name: PGSSLMODE
          value: "require"
        - name: NODE_EXTRA_CA_CERTS
          value: "/certs/global-bundle.pem"
        volumeMounts:
        - name: ssl-certs
          mountPath: /certs
          readOnly: true
      volumes:
      - name: ssl-certs
        configMap:
          name: rds-ssl-cert
```

### 3. Alternative: Using Kubernetes Secret

```bash
# Create secret from certificate file
kubectl create secret generic rds-ssl-cert \
  --from-file=global-bundle.pem=./global-bundle.pem \
  -n tooljet
```

```yaml
# In deployment.yaml
volumes:
- name: ssl-certs
  secret:
    secretName: rds-ssl-cert
```

### 4. Apply Configuration

```bash
kubectl apply -f tooljet-deployment.yaml
kubectl rollout status deployment/tooljet -n tooljet
```

### 5. Using Helm (if applicable)

```yaml
# values.yaml
env:
  PG_HOST: "your-rds-endpoint.region.rds.amazonaws.com"
  PGSSLMODE: "require"
  NODE_EXTRA_CA_CERTS: "/certs/global-bundle.pem"

extraVolumes:
  - name: ssl-certs
    configMap:
      name: rds-ssl-cert

extraVolumeMounts:
  - name: ssl-certs
    mountPath: /certs
    readOnly: true
```

**Reference**: [ToolJet Kubernetes EKS Setup Documentation](https://docs.tooljet.ai/docs/setup/kubernetes-eks)

---
id: verification
title: Vérification et dépannage
slug: /setup/postgresql-13-16/aws/verification/
---

## Étapes de vérification

### Docker

```bash
docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### AMI

```bash
sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### ECS

```bash
aws logs filter-log-events \
  --log-group-name /ecs/tooljet \
  --filter-pattern "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Kubernetes EKS

```bash
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

## Problèmes courants et solutions

### Certificat introuvable

**Symptômes** : `ENOENT: no such file or directory`

**Solution** : Vérifiez le chemin et les permissions du certificat

### Erreurs SSL persistantes

**Symptômes** : `SELF_SIGNED_CERT_IN_CHAIN`

**Solutions** :
1. Vérifiez que `NODE_EXTRA_CA_CERTS` est correctement défini
2. Assurez-vous que le fichier de certificat est lisible
3. Redémarrez l'application après les modifications de configuration

### Échec de connexion à la base de données

**Solutions** :
1. Vérifiez les groupes de sécurité RDS
2. Vérifiez les identifiants de la base de données
3. Testez la connexion manuellement

## Test de connexion manuel

```bash
# Test PostgreSQL connection with SSL
psql "postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/database?sslmode=require&sslrootcert=/path/to/global-bundle.pem"
```

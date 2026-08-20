---
id: verification
title: Vérification et dépannage
slug: /setup/postgresql-13-16/gcp/verification/
---

## Étapes de vérification

### Docker sur GCE

```bash
sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
sudo docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### GKE

```bash
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Cloud Run

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tooljet" \
  --filter="textPayload:TOOLJET APPLICATION STARTED SUCCESSFULLY" \
  --limit=10
```

### Vérification de la version de la base de données

```bash
psql "postgresql://username:password@your-cloud-sql-ip:5432/database" -c "SELECT version();"
```

## Problèmes courants et solutions

### Certificat introuvable

**Symptômes** : `ENOENT: no such file or directory, open '/certs/server-ca.pem'`

**Solutions** :
1. Vérifiez le chemin du certificat et les permissions du fichier
2. Vérifiez les montages de volumes dans les configurations Kubernetes/Docker
3. Assurez-vous que les permissions de Secret Manager sont correctes pour Cloud Run

### Erreurs de connexion SSL

**Symptômes** : `SELF_SIGNED_CERT_IN_CHAIN` ou `certificate verify failed`

**Solutions** :
1. Vérifiez que les connexions SSL fonctionnent correctement
2. Assurez-vous que le fichier de certificat est lisible par l'application
3. Vérifiez que le certificat est bien le certificat CA Cloud SQL correct
4. Envisagez d'utiliser Cloud SQL Proxy pour une gestion automatique du SSL

### Délai d'expiration de connexion Cloud SQL

**Symptômes** : Délais d'expiration de connexion ou connexions refusées

**Solutions** :
1. Vérifiez les réseaux autorisés de l'instance Cloud SQL
2. Vérifiez les règles VPC/pare-feu
3. Assurez-vous que l'instance Cloud SQL est à l'état RUNNABLE
4. Vérifiez que l'IP privée est configurée correctement

#### Problème : Erreurs d'authentification

**Symptômes** : `password authentication failed for user`

**Solutions** :
1. Vérifiez les identifiants de la base de données
2. Vérifiez que l'utilisateur existe et dispose des permissions appropriées
3. Confirmez que le nom de la base de données est correct
4. Testez la connexion depuis Cloud Shell

## Test manuel de connexion

```bash
# Test Cloud SQL connection with SSL from Cloud Shell
gcloud sql connect your-instance-id --user=postgres --database=your-database

# Test from local machine with SSL
psql "postgresql://username:password@your-cloud-sql-ip:5432/database" -c "SELECT version();"

# Test using Cloud SQL Proxy locally
./cloud-sql-proxy your-project-id:your-region:your-instance-id &
psql "postgresql://username:password@127.0.0.1:5432/database" -c "SELECT version();"
```

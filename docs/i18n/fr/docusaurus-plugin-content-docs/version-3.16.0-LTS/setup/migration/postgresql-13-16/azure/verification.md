---
id: verification
title: Vérification et dépannage
slug: /setup/postgresql-13-16/azure/verification/
---

## Étapes de vérification

### AKS

```bash
kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Azure Container Instances

```bash
az container logs --resource-group your-rg --name tooljet-container | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
```

### Vérification de la version de la base de données

```bash
psql "postgresql://username:password@your-server.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT version();"
```

## Problèmes courants et solutions

### Connexion SSL requise

**Symptômes** : `connection requires SSL` ou `SSL is required`

**Solutions** :
1. Assurez-vous que `PGSSLMODE=require` est défini dans les variables d'environnement
2. Vérifiez que la chaîne de connexion inclut `?sslmode=require`
3. Vérifiez que l'application obligatoire du SSL est activée sur Azure PostgreSQL Flexible Server

### Erreurs d'authentification

**Symptômes** : `password authentication failed for user`

**Solutions** :
1. Vérifiez que les identifiants de la base de données sont corrects
2. Vérifiez que l'utilisateur existe et dispose des autorisations appropriées
3. Confirmez que le nom de la base de données est correct
4. Testez la connexion depuis Azure Cloud Shell

### Connectivité réseau

**Symptômes** : Délais de connexion dépassés ou connexion refusée

**Solutions** :
1. Vérifiez les règles de pare-feu d'Azure PostgreSQL Flexible Server
2. Vérifiez la configuration du VNet/sous-réseau si vous utilisez un réseau privé
3. Assurez-vous que le serveur Azure PostgreSQL est à l'état **Available**
4. Vérifiez les règles NSG (Network Security Group)

### Échecs de démarrage du conteneur

**Symptômes** : Le conteneur ne démarre pas ou redémarre en boucle

**Solutions** :
1. Consultez les journaux du conteneur pour des messages d'erreur détaillés
2. Vérifiez que toutes les variables d'environnement requises sont définies
3. Assurez-vous que des ressources CPU/mémoire suffisantes sont allouées
4. Testez séparément la connectivité à la base de données

## Test de connexion manuel

```bash
# Test Azure PostgreSQL connection from Azure Cloud Shell
az postgres flexible-server connect \
  --name your-server-name \
  --admin-user your-username \
  --database-name your-database

# Test from local machine with SSL
psql "postgresql://username:password@your-server.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT version();"

# Test using Azure CLI with psql
az postgres flexible-server execute \
  --name your-server-name \
  --admin-user your-username \
  --admin-password your-password \
  --database-name your-database \
  --querytext "SELECT version();"
```

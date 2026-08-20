---
id: db-upgrade
title: Processus de mise à niveau de la base de données
slug: /setup/postgresql-13-16/gcp/db-upgrade/
---

Suivez ces étapes pour mettre à niveau la base de données :

## Étape 1 : Se préparer à la mise à niveau

Assurez-vous de disposer d'une sauvegarde récente et activez la récupération à un instant précis :

### Utilisation de la console Google Cloud

1. Accédez à **Cloud SQL** → **Instances**
2. Sélectionnez votre instance PostgreSQL 13
3. Cliquez sur **Edit**
4. Sous **Backup** :
   - Activez **Automated backups**
   - Activez **Point-in-time recovery**
5. Cliquez sur **Save**

### Utilisation de la CLI gcloud

```bash
# Create an on-demand backup before upgrade
gcloud sql backups create \
  --instance=your-instance-id \
  --description="Pre-upgrade backup before PostgreSQL 16 migration"

# Enable point-in-time recovery if not already enabled
gcloud sql instances patch your-instance-id \
  --backup-start-time=03:00 \
  --enable-point-in-time-recovery
```

## Étape 2 : Mettre à niveau Cloud SQL PostgreSQL vers la version 16

### Utilisation de la console Google Cloud (recommandé)

**En suivant le flux de la console à partir des captures d'écran :**

1. **Accéder à Cloud SQL** :
   - Allez dans **Google Cloud Console** → **Cloud SQL** → **Instances**
2. **Sélectionner votre instance de base de données** :
   - Cliquez sur votre instance de base de données PostgreSQL 13
3. **Accéder à l'interface de mise à niveau** :
   - Recherchez la notification **Database version upgrades are available**
   - Cliquez sur **Upgrade** à côté de cette notification
   - OU cliquez sur **Edit** et recherchez les options de mise à niveau
   - Lorsque le message « Go to instance upgrade page? » s'affiche, cliquez sur **Go to upgrade page**
4. **Choisir la version de la base de données** :
   - Sur la page « Upgrade database version » :
     - **Current database version** affichera : PostgreSQL 13
     - Dans le menu déroulant **Database version to upgrade**, sélectionnez : **PostgreSQL 16**
   - Remarques importantes affichées :
     - Consultez la documentation pour vous assurer que votre système est prêt
     - Effectuez d'abord un test sur un clone (vous devriez déjà l'avoir fait !)
     - Cloud SQL créera automatiquement une sauvegarde
     - Effectuez également votre propre sauvegarde avant la mise à niveau
   - Cliquez sur **Continue**
5. **Vérifier et confirmer** :
   - Vérifiez le résumé de la mise à niveau
   - Des étapes post-mise à niveau importantes sont indiquées (exécuter ANALYZE pour rafraîchir les statistiques de la base de données)
   - Cliquez sur **Upgrade instance** pour commencer
6. **Suivre la progression de la mise à niveau** :
   - Le statut de l'instance affichera « MAINTENANCE »
   - La mise à niveau prend généralement de 15 à 45 minutes selon la taille de la base de données
   - Attendez que le statut revienne à « RUNNABLE »
   - Vérifiez que **Database version** affiche **PostgreSQL 16** dans les détails de l'instance

### Utilisation de la CLI gcloud

```bash
# Upgrade your Cloud SQL instance to PostgreSQL 16
gcloud sql instances patch your-instance-id \
  --database-version=POSTGRES_16 \
  --async

# Monitor the operation
gcloud sql operations list --instance=your-instance-id --limit=5

# Check instance status
gcloud sql instances describe your-instance-id \
  --format="value(state,databaseVersion)"
```

## Étape 3 : Configuration du certificat SSL (facultatif)

:::note
Google Cloud SQL gère automatiquement le chiffrement SSL et la validation des certificats. Les certificats SSL ne sont nécessaires que si vous avez des configurations SSL personnalisées spécifiques ou si vous utilisez des certificats clients pour l'authentification.
:::

Pour la plupart des déploiements standards, vous pouvez ignorer cette étape et passer directement à la configuration de votre déploiement.

**Si vous avez besoin d'une configuration de certificat SSL personnalisée :**

```bash
# Download the Google Cloud SQL server CA certificate
gcloud sql ssl-certs list --instance=your-instance-id

# Download the server CA certificate
gcloud sql ssl-certs describe server-ca-cert \
  --instance=your-instance-id \
  --format="value(cert)" > server-ca.pem

# Verify the certificate file
head -5 server-ca.pem
# Should show: -----BEGIN CERTIFICATE-----
```

**Méthode alternative avec curl :**
```bash
# Download Google Cloud SQL CA certificates
curl -o server-ca.pem https://dl.google.com/cloudsql/cloud-sql-ca-cert.pem

# Verify the certificate file
head -5 server-ca.pem
```

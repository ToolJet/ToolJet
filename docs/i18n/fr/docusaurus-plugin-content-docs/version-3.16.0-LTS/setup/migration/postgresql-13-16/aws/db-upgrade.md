---
id: db-upgrade
title: Processus de mise à niveau de la base de données
slug: /setup/postgresql-13-16/aws/db-upgrade/
---

Suivez ces étapes pour mettre à niveau la base de données :

## Étape 1 : Préparer la mise à niveau
Créez un instantané (snapshot) de votre base de données PostgreSQL 13 avant la mise à niveau :

### Utilisation de la console AWS
1. Accédez à **RDS Console** → **Databases**
2. Sélectionnez votre instance PostgreSQL 13
3. Cliquez sur **Actions** → **Take snapshot**
4. Saisissez le nom de l'instantané : `pre-upgrade-snapshot-YYYYMMDD`
5. Cliquez sur **Take snapshot**

### Utilisation d'AWS CLI
```bash
aws rds create-db-snapshot \
  --db-instance-identifier your-db-instance \
  --db-snapshot-identifier pre-upgrade-snapshot-$(date +%Y%m%d)
```

## Étape 2 : Mettre à niveau RDS PostgreSQL vers la version 16.9

### Utilisation de la console AWS (recommandé)

1. **Accédez à la console RDS** :
   - Allez dans **AWS Console** → **RDS** → **Databases**
2. **Sélectionnez votre instance de base de données** :
   - Cliquez sur votre instance de base de données PostgreSQL 13
3. **Modifiez le moteur de base de données** :
   - Cliquez sur le bouton **Modify**
   - Dans la section **Engine options**, trouvez **Engine version**
   - Sélectionnez **16.9** dans le menu déroulant
4. **Vérifiez les paramètres de modification** :
   - Faites défiler jusqu'à **Scheduling of modifications**
   - Choisissez **Apply immediately** pour une mise à niveau immédiate, ou
   - Choisissez **Apply during the next scheduled maintenance window**
5. **Appliquez les modifications** :
   - Cliquez sur **Continue**
   - Vérifiez le résumé des modifications
   - Cliquez sur **Modify DB instance**
6. **Surveillez la progression de la mise à niveau** :
   - Le statut de l'instance affichera « modifying »
   - La mise à niveau prend généralement 10 à 30 minutes selon la taille de la base de données
   - Attendez que le statut revienne à « available »

### Utilisation d'AWS CLI

```bash
# Upgrade your RDS instance to PostgreSQL 16.9
aws rds modify-db-instance \
  --db-instance-identifier your-db-instance \
  --engine-version 16.9 \
  --apply-immediately
```

## Étape 3 : Télécharger le certificat SSL requis
```bash
# Download the global CA bundle from AWS
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# OR using curl
curl -O https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Verify the certificate file
head -5 global-bundle.pem
# Should show: -----BEGIN CERTIFICATE-----
```

---
id: db-upgrade
title: Processus de mise à niveau de la base de données
slug: /setup/postgresql-13-16/azure/db-upgrade/
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Suivez ces étapes pour mettre à niveau la base de données :

## Étape 1 : Se préparer à la mise à niveau

Assurez-vous de disposer de sauvegardes récentes et vérifiez la configuration des sauvegardes :

### Avec le portail Azure

1. Accédez à **Azure Database for PostgreSQL Flexible Server** → **Servers**
2. Sélectionnez votre instance PostgreSQL 13
3. Allez dans **Settings** → **Backup and restore**
4. Vérifiez la **Automated backup retention period** (7 à 35 jours recommandés)
5. Notez le calendrier des sauvegardes et assurez-vous que des sauvegardes récentes existent

### Avec Azure CLI

```bash
# Verify backup configuration
az postgres flexible-server show \
  --resource-group your-resource-group \
  --name your-server-name \
  --query "backup"

# Create an on-demand backup (if needed)
az postgres flexible-server backup \
  --resource-group your-resource-group \
  --name your-server-name \
  --backup-name pre-upgrade-backup-$(date +%Y%m%d)
```

## Étape 2 : Mettre à niveau Azure PostgreSQL vers la version 16

### Avec le portail Azure (recommandé)

1. **Accéder à PostgreSQL Flexible Server** :
   - Allez dans **Azure Portal** → **Azure Database for PostgreSQL Flexible Server**
2. **Sélectionner votre instance de base de données** :
   - Cliquez sur votre instance de base de données PostgreSQL 13
3. **Vérifier l'état du serveur** :
   - Assurez-vous que l'état du serveur est **Available**
   - Vérifiez qu'aucune opération de maintenance n'est en cours
4. **Démarrer le processus de mise à niveau** :
   - Dans la section **Overview**, recherchez les notifications de mise à niveau ou le bouton **Upgrade**
   - Cliquez sur **Upgrade**
5. **Choisir la version de la base de données** :
   - **Current version** affichera : PostgreSQL 13.x
   - **Target version** : sélectionnez **PostgreSQL 16**
   - Passez en revue les notes importantes sur la mise à niveau :
     - ⚠️ **L'action de mise à niveau de version majeure est irréversible**
     - Le nom du serveur reste inchangé après la mise à niveau
     - La version mineure sera définie sur la plus récente prise en charge
6. **Confirmer et exécuter** :
   - Passez en revue tous les paramètres et leurs implications
   - Cliquez sur **Upgrade** pour démarrer le processus
7. **Suivre la progression de la mise à niveau** :
   - L'état du serveur affichera **Updating** pendant la mise à niveau
   - La mise à niveau prend généralement de 15 à 45 minutes selon la taille de la base de données
   - Attendez que l'état revienne à **Available**
   - Vérifiez que la **version de PostgreSQL** affiche **16.x** dans les détails du serveur

### Avec Azure CLI

```bash
# Upgrade your Azure PostgreSQL Flexible Server to version 16
az postgres flexible-server upgrade \
  --resource-group your-resource-group \
  --name your-server-name \
  --version 16

# Monitor upgrade progress
az postgres flexible-server show \
  --resource-group your-resource-group \
  --name your-server-name \
  --query "{name:name,state:state,version:version}"
```

## Étape 3 : Configuration SSL (obligatoire)

:::note
Azure Database for PostgreSQL Flexible Server exige des connexions SSL. La variable d'environnement `PGSSLMODE=require` est obligatoire pour se connecter aux bases de données Azure PostgreSQL.
:::

Azure PostgreSQL Flexible Server gère automatiquement le chiffrement SSL/TLS. Aucun fichier de certificat supplémentaire n'est requis, mais vous devez configurer votre application pour exiger des connexions SSL.

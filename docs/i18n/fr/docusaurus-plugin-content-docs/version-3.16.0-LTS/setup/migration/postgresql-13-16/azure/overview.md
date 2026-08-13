---
id: overview
title: Mise à niveau d'Azure PostgreSQL 13 vers 16
slug: /setup/postgresql-13-16/azure/overview/
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Ce guide complet couvre la mise à niveau de votre Azure Database for PostgreSQL Flexible Server de la version 13 vers la version 16, ainsi que la configuration des connexions SSL pour ToolJet sur différentes méthodes de déploiement Azure : Azure Kubernetes Service (AKS) et Azure Container Instances.

## Prérequis

- Un déploiement ToolJet existant avec PostgreSQL 13 sur Azure Database for PostgreSQL Flexible Server
- Une instance Azure Database for PostgreSQL Flexible Server 13
- Un accès administratif à votre environnement de déploiement
- Une sauvegarde de votre base de données existante
- Azure CLI (`az`) installé et configuré
- Les autorisations Azure RBAC appropriées pour les opérations PostgreSQL

## Mesures de sécurité critiques et stratégie de test

**REMARQUE** : avant de mettre à niveau votre base de données de production, suivez cette approche complète de sécurité et de test :

### Phase 1 : Test de restauration ponctuelle de la base de données de production

1. Créer une restauration ponctuelle de la base de données de production

    <Tabs>

        <TabItem value="portal" label="Using Azure Portal"> 

            1. Accédez à **Azure Database for PostgreSQL Flexible Server** dans le portail Azure
            2. Sélectionnez votre instance PostgreSQL 13 de production
            3. Cliquez sur **Restore** dans la barre d'outils
            4. Sélectionnez **Point-in-time restore**
            5. Configurez les paramètres de restauration :
                - **Server name** : `production-pg13-test-restore`
                - **Restore point** : choisissez un horodatage récent (dans les 7 derniers jours)
                - **Location** : identique à la production (ou différente pour l'isolation)
                - **Compute + storage** : identique à la production (ou plus petit pour les tests)
                - **Networking** : même configuration VNet que la production
            6. Cliquez sur **Review + create**
            7. Cliquez sur **Create**
            8. Attendez la fin de la restauration (10 à 30 minutes selon la taille de la base de données)

        </TabItem>

        <TabItem value="CLI" label="Using Azure CLI"> 
                        
            ```bash
            # Create a point-in-time restore of your production database for testing
            az postgres flexible-server restore \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --source-server your-production-server \
            --restore-time "2024-12-01T10:00:00Z" \
            --location eastus

            # Monitor restore progress
            az postgres flexible-server show \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --query "state"
            ```

        </TabItem>

    </Tabs>

2. Activer les extensions requises (pour les nouvelles instances de base de données)

    :::note
    Si vous créez une nouvelle instance de base de données pour les tests au lieu d'utiliser une restauration ponctuelle, vous devrez activer les extensions requises dont ToolJet dépend.
    :::

    <Tabs>

        <TabItem value="portal" label="Using Azure Portal"> 

            1. **Accéder à votre instance de base de données de test** :
                - Allez dans **Azure Database for PostgreSQL Flexible Server** → **Servers**
                - Sélectionnez votre instance de base de données
            2. **Activer les extensions** :
                - Allez dans **Settings** → **Server parameters**
                - Recherchez **azure.extensions**
                - Dans le champ **Value**, ajoutez les extensions suivantes (séparées par des virgules) :
                    ```
                    citext,pg_cron,pgcrypto,uuid-ossp
                    ```
                - Cliquez sur **Save**
                - Attendez le redémarrage du serveur (cela peut prendre quelques minutes)

        </TabItem>

        <TabItem value="CLI" label="Using Azure CLI"> 
       
            ```bash
            # Enable required extensions for ToolJet
            az postgres flexible-server parameter set \
            --resource-group your-resource-group \
            --server-name production-pg13-test-restore \
            --name azure.extensions \
            --value "citext,pg_cron,pgcrypto,uuid-ossp"
            ```

        </TabItem>

    </Tabs>

3. **Vérifier les extensions** (après le redémarrage du serveur) :
   ```bash
   # Connect to database and verify extensions are available
   psql "postgresql://username:password@production-pg13-test-restore.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT name FROM pg_available_extensions WHERE name IN ('citext', 'pg_cron', 'pgcrypto', 'uuid-ossp') ORDER BY name;"
   ```

:::note 
Les restaurations ponctuelles héritent automatiquement de la configuration des extensions du serveur source ; cette étape n'est donc généralement nécessaire que pour les nouvelles instances de base de données.
:::

4. Mettre à niveau la base de données de test vers PostgreSQL 16

    <Tabs>

        <TabItem value="portal" label="Using Azure Portal"> 

            :::note
            [Guide de mise à niveau de version majeure d'Azure PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-perform-major-version-upgrade?tabs=portal-major-version-upgrade)
            :::

            1. **Accéder à votre instance de restauration de test** :
                - Allez dans **Azure Database for PostgreSQL Flexible Server** → **Servers**
                - Sélectionnez votre restauration de test : `production-pg13-test-restore`
            2. **Vérifier que le serveur est prêt** :
                - Assurez-vous que l'état du serveur affiche **Available**
                - Vérifiez qu'aucune opération n'est en cours
            3. **Démarrer le processus de mise à niveau** :
                - Dans la section **Overview**, recherchez l'option **Upgrade**
                - Cliquez sur **Upgrade**
                - Vous pouvez aussi aller dans **Settings** → **Server parameters** et rechercher les options de mise à niveau
            4. **Choisir la version de la base de données** :
                - **Current version** affichera : PostgreSQL 13
                - **Target version** : sélectionnez **PostgreSQL 16**
                - Passez en revue les notes de mise à niveau :
                    - ⚠️ **L'action de mise à niveau de version majeure est irréversible**
                    - Le nom du serveur reste inchangé après la mise à niveau
                    - La version mineure sera la plus récente prise en charge
            5. **Confirmer la mise à niveau** :
                - Passez en revue tous les paramètres et avertissements
                - Cliquez sur **Upgrade** pour démarrer le processus
            6. **Suivre la progression de la mise à niveau** :
                - Attendez la fin de la mise à niveau (15 à 45 minutes selon la taille de la base de données)
                - L'état du serveur affichera **Updating** pendant la mise à niveau
                - Vérifiez que la **version de PostgreSQL** affiche **16.x** dans les détails du serveur une fois terminé

        </TabItem>

        <TabItem value="CLI" label="Using Azure CLI"> 
       
            ```bash
            # Upgrade the test restore to PostgreSQL 16
            az postgres flexible-server upgrade \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --version 16

            # Monitor upgrade progress
            az postgres flexible-server show \
            --resource-group your-resource-group \
            --name production-pg13-test-restore \
            --query "{name:name,state:state,version:version}"
            ```

        </TabItem>

    </Tabs>

### Phase 2 : Test de l'environnement de staging

:::warning
Avant de mettre à niveau votre base de données de production, vous DEVEZ tester en profondeur le processus de mise à niveau et le fonctionnement de l'application dans un environnement de staging utilisant la base de données de test restaurée et mise à niveau.
:::

5. Déployer une instance ToolJet de staging
    1. **Configurez l'environnement de staging** selon votre méthode de déploiement préférée :
        - **Azure Kubernetes Service (AKS)** : suivez la section de déploiement AKS ci-dessous
        - **Azure Container Instances** : suivez la section de déploiement Azure Container ci-dessous
    2. **Configurez le staging pour utiliser la base de données de test mise à niveau** :
        - Mettez à jour vos fichiers de configuration (.env, ConfigMaps, modèles de déploiement, etc.)
        - Utilisez les informations de connexion de la base de données de test : `production-pg13-test-restore.postgres.database.azure.com`
        - Configurez les exigences SSL comme détaillé dans la section de votre méthode de déploiement

6. Test complet du staging <br/>
    **Testez toutes les fonctionnalités critiques :**

    1. **Démarrage de l'application** :
        ```bash
        # Verify ToolJet starts successfully (adjust command based on deployment method)
        # AKS: kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # ACI: az container logs --resource-group rg --name tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        ```
    2. **Test de connectivité de la base de données** :
        ```bash
        # Test connection to upgraded database
        psql "postgresql://username:password@production-pg13-test-restore.postgres.database.azure.com:5432/database?sslmode=require" -c "SELECT version();"
        # Should show: PostgreSQL 16.x
        ```
    3. **Liste de contrôle des tests de fonctionnalités** :
        - [ ] Connexion et authentification des utilisateurs
        - [ ] Création et accès aux espaces de travail  
        - [ ] Création et édition d'applications
        - [ ] Connexions aux sources de données
        - [ ] Exécution des requêtes et affichage des données
        - [ ] Gestion des utilisateurs et des permissions
        - [ ] Déploiement et partage des applications
        - [ ] Fonctionnalité des API
        - [ ] Téléversements et téléchargements de fichiers
        - [ ] Notifications par e-mail (si configurées)
    4. **Test de performance** :
        - Surveillez les temps de réponse des opérations courantes
        - Vérifiez les améliorations de performance des requêtes
        - Vérifiez que l'utilisation de la mémoire est stable
        - Testez avec des volumes de données réalistes
    5. **Validation de la connexion SSL** :
        - Vérifiez qu'il n'y a pas d'erreurs de connexion SSL dans les journaux
        - Testez que `PGSSLMODE=require` fonctionne correctement
        - Confirmez que des connexions sécurisées sont établies

### Phase 3 : Planification de la mise à niveau de production

7. Documenter les résultats et planifier la mise à niveau de production

    1. **Créer un document de résultats de test** :
        ```
        PostgreSQL 16 Upgrade Test Results - Azure
        =========================================
        
        Test Environment:
        - Database: production-pg13-test-restore (PITR from production)
        - ToolJet Version: [version]
        - Deployment Method: [AKS/Azure Container Instances]
        - Test Date: [date]
        - Azure Region: [region]
        
        Functionality Test Results:
        - User Authentication: ✅ Working
        - Workspace Access: ✅ Working  
        - Application Building: ✅ Working
        - Data Sources: ✅ Working
        - SSL Connectivity: ✅ Working with PGSSLMODE=require
        - [Add all test results...]
        
        Performance Observations:
        - Query Response Time: [improvement/same/degradation]
        - Application Load Time: [timing]
        - Memory Usage: [stable/issues]
        - CPU Usage: [stable/issues]
        
        Issues Found: [None / List any issues]
        
        Recommended Production Upgrade: ✅ Proceed / ❌ Needs fixes
        ```
    2. **Planifier la fenêtre de maintenance de production** :
        ```bash
        # Based on staging test results, plan for:
        # - Database upgrade time: ~15-45 minutes (depending on size)
        # - Application configuration updates: ~5-10 minutes  
        # - SSL connection verification: ~5 minutes
        # - Testing and verification: ~10-15 minutes
        # Total estimated downtime: 35-75 minutes
        ```

### Phase 4 : Exécution de la mise à niveau de production

8. Communiquer et exécuter la mise à niveau de production

    1. **Exigences de communication auprès des utilisateurs** :
        - **Informez tous les utilisateurs** de la fenêtre de maintenance planifiée
        - **Fournissez des méthodes de contact alternatives** pendant l'indisponibilité
        - **Mettez à jour la page de statut** si disponible
    2. **Exécutez la mise à niveau de production** en suivant exactement les mêmes étapes que celles testées en staging

### Mesures de sécurité supplémentaires

#### Stratégie de retour en arrière
:::warning
**L'action de mise à niveau de version majeure est irréversible**, selon la documentation Azure.
:::

Préparation du retour en arrière (**DOIT être effectuée avant la mise à niveau**) :

1. **Créer une sauvegarde par restauration ponctuelle** avant la mise à niveau :
   - Conservez le serveur PostgreSQL 13 d'origine disponible (ne le supprimez pas immédiatement)
   - Assurez-vous que des sauvegardes récentes sont disponibles pour la restauration
   - Documentez l'horodatage exact du point de restauration

Si des problèmes sont détectés pendant la mise à niveau de production :

1. Restaurer vers un nouveau serveur à partir de la sauvegarde
    ```bash
    # Restore from backup to a new server
    az postgres flexible-server restore \
    --resource-group your-resource-group \
    --name emergency-restore-server \
    --source-server your-production-server \
    --restore-time "2024-12-01T10:00:00Z"

    # Update ToolJet configuration to point to emergency restore server
    ```
2. Utiliser la restauration ponctuelle antérieure à la mise à niveau
    - Si vous avez créé une sauvegarde PITR avant la mise à niveau, restaurez à partir de ce point
    - Mettez à jour la configuration de l'application ToolJet pour utiliser le serveur restauré
    - Reprenez les opérations sur PostgreSQL 13 jusqu'à la résolution des problèmes

#### Surveillance post-mise à niveau

1. Surveillance via le portail Azure :
    1. Allez dans **Azure Database for PostgreSQL Flexible Server** → votre base de données
    2. Cliquez sur l'onglet **Monitoring**
    3. Surveillez ces métriques :
        - **CPU percentage**
        - **Memory percentage**
        - **Active connections**
        - **Read/Write IOPS**
        - **Network In/Out**
2. Surveillance de l'application (adaptez les commandes selon la méthode de déploiement) :
    ```bash
    # Check application logs
    # AKS: kubectl logs deployment/tooljet -n tooljet --tail=50
    # ACI: az container logs --resource-group rg --name tooljet --tail 50

    # Verify database version
    psql "postgresql://user:pass@server.postgres.database.azure.com:5432/db?sslmode=require" -c "SELECT version();"
    ```

#### Nettoyage après une mise à niveau réussie

Après 1 à 2 semaines de fonctionnement stable :

1. **Supprimer le serveur de restauration de test** :
   ```bash
   # Delete the test restore instance
   az postgres flexible-server delete \
     --resource-group your-resource-group \
     --name production-pg13-test-restore
   ```
2. **Vérifier les paramètres de rétention des sauvegardes** : assurez-vous que les sauvegardes automatisées sont configurées de manière appropriée

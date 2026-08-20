---
id: overview
title: Mise à niveau de PostgreSQL 13 vers 16 sur GCP
slug: /setup/postgresql-13-16/gcp/overview/
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Ce guide complet couvre la mise à niveau de votre Google Cloud SQL PostgreSQL de la version 13 à la version 16 et la configuration des certificats SSL pour ToolJet à travers différentes méthodes de déploiement GCP : Docker sur GCE, Google Kubernetes Engine (GKE) et Google Cloud Run.

## Prérequis

- Déploiement ToolJet existant avec PostgreSQL 13 sur Google Cloud SQL
- Instance Google Cloud SQL PostgreSQL 13
- Accès administratif à votre environnement de déploiement
- Sauvegarde de votre base de données existante
- Google Cloud SDK (`gcloud`) installé et configuré
- Permissions IAM appropriées pour les opérations Cloud SQL

## Mesures de sécurité critiques et stratégie de test

⚠️ **OBLIGATOIRE** : Avant de mettre à niveau votre base de données de production, suivez cette approche complète de sécurité et de test :

### Phase 1 : Test sur un clone de la base de données de production

1. Créer un clone de la base de données de production

    <Tabs>

        <TabItem value="console" label="Google Cloud Console"> 

            1. Accédez à **Cloud SQL** dans la Google Cloud Console
            2. Sélectionnez votre instance PostgreSQL 13 de production
            3. Cliquez sur **Create Clone**
            4. Configurez les paramètres du clone :
                - **Clone ID** : `production-pg13-clone-test`
                - **Description** : `Test clone for PostgreSQL 16 upgrade testing`
                - **Region** : Identique à la production (ou différente pour l'isolation)
                - **Zone** : Identique à la production ou différente
                - **Machine type** : Identique à la production (ou plus petite pour les tests)
                - **Storage** : Conservez les mêmes paramètres que la production
            5. Cliquez sur **Create Clone**
            6. Attendez la création du clone (10 à 30 minutes selon la taille de la base de données)

        </TabItem>

        <TabItem value="CLI" label="GCloud CLI"> 

            ```bash
            # Create a clone of your production database for testing
            gcloud sql instances clone production-instance-id \
            production-pg13-clone-test \
            --async

            # Monitor clone creation progress
            gcloud sql operations list \
            --instance=production-pg13-clone-test \
            --limit=5
            
            # Wait for clone to be ready
            gcloud sql instances describe production-pg13-clone-test \
            --format="value(state)"
            ```

        </TabItem>

    </Tabs>

2. Mettre à niveau la base de données de test vers PostgreSQL 16

    <Tabs>

        <TabItem value="console" label="Google Cloud Console"> 

            1. **Accédez à votre instance de clone de test** :
                - Allez dans **Cloud SQL** → **Instances**
                - Sélectionnez votre clone de test : `production-pg13-clone-test`
            2. **Démarrez le processus de mise à niveau** :
                - Cliquez sur **Edit** (ou le bouton **Upgrade** s'il est visible dans la section d'informations sur l'instance)
                - Une boîte de dialogue « Go to instance upgrade page? » s'affiche
                - Cliquez sur **Go to upgrade page**
            3. **Choisissez la version de la base de données** :
                - Vous serez redirigé vers la page « Upgrade database version »
                - La page affichera :
                    - **Current database version** : PostgreSQL 13
                    - **Database version to upgrade** : Menu déroulant
                - Sélectionnez **PostgreSQL 16** dans le menu déroulant
                - Cliquez sur **Continue**
            4. **Vérifiez et confirmez la mise à niveau** :
                - Vérifiez le résumé de la mise à niveau
                - Le système affichera des remarques importantes :
                    - Cloud SQL créera une sauvegarde pour protéger vos données
                    - Il est toujours conseillé d'effectuer également votre propre sauvegarde avant la mise à niveau
                    - Consultez les étapes post-mise à niveau importantes, y compris l'exécution d'ANALYZE
                - Cliquez sur **Upgrade instance** pour démarrer le processus
            5. **Suivez la progression de la mise à niveau** :
                - Attendez la fin de la mise à niveau (15 à 45 minutes selon la taille de la base de données)
                - Le statut de l'instance affichera « MAINTENANCE » pendant la mise à niveau
                - Vérifiez que **Database version** affiche **PostgreSQL 16** dans les détails de l'instance une fois terminé

        </TabItem>

        <TabItem value="CLI" label="GCloud CLI"> 

            ```bash
            # Upgrade the test clone to PostgreSQL 16
            gcloud sql instances patch production-pg13-clone-test \
            --database-version=POSTGRES_16 \
            --async

            # Monitor upgrade progress
            gcloud sql operations list \
            --instance=production-pg13-clone-test \
            --limit=5

            # Verify upgrade completion
            gcloud sql instances describe production-pg13-clone-test \
            --format="value(databaseVersion)"
            ```

        </TabItem>

    </Tabs>

### Phase 2 : Test de l'environnement de staging

3. Déployer une instance ToolJet de staging

    1. **Configurez l'environnement de staging** en utilisant votre méthode de déploiement préférée :
        - **Docker sur GCE** : Suivez la section de déploiement Docker ci-dessous
        - **GKE** : Suivez la section de déploiement GKE ci-dessous  
        - **Cloud Run** : Suivez la section de déploiement Cloud Run ci-dessous
    2. **Configurez le staging pour utiliser la base de données de test mise à niveau** :
        - Mettez à jour vos fichiers de configuration (.env, ConfigMaps, etc.)
        - Utilisez les informations de connexion de la base de données de test
        - Configurez les certificats SSL comme détaillé dans la section de votre méthode de déploiement

4. Tests complets du staging <br/>
    **Testez toutes les fonctionnalités critiques :**

    1. **Démarrage de l'application** :
        ```bash
        # Verify ToolJet starts successfully (adjust command based on deployment method)
        # Docker on GCE: sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # GKE: kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # Cloud Run: gcloud logging read "resource.type=cloud_run_revision" --limit=50 | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        ```
    2. **Test de connectivité de la base de données** :
        ```bash
        # Test connection to upgraded database
        psql "postgresql://username:password@test-db-ip:5432/database" -c "SELECT version();"
        # Should show: PostgreSQL 16.x
        ```
    3. **Liste de contrôle des tests fonctionnels** :
        - [ ] Connexion et authentification utilisateur
        - [ ] Création et accès aux espaces de travail  
        - [ ] Création et modification d'applications
        - [ ] Connexions aux sources de données
        - [ ] Exécution des requêtes et affichage des données
        - [ ] Gestion des utilisateurs et des permissions
        - [ ] Déploiement et partage d'applications
        - [ ] Fonctionnalité de l'API
        - [ ] Téléversements et téléchargements de fichiers
        - [ ] Notifications par e-mail (si configurées)
    4. **Test de performance** :
        - Surveillez les temps de réponse des opérations courantes
        - Vérifiez les améliorations de performance des requêtes
        - Vérifiez que l'utilisation de la mémoire est stable
        - Testez avec des volumes de données réalistes
    5. **Validation des certificats SSL** :
        - Vérifiez l'absence d'erreurs de connexion SSL dans les journaux
        - Testez que les connexions sécurisées fonctionnent correctement
        - Confirmez la validation de la chaîne de certificats

### Phase 3 : Planification de la mise à niveau en production

5. Documenter les résultats et planifier la mise à niveau en production

    1. **Créez un document de résultats de test** :
        ```
        PostgreSQL 16 Upgrade Test Results - GCP
        ========================================
        
        Test Environment:
        - Database: production-pg13-clone-test (cloned from production)
        - ToolJet Version: [version]
        - Deployment Method: [Docker on GCE/GKE/Cloud Run]
        - Test Date: [date]
        - GCP Region: [region]
        
        Functionality Test Results:
        - User Authentication: ✅ Working
        - Workspace Access: ✅ Working  
        - Application Building: ✅ Working
        - Data Sources: ✅ Working
        - [Add all test results...]
        
        Performance Observations:
        - Query Response Time: [improvement/same/degradation]
        - Application Load Time: [timing]
        - Memory Usage: [stable/issues]
        - CPU Usage: [stable/issues]
        
        Issues Found: [None / List any issues]
        
        Recommended Production Upgrade: ✅ Proceed / ❌ Needs fixes
        ```
    2. **Planifiez la fenêtre de maintenance en production** :
        ```bash
        # Based on staging test results, plan for:
        # - Database upgrade time: ~15-45 minutes (depending on size)
        # - Application configuration updates: ~5-10 minutes  
        # - SSL certificate setup: ~5 minutes
        # - Testing and verification: ~10-15 minutes
        # Total estimated downtime: 35-75 minutes
        ```

### Phase 4 : Exécution de la mise à niveau en production

6. Communiquer et exécuter la mise à niveau en production
    1. **Exigences de communication aux utilisateurs** :
        - **Informez tous les utilisateurs** de la fenêtre de maintenance planifiée
        - **Fournissez des méthodes de contact alternatives** pendant l'interruption
        - **Mettez à jour la page de statut** si disponible
    2. **Exécutez la mise à niveau en production** en suivant exactement les mêmes étapes que celles testées en staging

### Mesures de sécurité supplémentaires

#### Stratégie de retour en arrière

Si des problèmes sont découverts pendant la mise à niveau en production :

1. Revenir à la base de données d'origine (le plus rapide)
    - Créez une réplique de lecture de la base de données PostgreSQL 13 d'origine avant la mise à niveau
    - Conservez la base de données d'origine arrêtée mais non supprimée
    - Mettez à jour la configuration de ToolJet pour qu'elle pointe vers la base de données d'origine
    - Promouvez la réplique de lecture en instance autonome si nécessaire
2. Restaurer à partir d'une sauvegarde automatique
    1. En utilisant la console Google Cloud
        1. Allez dans **Cloud SQL** → **Instances** → Votre base de données
        2. Cliquez sur l'onglet **Backups**
        3. Trouvez la sauvegarde la plus récente avant la mise à niveau
        4. Cliquez sur **Restore**
        5. Choisissez de restaurer vers une nouvelle instance ou l'instance actuelle
    2. En utilisant la CLI gcloud
        ```bash
        # List available backups
        gcloud sql backups list --instance=your-instance-id

        # Restore from specific backup
        gcloud sql backups restore BACKUP_ID \
        --restore-instance=your-instance-id \
        --backup-instance=your-instance-id
        ```

#### Surveillance post-mise à niveau

1. Surveillance via la console Google Cloud
    1. Allez dans **Cloud SQL** → **Instances** → Votre base de données
    2. Cliquez sur l'onglet **Monitoring**
    3. Surveillez ces métriques :
        - **CPU utilization**
        - **Memory utilization**
        - **Database connections**
        - **Read/Write operations**
        - **Network bytes sent/received**
2. Surveillance de l'application (ajustez les commandes selon la méthode de déploiement) :
    ```bash
    # Check application logs
    # Docker on GCE: sudo journalctl -u tooljet | tail -50
    # GKE: kubectl logs deployment/tooljet -n tooljet --tail=50
    # Cloud Run: gcloud logging read "resource.type=cloud_run_revision" --limit=50

    # Verify database version
    psql "postgresql://user:pass@db-ip:5432/db" -c "SELECT version();"
    ```

#### Nettoyage après une mise à niveau réussie

Après 1 à 2 semaines de fonctionnement stable :
1. En utilisant la console Google Cloud :
    1. **Supprimez le clone de test** : Allez dans **Cloud SQL** → Sélectionnez `production-pg13-clone-test` → **Delete**
    2. **Vérifiez la rétention des sauvegardes** : Assurez-vous que les sauvegardes automatiques sont configurées de manière appropriée
2. En utilisant la CLI gcloud
    ```bash
    # Delete the test clone instance
    gcloud sql instances delete production-pg13-clone-test

    # Verify backup configuration
    gcloud sql instances describe your-production-instance \
    --format="value(settings.backupConfiguration)"
    ```

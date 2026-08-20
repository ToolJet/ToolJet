---
id: overview
title: Mise à niveau AWS PostgreSQL 13 vers 16.9
slug: /setup/postgresql-13-16/aws/overview/
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Ce guide complet couvre la mise à niveau de votre AWS RDS PostgreSQL de la version 13 vers la version 16.9, ainsi que la configuration des certificats SSL pour ToolJet selon différentes méthodes de déploiement : Docker, AMI, ECS et EKS.

## Prérequis
- Déploiement ToolJet existant avec PostgreSQL 13
- Instance AWS RDS PostgreSQL 13
- Accès administratif à votre environnement de déploiement
- Sauvegarde de votre base de données existante

## Mesures de sécurité critiques et stratégie de test

⚠️ **OBLIGATOIRE** : Avant de mettre à niveau votre base de données de production, suivez cette approche complète de sécurité et de test :

### Phase 1 : Instantané de la base de données de production et test de clone

1. **Créer un instantané de la base de données de production**
    
    <Tabs>

        <TabItem value="CLI" label="Using AWS CLI"> 

            ```bash
            # Create a snapshot of your production database
            aws rds create-db-snapshot \
            --db-instance-identifier your-production-db \
            --db-snapshot-identifier production-pg13-snapshot-$(date +%Y%m%d-%H%M)
            
            # Wait for snapshot completion
            aws rds wait db-snapshot-completed \
            --db-snapshot-identifier production-pg13-snapshot-$(date +%Y%m%d-%H%M)
            ```

        </TabItem>

        <TabItem value="Console" label="Using AWS Console"> 

            1. Accédez à **RDS Console** → **Databases**
            2. Sélectionnez votre instance PostgreSQL 13 de production
            3. Cliquez sur **Actions** → **Take snapshot**
            4. Saisissez l'identifiant de l'instantané : `production-pg13-snapshot-YYYYMMDD-HHMM`
            5. Ajoutez une description : `Pre-upgrade snapshot for PostgreSQL 16.9 testing`
            6. Cliquez sur **Take snapshot**
            7. Attendez que le statut de l'instantané affiche **Available** (5-15 minutes)

        </TabItem>

    </Tabs>

2. **Créer une base de données de test à partir de l'instantané**
    
    <Tabs>

        <TabItem value="CLI" label="Using AWS CLI"> 

            ```bash
            # Restore snapshot to a new test database instance
            aws rds restore-db-instance-from-db-snapshot \
            --db-instance-identifier test-db-pg13-clone \
            --db-snapshot-identifier production-pg13-snapshot-$(date +%Y%m%d-%H%M) \
            --db-instance-class db.t3.medium \
            --availability-zone your-az \
            --no-publicly-accessible
            ```

        </TabItem>

        <TabItem value="Console" label="Using AWS Console"> 

            1. Allez dans **RDS Console** → **Snapshots**
            2. Trouvez votre instantané : `production-pg13-snapshot-YYYYMMDD-HHMM`
            3. Sélectionnez l'instantané et cliquez sur **Actions** → **Restore snapshot**
            4. Configurez la base de données restaurée :
                - **DB instance identifier** : `test-db-pg13-clone`
                - **DB instance class** : `db.t3.medium` (ou identique à la production)
                - **Storage** : Conservez les paramètres par défaut de l'instantané
                - **Availability Zone** : Identique à la production
                - **VPC security groups** : Identiques à la production (pour les tests)
                - **Public accessibility** : **No** (pour la sécurité)
            5. Cliquez sur **Restore DB instance**
            6. Attendez que le statut affiche **Available** (10-20 minutes)

        </TabItem>

    </Tabs>

3. **Mettre à niveau la base de données de test vers PostgreSQL 16.9**
    
    <Tabs>

        <TabItem value="CLI" label="Using AWS CLI"> 

            ```bash
            # Upgrade the cloned test database
            aws rds modify-db-instance \
            --db-instance-identifier test-db-pg13-clone \
            --engine-version 16.9 \
            --apply-immediately
            
            # Monitor upgrade progress
            aws rds describe-db-instances \
            --db-instance-identifier test-db-pg13-clone \
            --query 'DBInstances[0].DBInstanceStatus'
            ```

        </TabItem>

        <TabItem value="Console" label="Using AWS Console"> 

            1. Allez dans **RDS Console** → **Databases**
            2. Sélectionnez votre base de données de test : `test-db-pg13-clone`
            3. Cliquez sur **Modify**
            4. Dans **Engine options** :
                - **Engine version** : Sélectionnez `16.9`
            5. Dans **Scheduling of modifications** :
                - Sélectionnez **Apply immediately**
            6. Cliquez sur **Continue**
            7. Vérifiez les modifications et cliquez sur **Modify DB instance**
            8. Attendez que la modification se termine (15-30 minutes)
            9. Vérifiez que **Engine version** affiche `16.9` dans les détails de la base de données

        </TabItem>

    </Tabs>

### Phase 2 : Test en environnement de préproduction

4. **Déployer une instance ToolJet de préproduction**

    1. **Configurez l'environnement de préproduction** en utilisant votre méthode de déploiement préférée :
        - **Docker** : Suivez la section de déploiement Docker ci-dessous
        - **AMI** : Suivez la section de déploiement AMI ci-dessous  
        - **ECS** : Suivez la section de déploiement ECS ci-dessous
        - **EKS** : Suivez la section de déploiement EKS ci-dessous
    2. **Configurez la préproduction pour utiliser la base de données de test mise à niveau** :
        - Mettez à jour vos fichiers de configuration (.env, définitions de tâches, etc.)
        - Utilisez le point de terminaison de la base de données de test : `test-db-pg13-clone.xxxxxxxxxx.your-region.rds.amazonaws.com`
        - Configurez les certificats SSL comme détaillé dans la section de votre méthode de déploiement

5. **Tests complets en préproduction** <br/>
    **🔍 Testez toutes les fonctionnalités critiques :**

    1. **Démarrage de l'application** :
        ```bash
        # Verify ToolJet starts successfully (adjust command based on deployment method)
        # Docker: docker-compose logs tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # AMI: sudo journalctl -u tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # ECS: aws logs filter-log-events --log-group-name /ecs/tooljet --filter-pattern "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        # EKS: kubectl logs deployment/tooljet -n tooljet | grep "TOOLJET APPLICATION STARTED SUCCESSFULLY"
        ```
    2. **Test de connectivité à la base de données** :
        ```bash
        # Test connection to upgraded database (adjust based on deployment)
        psql "postgresql://username:password@test-db-endpoint:5432/database?sslmode=require" -c "SELECT version();"
        # Should show: PostgreSQL 16.9
        ```
    3. **Liste de contrôle des tests fonctionnels** :
        - [ ] Connexion et authentification des utilisateurs
        - [ ] Création et accès aux espaces de travail  
        - [ ] Création et modification d'applications
        - [ ] Connexions aux sources de données
        - [ ] Exécution des requêtes et affichage des données
        - [ ] Gestion des utilisateurs et des permissions
        - [ ] Déploiement et partage des applications
        - [ ] Fonctionnalité de l'API
        - [ ] Téléversements et téléchargements de fichiers
        - [ ] Notifications par e-mail (si configurées)
    4. **Test de performance** :
        - Surveillez les temps de réponse pour les opérations courantes
        - Vérifiez les améliorations de performance des requêtes
        - Vérifiez que l'utilisation de la mémoire est stable
    5. **Validation du certificat SSL** :
        - Vérifiez l'absence d'erreurs de connexion SSL dans les journaux
        - Testez que les connexions sécurisées fonctionnent correctement

### Phase 3 : Planification de la mise à niveau de production

6. **Documenter les résultats et planifier la mise à niveau de production**

    1. **Créez un document de résultats de test** :
        ```
        PostgreSQL 16.9 Upgrade Test Results
        ===================================
        
        Test Environment:
        - Database: test-db-pg13-clone (cloned from production)
        - ToolJet Version: [version]
        - Deployment Method: [Docker/AMI/ECS/EKS]
        - Test Date: [date]
        
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
        
        Issues Found: [None / List any issues]
        
        Recommended Production Upgrade: ✅ Proceed / ❌ Needs fixes
        ```
    2. **Planifiez la fenêtre de maintenance de production** :
        ```bash
        # Based on staging test results, plan for:
        # - Database upgrade time: ~15-30 minutes
        # - Application configuration updates: ~5-10 minutes  
        # - SSL certificate setup: ~5 minutes
        # - Testing and verification: ~10-15 minutes
        # Total estimated downtime: 35-60 minutes
        ```

### Phase 4 : Exécution de la mise à niveau de production

7. **Communiquer et exécuter la mise à niveau de production**

    1. **Exigences de communication aux utilisateurs** :
        - **Informez tous les utilisateurs** de l'interruption de service planifiée à l'avance
    2. **Exécutez la mise à niveau de production** en suivant exactement les mêmes étapes que celles testées en préproduction

### Mesures de sécurité supplémentaires

#### Stratégie de retour en arrière

Si des problèmes sont détectés lors de la mise à niveau de production :

1. Revenir à la base de données d'origine (le plus rapide)
    - Mettez à jour la configuration de ToolJet pour utiliser la base de données PostgreSQL 13 d'origine
    - Conservez la base de données d'origine active jusqu'à ce que la mise à niveau soit entièrement vérifiée
2. Restaurer à partir de l'instantané <br/>
    **Utilisation de la console AWS :**
    1. Allez dans **RDS Console** → **Snapshots**
    2. Trouvez : `production-pg13-snapshot-YYYYMMDD-HHMM`
    3. Cliquez sur **Actions** → **Restore snapshot**
    4. Utilisez l'identifiant de la base de données d'origine
    5. Restaurez avec la même configuration que l'original

#### Surveillance post-mise à niveau

1. Surveillance via la console AWS :
    1. Allez dans **RDS Console** → **Databases** → Votre base de données
    2. Cliquez sur l'onglet **Monitoring**
    3. Surveillez ces métriques :
        - **Database connections**
        - **CPU utilization** 
        - **Read/Write IOPS**
        - **Database connection failures**
2. Surveillance de l'application (*ajustez les commandes selon la méthode de déploiement*) :
    ```bash
    # Check application logs
    # Docker: docker-compose logs tooljet | tail -50
    # AMI: sudo journalctl -u tooljet | tail -50
    # ECS: aws logs tail /ecs/tooljet
    # EKS: kubectl logs deployment/tooljet -n tooljet --tail=50

    # Verify database version
    psql "postgresql://user:pass@endpoint:5432/db?sslmode=require" -c "SELECT version();"
    ```

#### Nettoyage après une mise à niveau réussie

Après 1 à 2 semaines de fonctionnement stable :

- Utilisation de la console AWS :
    1. **Supprimer la base de données de test** : Allez dans **RDS Console** → Sélectionnez `test-db-pg13-clone` → **Actions** → **Delete**
    2. **Conserver l'instantané de production** : Conservez-le pour la reprise après sinistre (peut être configuré pour être supprimé automatiquement après 30 jours)

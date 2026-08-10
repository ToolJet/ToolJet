---
id: ecs
title: Déployer ToolJet sur Amazon ECS
slug: /setup/ecs/
sidebar_label: ECS
---

:::info
Vous devez configurer manuellement une base de données PostgreSQL à utiliser par ToolJet. Nous recommandons d'utiliser une **base de données RDS PostgreSQL**. Vous pouvez trouver les prérequis système [ici](/docs/setup/system-requirements#postgresql).

ToolJet fonctionne avec **Redis intégré** pour l'édition collaborative et les tâches en arrière-plan. Lors de l'exécution de **conteneurs worker séparés** ou d'une **configuration multi-pod**, une **instance Redis externe** est **requise** pour la coordination de la file d'attente des tâches.

:::warning
Pour utiliser les fonctionnalités de ToolJet AI dans votre déploiement, assurez-vous d'autoriser `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` dans vos paramètres réseau.
:::

## Options de déploiement automatisé

ToolJet fournit des modèles d'infrastructure as code (IaC) pour le déploiement automatisé sur ECS.

### Déployer avec Terraform

**Utilisez Terraform si :** vous gérez votre infrastructure avec des configurations Terraform versionnées.

ToolJet fournit des modules Terraform qui provisionnent toutes les ressources AWS requises, notamment le VPC, le cluster ECS, les définitions de tâches, les load balancers et les groupes de sécurité.

[_ToolJet Terraform pour ECS_](https://github.com/ToolJet/ToolJet/tree/develop/terraform/ECS)

### Déployer avec CloudFormation

**Utilisez CloudFormation si :** vous préférez l'automatisation d'infrastructure native AWS ou avez besoin de déploiements en un clic.

ToolJet fournit des [_modèles CloudFormation_](https://aws.amazon.com/cloudformation/) pour automatiser le provisionnement et la configuration des ressources.

#### Configuration complète de l'infrastructure (recommandée pour les nouveaux déploiements)

Utilisez ce modèle pour déployer ToolJet avec tous les composants d'infrastructure (VPC, sous-réseaux, groupes de sécurité, load balancers, cluster ECS, RDS, ElastiCache) :

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/Cloudformation-template-one-click.yml
```

#### Déployer dans une infrastructure existante

Utilisez ce modèle si vous disposez déjà d'un VPC, d'une base de données RDS ou d'un cluster ElastiCache :

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/Cloudformation-deploy.yml
```

## Déployer ToolJet

:::info
La configuration ci-dessous n'est qu'un modèle. N'hésitez pas à modifier la définition de tâche et à configurer les paramètres des ressources et des variables d'environnement selon vos besoins.
:::

Suivez les étapes ci-dessous pour déployer ToolJet sur un cluster ECS.

1. **Configurer les bases de données PostgreSQL**

   ToolJet nécessite **deux bases de données PostgreSQL distinctes** - une pour les données de l'application principale et une pour les données de la fonctionnalité ToolJet Database.

2. Créez un groupe cible et un load balancer d'application pour router le trafic vers les conteneurs ToolJet. Vous pouvez [_consulter_](https://docs.aws.amazon.com/AmazonECS/latest/userguide/create-application-load-balancer.html) la documentation AWS pour le configurer. Notez que le serveur ToolJet expose `/api/health`, que vous pouvez configurer pour les contrôles de santé (health checks).

3. Créez une définition de tâche pour déployer l'application ToolJet en tant que service sur votre cluster préconfiguré.
   1. Sélectionnez Fargate comme type de lancement compatible
   2. Configurez les rôles IAM et définissez la famille de système d'exploitation sur Linux.
   3. Sélectionnez une taille de tâche avec 3 Go de mémoire et 1 vCPU
      <img className="screenshot-full img-full" src="/img/setup/ecs/ecs-4.png" alt="ECS Setup" />
   4. Ajoutez les détails du conteneur affiché : <br/>
      Spécifiez le nom de votre conteneur, par ex. : `ToolJet` <br/>
      Définissez l'image que vous souhaitez déployer, par ex. : `tooljet/tooljet:ee-lts-latest` <br/>
      Mettez à jour le mappage des ports sur le port de conteneur `3000` pour le protocole tcp.
      <img className="screenshot-full img-full" src="/img/setup/ecs/ecs-5.png" alt="ECS Setup" />
      Spécifiez les valeurs d'environnement pour le conteneur. Vous voudrez utiliser des secrets pour stocker les informations sensibles ou les identifiants, veuillez consulter la [_documentation_](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data-secrets.html) AWS pour la configurer. Vous pouvez également stocker l'environnement dans un bucket S3, veuillez consulter la [_documentation_](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/taskdef-envfiles.html) AWS.
      <img className="screenshot-full img-full" src="/img/setup/ecs/ecs-6.png" alt="ECS Setup" />

      **Configurez toutes les variables d'environnement requises :**

      #### Configuration de l'application

      ```bash
      TOOLJET_HOST=<Endpoint url>
      LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
      SECRET_KEY_BASE=<generate using openssl rand -hex 64>
      ```

      #### Base de données 1 : base de données de l'application (PG_DB)

      Cette base de données stocke les données de l'application principale de ToolJet, notamment les utilisateurs, les applications et les configurations.

      ```bash
      PG_USER=<username>
      PG_HOST=<postgresql-instance-ip>
      PG_PASS=<password>
      PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
      ```

      #### Base de données 2 : base de données interne (TOOLJET_DB)

      Cette base de données stocke les métadonnées internes de ToolJet et les tables créées au sein de la fonctionnalité ToolJet Database.

      ```bash
      TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
      TOOLJET_DB_HOST=<postgresql-database-host>
      TOOLJET_DB_USER=<username>
      TOOLJET_DB_PASS=<password>
      ```

      :::warning
      **Critique** : `TOOLJET_DB` et `PG_DB` doivent être des **noms de bases de données différents**. Utiliser la même base de données pour les deux entraînera l'échec du déploiement.
      :::

      <details  id="tj-dropdown">
      <summary>Pourquoi ToolJet nécessite-t-il deux bases de données ?</summary>

      ToolJet nécessite **deux noms de bases de données distincts** pour un fonctionnement optimal :
      - **PG_DB (base de données de l'application)** : stocke les données de l'application principale de ToolJet, notamment les comptes utilisateurs, les définitions d'applications, les permissions et les configurations
      - **TOOLJET_DB (base de données interne)** : stocke les données de la fonctionnalité ToolJet Database, notamment les métadonnées internes et les tables créées par les utilisateurs au sein de la fonctionnalité ToolJet Database

      Cette séparation garantit l'isolation des données et des performances optimales à la fois pour les opérations de l'application et pour les tables de base de données créées par les utilisateurs.

      **Flexibilité de déploiement :**
      - **Même instance PostgreSQL** (recommandé pour la plupart des cas d'usage) : créez les deux bases de données au sein d'un seul serveur PostgreSQL
      - **Instances PostgreSQL séparées** (facultatif, pour la mise à l'échelle) : hébergez chaque base de données sur des serveurs PostgreSQL différents selon vos exigences de performance et d'isolation

      </details>

      #### Configuration PostgREST (requise)

      PostgREST fournit la couche API REST pour ToolJet Database. Ces variables sont **obligatoires** :

      :::tip
      Utilisez `openssl rand -hex 32` pour générer une valeur sécurisée pour `PGRST_JWT_SECRET`. PostgREST refusera les demandes d'authentification si ce paramètre n'est pas défini.
      :::

      ```bash
      PGRST_HOST=localhost:3001
      PGRST_LOG_LEVEL=info
      PGRST_DB_PRE_CONFIG=postgrest.pre_config
      PGRST_SERVER_PORT=3001
      PGRST_JWT_SECRET=<generate using openssl rand -hex 32>
      PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
      ```

      #### Configuration SSL pour AWS RDS PostgreSQL

      :::warning
      **Important** : Lors de la connexion à PostgreSQL 16.9 sur AWS RDS avec SSL activé, vous devez configurer les certificats SSL. La variable d'environnement `NODE_EXTRA_CA_CERTS` est essentielle pour résoudre les problèmes de chaîne de certificats SSL et pour se connecter aux points de terminaison HTTPS auto-signés.
      :::
      Pour les connexions AWS RDS PostgreSQL, ajoutez ces variables d'environnement à votre conteneur :

      ```
      PGSSLMODE=require
      NODE_EXTRA_CA_CERTS=/certs/global-bundle.pem
      ```

      Vous devrez également :
      1. **Télécharger le paquet de certificats global AWS RDS** sur vos instances de conteneur ECS :
         ```bash
         mkdir -p /opt/ssl-certs
         wget -O /opt/ssl-certs/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
         ```
      2. **Ajouter un montage de volume** dans votre définition de tâche :
         - **Nom du volume** : `ssl-certs`
         - **Chemin source** : `/opt/ssl-certs` (sur l'hôte)
         - **Chemin dans le conteneur** : `/certs` (dans le conteneur)
         - **Lecture seule** : Oui

   5. Assurez-vous que « Use log collection » est cochée et que la « Docker configuration » utilise la commande `npm run start:prod`
      <img className="screenshot-full img-full" src="/img/setup/ecs/ecs-8.png" alt="ECS Setup" />

4. Créez un service pour exécuter votre définition de tâche au sein de votre cluster.
   - Sélectionnez le cluster que vous avez créé
   - Sélectionnez Fargate comme type de lancement
     <br />
     <img className="screenshot-full img-m" src="/img/setup/ecs/ecs-9.png" alt="ECS Setup" />
     <br />
   - Sélectionnez le cluster et définissez le nom du service
   - Vous pouvez définir le nombre de tâches à démarrer, par exemple deux
   - Le reste des valeurs peut rester par défaut
     <br />
     <img className="screenshot-full img-l" src="/img/setup/ecs/ecs-10.png" alt="ECS Setup" />
     <br />
   - Cliquez sur l'étape suivante pour configurer les options réseau
   - Sélectionnez votre VPC, vos sous-réseaux et vos groupes de sécurité désignés. Veuillez vous assurer que le groupe de sécurité autorise le trafic entrant sur le port http 3000 pour la tâche.
     <br />
     <img className="screenshot-full img-l" src="/img/setup/ecs/ecs-11.png" alt="ECS Setup" />
     <br />
   - Comme les migrations sont exécutées lors du démarrage du conteneur, veuillez spécifier une période de grâce de contrôle de santé de 900 secondes. Sélectionnez l'option de load balancer d'application et définissez le nom du groupe cible sur celui que nous avons créé précédemment. Cela renseignera automatiquement les points de terminaison de contrôle de santé.

:::info Remarque sur ToolJet Database
ToolJet Database est une fonctionnalité intégrée qui vous permet de créer des applications plus rapidement et de gérer vos données facilement. Découvrez-en plus sur cette fonctionnalité [_ici_](/docs/tooljet-db/tooljet-database).
:::

## Workflows

Les workflows ToolJet permettent aux utilisateurs de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Cette fonctionnalité étend les capacités de ToolJet au-delà de la création d'outils internes sécurisés, permettant aux développeurs d'automatiser des processus métier complexes.

:::info
Pour les utilisateurs migrant depuis les workflows basés sur Temporal, veuillez consulter le [guide de migration des workflows](/docs/setup/workflow-temporal-to-bullmq-migration/).
:::

### Activer la planification des workflows

Pour activer la planification des workflows, définissez les variables d'environnement suivantes dans votre définition de tâche ECS :

```bash
# Worker Mode (required)
# Set to 'true' to enable job processing
# Set to 'false' or unset for HTTP-only mode (scaled deployments)
WORKER=true

# Workflow Processor Concurrency (optional)
# Number of workflow jobs processed concurrently per worker
# Default: 5
TOOLJET_WORKFLOW_CONCURRENCY=5
```

**Détails des variables d'environnement :**

- **WORKER** (requis) : active le traitement des tâches. Définissez-la sur `true` pour activer la planification des workflows
- **TOOLJET_WORKFLOW_CONCURRENCY** (facultatif) : contrôle le nombre de tâches de workflow traitées simultanément par instance worker. La valeur par défaut est 5 si non spécifiée

:::warning
**Exigence Redis externe** : lors de l'exécution de conteneurs worker séparés ou de plusieurs instances, une instance Redis externe avec état est **requise** pour la coordination de la file d'attente des tâches. Le Redis intégré ne fonctionne que lorsque le serveur et le worker se trouvent dans la même instance de conteneur (déploiement à instance unique).
:::

#### Configurer Redis pour les workflows

Nous recommandons d'utiliser **Amazon ElastiCache pour Redis** avec la configuration suivante :

:::info
Pour les déploiements en production, assurez-vous que votre cluster ElastiCache Redis se trouve dans le même VPC que vos tâches ECS et configurez les groupes de sécurité pour autoriser le trafic sur le port 6379.
:::

1. **Créez un cluster ElastiCache Redis** avec ces paramètres :
   - Version du moteur : Redis 7.x
   - Type de nœud : cache.t3.medium ou supérieur
   - Nombre de répliques : au moins 1 (pour la haute disponibilité)
   - Basculement automatique : activé
2. **Configurez les paramètres Redis** :
   - **maxmemory-policy** : doit être défini sur `noeviction` (essentiel pour BullMQ)
   - **appendonly** : défini sur `yes` pour la persistance AOF
   - **appendfsync** : défini sur `everysec`
3. **Ajoutez les variables d'environnement Redis** à votre définition de tâche ECS :
   ```bash
   REDIS_HOST=<your-elasticache-endpoint>
   REDIS_PORT=6379
   REDIS_PASSWORD=<your-redis-password>  # If auth is enabled
   ```

**Configuration Redis facultative :**

- `REDIS_USERNAME=` - Nom d'utilisateur Redis (ACL)
- `REDIS_DB=0` - Numéro de base de données Redis (par défaut : 0)
- `REDIS_TLS=true` - Activer TLS/SSL pour des connexions sécurisées

**Pour les variables d'environnement supplémentaires, consultez notre [documentation des variables d'environnement](/docs/setup/env-vars).**

## Mise à niveau vers la dernière version LTS

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez démarrer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois avec une fin de vie d'au moins 18 mois. Pour connaître la dernière version LTS, consultez la page [_ToolJet Docker Hub_](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning Critique : sauvegardez votre instance PostgreSQL

Avant de commencer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données de l'application) - contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (base de données interne) - contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de procéder à la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord effectuer une mise à niveau vers cette version avant de passer à la dernière version LTS.
- **Exigence ToolJet 3.0+ :** le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [_guide de migration ToolJet 3.0_](/docs/setup/upgrade-to-v3/).

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

---
id: google-cloud-run
title: Déployer ToolJet sur Google Cloud Run
slug: /setup/google-cloud-run/
sidebar_label: Google Cloud Run
---

:::info
Vous devez configurer manuellement une **base de données PostgreSQL** à utiliser par ToolJet. Nous recommandons d'utiliser **Cloud SQL** à cet effet.

ToolJet fonctionne avec **Redis intégré** pour l'édition collaborative et les tâches en arrière-plan. Lors de l'exécution de **conteneurs worker séparés** ou d'une **configuration multi-pod**, une **instance Redis externe** est **requise** pour la coordination de la file d'attente des tâches.

:::warning
Pour utiliser les fonctionnalités de ToolJet AI dans votre déploiement, assurez-vous d'autoriser `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` dans vos paramètres réseau.
:::

<!-- Follow the steps below to deploy ToolJet on Cloud run with `gcloud` CLI. -->

## Déployer l'application ToolJet

:::info **Vue d'ensemble de l'architecture** : ce déploiement utilise les services Google Cloud suivants :

- **Cloud Run** : héberge le conteneur de l'application ToolJet (**tooljet-app**)
- **Cloud SQL** : fournit deux bases de données PostgreSQL distinctes
  - **PG_DB** - base de données de l'application pour les utilisateurs, les applications et les configurations
  - **TOOLJET_DB** - base de données interne pour les données de la fonctionnalité ToolJet Database
    :::

1. **Créez un nouveau service Google Cloud Run :**
   <img className="screenshot-full img-m" src="/img/cloud-run/google-cloud-run-setup-V3.png" alt="Google Cloud Run New Setup" />
2. **Ingress et Authentication peuvent être configurés comme indiqué ci-dessous, pour commencer. N'hésitez pas à modifier les configurations de sécurité selon vos besoins.**
   <img className="screenshot-full img-l"  src="/img/cloud-run/ingress-auth-V3.png" alt="ingress-auth" />
3. **Dans l'onglet des conteneurs, veuillez vous assurer que le port est défini sur 3000 et que la commande `npm, run, start:prod` est saisie dans le champ d'argument du conteneur, avec une capacité CPU définie sur 2 Gio :**
   <img className="screenshot-full img-m" src="/img/cloud-run/port-and-capacity-postgrest-v2.png" alt="port-and-capacity-tooljet" />
   - Si la commande ci-dessus n'est pas compatible, veuillez utiliser la structure de commande suivante à la place : <br/>
     <img className="screenshot-full img-m"  src="/img/cloud-run/port-and-capacity-postgrest-alternative-command.png" alt="port-and-capacity-tooljet-alternative-command" />
   - Si vous rencontrez des problèmes de migration, veuillez exécuter la commande suivante. Notez que l'exécution de cette commande peut casser la révision. Cependant, remettre la commande à `npm, run, start:prod` permettra de redémarrer l'instance avec succès :
     <img className="screenshot-full img-m" src="/img/cloud-run/port-and-capacity-postgrest-migration-fix-command.png" alt="port-and-capacity-tooljet-migration-fix-command" />
4. **Configurez toutes les variables d'environnement requises :**

   #### Configuration de l'application

   ```bash
   TOOLJET_HOST=<Endpoint url>
   LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
   SECRET_KEY_BASE=<generate using openssl rand -hex 64>
   ```

   :::tip
   Mettez à jour la variable d'environnement `TOOLJET_HOST` si vous souhaitez utiliser l'URL par défaut attribuée par Cloud Run après le déploiement initial.
   :::

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

   <details id="tj-dropdown">
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

   ```bash
   PGRST_HOST=localhost:3001
   PGRST_LOG_LEVEL=info
   PGRST_DB_PRE_CONFIG=postgrest.pre_config
   PGRST_SERVER_PORT=3001
   PGRST_JWT_SECRET=<generate using openssl rand -hex 32>
   PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
   ```

   :::tip
   Utilisez `openssl rand -hex 32` pour générer une valeur sécurisée pour `PGRST_JWT_SECRET`. PostgREST refusera les demandes d'authentification si ce paramètre n'est pas défini.
   :::

   :::tip
   **Connexion via IP publique Cloud SQL** : si vous utilisez une [IP publique](https://cloud.google.com/sql/docs/postgres/connect-run) pour Cloud SQL, alors la connexion à l'hôte de la base de données (valeur pour `PG_HOST` et `TOOLJET_DB_HOST`) doit être définie au format socket unix : `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`
   :::

:::info Remarque sur ToolJet Database
ToolJet Database est une fonctionnalité intégrée qui vous permet de créer des applications plus rapidement et de gérer vos données facilement. Découvrez-en plus sur cette fonctionnalité [ici](/docs/tooljet-db/tooljet-database).
:::

5. **Veuillez vous rendre dans l'onglet de connexion. Sous l'instance Cloud SQL, veuillez sélectionner la base de données PostgreSQL que vous avez configurée.**
   <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/cloud-run/cloud-SQL-tooljet.png" alt="cloud-SQL-tooljet" /> <br/>
   Cliquez sur déployer une fois les paramètres ci-dessus définis.
   :::info
   Une fois le service créé et actif, pour rendre l'URL du Cloud Service publique, veuillez suivre les étapes [**ici**](https://cloud.google.com/run/docs/securing/managing-access) pour rendre le service public.
   :::

## Workflows

Les workflows ToolJet permettent aux utilisateurs de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Cette fonctionnalité étend les capacités de ToolJet au-delà de la création d'outils internes sécurisés, permettant aux développeurs d'automatiser des processus métier complexes.

:::info
Pour les utilisateurs migrant depuis les workflows basés sur Temporal, veuillez consulter le [guide de migration des workflows](/docs/setup/workflow-temporal-to-bullmq-migration/).
:::

### Activer la planification des workflows

Pour activer la planification des workflows, définissez les variables d'environnement suivantes :

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
**Exigence Redis externe** : lors de l'exécution de conteneurs worker séparés ou de plusieurs instances, une instance Redis externe avec état est **requise** pour la coordination de la file d'attente des tâches. Le Redis intégré ne fonctionne que lorsque le serveur et le worker se trouvent dans la même instance de conteneur (déploiement à instance unique). Configurez la connexion Redis à l'aide des variables d'environnement suivantes :

- `REDIS_HOST=localhost` - Par défaut : localhost
- `REDIS_PORT=6379` - Par défaut : 6379
- `REDIS_USERNAME=` - Facultatif : nom d'utilisateur Redis (ACL)
- `REDIS_PASSWORD=` - Facultatif : mot de passe Redis
- `REDIS_DB=0` - Facultatif : numéro de base de données Redis (par défaut : 0)
- `REDIS_TLS=false` - Facultatif : activer TLS/SSL (définir sur 'true')
  :::

**Pour les variables d'environnement supplémentaires, consultez notre [documentation des variables d'environnement](/docs/setup/env-vars).**

## Mise à niveau vers la dernière version LTS {#upgrading-to-the-latest-lts-version}

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez démarrer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois avec une fin de vie d'au moins 18 mois. Pour connaître la dernière version LTS, consultez la page [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning Critique : sauvegardez votre instance PostgreSQL

Avant de commencer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données de l'application) - contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (base de données interne) - contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de procéder à la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord effectuer une mise à niveau vers cette version avant de passer à la dernière version LTS.
- **Exigence ToolJet 3.0+ :** le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [ToolJet 3.0 Migration Guide](/docs/setup/upgrade-to-v3/).

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

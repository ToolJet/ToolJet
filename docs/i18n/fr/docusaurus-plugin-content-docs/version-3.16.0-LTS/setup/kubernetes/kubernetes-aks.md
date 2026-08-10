---
id: kubernetes-aks
title: Déployer ToolJet sur Kubernetes (AKS)
slug: /setup/kubernetes-aks/
sidebar_label: Kubernetes (AKS)
---

:::info
Vous devez configurer manuellement une base de données PostgreSQL à utiliser par ToolJet. Nous recommandons d'utiliser **Azure Database for PostgreSQL** puisque ce guide concerne le déploiement avec AKS. Vous pouvez trouver les prérequis système [ici](/docs/setup/system-requirements#postgresql).

ToolJet fonctionne avec **Redis intégré** pour l'édition collaborative et les tâches en arrière-plan. Lors de l'exécution de **conteneurs worker séparés** ou d'une **configuration multi-pod**, une **instance Redis externe** est **requise** pour la coordination de la file d'attente des tâches.

:::warning
Pour utiliser les fonctionnalités ToolJet AI dans votre déploiement, veillez à ajouter `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` à la liste blanche dans vos paramètres réseau.
:::

Suivez les étapes ci-dessous pour déployer ToolJet sur un cluster Kubernetes AKS.

1. Créez un cluster AKS et connectez-vous-y pour commencer le déploiement. Vous pouvez suivre les étapes mentionnées dans la [documentation Azure](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough-portal).
2. Créez le déploiement k8s

   ```bash
   curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/AKS/deployment.yaml
   ```

   **Configurez toutes les variables d'environnement requises** dans `deployment.yaml` :

   #### Configuration de l'application

   ```bash
   TOOLJET_HOST=<Endpoint url>
   LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
   SECRET_KEY_BASE=<generate using openssl rand -hex 64>
   ```

   #### Base de données 1 : base de données de l'application (PG_DB)

   Cette base de données stocke les données principales de l'application ToolJet, y compris les utilisateurs, les applications et les configurations.

   ```bash
   PG_USER=<username>
   PG_HOST=<postgresql-database-host>
   PG_PASS=<password>
   PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
   ```

   #### Base de données 2 : base de données ToolJet (TOOLJET_DB)

   ToolJet Database est une fonctionnalité intégrée qui vous permet de créer des applications plus rapidement et de gérer vos données facilement. En savoir plus sur cette fonctionnalité [ici](/docs/tooljet-db/tooljet-database).

   ```bash
   TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
   TOOLJET_DB_HOST=<postgresql-database-host>
   TOOLJET_DB_USER=<username>
   TOOLJET_DB_PASS=<password>
   ```

   :::warning
   **Critique** : `TOOLJET_DB` et `PG_DB` doivent être des **noms de base de données différents**. Utiliser la même base de données pour les deux entraînera un échec du déploiement.
   :::

   <details id="tj-dropdown">
   <summary>Pourquoi ToolJet nécessite-t-il deux bases de données ?</summary>

   ToolJet nécessite **deux noms de base de données distincts** pour un fonctionnement optimal :
   - **PG_DB (base de données de l'application)** : Stocke les données principales de l'application ToolJet, y compris les comptes utilisateurs, les définitions d'applications, les permissions et les configurations
   - **TOOLJET_DB (base de données interne)** : Stocke les données de la fonctionnalité ToolJet Database, y compris les métadonnées internes et les tables créées par les utilisateurs au sein de cette fonctionnalité

   Cette séparation garantit l'isolation des données et des performances optimales tant pour les opérations de l'application que pour les tables de base de données créées par les utilisateurs.

   **Flexibilité de déploiement :**
   - **Même instance PostgreSQL** (recommandé pour la plupart des cas d'usage) : Créez les deux bases de données au sein d'un seul serveur PostgreSQL
   - **Instances PostgreSQL séparées** (optionnel, pour la mise à l'échelle) : Hébergez chaque base de données sur des serveurs PostgreSQL différents selon vos exigences de performance et d'isolation

   </details>

   #### Configuration PostgREST (requis)

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

3. Créez le service k8s, réservez une adresse IP statique et exposez-la via un service de répartition de charge comme mentionné dans la [doc](https://docs.microsoft.com/en-us/azure/aks/static-ip). Vous pouvez vous référer à `service.yaml`.
   ```bash
    curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/AKS/service.yaml
   ```
4. Appliquez les configurations YAML
   ```bash
    kubectl apply -f deployment.yaml, service.yaml
   ```

Vous pourrez accéder à votre installation ToolJet une fois que les pods et les services seront en cours d'exécution.

## Workflows

Les Workflows ToolJet permettent aux utilisateurs de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Cette fonctionnalité étend les capacités de ToolJet au-delà de la création d'outils internes sécurisés, permettant aux développeurs d'automatiser des processus métier complexes.

:::info
Pour les utilisateurs migrant depuis les workflows basés sur Temporal, veuillez consulter le [Guide de migration des workflows](/docs/setup/workflow-temporal-to-bullmq-migration/).
:::

### Activer la planification des workflows

Pour activer la planification des workflows, définissez les variables d'environnement suivantes dans votre déploiement ToolJet :

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

- **WORKER** (requis) : Active le traitement des tâches. Définissez sur `true` pour activer la planification des workflows
- **TOOLJET_WORKFLOW_CONCURRENCY** (optionnel) : Contrôle le nombre de tâches de workflow traitées simultanément par instance de worker. La valeur par défaut est 5 si non spécifiée

:::warning
**Exigence Redis externe pour plusieurs workers de workflow** : Lors de l'exécution de conteneurs worker séparés ou de plusieurs instances, une instance Redis externe avec état est **requise** pour la coordination de la file d'attente des tâches. Le Redis intégré fonctionne uniquement lorsque le serveur et le worker sont dans la même instance de conteneur (déploiement à instance unique).
:::

#### Déployer Redis pour les workflows

Déployez une instance Redis avec état en utilisant l'exemple de configuration suivant :

```bash
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/redis-stateful.yaml
```

<details id="tj-dropdown">

<summary>Redis intégré vs Redis externe</summary>

Les images ToolJet incluent une instance Redis intégrée pour le développement. Lors du déploiement de workflows en production, vous devez mettre à jour votre configuration de déploiement pour utiliser le Redis externe avec état :

Changez **REDIS_HOST** de **localhost** à **redis-service** dans votre YAML de déploiement :

```yaml
- name: REDIS_HOST
  value: redis-service # Changed from localhost
- name: REDIS_PORT
  value: "6379"
```

</details>

Cet exemple de déploiement crée :

- Un StatefulSet avec stockage persistant pour Redis
- Un service headless pour une identité réseau stable
- Un ConfigMap avec une configuration Redis prête pour la production
- Un Secret pour l'authentification par mot de passe optionnelle

:::info
Mettez à jour le `redis-secret` dans le YAML de déploiement Redis avec un mot de passe sécurisé avant de déployer en production.

Ceci est un exemple de configuration que vous pouvez personnaliser selon vos besoins. Cependant, la **persistance AOF (Append Only File)** et le **`maxmemory-policy noeviction`** sont des paramètres critiques qui doivent être conservés pour la fiabilité de la file d'attente des tâches BullMQ.
:::

Après avoir déployé Redis, configurez ToolJet pour s'y connecter en utilisant ces variables d'environnement dans votre déploiement :

```bash
REDIS_HOST=redis-service.default.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password-here  # Match the password in redis-secret
```

**Configuration Redis optionnelle :**

- `REDIS_USERNAME=` - Nom d'utilisateur Redis (ACL)
- `REDIS_DB=0` - Numéro de base de données Redis (par défaut : 0)
- `REDIS_TLS=false` - Activer TLS/SSL (définir sur 'true')

**Remarque :** Assurez-vous que ces variables d'environnement sont ajoutées à votre configuration de déploiement Kubernetes (par exemple, dans votre fichier deployment.yaml ou un secret Kubernetes). **Pour des variables d'environnement supplémentaires, consultez notre [documentation sur les variables d'environnement](/docs/setup/env-vars).**

## Mise à niveau vers la dernière version LTS

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez commencer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois avec une fin de vie d'au moins 18 mois. Pour vérifier la dernière version LTS, consultez la page [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning Critique : Sauvegardez votre instance PostgreSQL

Avant de commencer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données de l'application) - Contient les utilisateurs, applications et configurations
2. **TOOLJET_DB** (base de données interne) - Contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de poursuivre la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord mettre à niveau vers cette version avant de passer à la dernière version LTS.
- **Exigence ToolJet 3.0+ :** Le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [Guide de migration ToolJet 3.0](/docs/setup/upgrade-to-v3/).

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Veuillez le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

---
id: helm
title: Déployer ToolJet avec Helm Chart
slug: /setup/helm/
sidebar_label: Helm
---

:::info
Vous devez configurer manuellement une **base de données PostgreSQL** à utiliser par ToolJet. Vous pouvez trouver les prérequis système [ici](/docs/setup/system-requirements#postgresql).

ToolJet fonctionne avec **Redis intégré** pour l'édition collaborative et les tâches en arrière-plan. Lors de l'exécution de **conteneurs worker séparés** ou d'une **configuration multi-pod**, une **instance Redis externe** est **requise** pour la coordination de la file d'attente des tâches.

:::warning
Pour utiliser les fonctionnalités ToolJet AI dans votre déploiement, veillez à ajouter `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` à la liste blanche dans vos paramètres réseau.
:::

Ce dépôt contient les charts Helm pour déployer [ToolJet](https://github.com/ToolJet/helm-charts) sur un cluster Kubernetes en utilisant Helm v3. Les charts incluent un serveur PostgreSQL intégré activé par défaut. Cependant, vous avez la possibilité de le désactiver et de configurer un autre serveur PostgreSQL en modifiant le fichier `values.yml`.

## Installation

### Depuis le dépôt Helm

```bash
helm repo add tooljet https://github.com/ToolJet/helm-charts.git
helm install tooljet tooljet/tooljet
```

### Depuis la source

1. Clonez le dépôt et accédez à ce répertoire
2. Exécutez `helm dependency update`
3. Il est recommandé mais optionnel de modifier les valeurs dans le fichier `values.yaml`, telles que les noms d'utilisateur, mots de passe, paramètres de persistance, etc.
4. Exécutez `helm install -n $NAMESPACE --create-namespace $RELEASE .`

N'oubliez pas de remplacer les variables par vos valeurs de configuration spécifiques.

## Base de données ToolJet

ToolJet propose une solution de base de données hébergée qui vous permet de créer rapidement des applications et de gérer vos données sans effort. La base de données ToolJet ne nécessite aucune configuration et propose une interface conviviale pour la gestion des données.

Pour plus d'informations sur la base de données ToolJet, vous pouvez consulter [ici](/docs/tooljet-db/tooljet-database).

## Configuration de Redis

Pour une configuration multi-service ou multi-pod, il est recommandé d'utiliser une instance Redis externe.

**Comportement par défaut :** <br/>

- Redis est inclus dans le Helm chart mais **désactivé par défaut**.

**Quand activer Redis ?** <br/>

- Si **ReplicaSet > 1**, Redis **doit être activé** dans `values.yaml` pour la gestion des sessions.

Activer ou désactiver Redis dans `values.yaml`

Pour **activer Redis**, modifiez la section suivante dans `values.yaml` :

```yaml
redis:
  enabled: true # Set to true if ReplicaSet > 1
  fullnameOverride: redis
  auth:
    enabled: true
    password: "tooljet"
  master:
    service:
      port: 6379
```

**Utiliser une instance Redis externe :**

- Pour configurer un Redis externe, mettez à jour `values.yaml` avec les variables suivantes :

  ```yaml
  REDIS_HOST=<external_redis_host>
  REDIS_PORT=<external_redis_port>
  REDIS_USER=<external_redis_user>
  REDIS_PASSWORD=<external_redis_password>
  ```

## Workflows

Les Workflows ToolJet permettent aux utilisateurs de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Cette fonctionnalité étend les capacités de ToolJet au-delà de la création d'outils internes sécurisés, permettant aux développeurs d'automatiser des processus métier complexes.

:::info
Pour les utilisateurs migrant depuis les workflows basés sur Temporal, veuillez consulter le [Guide de migration des workflows](/docs/setup/workflow-temporal-to-bullmq-migration).
:::

### Activer la planification des workflows

Pour activer la planification des workflows dans votre déploiement Helm, vous devez configurer les variables d'environnement suivantes :

```yaml
env:
  WORKER: "true"
  TOOLJET_WORKFLOW_CONCURRENCY: "10"
```

**Détails des variables d'environnement :**

- **WORKER** (par défaut : `true`) : Active le traitement des tâches pour les workflows. Définissez sur `true` pour traiter les tâches de workflow
- **TOOLJET_WORKFLOW_CONCURRENCY** (par défaut : `10`) : Nombre maximal de workflows simultanés pouvant être exécutés

:::warning
**Redis externe pour plusieurs workers de workflow** : Lors de l'exécution de plusieurs workers pour les workflows, une instance Redis externe avec état est recommandée pour de meilleures performances et fiabilité. Le Redis intégré convient aux configurations de workflow à worker unique.
:::

### Configurer plusieurs workers avec Redis externe

<details id="tj-dropdown">

<summary>Configuration values.yaml Helm pour plusieurs workers</summary>

Le Helm chart ToolJet inclut un modèle de déploiement de worker dédié (**worker.yml**) qui peut être utilisé pour exécuter plusieurs workers de workflow. Voici comment le configurer :

**Étape 1 : Activer Redis dans values.yaml**

```yaml
redis:
  enabled: true # Enable Redis for multiple workers
  architecture: standalone
  fullnameOverride: redis
  auth:
    enabled: true
    password: "your-secure-password"
  master:
    service:
      port: 6379
    persistence:
      enabled: true
      size: 8Gi
```

**Étape 2 : Configurer la connexion Redis**

```yaml
redis_pod:
  REDIS_HOST: "redis-master" # Redis service name
  REDIS_PORT: "6379"
  REDIS_USER: "default"
```

**Étape 3 : Ajouter les variables d'environnement de workflow**

Ajoutez ceci à la section `env:` dans values.yaml :

```yaml
env:
  TOOLJET_HOST: "https://your-tooljet-domain.com"
  DEPLOYMENT_PLATFORM: "k8s:helm"
  TOOLJET_WORKFLOW_CONCURRENCY: "10"
  # ... other environment variables
```

**Étape 4 : Configurer les paramètres du worker**

```yaml
workflow_env:
  WORKER: "true" # Already set by default

apps:
  tooljet:
    replicaCount: 1 # Main application server
```

**Étape 5 : Installer ou mettre à niveau avec Helm**

```bash
helm upgrade --install tooljet tooljet/tooljet -f values.yaml
```

### Architecture

Le Helm chart déploie :

- **Déploiement principal ToolJet** (`deployment.yaml`) : Serveur web avec `WORKER=true`, gère les requêtes HTTP et traite les tâches de workflow
- **Déploiement worker** (`worker.yml`) : Workers dédiés supplémentaires avec `WORKER=true`, s'adaptent indépendamment pour plus de capacité de traitement
- **Redis externe** : Service avec état pour la file d'attente des tâches et la persistance

### Exigences de configuration Redis

**Critique** : Redis doit être configuré avec :

- Persistance **AOF (Append Only File)** activée
- **maxmemory-policy** défini sur `noeviction`

Pour configurer ces paramètres, vous pouvez utiliser la configuration Redis :

```yaml
redis:
  enabled: true
  master:
    persistence:
      enabled: true
    extraFlags:
      - --appendonly yes
      - --maxmemory-policy noeviction
```

### Variables d'environnement Redis (facultatif)

Si vous devez configurer des paramètres Redis supplémentaires, vous pouvez les ajouter à la section `env:` :

```yaml
env:
  REDIS_HOST: "redis-master" # Default: redis-master
  REDIS_PORT: "6379" # Default: 6379
  REDIS_USERNAME: "" # Optional: Redis username (ACL)
  REDIS_PASSWORD: "" # Optional: Set via secret
  REDIS_DB: "0" # Optional: Redis database number
  REDIS_TLS: "false" # Optional: Enable TLS/SSL
```

**Remarque :** Seuls `REDIS_HOST` et `REDIS_PORT` sont requis. L'authentification et le TLS sont facultatifs selon votre configuration Redis.

</details>

## Mise à niveau vers la dernière version LTS {#upgrading-to-the-latest-lts-version}

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez commencer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois avec une fin de vie d'au moins 18 mois. Pour vérifier la dernière version LTS, consultez la page [_ToolJet Docker Hub_](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning Critique : Sauvegardez votre instance PostgreSQL

Avant de commencer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données de l'application) - Contient les utilisateurs, applications et configurations
2. **TOOLJET_DB** (base de données interne) - Contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de poursuivre la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord mettre à niveau vers cette version avant de passer à la dernière version LTS.
- **Exigence ToolJet 3.0+ :** Le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [_Guide de migration ToolJet 3.0_](/docs/setup/upgrade-to-v3/).

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Veuillez le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

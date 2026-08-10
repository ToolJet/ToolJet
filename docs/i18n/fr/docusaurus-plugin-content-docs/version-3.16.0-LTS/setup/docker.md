---
id: docker
title: Déployer ToolJet avec Docker Compose
slug: /setup/docker/
sidebar_label: Docker
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Suivez les étapes ci-dessous pour déployer ToolJet sur un serveur à l'aide de Docker Compose. ToolJet nécessite une base de données PostgreSQL pour stocker les définitions des applications, les identifiants (chiffrés) des sources de données et les données d'authentification des utilisateurs.

::::info
Si vous préférez essayer ToolJet sur votre machine locale avec Docker, vous pouvez suivre les étapes [ici](/docs/setup/try-tooljet/).

:::warning
Pour utiliser les fonctionnalités de ToolJet AI dans votre déploiement, assurez-vous d'ajouter `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` à la liste blanche dans vos paramètres réseau.
:::

::::

### Provisionnement de VM avec Terraform (facultatif)

Si vous ne disposez pas déjà d'un serveur, vous pouvez utiliser des scripts Terraform pour créer rapidement une VM sur AWS, Azure ou GCP, puis déployer ToolJet avec Docker.

- Déployer sur [AWS EC2](https://github.com/ToolJet/ToolJet/tree/develop/terraform/EC2)
- Déployer sur [Azure VM](https://github.com/ToolJet/ToolJet/tree/develop/terraform/Azure_VM)
- Déployer sur [GCP VM](https://github.com/ToolJet/ToolJet/tree/develop/terraform/GCP)

### Installation de Docker et Docker Compose

Installez docker et docker-compose sur le serveur.

- Documentation pour l'[installation de Docker](https://docs.docker.com/engine/install/)
- Documentation pour l'[installation de Docker Compose](https://docs.docker.com/compose/install/)

### Options de déploiement

Il existe deux options pour déployer ToolJet avec Docker Compose :

1. **Avec une base de données PostgreSQL intégrée (recommandé)**. Cette configuration utilise l'image Docker officielle de PostgreSQL.
2. **Avec une base de données PostgreSQL externe**. Cette configuration est recommandée si vous souhaitez utiliser un service PostgreSQL géré tel qu'AWS RDS ou Google Cloud SQL.

Vous ne savez pas quelle configuration choisir ? N'hésitez pas à demander à la communauté via [Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA).

<!--
<Tabs>
  <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default> -->

#### 1. Téléchargez notre fichier docker-compose de production sur le serveur.

  <Tabs>

    <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/docker-compose-db.yaml
      mv docker-compose-db.yaml docker-compose.yaml
      mkdir postgres_data
      ```
    </TabItem>
    <TabItem value="with-external-postgres" label="With external PostgreSQL">
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/docker-compose.yaml
      ```
    </TabItem>

  </Tabs>

#### 2. Créez un fichier `.env` dans le répertoire courant (là où le fichier docker-compose.yaml a été téléchargé à l'étape 1) :

  <Tabs>

    <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/.env.internal.example
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/internal.sh && chmod +x internal.sh
      mv .env.internal.example .env && ./internal.sh
      ```

      `internal.sh` aide à générer les variables `.env` de base telles que LOCKBOX_MASTER_KEY, SECRET_KEY_BASE, et le mot de passe de la base de données PostgreSQL.

    </TabItem>
    <TabItem value="with-external-postgres" label="With external PostgreSQL">
      Veuillez définir les identifiants de la base de données PostgreSQL en fonction de votre base de données externe. Veuillez saisir les détails de la base de données à l'aide du script bash comme indiqué ci-dessous.
      <img className="screenshot-full img-full" src="/img/setup/docker/bash.gif"/>
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/.env.external.example
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/external.sh && chmod +x external.sh
      mv .env.external.example .env && ./external.sh
      ```
    </TabItem>

  </Tabs>

#### 3. Pour démarrer le conteneur docker, utilisez la commande suivante :

```bash
docker-compose up -d
```

#### 4. La variable d'environnement `TOOLJET_HOST` peut être soit l'adresse IPv4 publique de votre serveur, soit un domaine personnalisé que vous souhaitez utiliser. Elle peut être modifiée dans le fichier .env.

Exemples :
`TOOLJET_HOST=http://12.34.56.78` ou
`TOOLJET_HOST=https://tooljet.yourdomain.com`

Si vous avez défini un domaine personnalisé pour `TOOLJET_HOST`, ajoutez une entrée `A record` dans vos paramètres DNS pour qu'elle pointe vers l'adresse IP du serveur.

<Tabs>

    <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>
      :::info
      i. Assurez-vous que `TOOLJET_HOST` commence bien par `http://` ou `https://`

      ii. Configurez docker pour qu'il s'exécute sans privilèges root en suivant les instructions écrites ici https://docs.docker.com/engine/install/linux-postinstall/

      iii. Si vous exécutez ToolJet sur un serveur linux, `docker` peut nécessiter des permissions sudo. Dans ce cas, vous pouvez exécuter :
      `sudo docker-compose up -d`
      :::
    </TabItem>
    <TabItem value="with-external-postgres" label="With external PostgreSQL">
      :::info
      i. Assurez-vous que `TOOLJET_HOST` commence bien par `http://` ou `https://`

      ii. S'il existe des points de terminaison HTTPS auto-signés auxquels ToolJet doit se connecter, veuillez vous assurer que la variable d'environnement `NODE_EXTRA_CA_CERTS` est définie avec le chemin absolu contenant les certificats.

      iii. Si vous exécutez ToolJet sur un serveur linux, `docker` peut nécessiter des permissions sudo. Dans ce cas, vous pouvez exécuter :
      `sudo docker-compose up -d`

      iv. Configurez docker pour qu'il s'exécute sans privilèges root en suivant les instructions écrites ici https://docs.docker.com/engine/install/linux-postinstall/
      :::
    </TabItem>

</Tabs>

De plus, pour configurer des variables d'environnement supplémentaires dans le fichier .env, veuillez consulter notre documentation sur les [variables d'environnement](/docs/setup/env-vars)

### Sauvegarde Docker (uniquement pour PostgreSQL intégré)

Le script bash ci-dessous vous aidera à effectuer des sauvegardes ainsi qu'à les restaurer :

1. Téléchargez le script :
   ```bash
   curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/backup-restore.sh && chmod +x backup-restore.sh
   ```
2. Exécutez le script avec la commande suivante :
   ```bash
   ./backup-restore.sh
   ```
   <img className="screenshot-full img-full" src="/img/setup/docker/backup-and-restore.gif" alt="Docker - Backup and Restore" />

## Workflows

ToolJet Workflows permet aux utilisateurs de concevoir et d'exécuter des automatisations complexes centrées sur les données à l'aide d'une interface visuelle basée sur des nœuds. Cette fonctionnalité étend les capacités de ToolJet au-delà de la création d'outils internes sécurisés, permettant aux développeurs d'automatiser des processus métier complexes.

:::info
Pour les utilisateurs migrant depuis des workflows basés sur Temporal, veuillez consulter le [Guide de migration des workflows](/docs/setup/workflow-temporal-to-bullmq-migration/).
:::

### Activer la planification des workflows

Pour activer la planification des workflows, définissez les variables d'environnement suivantes :

```bash
# Mode Worker (requis)
WORKER=true

# Concurrence du processeur de workflow (facultatif)
TOOLJET_WORKFLOW_CONCURRENCY=5
```

**Détails des variables d'environnement :**

- **WORKER** (requis) : active le traitement des tâches. Définissez sur `true` pour activer la planification des workflows
- **TOOLJET_WORKFLOW_CONCURRENCY** (facultatif) : contrôle le nombre de tâches de workflow traitées simultanément par instance de worker. La valeur par défaut est 5 si non spécifiée

:::warning
**Exigence Redis externe** : lors de l'exécution de conteneurs worker distincts ou de plusieurs instances, une instance Redis externe avec état est **requise** pour la coordination de la file d'attente de tâches. Le Redis intégré ne fonctionne que lorsque le serveur et le worker se trouvent dans la même instance de conteneur (déploiement à instance unique).
:::

### Exécuter plusieurs workers avec Redis externe

<details id="tj-dropdown">

<summary>Docker Compose Example with Multiple Workers and External Redis</summary>

Cet exemple montre comment exécuter ToolJet avec plusieurs workers et un Redis externe pour un traitement de workflow évolutif :

```yaml
services:
  tooljet:
    tty: true
    stdin_open: true
    container_name: Tooljet-app
    image: tooljet/tooljet:ee-lts-latest
    platform: linux/amd64
    restart: always
    env_file: .env
    ports:
      - 80:80
    environment:
      SERVE_CLIENT: "true"
      PORT: "80"
    command: npm run start:prod

  tooljet-worker-1:
    container_name: tooljet-worker-1
    image: tooljet/tooljet:ee-lts-latest
    env_file: .env
    environment:
      WORKER: "true"
      TOOLJET_WORKFLOW_CONCURRENCY: 10
    command: npm run start:prod
    depends_on:
      - redis

  tooljet-worker-2:
    container_name: tooljet-worker-2
    image: tooljet/tooljet:ee-lts-latest
    env_file: .env
    environment:
      WORKER: "true"
      TOOLJET_WORKFLOW_CONCURRENCY: 10
    command: npm run start:prod
    depends_on:
      - redis

  redis:
    image: redis:7
    container_name: redis
    ports:
      - 6379:6379
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory-policy noeviction

volumes:
  redis-data:
```

**Architecture :**

- **tooljet** : serveur web qui traite les requêtes HTTP et exécute les tâches (WORKER=true, port 80)
- **tooljet-worker-1 et tooljet-worker-2** : workers dédiés qui traitent uniquement les tâches de workflow (WORKER=true, sans ports)
- **redis** : Redis externe avec état, avec persistance pour la file d'attente de tâches

**Variables d'environnement Redis :**

Ajoutez ces éléments à votre fichier **.env** pour vous connecter au Redis externe :

```bash
# Redis - Remarque : seuls REDIS_HOST et REDIS_PORT sont requis. L'authentification et TLS sont facultatifs.
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=
# REDIS_DB=0                   # Facultatif : numéro de base de données Redis (par défaut : 0)
# REDIS_TLS=false              # Facultatif : activer TLS/SSL (mettre à 'true')
```

**Configuration Redis critique :**

- **--appendonly yes** : active la persistance AOF (Append Only File)
- **--maxmemory-policy noeviction** : requis par BullMQ pour éviter la perte de tâches

</details>

## Mise à niveau vers la dernière version LTS

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez démarrer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois, avec une fin de vie d'au moins 18 mois. Pour connaître la dernière version LTS, consultez la page [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning Critique : sauvegardez votre instance PostgreSQL

Avant de démarrer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** afin d'éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données applicative) - contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (base de données interne) - contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de procéder à la mise à niveau.
:::

:::warning Critique
Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord effectuer une mise à niveau vers cette version avant de passer à la dernière version LTS.
:::

### Étapes de mise à niveau

Une fois la sauvegarde PostgreSQL terminée, suivez les étapes ci-dessous pour effectuer la mise à niveau vers la dernière version LTS :

1. **Arrêter les conteneurs en cours d'exécution**  
   Exécutez la commande suivante sur votre serveur (dans le répertoire où se trouve votre fichier _docker-compose.yml_) :

   ```bash
   docker compose down
   ```

   Cela arrêtera les conteneurs en cours d'exécution tout en préservant vos volumes et vos données.

2. **Récupérer le dernier tag LTS depuis Docker Hub**  
   Vous pouvez consulter la page officielle [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) pour obtenir le dernier tag d'image.
3. **Mettre à jour le fichier _docker-compose.yml_**  
   Ouvrez votre fichier _docker-compose.yml_ et mettez à jour le champ _image_ sous le service _tooljet_ :

   ```yaml
   services:
     tooljet:
       image: tooljet/tooljet:v3.x.x-lts # Remplacez par le dernier tag LTS
   ```

   :::note
   Remplacez v3.x.x-lts par le tag exact de la version LTS copié depuis Docker Hub.
   :::

4. **Démarrer ToolJet avec la nouvelle version**  
   Après avoir mis à jour le tag d'image dans votre fichier _docker-compose.yml_, exécutez la commande suivante sur votre serveur (dans le même répertoire) :

   ```bash
   docker compose up -d
   ```

   Docker récupérera la nouvelle image et recréera les conteneurs avec la version mise à jour.

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

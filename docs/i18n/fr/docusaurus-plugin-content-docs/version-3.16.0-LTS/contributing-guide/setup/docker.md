---
id: docker
title: Docker
---

:::warning
Le guide suivant est destiné aux contributeurs souhaitant configurer ToolJet en local. Si vous souhaitez **auto-héberger** ToolJet, veuillez vous référer à la section **[Setup](/docs/setup/)**.
:::

Docker Compose est le moyen le plus simple de configurer le serveur et le client ToolJet en local.

_Si vous souhaitez simplement essayer ToolJet en local avec Docker, vous pouvez suivre les étapes [ici](/docs/setup/try-tooljet)._

## Prérequis

Assurez-vous d'avoir la dernière version de `docker` et `docker compose` installée.

**[Guide officiel d'installation de Docker](https://docs.docker.com/desktop/)**

**[Guide officiel d'installation de docker-compose](https://docs.docker.com/compose/install/)**

## Configuration

:::warning
Si vous effectuez la configuration sur une machine Windows, nous vous conseillons de configurer Docker Desktop avec WSL2. Plus d'informations sont disponibles [ici](https://docs.docker.com/desktop/windows/wsl/).

Assurez-vous de l'exécuter dans le terminal WSL2.
:::

1. Forkez le dépôt :

   Allez sur le [dépôt GitHub de ToolJet](https://github.com/ToolJet/Tooljet), cliquez sur le bouton **Fork** pour créer une copie du dépôt sur votre propre compte GitHub.

2. Clonez votre dépôt forké :

   Après avoir forké, clonez le dépôt forké sur votre machine locale en utilisant l'URL de votre dépôt forké.

```bash
git clone https://github.com/<your-username>/ToolJet.git
```

3. Créez un fichier `.env` en copiant `.env.internal.example`. Plus d'informations sur les variables pouvant être définies sont disponibles dans la **[référence des variables d'environnement](/docs/setup/env-vars)**.

```bash
cp ./deploy/docker/.env.internal.example .env
```

4. Remplissez les clés dans le fichier `.env` à l'aide de la commande ci-dessous :

```bash
chmod +x ./deploy/docker/internal.sh && ./deploy/docker/internal.sh
```

:::warning
Si vous effectuez la configuration sur une machine Windows, veuillez vous assurer que les fins de ligne du fichier .env sont réglées sur LF, car elles seront par défaut en CRLF sauf configuration contraire.
:::

Assurez-vous d'ajouter ces variables d'environnement requises, en plus des variables existantes pour PostgREST, dans votre fichier `.env` :

```
PGRST_HOST=postgrest:3002
PGRST_SERVER_PORT=3002
PGRST_DB_PRE_CONFIG=postgrest.pre_config
```

5. Construisez les images Docker.

```bash
docker compose build
docker compose run --rm  plugins npm run build:plugins
```

6. Lancez ToolJet.

```bash
docker compose up
```

ToolJet devrait maintenant être accessible en local à l'adresse `http://localhost:8082`.

7. Pour arrêter les conteneurs, utilisez les commandes ci-dessous :

```bash
docker compose stop
```

## Apporter des modifications à la base de code

Si vous apportez des modifications à la base de code ou récupérez les dernières modifications depuis upstream, le conteneur du serveur ToolJet rechargera automatiquement (hot reload) l'application sans qu'aucune action ne soit requise de votre part.

**Remarque :**

1. Si les modifications incluent des migrations de base de données ou l'ajout de nouveaux packages npm dans `package.json`, vous devez redémarrer le conteneur du serveur ToolJet en exécutant `docker compose restart server`.

2. Si vous devez ajouter un nouveau binaire ou une nouvelle bibliothèque système au conteneur lui-même, vous devrez ajouter ces dépendances dans `docker/server.Dockerfile.dev`, puis reconstruire l'image du serveur ToolJet. Vous pouvez le faire en exécutant `docker compose build server`. Une fois la construction terminée, vous pouvez démarrer tous les services en exécutant `docker compose up`.

Exemple :
Supposons que vous ayez besoin d'installer le binaire `imagemagick` dans le conteneur de votre serveur ToolJet. Vous devrez alors vous assurer que `apt` installe `imagemagick` lors de la construction de l'image. Le Dockerfile situé à `docker/server.Dockerfile.dev` pour le serveur ressemblerait alors à ceci :

```bash
FROM node:22.15.1-buster AS builder

RUN apt update && apt install -y \
build-essential  \
postgresql \
freetds-dev \
imagemagick

RUN mkdir -p /app
WORKDIR /app

COPY ./server/package.json ./server/package-lock.json ./
RUN npm install

ENV NODE_ENV=development

COPY ./server/ ./

COPY ./docker/ ./docker/

COPY ./.env ../.env

RUN ["chmod", "755", "entrypoint.sh"]
```

Une fois le Dockerfile mis à jour, reconstruisez l'image en exécutant `docker compose build server`. Après avoir construit la nouvelle image, démarrez les services en exécutant `docker compose up`.

## Exécution des tests

La configuration de test récupère la configuration depuis le fichier `.env.test` à la racine du projet.

1. Exécutez la commande suivante pour créer et migrer les données pour la base de données de test :

```bash
docker compose run --rm -e NODE_ENV=test server npm run db:create
docker compose run --rm -e NODE_ENV=test server npm run db:migrate
```

2. Pour exécuter les tests unitaires :

```bash
docker compose run --rm server npm run --prefix server test
```

3. Pour exécuter les tests e2e :

```bash
docker compose run --rm server npm run --prefix server test:e2e
```

4. Pour exécuter un test unitaire spécifique :

```bash
docker compose run --rm server npm --prefix server run test <path-to-file>
```

## Dépannage

Veuillez ouvrir une nouvelle issue sur https://github.com/ToolJet/ToolJet/issues ou rejoindre notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) si vous rencontrez des problèmes en essayant d'exécuter ToolJet en local.

## Débogage avec Docker

Dans cette section, nous fournissons des indications sur la façon d'activer le débogage pour les services ToolJet en utilisant Docker et Visual Studio Code. Ces ajouts profiteront grandement aux contributeurs en simplifiant le processus de débogage et en améliorant l'expérience de développement globale.

#### Configuration de lancement VSCode :

Une nouvelle configuration a été ajoutée dans `.vscode/launch.json` pour faciliter le lancement du client et du serveur en mode débogage. Cela permet aux contributeurs de déboguer facilement l'application au sein de l'environnement Visual Studio Code. Les configurations incluent :

- **Docker Debug Client** : lance le client s'exécutant dans un conteneur Docker pour le débogage dans Visual Studio Code.
- **Docker Debug Server** : débogue le serveur dans un conteneur Docker, permettant aux développeurs d'exploiter les outils de débogage Node.js directement depuis leur IDE.

#### Configuration des tâches VSCode :

Une nouvelle tâche a été introduite dans `.vscode/tasks.json` pour gérer les commandes Docker Compose pour le débogage. Cela inclut des tâches pour démarrer le client et le serveur en mode détaché, facilitant le lancement des sessions de débogage.

#### Configuration Docker Compose pour le débogage :

Le fichier `docker-compose-debug.yaml` définit les services pour le débogage, exposant le port nécessaire (9229) pour le débogage Node.js. Cette configuration garantit que le serveur s'exécute en mode débogage, permettant un dépannage efficace.

### Avantages de la configuration de débogage

Ces modifications simplifient le processus de débogage, rendant plus efficace l'identification et la résolution des problèmes par les contributeurs. L'intégration avec Visual Studio Code permet des fonctionnalités de débogage avancées telles que les points d'arrêt et l'inspection des variables en temps réel. De plus, la standardisation de la configuration de débogage favorise une meilleure collaboration entre les membres de l'équipe, facilitant le partage des connaissances et améliorant le flux de travail de développement global.

En mettant en œuvre ces configurations, ToolJet vise à améliorer l'expérience de développement, permettant aux contributeurs de résoudre rapidement les problèmes et de maintenir la dynamique du projet.

Si vous souhaitez exécuter docker en mode débogage, utilisez cette commande

```bash
docker-compose -f docker-compose.yaml -f docker-compose-debug.yaml up --build
```

**Ouvrir le projet dans VSCode** : ouvrez le répertoire ToolJet dans Visual Studio Code.

Vérifier les configurations de lancement :

- Ouvrez la vue de débogage en cliquant sur l'icône Debug dans la barre d'activité sur le côté de la fenêtre.
- Sélectionnez la configuration appropriée, telle que Docker Debug Client ou Docker Debug Server.

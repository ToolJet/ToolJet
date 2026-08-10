---
id: build-plugin-for-marketplace
title: Créer un nouveau plugin pour le marketplace
---

## Introduction

Le marketplace ToolJet est un endroit où vous pouvez trouver des plugins personnalisés et les installer sur votre instance ToolJet. Ce document vous aidera à créer un nouveau plugin pour le marketplace ToolJet.

## Prérequis

- [Node.js](https://nodejs.org/en/download/) (v22.15.1)
- [npm](https://www.npmjs.com/get-npm) (v10.9.2)

## Pour commencer

### 1. Activer le marketplace pour votre instance

Pour activer le marketplace sur votre instance, vous devez définir la variable d'environnement `ENABLE_MARKETPLACE` à `true` dans votre fichier `.env`.
Le marketplace est désactivé par défaut.
Une fois la variable d'environnement définie, redémarrez votre instance ToolJet. Vous trouverez les instructions pour exécuter ToolJet en local [ici](/docs/setup/).
Le marketplace est accessible depuis la route '/integrations'.

### 2. Installer tooljet-cli

Le marketplace ToolJet utilise [tooljet-cli](https://www.npmjs.com/package/@tooljet/cli) pour construire et publier des plugins. Vous pouvez l'installer via npm.

```bash
npm install -g tooljet-cli

# verify the installation
tooljet --version
```

### 3. Créer un nouveau plugin - Plugin Github

Créons un nouveau plugin Github pour le marketplace ToolJet, qui authentifiera un utilisateur à l'aide d'un Github Personal Access Token et inclura des opérations de base comme la récupération des informations utilisateur, la récupération des dépôts, la récupération des issues et la récupération des pull requests.

```bash
# create a new plugin
tooljet plugin create github
```

Indiquez le nom du plugin et sélectionnez le type de plugin, qui est `api` dans ce cas.
Sélectionnez `yes` lorsque l'on vous demande de créer un nouveau plugin pour le marketplace.

Indiquez l'URL du dépôt si celui-ci est hébergé sur GitHub, sinon laissez le champ vide.

Lorsque vous créez un plugin avec le ToolJet CLI, un objet est automatiquement ajouté au fichier plugins.json, situé dans le répertoire `ToolJet/server/src/assets/marketplace/`. Cet objet contient les métadonnées du plugin, telles que son nom, sa description, sa version, son auteur et d'autres détails.
Ce fichier plugins.json sert de registre de tous les plugins disponibles dans ToolJet. Au démarrage du serveur ToolJet, celui-ci lit ce fichier et charge tous les plugins qui y sont listés.

:::note
Il est important de noter que le fichier plugins.json ne doit pas être modifié manuellement, car il est généré automatiquement par le ToolJet CLI. Toute modification apportée à ce fichier peut entraîner des dysfonctionnements des plugins dans le système.
:::

Tous les plugins du marketplace sont stockés dans le répertoire `/marketplace` du dépôt ToolJet. Vous pouvez trouver le plugin Github [ici](https://github.com/ToolJet/ToolJet/tree/develop/marketplace/plugins/github).

La structure de répertoire d'un plugin ToolJet typique ressemble à ceci :

```bash
github/
  package.json
  lib/
    icon.svg
    index.ts
    operations.json
    manifest.json
```

- manifest.json doit contenir des informations telles que le nom du plugin, sa description, etc.
- operations.json doit contenir les métadonnées de toutes les opérations prises en charge par le plugin.
- index.ts est le fichier principal. Il définit un QueryService pour le plugin. Le QueryService gère l'exécution des requêtes, le test des connexions, la mise en cache des connexions, etc.
- icon.svg est l'icône du plugin.
- package.json est généré automatiquement par le cli.

:::info
**Pourquoi avons-nous besoin d'un fichier manifest.json ou d'un fichier operations.json ?**

Les fichiers manifest.json sont consommés par un composant React pour créer une interface utilisateur dynamique pour les formulaires de connexion en définissant le schéma d'une API ou d'une source de données. Le schéma contient des informations sur la source, telles que son nom, son type et les variables exposées. Il inclut également des options d'authentification et d'autres propriétés personnalisables par l'utilisateur. La section properties définit les champs spécifiques et leurs types requis pour se connecter à l'API ou à la source de données. Le composant React lit le fichier manifest.json et génère les composants d'interface nécessaires en fonction du schéma, permettant aux utilisateurs de saisir les informations requises pour la connexion à la source. Cela peut inclure des champs de texte, des listes déroulantes, des cases à cocher et d'autres éléments d'interface, selon le schéma défini dans le fichier manifest.json.

Le fichier operations.json contient une définition de schéma pour une source de données particulière, par exemple Github. Il décrit les opérations disponibles et leurs paramètres pouvant être utilisés pour interroger la source de données.

Un composant React utilise ce schéma pour créer des requêtes dans les applications ToolJet afin de générer une interface permettant aux utilisateurs de sélectionner l'opération souhaitée et de fournir les paramètres requis.

Le composant utiliserait les propriétés définies dans le fichier operations.json pour créer différents éléments d'interface, tels que des listes déroulantes et des champs de saisie, et gérer les interactions de l'utilisateur pour créer la requête finale. Une fois que l'utilisateur a rempli les paramètres requis, le composant les utiliserait pour générer une requête pouvant être exécutée contre la source de données, et renverrait les résultats à l'utilisateur.

En conclusion, les fichiers _manifest.json_ et _operations.json_ jouent un rôle important dans la création de composants d'interface dynamiques dans les applications ToolJet. Ces fichiers définissent le schéma des sources de données et des opérations disponibles, qui est ensuite consommé par des composants React pour générer les éléments d'interface nécessaires afin que les utilisateurs puissent interagir. Grâce à ces fichiers, ToolJet permet aux utilisateurs de se connecter facilement à diverses API et sources de données, d'exécuter des requêtes et de récupérer des données de manière simple et intuitive.
:::

### 4. Définir le fichier manifest.json

Nous devons inclure les options nécessaires pour construire le formulaire de connexion.

```json
  "properties": {
    "credentials": {
      "label": "Authentication",
      "key": "auth_type",
      "type": "dropdown-component-flip",
      "description": "Single select dropdown for choosing credentials",
      "list": [
        {
          "value": "personal_access_token",
          "name": "Use Personal Access Token"
        }
      ]

    },
    "personal_access_token": {
      "token": {
        "label": "Token",
        "key": "personal_token",
        "type": "password",
        "description": "Enter personal access token",
        "hint": "You can generate a personal access token from your Github account settings."
      }
    }
  }
```

Il contient des informations sur les options d'authentification, notamment une liste déroulante pour choisir un type d'identifiants et un champ pour saisir un personal access token. Les propriétés label, key, type, description et hint sont utilisées pour définir les champs spécifiques et leurs types requis pour se connecter à l'API ou à la source de données.

### 5. Définir le fichier operations.json

```json
  "properties": {
    "operation": {
      "label": "Operation",
      "key": "operation",
      "type": "dropdown-component-flip",
      "description": "Single select dropdown for operation",
      "list": [
        {
          "value": "get_user_info",
          "name": "Get user info"
        },
        {
          "value": "get_repo",
          "name": "Get repository"
        },
        {
          "value": "get_repo_issues",
          "name": "Get repository issues"
        },
        {
          "value": "get_repo_pull_requests",
          "name": "Get repository pull requests"
        }
      ]
    },
    "get_user_info": {
      "username": {
        "label": "Username",
        "key": "username",
        "type": "codehinter",
        "lineNumbers": false,
        "description": "Enter username",
        "width": "320px",
        "height": "36px",
        "className": "codehinter-plugins",
        "placeholder": "Enter username"
      }
    },
    "get_repo": {
      "owner": {
        "label": "Owner",
        "key": "owner",
        "type": "codehinter",
        "lineNumbers": false,
        "description": "Enter owner name",
        "width": "320px",
        "height": "36px",
        "className": "codehinter-plugins",
        "placeholder": "developer"
      },
      "repo": {
        "label": "Repository",
        "key": "repo",
        "type": "codehinter",
        "lineNumbers": false,
        "description": "Enter repository name",
        "width": "320px",
        "height": "36px",
        "className": "codehinter-plugins",
        "placeholder": "tooljet"
      }
    },
    "get_repo_issues": {
      "owner": {
        "label": "Owner",
        "key": "owner",
        "type": "codehinter",
        "lineNumbers": false,
        "description": "Enter owner name",
        "width": "320px",
        "height": "36px",
        "className": "codehinter-plugins",
        "placeholder": "developer"
      },
      "repo": {
        "label": "Repository",
        "key": "repo",
        "type": "codehinter",
        "lineNumbers": false,
        "description": "Enter repository name",
        "width": "320px",
        "height": "36px",
        "className": "codehinter-plugins",
        "placeholder": "tooljet"
      },
      "state": {
        "label": "State",
        "key": "state",
        "className": "codehinter-plugins col-4",
        "type": "dropdown",
        "description": "Single select dropdown for choosing state",
        "list": [
          {
            "value": "open",
            "name": "Open"
          },
          {
            "value": "closed",
            "name": "Closed"
          },
          {
            "value": "all",
            "name": "All"
          }
        ]
      }
    },
    "get_repo_pull_requests": {
      "owner": {
        "label": "Owner",
        "key": "owner",
        "type": "codehinter",
        "lineNumbers": false,
        "description": "Enter owner name",
        "width": "320px",
        "height": "36px",
        "className": "codehinter-plugins",
        "placeholder": "developer"
      },
      "repo": {
        "label": "Repository",
        "key": "repo",
        "type": "codehinter",
        "lineNumbers": false,
        "description": "Enter repository name",
        "width": "320px",
        "height": "36px",
        "className": "codehinter-plugins",
        "placeholder": "tooljet"
      },
      "state": {
        "label": "State",
        "key": "state",
        "type": "dropdown",
        "className": "codehinter-plugins col-4",
        "description": "Single select dropdown for choosing state",
        "list": [
          {
            "value": "open",
            "name": "Open"
          },
          {
            "value": "closed",
            "name": "Closed"
          },
          {
            "value": "all",
            "name": "All"
          }
        ]
      }
    }
  }
```

Le fichier operations.json définit les opérations pouvant être effectuées sur la source de données. Il contient des informations sur le type d'opération, les champs requis pour l'exécuter et le type de chaque champ. Les propriétés label, key, type, description et hint sont utilisées pour définir les champs spécifiques et leurs types requis pour se connecter à l'API ou à la source de données.

### 6. Ajouter le package npm de GitHub aux dépendances du plugin

```bash
# change directory to the plugin directory and install the npm package
cd plugins/github
npm i octokit --workspace=@tooljet-marketplace/github
```

:::info
Étapes pour installer un package npm dans un plugin

```bash
npm i <npm-package-name> --workspace=<plugin-name-in-package-json>
```

La commande `npm i <npm-package-name> --workspace=<plugin-name-in-package-json>` est utilisée pour installer un package npm spécifique dans un workspace particulier d'un dépôt multi-packages.

Le flag _--workspace_ est utilisé pour spécifier le workspace dans lequel le package doit être installé. Dans ce cas, nous installons le package dans le workspace _@tooljet-marketplace/github_.
:::

### 7. Implémenter la logique d'exécution des requêtes dans index.ts

Le QueryService du plugin Github gère la logique d'exécution des requêtes dans index.ts. Le QueryService reçoit les métadonnées de la source de données, y compris les identifiants et configurations de connexion, ainsi que les paramètres de la requête exécutée.

Pour la source de données Github, les sourceOptions incluront les identifiants requis pour l'authentification, tels que le personal access token. Les queryOptions contiendront les configurations et paramètres spécifiques à la requête, y compris l'opération à effectuer, comme récupérer la liste des dépôts d'un utilisateur donné.

Le QueryService utilisera ces informations pour créer et exécuter les requêtes API nécessaires auprès de l'API Github. Les données résultantes seront renvoyées à l'appelant, qui pourra ensuite les traiter selon ses besoins.

Créez un nouveau fichier query_operations.ts dans le répertoire plugins/github/src et ajoutez-y le code suivant.

```typescript
import { Octokit } from "octokit";
import { QueryOptions } from "./types";

export async function getUserInfo(
  octokit: Octokit,
  options: QueryOptions,
): Promise<object> {
  const { data } = await octokit.request("GET /users/{username}", {
    username: options.username,
  });
  return data;
}

export async function getRepo(
  octokit: Octokit,
  options: QueryOptions,
): Promise<object> {
  const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
    owner: options.owner,
    repo: options.repo,
  });
  return data;
}

export async function getRepoIssues(
  octokit: Octokit,
  options: QueryOptions,
): Promise<object> {
  const { data } = await octokit.request("GET /repos/{owner}/{repo}/issues", {
    owner: options.owner,
    repo: options.repo,
    state: options.state || "all",
  });
  return data;
}

export async function getRepoPullRequests(
  octokit: Octokit,
  options: QueryOptions,
): Promise<object> {
  const { data } = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
    owner: options.owner,
    repo: options.repo,
    state: options.state || "all",
  });
  return data;
}
```

Le fichier query_operations.ts contient les fonctions qui seront utilisées pour exécuter les requêtes. Ces fonctions seront appelées par le QueryService dans index.ts.

La classe Github comporte trois méthodes :

- run : cette méthode est appelée lorsqu'une requête doit être exécutée. Elle prend en entrée _sourceOptions_ et _queryOptions_, qui représentent respectivement les métadonnées de la source et la configuration de la requête. La méthode run utilise la bibliothèque octokit pour effectuer des requêtes API vers l'API GitHub et renvoie le résultat de la requête dans un objet QueryResult.

- testConnection : lors de l'ajout d'une nouvelle source de données à une application ToolJet, la connexion peut être testée.
  Cette méthode est appelée lorsqu'une connexion doit être testée. Elle prend en entrée sourceOptions, qui représente les métadonnées de la source. La méthode testConnection teste la connexion en tentant de récupérer l'utilisateur authentifié et renvoie un objet ConnectionTestResult indiquant si la connexion a réussi ou non.

:::note
Toutes les sources de données ne disposent pas nécessairement d'un moyen de tester la connexion. Si cela ne s'applique pas à votre source de données, vous pouvez désactiver la fonctionnalité de test de connexion en ajoutant "customTesting": true, au manifest.json de votre plugin.
::

- getConnection : cette méthode est une méthode d'assistance qui renvoie un client octokit authentifié, utilisé pour effectuer des requêtes vers l'API GitHub. Elle prend en entrée sourceOptions, qui représente les métadonnées de la source, et renvoie un client octokit authentifié.

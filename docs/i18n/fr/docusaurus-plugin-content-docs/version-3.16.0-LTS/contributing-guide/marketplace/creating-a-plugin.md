---
id: creating-a-plugin
title: 'Marketplace: Creating plugins'
---

## Que sont les plugins

Le développement de ToolJet est centré sur l'extensibilité, permettant aux développeurs d'utiliser des plugins qui étendent ses capacités. Actuellement, ces plugins se limitent aux connecteurs, notamment aux connecteurs de sources de données comme PostgreSQL, MySQL, Twilio, Stripe, et bien d'autres. En utilisant JavaScript/TypeScript, les développeurs peuvent créer des plugins pour enrichir les fonctionnalités de ToolJet et publier ces plugins sur le ToolJet Marketplace.

Ce guide fournit des instructions étape par étape pour créer des plugins ToolJet à l'aide du CLI `tooljet`.

Le CLI `tooljet` est un outil de ligne de commande convivial conçu pour simplifier le processus de création de plugins. Dans le cadre de ce guide, nous allons créer un plugin de base pour GitHub.

## Étape 1 : Création d'un nouveau plugin - Plugin GitHub

La première étape consiste à initialiser (bootstrap) un nouveau plugin pour le marketplace de ToolJet. Le plugin authentifiera les utilisateurs à l'aide d'un jeton d'accès personnel GitHub (Personal Access Token) et inclura des opérations fondamentales telles que la récupération des informations utilisateur, des dépôts, des issues et des pull requests.

Si vous avez terminé le guide **[Setup](/docs/contributing-guide/marketplace/marketplace-setup)**, vous pouvez commencer à développer le plugin à l'aide du CLI `tooljet`. Pour lancer le développement du plugin, saisissez la commande suivante dans le terminal :
```bash
# create a new plugin
tooljet plugin create github
```

Lorsque vous y êtes invité, saisissez le **nom du plugin** et sélectionnez le **type de plugin**, qui est api dans ce cas. De plus, sélectionnez **yes** lorsque vous êtes invité à créer un nouveau plugin pour le marketplace.

Si votre plugin est hébergé sur GitHub, veuillez fournir l'**URL du dépôt** lorsque vous y êtes invité. Sinon, laissez le champ vide.

Lorsqu'un plugin est créé à l'aide du CLI `ToolJet`, un objet est ajouté au fichier **plugins.json** situé dans le répertoire **`ToolJet/server/src/assets/marketplace/`**. Cet objet contient des métadonnées sur le plugin, telles que son nom, sa description, sa version, son auteur et d'autres détails pertinents.

Le fichier plugins.json fait office de registre de tous les plugins disponibles pour utilisation dans ToolJet. Lorsque le serveur ToolJet démarre, il lit le fichier plugins.json et charge tous les plugins qui y sont listés.

:::info
Il est important de noter que le fichier plugins.json ne doit pas être modifié manuellement, car il est généré automatiquement par le `ToolJet CLI`. Apporter des modifications à ce fichier peut entraîner des dysfonctionnements des plugins dans le système.
:::

Tous les plugins du marketplace sont stockés dans le répertoire **`/marketplace`** du dépôt ToolJet. Vous pouvez trouver le plugin GitHub **[ici](https://github.com/ToolJet/ToolJet/tree/main/marketplace/plugins/github)**.

La structure d'un répertoire de plugin ToolJet typique se présente comme suit :
```bash
github/
  package.json
  lib/
    icon.svg
    index.ts
    operations.json
    manifest.json
```

Dans cette structure, le fichier **manifest.json** contient des informations sur le nom du plugin, sa description et d'autres détails. Le fichier **operations.json** contient des métadonnées sur toutes les opérations prises en charge par le plugin. Le fichier principal, **index.ts**, crée un QueryService pour le plugin, qui gère les queries, les tests de connexion, la mise en cache, et plus encore. Le fichier **icon.svg** sert d'icône pour le plugin, tandis que **package.json** est généré automatiquement par le CLI.

:::info
**Pourquoi avons-nous besoin d'un fichier manifest.json ou d'un fichier operations.json ?**

Le fichier manifest.json est utilisé par un composant React pour créer une UI dynamique pour les formulaires de connexion. Il définit le schéma d'une API ou d'une source de données, y compris son nom, son type, ainsi que toutes les variables exposées, en plus des options d'authentification et d'autres propriétés personnalisables. La section properties spécifie les champs requis et leurs types pour se connecter à l'API ou à la source de données. En lisant le fichier manifest.json, le composant React génère les composants d'UI nécessaires en fonction du schéma, tels que des champs de texte, des menus déroulants, des cases à cocher et d'autres éléments.

D'autre part, le fichier operations.json contient une définition de schéma pour une source de données spécifique, comme Github. Il décrit les opérations disponibles et leurs paramètres pouvant être utilisés pour interroger la source de données. Un composant React utilise ce schéma pour créer des queries dans les applications ToolJet, générant une UI qui permet aux utilisateurs de sélectionner l'opération souhaitée et de fournir les paramètres requis. Le composant utilise les propriétés définies dans le fichier operations.json pour créer divers éléments d'UI, tels que des menus déroulants et des champs de saisie, et pour gérer les interactions utilisateur afin de créer la query finale. Une fois que l'utilisateur a rempli les paramètres requis, le composant les utilise pour générer une query pouvant être exécutée sur la source de données et renvoyer les résultats à l'utilisateur.

Dans l'ensemble, les fichiers *manifest.json* et *operations.json* sont essentiels pour créer des composants d'UI dynamiques dans les applications ToolJet. Ils définissent le schéma pour les sources de données et les opérations disponibles, que les composants React utilisent ensuite pour générer des éléments d'UI conviviaux. En utilisant ces fichiers, ToolJet permet aux utilisateurs de se connecter facilement à diverses API et sources de données, d'exécuter des queries et de récupérer des données de manière intuitive et efficace.
:::

## Étape 2 : Définition du fichier manifest.json

Pour construire le formulaire de connexion, il est important d'inclure les options nécessaires dans le fichier manifest.json. Voici un exemple de la façon de le faire :
```json
  "properties": {
    "credentials": {
      "label": "Authentication",
      "key": "auth_type",
      "type": "dropdown-component-flip",
      "description": "A single select dropdown to choose credentials",
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
        "description": "Enter your personal access token",
        "hint": "You can generate a personal access token from your Github account settings."
      }
    }
  }
```
Ce fichier manifest.json inclut des informations sur les options d'authentification, notamment un menu déroulant pour choisir un type d'identifiants et un champ pour saisir un jeton d'accès personnel. Les propriétés label, key, type, description et hint sont utilisées pour définir les champs spécifiques et leurs types requis pour se connecter à l'API ou à la source de données.

Dans ce code particulier, deux propriétés principales sont définies : **`credentials`** et **`personal_access_token`**.

La propriété **`credentials`** spécifie la méthode d'authentification à utiliser. Elle contient plusieurs clés :
- **`label`** : un libellé convivial pour la méthode d'authentification, défini sur "Authentication"
- **`key`** : un identifiant unique pour la méthode d'authentification, défini sur "auth_type"
- **`type`** : le type de la méthode d'authentification, défini sur "dropdown-component-flip"
- **`description`** : une description de la méthode d'authentification, définie sur "A single select dropdown to choose credentials"
- **`list`** : un tableau d'objets représentant les différentes méthodes d'authentification disponibles. Dans ce cas, une seule méthode est disponible : un jeton d'accès personnel. La clé `value` de l'objet est définie sur "personal_access_token" et la clé `name` est définie sur "Use Personal Access Token".

La propriété **`personal_access_token`** spécifie les détails de la méthode d'authentification par jeton d'accès personnel. Elle contient une clé `token`, qui spécifie le jeton d'accès personnel réel à utiliser. La clé `token` contient plusieurs clés :
- **`label`** : un libellé convivial pour le jeton d'accès personnel, défini sur "Token"
- **`key`** : un identifiant unique pour le jeton d'accès personnel, défini sur "personal_token"
- **`type`** : le type du jeton d'accès personnel, défini sur "password"
- **`description`** : une description du jeton d'accès personnel, définie sur "Enter your personal access token"
- **`hint`** : une astuce pour le jeton d'accès personnel, définie sur "You can generate a personal access token from your Github account settings."

Les options de `type` disponibles sont :

Cependant, d'après le code fourni, les options de **`type`** disponibles sont :
- **`password`** : utilisé pour saisir une valeur secrète, telle qu'un mot de passe ou un jeton d'accès.
- **`dropdown-component-flip`** : utilisé pour créer un menu déroulant qui inverse sa position par rapport au composant qui le déclenche.
- **`text`** : utilisé pour saisir une seule ligne de texte.
- **`textarea`** : utilisé pour saisir plusieurs lignes de texte.
- **`toggle`** : utilisé pour créer un simple interrupteur marche/arrêt.
- **`react-component-headers`** : utilisé pour afficher des en-têtes pour les composants React.
- **`codehinter`** : un champ de saisie spécialisé utilisé pour entrer du code et disposant de fonctionnalités supplémentaires, telles que la résolution de code JavaScript entre doubles accolades `{{}}`.

:::tip
Le fichier **manifest.json** est utilisé par le composant de la fenêtre modale de connexion, qui apparaît pour inviter les utilisateurs à saisir les identifiants de leur source de données. Le fichier **operations.json**, quant à lui, est utilisé par le gestionnaire de queries lorsque les utilisateurs génèrent une query spécifique pour une source de données connectée. **Les deux fichiers utilisent un schéma similaire**.
:::

## Étape 3 : Définition du fichier operations.json
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
Le fichier operations.json spécifie les opérations disponibles pouvant être exécutées sur la source de données. Il fournit des détails sur le type d'opération, les champs requis pour exécuter l'opération, et le type de données de chaque champ. Les propriétés label, key, type, description et hint sont utilisées pour définir les champs spécifiques et leurs types requis pour établir une connexion avec l'API ou la source de données.

## Étape 4 : Ajouter le package npm de GitHub aux dépendances du plugin

- Changez de répertoire vers le répertoire du plugin où le package npm doit être installé, puis installez le package
  ```bash
  # change directory to the plugin directory and install the npm package
  npm i octokit --workspace=@tooljet-marketplace/github 
  ```

  :::info
  Étapes pour installer un package npm dans un plugin

  ```bash
  npm i <npm-package-name> --workspace=<plugin-name-in-package-json>
  ```

  La commande `npm i <npm-package-name> --workspace=<plugin-name-in-package-json>` est utilisée pour installer un package npm spécifique dans un workspace particulier d'un dépôt multi-packages.

  Le flag *--workspace* est utilisé pour spécifier le workspace dans lequel le package doit être installé. Dans ce cas, nous installons le package dans le workspace *@tooljet-marketplace/github*.
  :::

## Étape 5 : Implémenter la logique d'exécution des queries dans index.ts

Dans index.ts, la logique d'exécution des queries doit être implémentée pour le QueryService du plugin Github. Le QueryService est responsable de la gestion du processus d'exécution des queries et reçoit des informations sur la source de données, notamment les identifiants, les configurations et les paramètres de query.

Pour la source de données Github, sourceOptions contiendra les identifiants d'authentification nécessaires, comme le jeton d'accès personnel, tandis que queryOptions inclura les configurations et paramètres spécifiques à la query, comme l'obtention d'une liste de dépôts pour un utilisateur particulier.

En utilisant ces informations, le QueryService créera et exécutera des requêtes API contre l'API Github. Les données résultantes seront renvoyées à l'appelant pour un traitement ultérieur si nécessaire.

Créez un nouveau fichier **query_operations.ts** dans le répertoire **plugins/github/src** et ajoutez-y le code suivant.
```typescript
import { Octokit } from 'octokit'
import { QueryOptions } from './types'


export async function getUserInfo(octokit: Octokit, options: QueryOptions): Promise<object> {
  const { data } = await octokit.request(
    'GET /users/{username}',
    {
      username: options.username
    }
  );
  return data;
}

export async function getRepo(octokit: Octokit, options: QueryOptions): Promise<object> {
    const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}',
        {
            owner: options.owner,
            repo: options.repo
        }
    );
    return data;
}

export async function getRepoIssues(octokit: Octokit, options: QueryOptions): Promise<object> {
    const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/issues',
        {
            owner: options.owner,
            repo: options.repo,
            state: options.state || 'all'

        }
    );
    return data;
}

export async function getRepoPullRequests(octokit: Octokit, options: QueryOptions): Promise<object> {
    const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls',
        {
            owner: options.owner,
            repo: options.repo,
            state: options.state || 'all'
        }
    );
    return data;
}

```


Le fichier query_operations.ts comprend les fonctions qui exécuteront les queries et qui seront appelées par le QueryService dans index.ts.

La classe GitHub possède trois méthodes :

- **run** : cette méthode exécute une query et est invoquée en passant sourceOptions et queryOptions en entrée, représentant respectivement les métadonnées de la source et la configuration de la query. La méthode run utilise la bibliothèque octokit pour envoyer des requêtes API à l'API GitHub et renvoie le résultat de la query dans un objet QueryResult.

- **testConnection** : lors de l'ajout d'une nouvelle source de données à une application ToolJet, la connexion peut être testée. La méthode testConnection est utilisée pour tester la connexion, et elle prend sourceOptions en entrée, représentant les métadonnées de la source. La méthode teste la connexion en essayant de récupérer l'utilisateur authentifié et renvoie un objet ConnectionTestResult indiquant si la connexion a réussi.

  :::note
  Toutes les sources de données ne prennent pas nécessairement en charge le test de connexion. Si cela ne s'applique pas à votre source de données, vous pouvez désactiver la fonctionnalité de test de connexion en ajoutant "customTesting": true au fichier manifest.json de votre plugin.
  :::

- **getConnection** : cette méthode est une fonction utilitaire qui renvoie un client octokit authentifié, utilisé pour envoyer des requêtes à l'API GitHub. Elle prend sourceOptions en entrée, représentant les métadonnées de la source, et renvoie un client octokit authentifié.

## Étape 6 : Ajouter la gestion des erreurs

En cas d'erreur, il est nécessaire de renvoyer le message d'erreur reçu du Plugin SDK. Pour y parvenir, incluez `errorDetails` dans la méthode **run** au sein du fichier **index.ts**. Les paramètres spécifiques de l'erreur peuvent varier selon le plugin. <br/><br/>
De plus, le champ **data** du Plugin SDK correspond à **errorDetails** dans le code, et le champ **errorMessage** généré dynamiquement correspond au champ **description** dans l'aperçu de l'erreur.

#### Exemple

Prenons le cas de MongoDB. Si une erreur se produit, telle que la suivante :

<img className="screenshot-full" src="/img/contributing-guide/create-plugin/mongodb-error.png" alt="MongoDB Error" />

Vous pouvez implémenter la gestion des erreurs à l'aide du code suivant :

```js
catch (error) {
      let errorMessage = 'An unknown error occurred';
      let errorDetails = {};

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        errorDetails = {
          name: error.name,
          code: (error as any).code || null,
          codeName: (error as any).codeName || null,
          keyPattern: (error as any).keyPattern || null,
          keyValue: (error as any).keyValue || null,
        };
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
}
```

Ce code garantit que les messages et détails d'erreur sont correctement renvoyés au Plugin SDK, permettant des aperçus d'erreurs pertinents pour l'utilisateur.

<img className="screenshot-full" src="/img/contributing-guide/create-plugin/query-error.png" alt="Query Error" />

## Supprimer un plugin
Pour supprimer un plugin, saisissez la commande suivante :

```bash
tooljet plugin delete PLUGIN_NAME
```

Le CLI demandera aux utilisateurs de vérifier si le plugin à supprimer est un plugin du marketplace avant de procéder à la suppression.

## Publier un plugin
Pour publier un plugin, soumettez une pull request sur le dépôt GitHub de ToolJet après l'avoir créé. L'équipe ToolJet examinera la pull request, et si elle est approuvée, le plugin sera inclus et publié dans la prochaine version.

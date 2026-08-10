---
id: gitsync-env-vars
title: Configurer GitSync via des variables d'environnement
---

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

:::warning BETA
La configuration de Git Sync via des variables d'environnement est actuellement en beta et n'est pas recommandée pour un usage en production.
:::

GitSync peut être configuré à l'aide de variables d'environnement plutôt que via l'interface de ToolJet. Cela vous permet de fournir directement les identifiants Git sur la machine hôte, à l'échelle de chaque workspace, ce qui est particulièrement utile pour les déploiements self-hosted où la configuration doit être reproductible et automatisée.

Cette approche prend en charge deux cas d'usage principaux :

* **Configuration statique :** les identifiants sont définis une seule fois via des variables d'environnement, ce qui facilite le déploiement de nouvelles instances ToolJet avec une configuration GitSync préconfigurée.
* **Gestion dynamique des identifiants :** les identifiants sensibles tels que les clés privées de GitHub App ou les jetons d'accès sont souvent rotés périodiquement pour des raisons de sécurité et de conformité. La gestion de ces identifiants via des variables d'environnement permet une intégration fluide avec des systèmes externes de gestion des secrets (par exemple, AWS Secrets Manager, Vault, pipelines CI/CD), permettant une rotation automatisée sans mises à jour manuelles via l'interface.

Il existe deux façons de fournir ces variables d'environnement :

* **[Variable d'environnement unique](#option-1-single-environment-variable)** (`WORKSPACE_GIT_CONFIGS`) — un unique objet JSON sous forme de chaîne contenant la configuration de tous les workspaces.
* **[Fichiers d'environnement par workspace](#option-2-per-workspace-environment-files)** (`.tj_env.<workspace-slug-or-uuid>`) — un fichier de type dotenv par workspace.

Les deux approches acceptent le même ensemble d'identifiants spécifiques au fournisseur, décrits ci-dessous.

## Fournisseurs Git pris en charge

ToolJet prend en charge les fournisseurs suivants :

#### GitHub (HTTPS)

| **Clé** | **Description** |
| --- | --- |
| `GITHUB_URL` | L'URL HTTPS de votre dépôt GitHub. (par exemple `https://github.com/your-org/your-repo`) |
| `GITHUB_BRANCH` | La branche avec laquelle synchroniser. |
| `GITHUB_APP_ID` | L'ID de votre GitHub App. |
| `GITHUB_INSTALLATION_ID` | L'ID d'installation de votre GitHub App. |
| `GITHUB_PRIVATE_KEY` | La clé privée générée lors de la création de la GitHub App. Échappez les retours à la ligne avec `\n`. |

Pour une instance GitHub Enterprise self-hosted, vous pouvez également inclure :

| **Clé** | **Description** |
| --- | --- |
| `GITHUB_ENTERPRISE_URL` | Le domaine de votre instance GitHub self-hosted. (par exemple `https://github.your-company.com`) |
| `GITHUB_ENTERPRISE_API_URL` | Le point de terminaison API de votre instance GitHub self-hosted. (par exemple `https://api.github.your-company.com`) |

#### GitLab

| **Clé** | **Description** |
| --- | --- |
| `GITLAB_URL` | L'URL de votre dépôt GitLab. (par exemple `https://gitlab.com/your-org/your-repo`) |
| `GITLAB_BRANCH` | La branche avec laquelle synchroniser. Par défaut, `main`. |
| `GITLAB_PROJECT_ID` | L'ID de votre projet GitLab. |
| `GITLAB_PROJECT_ACCESS_TOKEN` | Un jeton d'accès de projet avec les permissions de lecture/écriture. |

Pour une instance GitLab self-hosted, vous pouvez également inclure :

| **Clé** | **Description** |
| --- | --- |
| `GITLAB_ENTERPRISE_URL` | Le domaine de votre instance GitLab self-hosted. (par exemple `https://gitlab.your-company.com`) |

#### Git (SSH)
| **Clé**               | **Description**                                                                   |
| --------------------- | --------------------------------------------------------------------------------- |
| `GIT_SSH_URL`         | L'URL SSH de votre dépôt Git (par exemple `git@your-git-host.com:org/repo.git`).   |
| `GIT_SSH_BRANCH`      | La branche avec laquelle synchroniser.                                                          |
| `GIT_SSH_PRIVATE_KEY` | La clé privée SSH utilisée pour l'authentification. Assurez-vous que les retours à la ligne sont échappés avec `\n`. |
| `GIT_SSH_PUBLIC_KEY`  | La clé publique SSH correspondante.                                                 |
| `GIT_SSH_KEY_TYPE`    | Le type de clé SSH (par exemple `ed25519`, `rsa`).                                         |

:::note
Un seul fournisseur peut être actif par workspace à la fois. Si une clé requise pour un fournisseur est manquante, ToolJet ignorera ce fournisseur. Vérifiez à nouveau votre liste de clés si la configuration ne s'active pas.
:::

## Option 1 : variable d'environnement unique

Configurez Git Sync pour tous les workspaces à l'aide d'une seule variable d'environnement, `WORKSPACE_GIT_CONFIGS`.

### 1. Définir la variable d'environnement

Définissez `WORKSPACE_GIT_CONFIGS` comme un objet JSON sous forme de chaîne. Chaque clé de premier niveau est un **slug** ou un **UUID** de workspace, et sa valeur est un objet contenant les clés spécifiques au fournisseur listées dans [Fournisseurs Git pris en charge](#supported-git-providers) (GitHub, GitLab ou Git SSH).

L'ensemble de la valeur JSON doit être sur une seule ligne, avec les retours à la ligne des clés privées échappés en `\n`.

```
WORKSPACE_GIT_CONFIGS='{"nexus-workspace":{"GITHUB_URL":"https://github.com/acme-corp/internal-tools.git","GITHUB_BRANCH":"master","GITHUB_APP_ID":"123456","GITHUB_INSTALLATION_ID":"98765432","GITHUB_PRIVATE_KEY":"-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"}}'
```

Pour configurer plusieurs workspaces, ajoutez d'autres clés à l'objet de premier niveau, une par workspace :

```
WORKSPACE_GIT_CONFIGS='{"workspace-one":{...},"workspace-two":{...}}'
```

### 2. Rendre la variable disponible pour le serveur

Ajoutez `WORKSPACE_GIT_CONFIGS` là où vous gérez les variables d'environnement de votre serveur, par exemple votre fichier `.env`, ou la section `environment` de votre fichier Docker Compose :

```yaml
services:
  tooljet:
    image: tooljet/tooljet:latest
    environment:
      WORKSPACE_GIT_CONFIGS: '{"nexus-workspace":{"GITHUB_URL":"https://github.com/acme-corp/internal-tools.git","GITHUB_BRANCH":"master","GITHUB_APP_ID":"123456","GITHUB_INSTALLATION_ID":"98765432","GITHUB_PRIVATE_KEY":"-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"}}'
```

### 3. Redémarrer le serveur

Redémarrez le serveur ToolJet pour que le changement prenne effet. Cette variable n'est lue qu'au démarrage — les changements effectués pendant que le serveur est en cours d'exécution ne prendront effet qu'après un redémarrage du serveur.

## Option 2 : fichiers d'environnement par workspace

Au lieu d'une seule variable d'environnement, vous pouvez configurer Git Sync en utilisant un fichier de type dotenv par workspace.

### 1. Créer le fichier d'environnement

Sur votre machine hôte, créez un fichier nommé `.tj_env.<workspace-slug-or-uuid>`. Ce fichier utilise le format dotenv standard (`KEY=VALUE`) et contient les identifiants Git pour un workspace spécifique.

Vous pouvez nommer le fichier en utilisant le **slug** ou l'**UUID** du workspace :

| Style de nommage | Exemple |
| --- | --- |
| Par slug de workspace | `.tj_env.my-workspace` |
| Par UUID de workspace | `.tj_env.550e8400-e29b-41d4-a716-446655440000` |

Vous pouvez placer plusieurs fichiers `.tj_env.*` dans le même répertoire, à raison d'un par workspace.

### 2. Ajouter les identifiants de votre fournisseur Git

Renseignez le fichier avec les clés requises pour votre fournisseur Git, listées dans [Fournisseurs Git pris en charge](#supported-git-providers) ci-dessus.

### 3. Rendre le fichier disponible pour le serveur

Le fichier `.tj_env.*` doit être accessible dans `/app/` à l'intérieur du conteneur au moment où le serveur démarre. La façon de l'y placer dépend de votre configuration de déploiement. Pour Docker Compose, consultez le [guide de configuration Docker Compose](#docker-compose-setup).

### 4. Redémarrer le serveur

Une fois le fichier monté, redémarrez le serveur ToolJet.
Au démarrage, ToolJet lit tous les fichiers `.tj_env.*` depuis `/app/` et les associe à leurs workspaces respectifs.

Si le fichier est supprimé, ToolJet désactivera automatiquement la configuration au prochain redémarrage.

:::note
Les fichiers d'environnement ne sont lus qu'au démarrage. Tout changement effectué sur un fichier `.tj_env.*` pendant que le serveur est en cours d'exécution ne prendra effet qu'après un redémarrage du serveur.
:::

## Configuration Docker Compose

Montez le fichier `.tj_env.*` depuis votre machine hôte dans le conteneur, à `/app/`. Vous pouvez monter des fichiers individuels ou un répertoire entier.

**Pour monter un seul fichier de workspace :**

```yaml
services:
  tooljet:
    image: tooljet/tooljet:latest
    volumes:
      - ./.tj_env.my-workspace:/app/.tj_env.my-workspace
```

**Pour monter plusieurs fichiers de workspace à la fois :**

```yaml
services:
  tooljet:
    image: tooljet/tooljet:latest
    volumes:
      - ./workspace-envs:/app
```

<details id="tj-dropdown">
<summary>Exemple de configuration Docker Compose</summary>

```yaml
name: tooljet-production

services:
  tooljet:
    image: tooljet/tj:v1
    container_name: tooljet-app
    platform: linux/amd64
    restart: always
    env_file: .env.production
    ports:
      - "80:80"
    depends_on:
      - postgres
    environment:
      SERVE_CLIENT: "true"
      PORT: "80"
    command: npm run start:prod
    volumes:
      - ./.tj_env.devs-workspace:/app/.tj_env.devs-workspace

  postgres:
    container_name: postgres
    image: postgres:16
    restart: always
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

volumes:
  postgres_data:
    driver: local
```
</details>

:::note
Un seul fournisseur Git (GitHub HTTPS, Git SSH ou GitLab) peut être actif par workspace à la fois.
:::

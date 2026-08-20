---
id: marketplace-plugin-azurerepos
title: Azure Repos
---

ToolJet offre la possibilité d'établir une connexion avec Azure Repos afin de lire et de committer sur des dépôts Git pour le contrôle de source et la gestion des versions.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus [Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à Azure Repos, vous aurez besoin du **nom de l'organisation (par exemple, https://dev.azure.com/your-organization)** et d'un **Personal Access Token (PAT)**.
Générez un Personal Access Token (PAT) en accédant à User Settings, puis en sélectionnant Personal Access Tokens. Assurez-vous que le token inclut les scopes nécessaires en fonction des opérations que vous souhaitez effectuer.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/azurerepos/connection.png" alt="Azure Repos Connection TJ"/>

## Opérations prises en charge

1. **[Get Azure Repository](#get-azure-repository)**
2. **[Get Repository Commits](#get-repository-commits)**
3. **[Get Repository Branches](#get-repository-branches)**
4. **[Get Repository Pushes](#get-repository-pushes)**
5. **[Get Project Pull Requests](#get-project-pull-requests)**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/azurerepos/listops.png" alt="Azure Repos supported operations"/>


### Get Azure Repository

Récupère les détails d'un dépôt spécifique au sein de votre projet Azure DevOps.

#### Paramètre requis

- **Project**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/azurerepos/azure-query.png" alt="get azure repository"/>

<details id="tj-dropdown">
<summary>**Exemples de valeurs**</summary>

```json
Project: test
```

</details>

### Get Repository Commits

Récupère une liste des commits effectués sur un dépôt sélectionné.

#### Paramètre requis

- **Project**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/azurerepos/commit-query.png" alt="get repository commits"/>

<details id="tj-dropdown">
<summary>**Exemples de valeurs**</summary>

```json
Project name: test
Repository commits: ToolJet
```

</details>

### Get Repository Branches

Liste toutes les branches disponibles dans un dépôt Azure spécifié.

#### Paramètre requis

- **Project**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/azurerepos/branch-query.png" alt="get repository branches"/>

<details id="tj-dropdown">
<summary>**Exemples de valeurs**</summary>

```json
Project: test
Repository commits: ToolJet
```

</details>

### Get Repository Pushes

Récupère les informations sur les pushs récents effectués sur le dépôt.

#### Paramètre requis

- **Project**

<img className="screenshot-full img-full" src="/img/marketplace/plugins//azurerepos/push-query.png" alt="get repository pushes"/>

<details id="tj-dropdown">
<summary>**Exemples de valeurs**</summary>

```json
Project: test
Repository commits: ToolJet
```

</details>

### Get Project Pull Requests

Récupère les pull requests associées au projet et au dépôt sélectionnés.

#### Paramètre requis

- **Project**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/azurerepos/pr-query.png" alt="get project pull requests"/>

<details id="tj-dropdown">
<summary>**Exemples de valeurs**</summary>

```json
Project pull requests: test
```

</details>


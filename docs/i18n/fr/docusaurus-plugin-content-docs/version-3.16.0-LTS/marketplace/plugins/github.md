---
id: marketplace-plugin-github
title: GitHub
---

ToolJet offre une intégration transparente avec GitHub. Cette connexion vous permet d'interagir directement avec les dépôts et les données GitHub.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à GitHub, vous avez besoin de l'identifiant suivant :
- **Personal Access Token** : Vous pouvez générer ce token depuis les **[paramètres de votre compte GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)**.

Vous aurez besoin d'un Personal Access Token pour accéder aux données des dépôts privés. Les données des dépôts publics restent accessibles sans Personal Access Token.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/connection-v4.png" alt="GitHub data source configuration " />

## Requêtes prises en charge

- **[Get user info](#get-user-info)**
- **[Get repository](#get-repository)**
- **[Get repository issues](#get-repository-issues)**
- **[Get repository pull requests](#get-repository-pull-requests)**

### Get User Info

Cette opération récupère les détails d'un utilisateur spécifié.

#### Paramètre requis

- **Username** : Spécifiez le nom d'utilisateur ou l'organisation GitHub dont vous souhaitez récupérer les détails.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/get-user-info-v4.png" alt=" GitHub get user info query " />

### Get Repository

Récupère des informations détaillées sur un dépôt spécifique.

#### Paramètres requis

- **Owner** : Nom du propriétaire du dépôt, qui peut être soit un utilisateur GitHub, soit une organisation.
- **Repository** : Le nom exact du dépôt.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/get-repo-v4.png" alt="GitHub get repo query" />

### Get Repository Issues

Génère une liste des issues associées à un dépôt, avec des options pour les filtrer selon leur statut.

#### Paramètres requis

- **Owner** : Le nom du propriétaire du dépôt. Le propriétaire peut être soit une organisation GitHub, soit un utilisateur.
- **Repository** : Le nom du dépôt pour lequel les issues doivent être récupérées.
- **State** : Filtrez les issues selon leur statut : All, Open, ou Closed.

#### Paramètres optionnels

- **Page size** : Nombre souhaité d'issues par page. La valeur par défaut est 30.
- **Page number** : Numéro de page souhaité pour récupérer les issues. La valeur par défaut est 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/get-repo-issues-v4.png" alt="GitHub get repo issues query" />

### Get Repository Pull Requests

Génère une liste des pull requests d'un dépôt, avec des options pour les filtrer selon leur statut.

#### Paramètres requis

- **Owner** : Le nom du propriétaire du dépôt. Le propriétaire peut être soit une organisation GitHub, soit un utilisateur.
- **Repository** : Le nom du dépôt pour lequel les pull requests doivent être récupérées.
- **State** : Filtrez les pull requests selon leur statut : All, Open, ou Closed.

#### Paramètres optionnels

- **Page size** : Nombre souhaité d'issues par page. La valeur par défaut est 30.
- **Page number** : Numéro de page souhaité pour récupérer les pull requests. La valeur par défaut est 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/get-repo-pr-v4.png" alt="GitHub get repo PRs query" />

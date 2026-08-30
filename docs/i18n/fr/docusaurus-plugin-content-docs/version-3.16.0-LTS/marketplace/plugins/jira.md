---
id: marketplace-plugin-jira
title: Jira
---

# Jira

ToolJet vous permet de vous connecter à votre instance Jira pour effectuer diverses opérations telles que la gestion des issues, des utilisateurs, des worklogs et des boards.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

<div style={{textAlign: 'center'}}>
    <img style={{ marginTop:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/jira/jira-signup-page.png" alt="Jira Homepage" />
</div>

## Connexion

Pour vous connecter à une source de données Jira dans ToolJet, vous pouvez soit cliquer sur le bouton **+Add new data source** dans le panneau de requêtes, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** du dashboard ToolJet.

Pour vous connecter à votre instance Jira, les identifiants suivants sont requis :

- **URL** : L'URL de votre instance Jira
- **Email** : L'adresse e-mail de votre compte Jira
- **Token** : Votre token API Jira

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/connection.png" alt="Jira data source configuration" />
</div>

:::tip
Vous pouvez générer un personal access token depuis la section **Manage account > Security > API Tokens** de votre compte Jira.
:::

## Interroger Jira

1. Cliquez sur le bouton **+** dans le gestionnaire de queries en bas de l'éditeur et sélectionnez la source de données Jira ajoutée précédemment.
2. Choisissez la ressource et l'opération que vous souhaitez effectuer sur votre instance Jira.

:::tip
Les résultats de query peuvent être transformés à l'aide de transformations. Référez-vous à notre documentation sur les transformations pour plus de détails : **[lien](/docs/app-builder/custom-code/transform-data)**
:::

## Ressources et opérations prises en charge

ToolJet prend en charge les ressources et opérations Jira suivantes :

<img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/listops.png" alt="Jira supported operations" />

#### Issue

- **[Get Issue](#get-issue)**
- **[Create Issue](#create-issue)**
- **[Delete Issue](#delete-issue)**
- **[Assign Issue](#assign-issue)**
- **[Edit Issue](#edit-issue)**

#### User

- **[Get User](#get-user)**
- **[Find Users by Query](#find-users-by-query)**
- **[Find Assignable Users](#assignable-users)**

#### Worklog

- **[Get Issue Worklogs](#get-issue-worklogs)**
- **[Add Worklog](#add-worklog)**
- **[Delete Worklog](#delete-worklog)**

#### Board

- **[Get Issues for Backlog](#get-issues-for-backlog)**
- **[Get All Boards](#get-all-boards)**
- **[Get Issues for Board](#get-issues-for-board)**

## Issue

### Get Issue

Cette opération récupère les détails d'une issue Jira spécifique.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/get-issue-query.png" alt="Jira Get Issue"/>
</div>

#### Paramètres requis :

- **Issue key** : La clé ou l'id de l'issue à récupérer.
- **Params/Body** : Paramètres supplémentaires tels que les fields à récupérer, les options d'expand, etc.

#### Exemple :

```yaml
Issue Key: 10004
Params/Body:
{
    "fields": "summary,description,created",
    "expand": "renderedFields,names"
}
```

### Create Issue

Cette opération crée une nouvelle issue Jira.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/create-issue-query.png" alt="Jira Create Issue"/>
</div>

#### Paramètre requis :

- **Params/Body** : Les détails de l'issue à créer.

#### Exemple :

```yaml
Params/Body:
{
  "fields": {
    "project": {
      "key": "SCRUM"
    },
    "summary": "A particular bug needs to be fixed.",
    "description": "The XYZ feature is not working as expected.",
    "issuetype": {
      "name": "Bug"
    },
    "assignee": {
      "accountId": "712020:4581444c-054e-41d8-90ed-6d1d849557f7"
    },
    "labels": [
      "bug",
      "urgent"
    ]
  }
}
```

### Delete Issue

Cette opération supprime une issue Jira spécifique.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/delete-issue-query.png" alt="Jira Delete Issue"/>
</div>

#### Paramètre requis :

- **Issue key** : La clé ou l'id de l'issue à supprimer.

#### Paramètre optionnel :

- **Delete subtasks** : Indique s'il faut supprimer les subtasks de l'issue.

#### Exemple :

```yaml
Issue Key: SCRUM-32
Delete Subtasks: Yes // Can be Yes or No
```

### Assign Issue

Cette opération assigne une issue Jira à un utilisateur spécifique.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/assign-issue-query.png" alt="Jira Assign Issue"/>
</div>

#### Paramètres requis :

- **Issue key** : La clé ou l'id de l'issue à assigner.
- **Account id** : L'account ID de l'utilisateur auquel assigner l'issue.

#### Exemple :

```yaml
Issue Key: 10001
Account id: 712020:4581444c-054e-41d8-90ed-6d1d849557f7
```

### Edit Issue

Cette opération modifie une issue Jira existante.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/edit-issue-query.png" alt="Jira Edit Issue"/>
</div>

#### Paramètres requis :

- **Issue key** : La clé ou l'id de l'issue à modifier.
- **Params/Body** : Les fields à mettre à jour et leurs nouvelles valeurs.

#### Exemple :

```yaml
Issue Key: 10007
Params/Body:
{
  "fields": {
    "summary": "Updated issue summary",
    "description": "Updated issue description"
  }
}
```

## User

### Get User

Cette opération récupère les détails d'un utilisateur Jira spécifique.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/get-user-query.png" alt="Jira Get User"/>
</div>

#### Paramètre requis :

- **Account id** : L'account ID de l'utilisateur à récupérer.

#### Paramètre optionnel :

- **Expand** : Détails utilisateur supplémentaires à inclure dans la réponse.

#### Exemple :

```yaml
Account id: 5b10a2844c20165700ede21g
Expand: groups,applicationRoles
```

### Find Users by Query

Cette opération recherche des utilisateurs en fonction d'une query.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/find-users-query.png" alt="Jira Find Users"/>
</div>

#### Paramètre requis :

- **Query** : La requête de recherche au format Jira Query Language (JQL).

#### Paramètres optionnels :

- **Start at** : L'index du premier utilisateur à retourner.
- **Max results** : Le nombre maximum d'utilisateurs à retourner.

#### Exemple :

```yaml
Query: is assignee of PROJ
Start at: 1
Max results: 10
```

### Assignable Users

Cette opération recherche les utilisateurs pouvant être assignés à des issues.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/jira/assignable-users-query.png" alt="Jira Assignable Users"/>
</div>

#### Paramètres requis :

- **Query** : La requête de recherche au format Jira Query Language (JQL).
- **Account id** : L'account ID de l'utilisateur pour lequel rechercher des utilisateurs assignables.
- **Project key** : La clé ou l'id du projet pour lequel rechercher des utilisateurs assignables.
- **Issue key** : La clé ou l'id de l'issue pour laquelle rechercher des utilisateurs assignables.

#### Paramètres optionnels :

- **Start at** : L'index du premier utilisateur à retourner.
- **Max results** : Le nombre maximum d'utilisateurs à retourner.
- **Action descriptor id** : L'action descriptor ID pour lequel rechercher des utilisateurs assignables.
- **Recommended** : Indique s'il faut retourner les utilisateurs recommandés.

:::info
Remarque : Query et Account id sont des paramètres mutuellement exclusifs. Vous ne pouvez utiliser qu'un seul des deux.
:::

#### Exemple :

```yaml
Query: Mark // Search for users with "Mark" in their name, username, or email
Account id: 5b10a2844c20165700ede21g
Project key: PROJ
Issue key: SCRUM-1
Start at: 1
Max results: 10
Action descriptor id: 12345
Recommended: Yes
```

## Worklog

### Get Issue Worklogs

Cette opération récupère les worklogs d'une issue spécifique.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/get-worklogs-query.png" alt="Jira Get Issue Worklogs"/>
</div>

#### Paramètre requis :

- **Issue key** : La clé ou l'id de l'issue pour laquelle récupérer les worklogs.

#### Paramètres optionnels :

- **Start at** : L'index du premier worklog à retourner.
- **Max results** : Le nombre maximum de worklogs à retourner.
- **Started after** : La date et l'heure à partir desquelles récupérer les worklogs.
- **Started before** : La date et l'heure jusqu'à laquelle récupérer les worklogs.

#### Exemple :

```yaml
Issue Key: SCRUM-1
Start at: 1
Max results: 10
Started after: 1626228754515
Started before: 1726228754515
```

### Add Worklog

Cette opération ajoute une nouvelle entrée de worklog à une issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/add-worklog-query.png" alt="Jira Add Worklog"/>
</div>

#### Paramètres requis :

- **Issue key** : La clé ou l'id de l'issue à laquelle ajouter le worklog.
- **Params/Body** : Les détails de l'entrée de worklog.

#### Exemple :

```yaml
Issue Key: SCRUM-1
Params/Body:
{
  "comment": "It's important to keep the team motivated!",
  "created": "2026-02-25T10:56:25.035+0000",
  "id": "100028",
  "issueId": "SCRUM-1",
  "started": "2026-02-25T10:59:49.015+0000",
  "timeSpent": "2h 47m"
}
```

### Delete Worklog

Cette opération supprime une entrée de worklog spécifique d'une issue.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/delete-worklog-query.png" alt="Jira Delete Worklog"/>
</div>

#### Paramètres requis :

- **Issue key** : La clé ou l'id de l'issue contenant le worklog.
- **Worklog id** : L'ID du worklog à supprimer.

#### Paramètre optionnel :

- **Params/Body** : Paramètres supplémentaires tels que la notification des utilisateurs, l'ajustement de l'estimation, etc.

#### Exemple :

```yaml
Issue Key: SCRUM-1
Worklog id: 100010
Params/Body:
{
    "notifyUsers": "true",
    "adjustEstimate": "auto"
}
```

## Board

### Get Issues for Backlog

Cette opération récupère les issues du backlog d'un board.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/get-board-backlog.png" alt="Jira Backlog Issues"/>
</div>

#### Paramètre requis :

- **Board id** : L'ID du board dont récupérer les issues du backlog.

#### Paramètres optionnels :

- **Start at** : L'index de la première issue à retourner.
- **Max results** : Le nombre maximum d'issues à retourner.
- **Expand** : Détails d'issue supplémentaires à inclure dans la réponse.
- **Params/Body** : Paramètres supplémentaires tels que les fields à récupérer, les options d'expand, etc.

#### Exemple :

```yaml
Board id: 001
Start at: 1
Max results: 10
Expand: widget
Params/Body:
{
    "fields": ["color", "transparency", "color_radius"]
}
```

### Get All Boards

Cette opération récupère tous les boards visibles par l'utilisateur.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/get-all-boards.png" alt="Jira All Boards"/>
</div>

#### Paramètre requis :

- **Project key** : Limite les boards à un projet spécifique.

#### Paramètres optionnels :

- **Start at** : L'index du premier board à retourner.
- **Name** : Le nom du board à rechercher.
- **Max results** : Le nombre maximum de boards à retourner.
- **Expand** : Détails de board supplémentaires à inclure dans la réponse.

#### Exemple :

```yaml
Project key: PROJ
Start at: 1
Name: SCRUM board
Max results: 10
Expand: projects
```

### Get Issues for Board

Cette opération récupère toutes les issues d'un board spécifique.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full img-full" src="/img/marketplace/plugins/jira/get-issues-board.png" alt="Jira Board Issues"/>
</div>

#### Paramètre requis :

- **Board id** : L'ID du board dont récupérer les issues.

#### Paramètres optionnels :

- **Start at** : L'index de la première issue à retourner.
- **Max results** : Le nombre maximum d'issues à retourner.
- **Expand** : Détails d'issue supplémentaires à inclure dans la réponse.
- **Params/Body** : Paramètres supplémentaires tels que les fields à récupérer, les options d'expand, etc.

#### Exemple :

```yaml
Board id: 05
Start at: 1
Max results: 10
Expand: projects
Params/Body:
{
    "fields": ["scope", "budget", "quality"]
}
```

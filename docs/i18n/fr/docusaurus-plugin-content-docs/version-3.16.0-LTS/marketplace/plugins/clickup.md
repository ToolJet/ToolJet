---
id: marketplace-plugin-clickup
title: Click Up
---

ClickUp est une plateforme de gestion de projet et de collaboration basée sur le cloud, conçue pour aider les équipes de toutes tailles à gérer efficacement leurs projets, tâches et workflows. En intégrant ClickUp à ToolJet, vous pouvez créer des outils internes personnalisés qui interagissent avec votre espace de travail ClickUp pour gérer des tâches, des dossiers, des listes, et plus encore.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[utilisation des plugins du Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour vous connecter à ClickUp, vous aurez besoin d'une clé API, que vous pouvez générer depuis les [paramètres de ClickUp](https://app.clickup.com/settings/apps).

<img className="screenshot-full img-full" src="/img/marketplace/plugins/clickup/connection.png" alt="ClickUp Plugin's connection"/>

## Opérations prises en charge

ToolJet prend en charge un large éventail d'opérations ClickUp, regroupées dans les catégories suivantes. Chaque catégorie correspond à une partie spécifique du modèle de données ClickUp, vous permettant d'effectuer des actions ciblées dans votre espace de travail :

| **Catégorie**   | **Description**                                                     |
| -------------- | ------------------------------------------------------------------- |
| **Task**       | Créer, récupérer, mettre à jour et supprimer des tâches dans votre espace de travail. |
| **OAuth**      | Publier le token OAuth.                                               |
| **User**       | Accéder aux données liées aux utilisateurs dans votre espace de travail. |
| **Team**       | Interagir avec les équipes dans ClickUp.                                     |
| **Checklist**  | Gérer les checklists et les éléments de checklist au sein des tâches. |
| **View**       | Récupérer les vues disponibles dans une liste (par ex., vue tableau, table, liste). |
| **List**       | Accéder et gérer les listes à l'intérieur des dossiers ou directement sous les espaces. |
| **Comment**    | Ajouter ou récupérer des commentaires associés aux tâches. |
| **Folder**     | Récupérer et gérer les dossiers au sein d'un espace. |
| **Space**      | Interagir avec les espaces qui organisent les dossiers et les listes sous une équipe. |
| **Goal**       | Gérer les objectifs et leur progression au sein de votre espace de travail. |
| **Key Result** | Suivre les résultats mesurables liés à des objectifs spécifiques. |
| **Group**      | Gérer les groupes de tâches ou les groupes d'assignés pour une meilleure organisation. |
| **Webhook**    | Créer et gérer des webhooks pour le suivi des événements ClickUp en temps réel. |
| **Workspace**  | Accéder aux informations et paramètres généraux au niveau de l'espace de travail. |

### Type d'opération

Le plugin prend en charge les méthodes HTTP suivantes :
- **GET** – Récupérer des données (par ex., récupérer une tâche, lister les utilisateurs).
- **POST** – Créer de nouvelles ressources (par ex., créer une tâche ou un commentaire).
- **PUT** – Mettre à jour des ressources existantes (par ex., mettre à jour les détails d'une tâche).
- **DELETE** – Supprimer des ressources (par ex., supprimer un élément de checklist ou un webhook).

## Naviguer dans la hiérarchie ClickUp

La structure de données de ClickUp est hiérarchique, ce qui signifie que de nombreuses entités (comme les listes ou les vues) sont imbriquées les unes dans les autres. Pour effectuer des opérations — comme récupérer des tâches à partir d'une vue spécifique — vous devez d'abord récupérer une chaîne d'identifiants étape par étape, chacun dépendant du précédent.

```
# ClickUp Hierarchy

User
└── Workspace / Team
    └── Space
        └── Folder
            └── List
                ├── Task
                │   ├── Checklist
                │   └── Comment
                └── View
    ├── Group
    ├── Webhook
    └── Goal
        └── Key Result
```


#### Exemple : Récupérer un view_id

Pour obtenir un `view_id` (nécessaire pour accéder à une vue de liste spécifique comme tableau, table ou liste), vous devez suivre les étapes suivantes :

1. Obtenir l'ID de l'équipe (Team ID)
    - Opération : **`GET /v2/team`**
    - renvoie une liste des `team_ids` disponibles pour l'utilisateur authentifié.
2. Obtenir l'ID de l'espace (Space ID)
    - Opération : **`GET /v2/team/{team_id}/space`**
    - renvoie les `space_ids` sous cette équipe.
3. Obtenir l'ID du dossier (Folder ID)
    - Opération : **`GET /space/{space_id}/folder`**
    - renvoie les folder_ids dans l'espace sélectionné.
4. Obtenir l'ID de la liste (List ID)
    - Opération : **`GET /folder/{folder_id}/list`**
    - renvoie les `list_ids` sous ce dossier. <br/>
    Si l'espace contient des listes directement (pas à l'intérieur de dossiers), vous pouvez utiliser :
    - Opération : **`GET /space/{space_id}/list`**
5. Obtenir l'ID de la vue (View ID)
    - Opération : **`GET /list/{list_id}/view`**
    - renvoie les `view_ids` associés à cette liste, comme la vue Tableau, la vue Liste, etc.

## Exemple : Créer une tâche

Pour créer une tâche à l'aide du plugin ClickUp dans ToolJet, vous aurez besoin du `list_id` où la tâche doit être créée. Suivez la hiérarchie ClickUp jusqu'à l'étape 4 pour obtenir l'ID de la liste. Une fois que vous avez obtenu l'ID de la liste, sélectionnez l'opération `POST /v2/list/{list_id}/task`.

**Paramètres requis** :
- **list_id** : L'ID de la liste où la nouvelle tâche sera ajoutée.
- **name** : Le nom/titre de la tâche à créer.

**Exemple de sortie :**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/clickup/post-query.png" alt="Clickup Querying"/>

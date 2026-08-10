---
id: marketplace-plugin-asana
title: Asana
---

Asana est une plateforme de gestion du travail qui aide les équipes à organiser, suivre et gérer leurs projets et tâches. Le plugin Asana dans ToolJet vous permet de :
- Créer, mettre à jour et gérer des tâches et sous-tâches.
- Organiser les tâches avec des projets, sections, tags et followers.
- Publier des commentaires et consulter l'activité des tâches.
- Gérer les workspaces, utilisateurs et équipes.
- Récupérer et gérer les pièces jointes des tâches.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus [Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Le plugin Asana utilise l'authentification **OAuth 2.0** pour connecter votre compte Asana de manière sécurisée.

Pour configurer la connexion, vous aurez besoin des identifiants suivants, que vous pouvez générer depuis la [Asana Developer Console](https://asana.com/developers).

- **Client ID** 
- **Client Secret**
- **Redirect URI**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/connection.png" alt="Asana plugin connection"/>

## Opérations prises en charge

- **[Task](#task)**
- **[Project](#project)**
- **[Workspace](#workspace)**
- **[Attachment](#attachment)**

## Task

Gérez les tâches dans Asana en créant, mettant à jour, récupérant, organisant et collaborant sur des tâches, y compris les sous-tâches, commentaires, followers, projets et pièces jointes.

### List Tasks
Récupère une liste de tâches depuis Asana.

#### Paramètre requis
- Project GID

#### Paramètres optionnels
- Fields (opt_fields)
- Limit
- Offset token

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-task.png" alt="Asana List task ops"/>

### Get Task
Récupère les détails d'une tâche spécifique.

#### Paramètre requis
- Task GID

#### Paramètre optionnel
- Fields (opt_fields)

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/get-task.png" alt="Asana Get task ops"/>

### Create Task
Crée une nouvelle tâche dans Asana.

#### Paramètres requis
- Workspace GID
- Task data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-task.png" alt="Asana Create task ops"/>

### Update Task
Met à jour les détails d'une tâche existante.

#### Paramètres requis
- Task GID
- Task data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/update-task.png" alt="Asana Update task ops"/>

### Delete Task
Supprime une tâche existante.

#### Paramètre requis
- Task GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/delete-task.png" alt="Asana Delete task ops"/>

### Add Comment
Ajoute un commentaire à une tâche.

#### Paramètres requis
- Task GID
- Comment text

#### Paramètres optionnels
- Pin comment

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/add-comment.png" alt="Asana Add comment ops"/>

### List Stories (comments)
Récupère les commentaires et l'activité associés à une tâche.

#### Paramètre requis
- Task GID

#### Paramètre optionnel
- Fields (opt_fields)

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-stories.png" alt="Asana List stories ops"/>

### List Subtasks
Récupère toutes les sous-tâches d'une tâche.

#### Paramètre requis
- Task GID

#### Paramètre optionnel
- Fields (opt_fields)

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-subtask.png" alt="Asana List subtask ops"/>

### Create Subtask
Crée une nouvelle sous-tâche sous une tâche existante.

#### Paramètres requis
- Parent Task GID
- Subtask data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-subtask.png" alt="Asana Create subtask ops"/>

### Add to Project
Ajoute une tâche à un projet.

#### Paramètres requis
- Task GID
- Project GID

#### Paramètre optionnel
- Section GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/add-to-project.png" alt="Asana Add to project ops"/>

### Remove from Project
Retire une tâche d'un projet.

#### Paramètres requis
- Task GID
- Project GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/remove-from-project.png" alt="Asana Remove from project ops"/>

### Add Followers
Ajoute des followers à une tâche.

#### Paramètres requis
- Task GID
- Follower GIDs

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/add-followers.png" alt="Asana Add followers ops"/>

### Remove Followers
Retire des followers d'une tâche.

#### Paramètres requis
- Task GID
- Follower GIDs

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/remove-followers.png" alt="Asana Remove followers ops"/>

### Duplicate Task

Crée un duplicata d'une tâche existante.

#### Paramètre requis
- Task GID

#### Paramètres optionnels
- New task name
- Include fields

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/duplicate-task.png" alt="Asana Duplicate task ops"/>

### List Attachments
Récupère toutes les pièces jointes associées à une tâche.

#### Paramètre requis
- Task GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-attach.png" alt="Asana List attach ops"/>

## Project
Gérez les projets Asana en les créant, mettant à jour, récupérant, supprimant, et en accédant à leurs sections.

### List Projects
Récupère une liste de projets.

#### Paramètre requis
- Workspace GID

#### Paramètres optionnels
- Fields (opt_fields)
- Limit
- Offset token

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-proj.png" alt="Asana List projects ops"/>

### Get Project
Récupère les détails d'un projet spécifique.

#### Paramètre requis
- Project GID

#### Paramètre optionnel
- Fields (opt_fields)   

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/get-proj.png" alt="Asana Get projects ops"/>

### Create Project
Crée un nouveau projet.

#### Paramètres requis
- Workspace GID
- Project data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-proj.png" alt="Asana Create projects ops"/>

### Update Project
Met à jour un projet existant.

#### Paramètres requis
- Project GID
- Project data

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/update-proj.png" alt="Asana Update projects ops"/>

### Delete Project
Supprime un projet.

#### Paramètre requis
- Project GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/delete-proj.png" alt="Asana delete projects ops"/>

### List Sections
Récupère toutes les sections d'un projet.

#### Paramètre requis
- Project GID

#### Paramètre optionnel
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-sections.png" alt="Asana List section ops"/>

## Workspace
Accédez et gérez les ressources du workspace, y compris les workspaces, utilisateurs, équipes et tags.

### List Workspaces	
Récupère tous les workspaces accessibles.

#### Paramètre optionnel
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-workspace.png" alt="Asana List workspace ops"/>

### List Users	
Récupère les utilisateurs d'un workspace.

#### Paramètre requis
- Workspace GID

#### Paramètre optionnel
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-users.png" alt="Asana List users ops"/>

### List Teams	
Récupère les équipes d'un workspace.

#### Paramètre requis
- Workspace GID

#### Paramètre optionnel
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-teams.png" alt="Asana List teams ops"/>

### List Tags	
Récupère les tags disponibles dans un workspace.

#### Paramètre requis
- Workspace GID

#### Paramètre optionnel
- Fields (opt_fields)  

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/list-tags.png" alt="Asana List tags ops"/>

### Create Tag	
Crée un nouveau tag dans un workspace.

#### Paramètre requis
- Workspace GID
- Tag name

#### Paramètre optionnel
- Tag color 

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/create-tag.png" alt="Asana Create tag ops"/>

## Attachment
Récupérez et gérez les pièces jointes associées aux tâches Asana.

### Get Attachment	
Récupère les détails d'une pièce jointe spécifique.

#### Paramètre requis
- Attachment GID

#### Paramètre optionnel
- Fields (opt_fields) 

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/get-attachment.png" alt="Asana Get attachment ops"/>

### Delete Attachment	
Supprime une pièce jointe existante.

#### Paramètre requis
- Attachment GID

<img className="screenshot-full img-full" src="/img/marketplace/plugins/asana/delete-attachment.png" alt="Asana Delete attachment ops"/>

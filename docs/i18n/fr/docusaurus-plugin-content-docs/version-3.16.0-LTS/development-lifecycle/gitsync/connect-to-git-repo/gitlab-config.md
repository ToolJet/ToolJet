---
id: gitlab-config
title: Configuration GitLab
---

<PlanBadge type="enterprise" />

La configuration GitLab pour git sync offre une manière flexible de connecter votre espace de travail ToolJet à un dépôt GitLab. Cette configuration utilise HTTPS, ce qui évite d'avoir à gérer des clés SSH et permet de contourner les blocages de port SSH. Vous pouvez également sélectionner et changer de branche de dépôt directement depuis l'interface de ToolJet.


Rôle requis : **Admin**

### 1. **Créer un nouveau projet** 
    Créez un nouveau projet dans votre compte GitLab. Vous pouvez choisir de le rendre public ou privé. Si vous utilisez un dépôt existant, assurez-vous qu'il est vide avant de continuer.


### 2. Obtenir l'ID du projet GitLab
Sur la page de présentation du projet, cliquez sur Actions dans le coin supérieur droit, puis sélectionnez Copy project ID. Cette valeur représente l'identifiant unique attribué par GitLab à votre projet. Conservez cette valeur pour un usage ultérieur.

<img className="screenshot-full img-s" src="/img/gitsync/gitlab-config/projectid.png" alt="git sync" />

### 3. Générer un jeton d'accès personnel
Suivez ces étapes pour générer un [jeton d'accès personnel](https://docs.gitlab.com/user/project/settings/project_access_tokens/#create-a-project-access-token) :
- Accédez aux paramètres de votre projet (Project Settings) et cliquez sur *Access Tokens*
- Saisissez un nom pour votre jeton.
- Sélectionnez un rôle parmi Developer, Maintainer ou Owner
- Sélectionnez les portées (scopes) requises. Les portées obligatoires sont :
        - api
        - read_api
        - read_repository
        - write_repository
- Cliquez sur le bouton Create personal access token.

Une fois généré, copiez et conservez le jeton, car il ne sera plus affiché par la suite. Ce jeton sera utilisé plus tard lors de la configuration de git sync.

### 4. Configurer GitLab dans git sync 

Accédez à la page **Workspace settings** et cliquez sur l'onglet **Configure git**. Ensuite, saisissez les valeurs de configuration requises après avoir sélectionné GitLab comme fournisseur de dépôt.

<img className="screenshot-full img-s" src="/img/gitsync/gitlab-config/config.png" alt="git sync" />


Le tableau ci-dessous décrit chaque valeur de configuration :

#### Dépôt
| **Paramètre**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **Repo URL**              | L'URL du projet que vous avez créé pour l'utiliser avec ToolJet. (par exemple `https://gitlab.com/<group-name>/<project-name>` ou `https://gitlab.com/<username>/<project-name>`)                                          |
| **Branch name**         | Nom de la branche de votre projet. Par défaut, la branche main est utilisée.                                                                                      |

#### GitLab auto-hébergé (Optionnel)
| **Paramètre**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **GitLab enterprise URL**             |    Le domaine utilisé pour accéder à votre instance GitLab auto-hébergée. (par exemple `https://gitlab.corp.com`) Si vous utilisez GitLab Cloud, vous pouvez laisser ce champ vide.                                                                                        |

#### Configuration de l'accès au projet
| **Paramètre**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **GitLab Project ID**                    | L'[ID du projet GitLab](https://docs.gitlab.com/user/project/working_with_projects/#find-the-project-id). |
| **GitLab Project access token**           | Le [jeton d'accès au projet GitLab](https://docs.gitlab.com/user/project/settings/project_access_tokens/#create-a-project-access-token).    |


    Une fois les configurations nécessaires saisies, cliquez sur **Save Changes**. Votre espace de travail sera désormais connecté à votre projet GitLab.

:::note
Vous pouvez utiliser les mêmes identifiants pour configurer un dépôt spécifique sur plusieurs instances ou espaces de travail.
:::

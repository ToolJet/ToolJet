---
id: bulk-invite-users
title: Bulk Invite
---

Les admins peuvent inviter des utilisateurs en masse dans un espace de travail à l'aide d'un fichier CSV contenant les adresses e-mail des utilisateurs, leurs **[rôles](/docs/user-management/role-based-access/user-roles)**, leurs **[groupes](/docs/user-management/role-based-access/custom-groups)** et d'autres détails. Les utilisateurs invités reçoivent un e-mail avec des instructions pour rejoindre l'espace de travail, garantissant un processus d'intégration fluide.

## Étapes pour inviter des utilisateurs en masse

Rôle requis : **Admin**

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/users`)

3. Cliquez sur le bouton **Add users**.
    <img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

4. Passez à l'onglet **Upload CSV file**.

5. Téléchargez un fichier CSV contenant les champs suivants :

    | Field | Required/Optional | Example |
    |:-----|:---------|:-------|
    | First Name | L'un des deux, prénom ou nom, est requis. | John |
    | Last Name | L'un des deux, prénom ou nom, est requis. | Doe |
    | Email address | Requis | john@corp.com |
    | User Role | Requis | Admin |
    | Group | Facultatif | Manager |
    | Metadata | Facultatif | `{"apiKey": "abc123"}` |

    Vous pouvez également télécharger le modèle pour le modifier.
6. Cliquez sur **Upload users**.
    <img className="screenshot-full" src="/img/user-management/onboard-user/bulk-invite/upload-csv.png" alt="Add user button" />

## Invitation par e-mail

Prérequis : **[Configurer un serveur SMTP](/docs/tj-setup/smtp-setup/configuration)**

Une fois qu'un utilisateur est invité dans l'espace de travail, il reçoit un e-mail contenant un lien d'invitation unique vers l'espace de travail. En cliquant sur le lien, l'utilisateur est redirigé vers la page de connexion ou d'inscription de l'espace de travail pour terminer le processus d'intégration.

<img className="screenshot-full img-l" src="/img/user-management/onboard-user/invite-user/email.png" alt="Workspace Level Permissions" />

## URL d'invitation

Sur ToolJet auto-hébergé, les utilisateurs admin peuvent copier l'URL d'invitation unique et la partager avec l'utilisateur.

<img className="screenshot-full img-l" src="/img/user-management/onboard-user/invite-user/copy-link.png" alt="Workspace Level Permissions" />

## Statut de l'utilisateur

Les utilisateurs admin peuvent suivre le statut des utilisateurs comme suit :

### ToolJet auto-hébergé

- **Invited** : L'utilisateur a été invité à rejoindre l'espace de travail.
- **Active** : L'utilisateur est membre de l'espace de travail actuel.
- **Archived** : L'utilisateur a été archivé par l'admin.

### ToolJet Cloud

- **Requested** : L'utilisateur a été invité dans l'espace de travail actuel mais ne possède pas de compte ToolJet.
- **Invited** : L'utilisateur a été invité dans l'espace de travail actuel et possède un compte ToolJet.
- **Active** : L'utilisateur est membre de l'espace de travail actuel.
- **Archived** : L'utilisateur a été archivé par l'admin.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/user-status.png" alt="Workspace Level Permissions" />


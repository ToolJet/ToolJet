---
id: invite-user
title: Invite
---

Les admins peuvent inviter des utilisateurs dans un espace de travail en utilisant leurs adresses e-mail et leur attribuer des **[rôles](/docs/user-management/role-based-access/user-roles)** et **[groupes](/docs/user-management/role-based-access/custom-groups)** spécifiques pour gérer les permissions. Les utilisateurs invités reçoivent un e-mail avec des instructions pour rejoindre l'espace de travail, garantissant un processus d'intégration fluide.

## Étapes pour inviter un utilisateur

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/users`)

3. Cliquez sur le bouton **Add users**.
    <img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/add-user.png" alt="Add user button" />

4. Remplissez les détails suivants :
    | Field | Required/Optional | Example |
    |:-----|:---------|:-------|
    | Name | Requis | John Doe |
    | Email address | Requis | john@corp.com |
    | Select groups | Requis | USER ROLE: **Admin** |
    | | Facultatif | CUSTOM GROUPS: **Manager** |
    | [User metadata](/docs/user-management/onboard-users/user-metadata) | Facultatif | `{"apiKey": "abc123"}` |

    <img className="screenshot-full img-m" src="/img/user-management/onboard-user/invite-user/user-details.png" alt="Invite User" />

5. Cliquez sur le bouton **Invite users** pour envoyer l'invitation.
    

## Invitation par e-mail

Prérequis : **[Configurer un serveur SMTP](/docs/tj-setup/smtp-setup/configuration)**

Une fois qu'un utilisateur est invité dans l'espace de travail, il reçoit un e-mail contenant un lien d'invitation unique vers l'espace de travail. En cliquant sur le lien, l'utilisateur est redirigé vers la page de connexion ou d'inscription de l'espace de travail pour terminer le processus d'intégration.

<img className="screenshot-full img-l" src="/img/user-management/onboard-user/invite-user/email.png" alt="Workspace Level Permissions" />

## URL d'invitation

Sur ToolJet auto-hébergé, les admins peuvent copier l'URL d'invitation unique et la partager avec l'utilisateur.

<img className="screenshot-full" src="/img/user-management/onboard-user/invite-user/copy-link.png" alt="Workspace Level Permissions" />

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


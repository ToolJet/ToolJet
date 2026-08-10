---
id: self-signup-user
title: Sign-Up
---

Dans ToolJet, la fonctionnalité d'inscription permet aux admins d'activer l'enregistrement direct des utilisateurs via une URL d'inscription, éliminant ainsi le besoin d'invitations. Pour la version auto-hébergée, l'activation de l'inscription peut se faire à la fois au niveau instance et au niveau espace de travail.

## Activer l'inscription au niveau instance

Rôle requis : **Super Admin** <br/>

Le super admin peut activer l'inscription au niveau instance, et chaque fois qu'un utilisateur rejoint une instance via l'inscription libre, un nouvel espace de travail personnel est créé pour cet utilisateur et le rôle d'admin de l'espace de travail lui est attribué.

Suivez ces étapes pour activer l'inscription au niveau instance :

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Settings > Manage instance settings**. <br/> 
    (URL d'exemple - `https://app.corp.com/instance-settings/manage-instance-settings`)

3. Assurez-vous d'avoir autorisé l'espace de travail personnel.
    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/personal-ws.png" alt="Workspace Level Permissions" />

4. Allez maintenant dans l'onglet **Instance login**. <br/> 
    (URL d'exemple - `https://app.corp.com/instance-settings/instance-login`)

5. Saisissez les domaines autorisés à accéder à l'espace de travail ; vous pouvez saisir plusieurs noms de domaine séparés par une virgule. <br/>
Si vous ne saisissez aucun domaine autorisé, alors toute personne disposant de l'URL de connexion pourra s'inscrire à l'espace de travail.
    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/sh-allowed-domain.png" alt="Workspace Level Permissions" />

6. Cliquez sur le bouton bascule pour activer l'inscription ; par défaut, l'inscription est désactivée.
    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/sh-enable-signup.png" alt="Workspace Level Permissions" />

7. Cliquez sur le bouton **Save changes** en bas de la page.

    Désormais, les utilisateurs peuvent s'inscrire sur l'URL de déploiement ToolJet. <br/>
    (URL d'exemple : `https://app.corp.com/signup`)

    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/instance-signup.png" alt="Workspace Level Permissions" />

## Activer l'inscription au niveau espace de travail

Rôle requis : **Admin** <br/>

L'admin peut activer l'inscription au niveau espace de travail, et chaque fois qu'un utilisateur rejoint un espace de travail via l'inscription libre, le rôle d'utilisateur final lui est attribué.

Suivez ces étapes pour activer l'inscription au niveau espace de travail :

1. Allez dans **Workspace settings > Workspace login**. <br/>
    (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

2. Saisissez les domaines autorisés à accéder à l'espace de travail ; vous pouvez saisir plusieurs noms de domaine séparés par une virgule. <br/>
Si vous ne saisissez aucun domaine autorisé, alors toute personne disposant de l'URL de connexion pourra s'inscrire à l'espace de travail.
    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/allowed-domain.png" alt="Workspace Level Permissions" />

3. Cliquez sur le bouton bascule pour activer l'inscription ; par défaut, l'inscription est désactivée.
    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/login-url.png" alt="Workspace Level Permissions" />

4. Cliquez sur le bouton **Save changes** en bas de la page.

5. Copiez l'URL de connexion et partagez-la avec les utilisateurs.

    Les utilisateurs pourront désormais voir une option d'inscription sur la page de connexion. <br/>
    (URL d'exemple : `https://app.corp.com/login/nexus`)

    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/login-page.png" alt="Workspace Level Permissions" />

    Les utilisateurs peuvent naviguer vers la page d'inscription à partir de là et s'enregistrer eux-mêmes.

    <img className="screenshot-full" src="/img/user-management/onboard-user/self-signup/signup-page.png" alt="Workspace Level Permissions" />


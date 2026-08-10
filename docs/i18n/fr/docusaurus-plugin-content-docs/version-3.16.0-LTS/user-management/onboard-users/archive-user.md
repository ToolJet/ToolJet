---
id: archive-user
title: Archive and Unarchive
---

Les admins peuvent archiver des utilisateurs dans un espace de travail, ce qui supprimera l'accès de l'utilisateur à l'espace de travail tout en préservant toutes les applications et les modifications effectuées par l'utilisateur. L'utilisateur peut être réinvité dans l'espace de travail en le désarchivant si nécessaire.

:::info
1. Les utilisateurs archivés ne seront pas comptabilisés pour la facturation/l'octroi de licences.
2. Il doit y avoir au moins un admin actif ; tous les admins d'un espace de travail ne peuvent pas être archivés.
:::

## Étapes pour archiver un utilisateur

### Niveau instance

Lorsqu'un utilisateur est archivé au niveau instance, il sera automatiquement archivé de tous les espaces de travail et ne pourra être invité à aucun nouvel espace de travail. Suivez ces étapes pour archiver un utilisateur au niveau instance :

Rôle requis : **Super Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Settings > All Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/instance-settings/all-users`)

3. Repérez l'utilisateur à archiver et cliquez sur le menu à trois points (kebab) situé à la fin de sa ligne.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-archive-user-menu.png" alt="Workspace Level Permissions" />

4. Sélectionnez **Archive user**.

5. Le statut de l'utilisateur sera mis à jour en archivé.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-archived-user.png" alt="Workspace Level Permissions" />

### Niveau espace de travail

L'archivage d'un utilisateur au niveau espace de travail ne supprimera que son accès à cet espace de travail spécifique. L'utilisateur conservera l'accès à tous les autres espaces de travail auxquels il a été invité. Suivez ces étapes pour archiver un utilisateur au niveau espace de travail :

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/users`)

3. Repérez l'utilisateur à archiver et cliquez sur le menu à trois points (kebab) situé à la fin de sa ligne.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/archive-user-menu.png" alt="Workspace Level Permissions" />

4. Sélectionnez **Archive user**.

5. Le statut de l'utilisateur sera mis à jour en archivé.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/archived-user.png" alt="Workspace Level Permissions" />

## Étapes pour désarchiver un utilisateur

### Niveau instance

Lorsqu'un utilisateur est désarchivé au niveau instance, les admins devront ensuite le désarchiver ou l'inviter à nouveau dans chaque espace de travail individuel.

Rôle requis : **Super Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Settings > All Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/instance-settings/all-users`)

3. Repérez l'utilisateur à désarchiver et cliquez sur le menu à trois points (kebab) situé à la fin de sa ligne.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-unarchive-user-menu.png" alt="Workspace Level Permissions" />

4. Sélectionnez **Unarchive user**.

5. Le statut de l'utilisateur sera mis à jour en invité.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/sh-unarchived-user.png" alt="Workspace Level Permissions" />

### Niveau espace de travail

Si un utilisateur est désarchivé au niveau espace de travail, il est automatiquement désarchivé au niveau instance également.

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/users`)

3. Repérez l'utilisateur à désarchiver et cliquez sur le menu à trois points (kebab) situé à la fin de sa ligne.
    <img className="screenshot-full" src="/img/user-management/onboard-user/archive-user/unarchive-user-menu.png" alt="Workspace Level Permissions" />

3. Sélectionnez **Unarchive user**.

4. Le statut de l'utilisateur sera mis à jour en invité et l'utilisateur recevra un nouvel e-mail d'invitation pour rejoindre l'espace de travail.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/onboard-user/archive-user/unarchived-user.png" alt="Workspace Level Permissions" />

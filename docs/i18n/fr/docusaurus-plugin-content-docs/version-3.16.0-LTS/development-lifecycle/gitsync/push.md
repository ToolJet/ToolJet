---
id: push
title: Envoyer des modifications vers le dépôt Git
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Une fois la fonctionnalité GitSync configurée, vous pouvez commencer à envoyer (push) des modifications vers le dépôt git aux moments suivants :

- [Création d'application](#app-creation)
- [Commit manuel via le bouton GitSync](#manual-commit-using-gitsync-button)
- [Commit automatique lors du renommage d'une application](#auto-commit-on-app-rename)
- [Mise à jour de version d'application](#app-version-update)
- [Commit automatique lors de la promotion d'environnement](#auto-commit-on-promoting-environment)
- [Suppression d'application](#app-deletion)

## Création d'application {#app-creation}

Chaque fois que vous créez une nouvelle application, vous verrez une option pour sélectionner **Commit changes**. Si vous sélectionnez l'option **commit changes**, les modifications seront envoyées (commit) vers le dépôt git.

**Remarque** : si le nom de l'application est identique au nom d'une application existante dans le dépôt git, celle-ci sera écrasée dans le dépôt git.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/commitchanges.png" alt="GitLab SSH Key" />

Sélectionner l'option **Commit changes** créera un nouveau commit dans le dépôt git. Le message de commit sera `App creation` et l'auteur sera l'utilisateur ayant créé l'application.

Lors de la création d'une application, un dossier **.meta** est généré, contenant un fichier **meta.json** avec les détails du dernier commit. Ensuite, un dossier d'application est également créé, stockant **v1.json**, qui contient les détails spécifiques de la version v1 de l'application.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/firstcommit.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/author.png" alt="GitSync" />

    </TabItem>

</Tabs>

## Commit manuel via le bouton GitSync {#manual-commit-using-gitsync-button}

Chaque fois qu'un utilisateur effectue une modification dans une application, il peut envoyer un commit vers le dépôt git en suivant ces étapes :

1. Après avoir effectué les modifications, cliquez sur le bouton **GitSync** dans la barre supérieure. 
    <img className="screenshot-full" src="/img/development-lifecycle/backup/gitsync/gitsync-button.png" alt="GitSync Button" />

2. En cliquant sur le bouton **GitSync**, une fenêtre modale s'ouvre avec l'option de saisir le message de commit. 
    <img className="screenshot-full" src="/img/development-lifecycle/backup/gitsync/commit-message.png" alt="GitSync Commit Message" />

3. Saisissez le message de commit et cliquez sur le bouton **Commit changes** pour envoyer les modifications vers le dépôt git. 

En plus du message de commit, l'utilisateur peut également voir l'**URL du dépôt Git** connecté ainsi que les détails du dernier commit. Les **détails du dernier commit** (Last commit details) permettent à l'utilisateur de connaître le message, l'auteur, la date et l'heure du dernier commit. Cela aide l'utilisateur à connaître les détails du dernier commit et à rédiger son message de commit en conséquence.

Une fois les modifications envoyées (commit), l'utilisateur peut voir le message de commit, l'auteur et la date dans le dépôt git.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/development-lifecycle/backup/gitsync/github-commit.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/lastcommitmsg.png" alt="GitSync" />

    </TabItem>

</Tabs>

## Commit automatique lors du renommage d'une application {#auto-commit-on-app-rename}

Chaque fois qu'une application est renommée, les modifications seront automatiquement envoyées (commit) vers le dépôt git. Le message de commit sera `App is renamed` et l'auteur sera l'utilisateur ayant renommé l'application. De même, un commit automatique est généré chaque fois qu'une version est renommée.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/rename.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/apprename.png" alt="GitSync" />

    </TabItem>

</Tabs>

## Mise à jour de version d'application {#app-version-update}

Chaque fois qu'un utilisateur crée une nouvelle version d'une application, une option permettant de sélectionner **Commit changes** sera disponible. Si l'utilisateur sélectionne l'option **commit changes**, la nouvelle version de l'application sera envoyée (commit) vers le dépôt git et l'ancienne version sera remplacée.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/gitlab/newversion.png" alt="GitLab SSH Key" />

Le fichier **JSON** dans le dossier de l'application sera remplacé par la nouvelle version de l'application, et le fichier **meta.json** dans le dossier **.meta** sera mis à jour avec le nouvel identifiant et le nouveau nom de version. Le message de commit sera **Version creation** et l'auteur sera l'utilisateur ayant créé la nouvelle version de l'application. 

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/replace.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/newversion1.png" alt="GitSync" />

    </TabItem>

</Tabs>

## Commit automatique lors de la promotion d'environnement {#auto-commit-on-promoting-environment}

Lorsque vous promouvez un environnement, de **Development vers Staging**, les modifications seront automatiquement envoyées (commit) vers le dépôt git. Le message de commit sera `<version_number> Version of <app_name> promoted from <source_environment> to <destination_environment>`. L'auteur sera l'utilisateur ayant effectué la promotion de l'environnement. Lorsque vous promouvez un environnement, de **Staging vers Production**, aucune modification ne sera envoyée (commit) vers le dépôt git. Ce paramètre est commun à toutes les configurations de git sync.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/promoted.png" alt="GitSync" />

Cette option peut être activée ou désactivée depuis l'onglet **Configure git** sur la page **Workspace settings**. Par défaut, cette option est désactivée.

<img className="screenshot-full" src="/img/gitsync/autocommit_.png" alt="GitSync" />

## Suppression d'application {#app-deletion}

Chaque fois qu'un utilisateur supprime une application de l'espace de travail, l'application ne sera pas supprimée du dépôt git. L'application restera disponible dans le dépôt git dans le même état qu'avant sa suppression.

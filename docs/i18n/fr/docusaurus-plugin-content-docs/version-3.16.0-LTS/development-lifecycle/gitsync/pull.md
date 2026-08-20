---
id: pull
title: Récupérer des modifications depuis le dépôt Git
---

Une fois que git sync est configuré et que les modifications sont envoyées (commit) vers le dépôt git, ces modifications peuvent ensuite être récupérées (pull) depuis le dépôt git pour les cas d'usage suivants :

- [Développement séquentiel](#sequential-development) - Permet à plusieurs développeurs de travailler sur la même application, l'un après l'autre.
- [Migration d'application](#application-migration) - Pour utiliser une instance multiple comme environnement multiple.
- [Sauvegarde d'application](#application-backup) - Pour restaurer une sauvegarde d'application.

## Développement séquentiel {#sequential-development}

Git Sync peut être utilisé pour effectuer un développement séquentiel, permettant à plusieurs développeurs de travailler sur une seule application de manière séquentielle. Dans cette approche, un développeur effectue des modifications et les envoie (commit), puis le développeur suivant doit récupérer (pull) le dernier commit avant de commencer de nouvelles modifications. 

Par exemple : si le développeur A effectue un commit (Commit A), alors le développeur B doit récupérer (pull) le dernier commit avant de commencer à travailler, puis effectuer un nouveau commit. Sinon, le travail envoyé par le développeur A pourrait être perdu.


Suivez ces étapes pour [importer une application](#import-application). Assurez-vous que la case **Make application editable** est **activée** ; le nom de l'application peut également être mis à jour lors de l'importation.

:::caution
ToolJet ne suit que le dernier commit du dépôt Git. **Il est essentiel de récupérer (pull) les dernières modifications avant de commencer toute nouvelle modification** ou d'effectuer un nouveau commit.
:::

:::info
Le développement simultané à l'aide de git sync est prévu pour les prochaines versions.
:::

## Migration d'application {#application-migration}

ToolJet prend en charge l'utilisation de plusieurs instances comme plusieurs environnements — Développement, Préproduction (Staging) et Production. Les applications peuvent être migrées entre ces environnements à l'aide de git sync. Pour plus de détails, reportez-vous au guide [Instance comme environnement](/docs/development-lifecycle/environment/self-hosted/multi-instance/instance-as-environment).

Pour migrer une application vers l'environnement de préproduction ou de production, suivez les étapes pour [importer une application](#import-application). Assurez-vous que la case **Make application editable** est **désactivée** lors de l'importation, afin d'éviter des commits involontaires depuis ces environnements.

## Sauvegarde d'application {#application-backup}

Toute application ToolJet stockée dans un dépôt Git peut être restaurée en suivant les étapes pour [importer une application](#import-application). Assurez-vous que la case **Make application editable** est **activée** si vous avez l'intention d'apporter de nouvelles modifications à l'application ; le nom de l'application peut également être mis à jour lors de l'importation.

## Importer une application {#import-application}

Pour importer une application depuis un dépôt git, cliquez sur le menu kebab (trois points) à droite du bouton **Create new app** sur le tableau de bord. Cliquez sur l'option **Import from git repository**.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/restore-app.png" alt="git sync" />

En cliquant sur l'option **Import from git repository**, une fenêtre modale s'affiche avec les options de configuration suivantes :

- **Create app from** : sélectionnez l'application à importer depuis le dépôt Git.
- **App name** : mettez à jour le nom de l'application. <br/> Remarque : le nom de l'application doit être unique ; si une application du même nom existe déjà dans l'espace de travail, l'utilisateur devra changer le nom de l'une des deux applications.
- **Make application editable** : lorsque cette option est activée, l'application importée devient modifiable. Il est recommandé de laisser cette option désactivée dans les environnements de préproduction et de production lors de la migration d'application.

Une fois toute la configuration effectuée, cliquez sur le bouton **Import app** pour importer l'application depuis le dépôt git. 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/gitsync/importmodal-v3.png" alt="git sync" />

:::info
Dans la version actuelle, les constantes de l'espace de travail (workspace constants) ne sont pas synchronisées avec le dépôt Git et doivent être configurées manuellement.

La synchronisation automatique des constantes de l'espace de travail avec le dépôt Git est prévue pour les prochaines versions.
:::

## Récupérer les modifications

Vous pouvez vérifier les mises à jour et récupérer les modifications depuis le dépôt git en suivant ces étapes :

1. Cliquez sur le bouton **GitSync** ; une fenêtre modale s'ouvre avec l'option **Check for updates**. 

2. Cliquez sur le bouton **Check for updates** pour vérifier les mises à jour dans le dépôt git. S'il y a des mises à jour, vous verrez les détails de celles-ci, tels que le message de commit, l'auteur et la date, dans la fenêtre modale. 

3. Cliquez sur le bouton **Pull changes** pour récupérer les modifications depuis le dépôt git.

    <img className="screenshot-full img-s" src="/img/gitsync/updatecheck-v2.png" alt="git sync" />


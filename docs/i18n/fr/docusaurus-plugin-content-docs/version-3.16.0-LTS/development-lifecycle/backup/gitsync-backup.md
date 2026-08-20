---
id: gitsync-backup
title: GitSync Backup
---

GitSync permet aux utilisateurs de sauvegarder leurs applications en poussant les modifications vers un dépôt Git, garantissant ainsi un historique sécurisé. Chaque fois qu'une modification est poussée vers le dépôt git, un commit est créé. Ces modifications peuvent ensuite être facilement restaurées dans ToolJet, assurant un processus de sauvegarde et de restauration fluide. Pour plus de détails sur la configuration de GitSync, consultez le guide **[Configuration de GitSync](/docs/development-lifecycle/gitsync/overview)**.

**Remarque** : Seule la dernière version poussée de l'application est stockée dans le dépôt git, c'est-à-dire que chaque fois qu'une nouvelle version est poussée vers le dépôt git, seule la dernière version est conservée et toutes les versions précédentes sont remplacées.

Pour savoir comment pousser des modifications vers un dépôt git avec GitSync, consultez le guide **[Pousser des modifications vers le dépôt Git](/docs/development-lifecycle/gitsync/push)**.

## Restaurer une application

Les modifications peuvent être récupérées depuis le dépôt git pour restaurer une application. Pour savoir comment récupérer des modifications depuis un dépôt git avec GitSync, consultez le guide **[Récupérer des modifications depuis le dépôt Git](/docs/development-lifecycle/gitsync/pull)**.

**Remarque :** Une application restaurée depuis le dépôt git ne peut pas être modifiée. Pour modifier l'application, vous devrez créer un clone de celle-ci.

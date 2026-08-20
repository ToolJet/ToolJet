---
id: overview
title: Présentation de GitSync
sidebar_label: Présentation
---

<PlanBadge type="team" />

La fonctionnalité GitSync de ToolJet permet une synchronisation transparente des applications de l'espace de travail avec un dépôt Git, ce qui peut être utilisé pour la migration d'environnement et la gestion des sauvegardes. Elle prend en charge à la fois les fournisseurs Git basés sur le cloud et auto-hébergés, offrant une flexibilité dans la gestion du développement et du déploiement des applications. GitSync peut également être configuré pour une branche personnalisée. Reportez-vous au guide **[Configurer GitSync](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/gitsync-config)** pour plus d'informations.

## Cas d'usage clés

### Migration d'application

GitSync peut être utilisé pour faciliter le déplacement d'applications entre différentes instances ToolJet, par exemple du développement vers la préproduction (staging) puis vers la production. Les utilisateurs peuvent transférer facilement leurs applications entre instances en envoyant (push) les modifications vers un dépôt Git. Cela signifie qu'une fois qu'une application est développée sur une instance, elle peut être facilement déplacée vers une autre en la synchronisant simplement avec le dépôt, garantissant une transition fluide sans nécessiter de configurations manuelles. Reportez-vous au guide **[multi-instance](/docs/development-lifecycle/environment/self-hosted/multi-instance/instance-as-environment)** pour des étapes détaillées.

### Sauvegarde des applications

GitSync offre une solution simple pour créer des sauvegardes de vos applications. En envoyant (push) les modifications vers un dépôt Git, les utilisateurs peuvent garantir un historique sécurisé et versionné de leur application. Cela constitue un mécanisme de sauvegarde fiable, protégeant contre la suppression ou la corruption accidentelle d'une application ou d'une version. Reportez-vous au guide **[Sauvegarde GitSync](/docs/development-lifecycle/backup/gitsync-backup)** pour plus d'informations.

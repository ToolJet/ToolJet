---
id: release-rollback
title: Publication et restauration
---

ToolJet vous permet de **[publier et partager](#release)** votre application et de **[revenir en arrière](#rollback)** vers une version stable chaque fois que nécessaire.

## Publication {#release}

Publier une application dans ToolJet rend la version sélectionnée disponible pour les utilisateurs finaux, leur permettant d'accéder à l'application et de l'utiliser pour leurs tâches. Cela garantit un déploiement contrôlé des fonctionnalités et des corrections de bugs, tout en assurant que les utilisateurs ont accès à la dernière version de l'application. Une fois qu'une application est publiée, elle peut être accédée de plusieurs manières ; consultez le guide **[Partager une application](/docs/development-lifecycle/release/share-app)** pour plus d'informations.

### Étapes pour publier une application

1. Enregistrez la version brouillon souhaitée.

2. Promouvez la version souhaitée vers l'**[environnement de production](/docs/development-lifecycle/environment/self-hosted/multi-environment)**.

3. Cliquez sur le bouton **Release** situé à côté du nom de la version dans l'environnement **Production**.
    <img className="screenshot-full border-none" src="/img/development-lifecycle/release/release/draft-version/release.png" alt="release"/>

4. Une boîte de dialogue de confirmation s'affichera, vous demandant si vous souhaitez publier la version actuelle de l'application. Cliquer sur le bouton **Yes** publiera la version actuelle de l'application en remplaçant la précédente.
    <img className="screenshot-full border-none" src="/img/development-lifecycle/release/release/draft-version/confirm.png" alt="release"/>

## Restauration {#rollback}

La fonctionnalité de restauration dans ToolJet vous permet de revenir à une version précédemment stable de votre application chaque fois que nécessaire. Qu'il s'agisse de corriger des bugs, de résoudre des erreurs ou de traiter des problèmes inattendus après une publication, la restauration garantit une perturbation minimale pour les utilisateurs finaux. Elle restaure instantanément une version antérieure tout en conservant la même URL de l'application, permettant à l'équipe de maintenir la stabilité de l'application tout en déboguant hors ligne la version défectueuse.

Par exemple, après la publication d'une nouvelle version v1.2.0, des utilisateurs signalent des défaillances du composant de formulaire. Grâce à la restauration de version de ToolJet, l'équipe peut rapidement revenir à la version stable v1.1.0, rétablissant la fonctionnalité en quelques minutes. Cela minimise les temps d'arrêt et permet aux développeurs de déboguer la version défectueuse hors ligne.

### Étapes pour effectuer une restauration

1. Accédez au **Gestionnaire de versions** depuis la barre d'outils et sélectionnez l'environnement **Production**. Toutes les versions de production de l'application seront affichées. La version actuellement publiée aura une étiquette **Released** de couleur verte à côté d'elle.
    <img className="screenshot-full" src="/img/development-lifecycle/release/version-control/draft-version/version-menu-2.png" alt="app version"/>

2. Cliquez sur la version souhaitée dans la liste pour la sélectionner.

3. Cliquez sur le bouton Release situé à côté de la version sélectionnée.
    <img className="screenshot-full img-m" src="/img/development-lifecycle/release/release/draft-version/rollback.png" alt="app version"/>

4. Une boîte de dialogue de confirmation s'affichera, vous demandant si vous souhaitez publier la version actuelle de l'application. Cliquer sur le bouton **Release** publiera la version actuelle de l'application.
    <img className="screenshot-full border-none" src="/img/development-lifecycle/release/release/draft-version/confirm-v2.png" alt="Confirmation"/>

## Autorisation de publication d'application

L'administrateur peut configurer l'autorisation de publication d'application depuis la page [Permissions](/docs/user-management/role-based-access/user-roles#permissions-for-user-roles). Cela désactive le bouton **Release** pour les utilisateurs qui n'ont pas l'autorisation requise, permettant uniquement aux rôles autorisés, tels que les managers, de publier l'application.
<img className="screenshot-full img-m" src="/img/development-lifecycle/release/release/draft-version/disable-release.png" alt="Disable Release"/>


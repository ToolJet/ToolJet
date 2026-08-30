---
id: version-control
title: Contrôle de version
---

<PlanBadge type="pro" />

Le contrôle de version dans ToolJet vous aide à maintenir plusieurs versions de l'application, à effectuer un développement itératif et à déployer les mises à jour de manière systématique. Il garantit la stabilité et permet un déploiement fluide des nouvelles fonctionnalités ou corrections.

Par exemple, pour expérimenter une nouvelle fonctionnalité, vous pouvez créer une nouvelle version brouillon de l'application et l'essayer, sans perturber l'application publiée. Et après des tests approfondis, vous pouvez publier cette version. Cela minimise les temps d'arrêt et permet aux développeurs d'expérimenter et de déboguer la nouvelle fonctionnalité sans perturber les utilisateurs.

Chaque version est isolée des autres et peut avoir des environnements différents, tels que développement, préproduction ou production. Consultez le guide **[Multi-environnements](/docs/development-lifecycle/environment/self-hosted/multi-environment)** pour plus d'informations. Les versions peuvent également être utilisées pour revenir à une version enregistrée si nécessaire, consultez le guide **[Publication et restauration](/docs/development-lifecycle/release/release-rollback)** pour plus d'informations.

## Fonctionnement des versions brouillon et enregistrées

Une version brouillon représente la copie de travail de votre application. Chaque fois que vous commencez à effectuer des modifications, ToolJet garantit que les modifications ont lieu dans un brouillon. Les brouillons vous permettent d'expérimenter en toute sécurité sans affecter la version active dans un environnement.

Les versions enregistrées sont des points de contrôle finalisés créés à partir des brouillons. Les versions enregistrées sont figées, ne peuvent pas être modifiées, et peuvent être promues vers la préproduction ou la production, publiées auprès des utilisateurs, ou utilisées pour une restauration.

Un brouillon peut être enregistré en tant que version lorsque vous êtes prêt à promouvoir ou publier vos modifications. Seules les versions enregistrées peuvent être promues vers la préproduction ou la production, tandis que les versions brouillon restent modifiables. Cela permet de maintenir une séparation claire entre le travail en cours et les versions prêtes pour le déploiement ou les tests.

### Schéma de couleurs
Le schéma de couleurs suivant représente le statut des applications ToolJet à travers les différentes étapes du cycle de vie de développement.

<center>

<div style={{ display: 'flex' }} >

<div style = {{ width:'30%' }} >

<figure>
  <img className="screenshot-full img-full" src="/img/workflows/versions/draft.png" alt="Draft Version"> </img>
  <figcaption>Version brouillon</figcaption>
</figure>

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'30%' }} >

<figure>
  <img className="screenshot-full img-full" src="/img/workflows/versions/saved.png" alt="Saved Version"> </img>
  <figcaption>Version enregistrée</figcaption>
</figure>

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'30%' }} >

<figure>
  <img className="screenshot-full img-full" src="/img/workflows/versions/released.png" alt="Released Version"> </img>
  <figcaption>Version publiée</figcaption>
</figure>

</div>

</div>

</center>

## Créer une version brouillon

Vous pouvez créer de nouvelles versions depuis le **Gestionnaire de versions** en haut. Il affiche la version actuelle de l'application et peut être utilisé pour basculer entre différentes versions de l'application. Pour créer une nouvelle version :

1. Accédez au **Gestionnaire de versions** depuis la barre d'outils et cliquez sur le menu déroulant. Toutes les versions disponibles de l'application seront affichées. La version publiée aura une étiquette de couleur verte indiquant **Released** à côté d'elle. Les versions brouillon auront une étiquette indiquant **Draft** à côté d'elles.
    <img className="screenshot-full" src="/img/development-lifecycle/release/version-control/draft-version/version-menu.png" alt="app version"/>

2. Cliquez sur le bouton **Create draft version** en bas du menu, une fenêtre modale s'affichera.

3. Saisissez un **Version Name**.

4. Sélectionnez le menu déroulant **Create from version**, qui inclura toutes les versions enregistrées de l'application ; choisissez une version dans le menu déroulant que vous souhaitez utiliser pour votre nouvelle version, ou ToolJet sélectionnera automatiquement la dernière version publiée. Une nouvelle version brouillon ne peut être créée qu'à partir d'une version enregistrée.

5. Cliquez sur le bouton **Create version** pour ajouter une nouvelle version.
    <img className="screenshot-full img-s" src="/img/development-lifecycle/release/version-control/draft-version/newpopup.png" alt="modal"/>

## Renommer une version

Pour changer le nom d'une version d'application, accédez au **gestionnaire de versions** et repérez la version que vous souhaitez renommer. À partir de là, vous pouvez cliquer sur l'icône `⋮` située à côté du nom de la version. Ensuite, cliquez sur **Edit details**. Une fenêtre modale s'affichera. Vous pouvez modifier le **Version name** et la **Version description** dans la fenêtre modale. Les versions publiées ne peuvent pas être modifiées.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/draft-version/edit.png" alt="version dropdown" />

## Supprimer une version

Pour supprimer une version d'application, accédez au gestionnaire de versions et sélectionnez la version que vous souhaitez supprimer. À partir de là, vous pouvez cliquer sur l'icône `⋮` située à côté du nom de la version. Ensuite, cliquez sur **Delete version** pour supprimer la version. Une version publiée ne peut pas être supprimée.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/draft-version/delete.png" alt="version dropdown" />


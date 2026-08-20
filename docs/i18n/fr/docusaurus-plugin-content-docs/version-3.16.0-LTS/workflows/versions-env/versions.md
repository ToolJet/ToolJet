---
id: version-control
title: Contrôle de version
---

Le contrôle de version pour les workflows vous aide à maintenir plusieurs versions d'un workflow, à itérer sur les modifications en toute sécurité, et à déployer les mises à jour de manière systématique. Il assure la stabilité en gardant votre workflow publié en cours d'exécution tandis que vous développez et testez de nouvelles modifications dans un brouillon séparé.

Par exemple, vous pouvez créer une nouvelle version brouillon d'un workflow pour modifier un nœud ou mettre à jour sa logique, sans perturber le workflow actuellement publié. Après les tests, vous pouvez promouvoir et publier la nouvelle version. Cela minimise les temps d'arrêt et permet aux développeurs d'expérimenter sans affecter les exécutions en production.

Chaque version est isolée et peut être promue à travers des environnements tels que le développement, la préproduction et la production. Consultez le guide **[Environnements de workflow](/docs/workflows/versions-env/environments)** pour plus d'informations.

## Comment fonctionnent les versions brouillon et enregistrées

Une version brouillon représente la copie de travail de votre workflow. Lorsque vous créez une nouvelle version ou commencez à modifier, ToolJet garantit que les modifications se produisent à l'intérieur d'un brouillon. Les brouillons vous permettent de modifier en toute sécurité les nœuds et la logique du workflow sans affecter la version active.

Les versions enregistrées sont des points de contrôle finalisés créés à partir de brouillons. Les versions enregistrées sont fixes, ne peuvent pas être modifiées, et peuvent être promues vers la préproduction ou la production, publiées pour exécution, ou utilisées pour un rollback.

Un brouillon peut être enregistré en tant que version lorsque vous êtes prêt à promouvoir ou publier vos modifications. Seules les versions enregistrées peuvent être promues vers la préproduction ou la production, tandis que les versions brouillon restent modifiables. Cela permet de séparer clairement le travail en cours des versions prêtes pour le déploiement.

### Statut de version

Le schéma de couleurs suivant représente le statut des versions de workflow à travers les différentes étapes du cycle de développement.

<center>

<div style={{ display: 'flex' }} >

<div style = {{ width:'30%' }} >

<figure>
  <img className="screenshot-full img-full" src="/img/workflows/versions/draft.png" alt="Version brouillon"> </img>
  <figcaption>Version brouillon</figcaption>
</figure>

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'30%' }} >

<figure>
  <img className="screenshot-full img-full" src="/img/workflows/versions/saved.png" alt="Version enregistrée"> </img>
  <figcaption>Version enregistrée</figcaption>
</figure>

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'30%' }} >

<figure>
  <img className="screenshot-full img-full" src="/img/workflows/versions/released.png" alt="Version publiée"> </img>
  <figcaption>Version publiée</figcaption>
</figure>

</div>

</div>

</center>

## Créer une version brouillon

Vous pouvez créer de nouvelles versions depuis le **Version Manager** dans la barre d'outils de l'éditeur de workflow. Il affiche la version actuelle et peut être utilisé pour basculer entre les différentes versions du workflow. Pour créer une nouvelle version :

1. Accédez au **Version Manager** depuis la barre d'outils et cliquez sur le menu déroulant. Il affichera toutes les versions disponibles du workflow. La version publiée aura une étiquette verte indiquant **Released** à côté d'elle. Les versions brouillon auront une étiquette indiquant **Draft** à côté d'elles.
2. Cliquez sur le bouton **Create draft version** en bas du menu, et une fenêtre modale apparaîtra.
3. Saisissez un **Version Name**.
4. Sélectionnez le menu déroulant **Create from version**, qui inclura toutes les versions enregistrées du workflow ; choisissez une version dans le menu déroulant que vous souhaitez utiliser comme base pour votre nouvelle version, ou ToolJet sélectionnera automatiquement la dernière version publiée.
5. Cliquez sur **Create version** pour ajouter une nouvelle version.
<img className="screenshot-full img-s" src="/img/development-lifecycle/release/version-control/draft-version/newpopup.png" alt="fenêtre modale"/>

## Renommer une version

Pour changer le nom d'une version de workflow, accédez au **Version Manager** et localisez la version que vous souhaitez renommer. Cliquez sur l'icône `⋮` à côté du nom de la version et sélectionnez **Edit details**. Une fenêtre modale apparaîtra où vous pourrez mettre à jour le **Version Name** et la **Version Description**. Les versions publiées ne peuvent pas être modifiées.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/draft-version/edit.png" alt="menu déroulant des versions" />

## Supprimer une version

Pour supprimer une version de workflow, accédez au **Version Manager** et sélectionnez la version que vous souhaitez supprimer. Cliquez sur l'icône `⋮` à côté du nom de la version et sélectionnez **Delete version** pour la supprimer. Les versions publiées ne peuvent pas être supprimées.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/draft-version/delete.png" alt="menu déroulant des versions" />

## Publier une version de workflow

Une version de workflow ne peut être publiée que lorsqu'elle a été promue vers l'environnement de production. Publier une version en fait la version active qui s'exécute lorsque le workflow est déclenché via des webhooks, des planifications, ou d'autres méthodes d'exécution.

Pour publier une version :

1. Assurez-vous que la version a été promue à travers tous les environnements jusqu'à la production. Consultez le guide **[Environnements de workflow](/docs/workflows/versions-env/environments)** pour les étapes de promotion.
2. Une fois la version dans l'environnement de production, cliquez sur le bouton **Release**.
3. La version publiée devient le workflow actif qui répond à tous les déclencheurs.

:::info
Une seule version d'un workflow peut être publiée à la fois. Publier une nouvelle version remplace automatiquement la version précédemment publiée.
:::

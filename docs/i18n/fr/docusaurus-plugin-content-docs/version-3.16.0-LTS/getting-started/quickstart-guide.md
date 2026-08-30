---
id: quickstart-guide
title: Guide de démarrage rapide
---

Ce guide de démarrage rapide vous accompagne dans la création d'une application d'annuaire des employés avec ToolJet. L'application permet aux utilisateurs de suivre et de mettre à jour les informations des employés tout en utilisant les fonctionnalités principales de la plateforme, au sein d'une interface conviviale. Voici les instructions étape par étape :

1. **[Créer votre première application](#1-create-your-first-application)** <br/>
2. **[Créer une table de base de données](#2-create-a-database-table)** <br/>
3. **[Créer une requête pour récupérer des données](#3-create-a-query-to-fetch-data)** <br/>
4. **[Lier les données récupérées à l'interface](#4-bind-queried-data-to-the-ui)** <br/>
5. **[Créer une requête pour ajouter des données](#5-create-a-query-to-add-data)** <br/>
6. **[Utiliser des événements pour déclencher des requêtes](#6-use-events-to-trigger-queries)** <br/>
7. **[Aperçu, publication et partage](#7-preview-release-and-share)** <br/>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 1. Créer votre première application {#1-create-your-first-application}

Pour commencer, créez un compte **[ToolJet](https://www.tooljet.com/signup)** gratuit et suivez les étapes ci-dessous.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/3opM-aL_ct4?si=ubFBF7SpneufFb0s&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Cliquez sur le bouton **Create new app** du tableau de bord. Nommez votre application "Employee Directory".
- Faites glisser un composant **[Table](/docs/widgets/table/)** sur le canevas. Vous pouvez également concevoir un en-tête en ajoutant d'autres composants.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 2. Créer une table de base de données {#2-create-a-database-table}

Créez maintenant une nouvelle table dans la **[base de données ToolJet](/docs/tooljet-db/tooljet-database/)** pour stocker les informations des employés.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/a7qWJajVQ2o?si=KtppkSMB7JK4ANd1&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Nommez la table _employees_, puis ajoutez les colonnes suivantes : first_name, last_name, email, phone, department, position, joining et status.
- Ajoutez quelques enregistrements d'employés dans la table de base de données comme données de test.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 3. Créer une requête pour récupérer des données {#3-create-a-query-to-fetch-data}

Pour afficher les employés dans l'application, vous devez d'abord récupérer les données depuis la base de données à l'aide d'une requête.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/IGuka14FHbs?si=3CNbMwP4w-D9t9kW&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Cliquez sur le bouton **Add** dans le **[panneau des requêtes](/docs/app-builder/connecting-with-data-sources/creating-managing-queries)** pour créer une nouvelle requête.
- Sélectionnez **ToolJet Database** comme source de données pour la requête.
- Renommez la requête en _getEmployees_.
- Choisissez _employees_ comme nom de table, et _List rows_ comme opération.
- Cliquez sur le bouton **Run** pour récupérer les données.
- Pour exécuter automatiquement la requête au démarrage de l'application, activez le bascule _Run this query on application load_ dans les paramètres de la requête.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 4. Lier les données récupérées à l'interface {#4-bind-queried-data-to-the-ui}

Vous devez maintenant lier les données renvoyées par la requête _getEmployees_ au composant Table créé à la première étape.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/fmLeeheFHsM?si=YzO-V_NHTyKHYkC5&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Cliquez sur le composant Table pour ouvrir son panneau de propriétés.
- Sous la propriété Data, saisissez le code ci-dessous :

```js
{
  {
    queries.getEmployees.data;
  }
}
```

Le composant Table est maintenant rempli avec les données renvoyées par la requête _getEmployees_.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 5. Créer une requête pour ajouter des données {#5-create-a-query-to-add-data}

Dans le coin inférieur droit du composant Table, se trouve un bouton **+(Add new row)** qui ouvre un formulaire généré automatiquement pour ajouter de nouvelles données à la table. Suivez les étapes ci-dessous pour créer une requête _addEmployees_ et l'exécuter lorsque vous cliquez sur le bouton **Save** du formulaire généré automatiquement.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/mbvygFJYY9c?si=sEpqNlR36P8wlHBN&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Cliquez sur le bouton **Add** dans le panneau des requêtes, et sélectionnez **ToolJet Database** comme source de données.
- Sélectionnez _employees_ comme nom de table, et Create row comme opération.
- Renommez la requête en _addEmployees_.
- Cliquez sur **Add Column** pour ajouter les colonnes nécessaires.
- Saisissez le code ci-dessous pour les clés de colonnes **first_name** et **email** :

```js
{{components.table1.newRows[0].first_name}}
{{components.table1.newRows[0].email}}
...
```

Formulez toutes les clés restantes selon le même format.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 6. Utiliser des événements pour déclencher des requêtes {#6-use-events-to-trigger-queries}

La requête _addEmployees_ doit s'exécuter lorsque vous cliquez sur le bouton **Save** du formulaire généré automatiquement. Le composant Table doit ensuite se recharger et afficher les données mises à jour chaque fois qu'un nouvel employé est ajouté. Suivez les étapes ci-dessous pour configurer cette fonctionnalité à l'aide d'événements.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/UJ3FyUqhhjE?si=pPun7LM7Rbs0g35C&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Cliquez sur le composant Table, puis cliquez sur **New event handler** dans le panneau des propriétés.
- Choisissez Add new rows comme événement, Run Query comme action, et _addEmployees_ comme requête.
- Dans la configuration de la requête _addEmployees_, sous l'onglet des paramètres, cliquez sur **New event handler** pour ajouter un nouvel événement.
- Sélectionnez Query Success comme événement, Run Query comme action, et _getEmployees_ comme requête.

Maintenant, lorsque vous cliquez sur le bouton **+ (Add new row)** du composant Table, saisissez les informations de l'employé, puis cliquez sur **Save**, les données seront ajoutées à la base de données et automatiquement répercutées dans le composant Table sur l'interface.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 7. Aperçu, publication et partage {#7-preview-release-and-share}

Les boutons d'aperçu, de publication et de partage se trouvent en haut à droite de l'App-Builder.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/yY8UAC4FK44?si=fTdYYvUI3TK_NIWq&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Cliquez sur le bouton **Preview** en haut à droite de l'App Builder pour vérifier l'avancement de votre application pendant le développement.
- Une fois le développement terminé et l'application prête à être utilisée, cliquez sur le bouton **Release** pour la déployer.
- Enfin, partagez votre application avec vos utilisateurs finaux à l'aide du bouton **Share**.

Félicitations, vous avez terminé le tutoriel ! Vous avez créé avec succès une application d'annuaire des employés et, au passage, appris les fondamentaux de ToolJet.

</div>

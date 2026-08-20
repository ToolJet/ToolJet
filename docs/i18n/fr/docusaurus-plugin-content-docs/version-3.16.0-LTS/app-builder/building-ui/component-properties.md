---
id: component-properties
title: Propriétés des composants
---

Les **propriétés des composants** définissent l'apparence, le comportement et l'interactivité des composants d'interface dans ToolJet. Elles permettent également de configurer des permissions au niveau du composant, permettant à certains utilisateurs ou groupes d'utilisateurs sélectionnés d'interagir avec le composant.

Chaque composant dispose d'un ensemble unique de propriétés en fonction de sa fonctionnalité. Voici un aperçu des types courants de propriétés configurables :

- **Labels et champs de données** : Pour les composants de saisie, vous pouvez configurer le label, ajouter des placeholders, des valeurs par défaut, définir des règles de validation, etc.
- **Data** : Alimentez les composants avec des valeurs statiques ou des données dynamiques via des queries.
- **Events** : Les événements sont des actions ou des déclencheurs qui répondent aux interactions des utilisateurs ou à des conditions spécifiques dans votre application. Ils vous permettent de définir une logique personnalisée (comme exécuter une query, naviguer vers une page ou afficher une notification) en réponse à l'activité des utilisateurs ou aux changements de l'application — sans écrire de code backend.
- **Styles** : Définissez des attributs visuels tels que les couleurs, l'espacement, l'alignement et le rayon des bordures pour ajuster l'apparence du composant.
- **State** : Contrôlez les états du composant tels que le chargement, la visibilité, ou si le composant est désactivé. Vous pouvez basculer ces états manuellement ou les contrôler à l'aide d'expressions logiques.
- **Device** : Configurez si le composant doit être visible sur des appareils spécifiques, comme mobile ou ordinateur de bureau.

<img className="screenshot-full img-full" src="/img/app-builder/components/properties-panel.png" alt="App Builder: Component library"/>

Ce ne sont là que quelques types de propriétés couramment utilisés. Pour des informations détaillées sur un composant spécifique et ses propriétés, reportez-vous à sa documentation individuelle. 

## Permissions au niveau du composant

Vous pouvez configurer des permissions au niveau du composant pour permettre uniquement à certains utilisateurs finaux ou groupes d'utilisateurs sélectionnés d'interagir avec le composant. Le composant ne sera pas du tout rendu pour les utilisateurs qui n'ont pas accès.

Supposons que vous construisiez une application pour gérer les détails des licences clients. Les commerciaux devraient pouvoir créer, mettre à jour et supprimer les informations client. Pendant ce temps, les équipes Produit, Marketing et Customer Success ne devraient pouvoir que consulter ces données. Pour appliquer cela, vous pouvez configurer des permissions au niveau du composant pour masquer les boutons Edit et Delete aux utilisateurs qui ne sont pas commerciaux. Ces boutons ne seront pas du tout rendus pour les utilisateurs sans accès.

### Configurer une permission au niveau du composant

Suivez ces étapes pour configurer une permission au niveau du composant :

**Rôle requis** : Admin ou Builder

1. Sélectionnez le composant, puis cliquez sur le menu kebab (trois points) situé à côté du nom du composant dans le panneau des propriétés.
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/components/permission-kebab.png" alt="App Builder: Component library"/>
2. Sélectionnez **Component permission**. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/components/component-permission.png" alt="App Builder: Component library"/>
3. Sélectionnez le **Type** :
    - **All users with access to the app** : Accorde l'accès à tous les utilisateurs qui peuvent accéder à l'application.
    - **Users** : Sélectionnez des utilisateurs spécifiques dans la liste déroulante. Remarque : Ces utilisateurs doivent déjà avoir accès à l'application.
    - **User groups** : Restreint l'accès aux membres des groupes d'utilisateurs sélectionnés. Remarque : Les groupes d'utilisateurs sélectionnés doivent avoir accès à l'application.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/components/permission-type.png" alt="App Builder: Component library"/>

**Remarque** : Si les permissions d'un composant ont été configurées par un administrateur et que le builder ne figure pas parmi les utilisateurs ou groupes autorisés, le builder ne pourra pas modifier les permissions du composant.

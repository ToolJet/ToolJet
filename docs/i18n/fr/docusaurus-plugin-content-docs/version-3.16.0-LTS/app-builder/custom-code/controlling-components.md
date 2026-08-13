---
id: control-components
title: Contrôler les composants avec du code
---

Outre les [**événements**](/docs/app-builder/events/overview), les Component-Specific Actions (CSA) peuvent également être déclenchées via du code pour modifier les propriétés et l'état des composants.

Imaginons que vous souhaitiez :
- Réinitialiser automatiquement un **Form** après sa soumission
- Afficher ou masquer des composants selon une condition
- Mettre à jour un **Text Input** en fonction de la valeur d'un autre champ
- Désactiver un bouton pendant les appels API
- Changer l'onglet actif de manière programmatique

Dans chacun de ces cas, vous pouvez utiliser les CSA avec des requêtes JavaScript ou Python.

## Comment ça fonctionne

Chaque composant de ToolJet dispose d'un ensemble de CSA. Voici quelques exemples de CSA :
- setValue() – définit ou met à jour la valeur d'un composant
- clear() – efface la valeur d'un champ de saisie
- setLoading() – active ou désactive l'état de chargement
- setDisable() – active ou désactive un composant
- setVisibility() – contrôle dynamiquement la visibilité d'un composant

Vous pouvez déclencher ces actions depuis vos requêtes JavaScript ou Python. 

Par exemple, si vous avez un **Button** qui déclenche une requête et que vous souhaitez afficher un indicateur de chargement jusqu'à ce que les données soient chargées. Vous pourriez utiliser `setLoading()` pour afficher un spinner :

```js
await components.button1.setLoading(queries.getData.isLoading)
```

## Cas d'usage

### Pré-remplir un champ de formulaire selon la sélection de l'utilisateur

Lorsqu'un utilisateur sélectionne un produit dans une **Dropdown**, définissez automatiquement le prix dans un composant **Text Input** :

```js
await components.textInput1.setValue(components.dropdown1.value)
```

### Effacer les champs après la soumission d'un formulaire :

Après qu'un utilisateur a soumis un **Form**, réinitialisez tous les champs :

```js
await components.formInput.resetForm()
```

### Fermer la Modal après la soumission du formulaire :

Si vous utilisez une **Modal** pour collecter des données, fermez-la une fois que le **Form** a été soumis avec succès :

```js
await components.modal1.close()
```

Utiliser les CSA dans votre code vous permet de contrôler dynamiquement le comportement des composants en fonction de votre propre logique.

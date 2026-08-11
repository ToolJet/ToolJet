---
id: tags
title: Tags
---

Le composant Tag est utilisé pour afficher de petits éléments d'interface étiquetés qui aident à catégoriser, mettre en évidence ou ajouter du contexte aux données.

**Quand l'utiliser ?**
- **Afficher clairement des statuts** : utilisez les tags pour représenter des états d'éléments tels que Active, Pending ou Completed de manière compacte et cohérente.
- **Catégoriser des informations** : ajoutez du contexte en étiquetant les éléments avec des catégories telles que High Priority, Bug ou Feature Request.
- **Améliorer la lisibilité** : utilisez des tags avec des couleurs distinctes et des libellés courts pour faciliter la lecture de longues listes ou tables.

## Options

Les tags peuvent être ajoutés à l'aide de la section options du panneau de propriétés ; vous pouvez cliquer sur **+ Add new option** pour ajouter un nouveau tag ou activer **Dynamic tags** pour ajouter des tags dynamiquement.

### Propriétés

| **Propriété**            | **Description**                                       | **Options de configuration**                 |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------- |
| **Title**               | Texte affiché à l'intérieur du tag.                        | String / Bind a variable                  |
| **Pill color**          | Couleur d'arrière-plan du tag.                          | Color picker / HEX / RGBA / Custom Themes |
| **Text and icon**       | Définit la couleur du texte et de l'icône à l'intérieur du tag. | Color picker / HEX / RGBA / Custom Themes |
| **Icon**                | Ajoute une icône au tag et contrôle sa visibilité.    | Choose from icon library                  |
| **Tag visibility**      | Affiche ou masque le tag.                                 | Toggle to control                         |
| **Overflow**            | Définit la façon dont le contenu du tag est géré lorsqu'il dépasse l'espace disponible. | Scroll / Wrap    |

### Dynamic Tags

Vous pouvez lier un tableau d'objets pour générer des tags de manière dynamique. Chaque objet du tableau doit définir le libellé et les styles du tag.

```js
{{ 
    [ 
	  { title: 'success', color: '#34A94733', textColor: '#34A947' }, 
	  { title: 'info', color: '#405DE61A', textColor: '#405DE6'  }, 
	  { title: 'warning', color: '#F357171A', textColor: '#F35717'  }, 
	  { title: 'danger', color: '#EB2E3933', textColor: '#EB2E39' } 
    ] 
}}
```

Chaque objet doit inclure un titre, un code couleur pour un tag spécifique et une couleur de texte correspondante.

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des Component Specific Actions (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"100px"}}> **Action** </div> | **Description** | **RunJS Query** |
|:-----------|:----------------|:----------------|
| setVisibility( ) | Définit la visibilité du composant. | `components.tags1.setVisibility()` |
| setLoading( ) | Définit l'état de chargement du composant. | `components.tags1.setLoading()` |
| setDisable( ) | Désactive le composant. | `components.tags1.setDisable()` |

## Variables exposées

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| tags       | Contient la valeur de tous les tags dans un tableau.  | `{{components.tags1.tags}}`.      |
| isLoading  | Indique si le composant est en cours de chargement.    | `{{components.tags1.isLoading}}`  |
| isVisible  | Indique si le composant est visible.    | `{{components.tags1.isVisible}}`  |
| isDisabled | Indique si le composant est désactivé.   | `{{components.tags1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :-------------------------------------------------| :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | String |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Pills

| **Propriété**      | **Description**                              | **Options de configuration**         |
|:----------------- |:-------------------------------------------- |:--------------------------------- |
| **Size**          | Définit la taille globale des tags.           | **Small** / **Large**             |
| **Border radius** | Contrôle l'arrondi des coins du tag. | Enter value in **px**             |
| **Alignment**     | Aligne les tags dans le conteneur du composant.  | **Left** / **Center** / **Right** |

### Container

| Propriété          | Description                                |
|:----------------- |:-------------------------------------------|
| **Box shadow**    | Applique un style d'ombre au conteneur.   |
| **Padding**       | Définit le remplissage autour du conteneur.     |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

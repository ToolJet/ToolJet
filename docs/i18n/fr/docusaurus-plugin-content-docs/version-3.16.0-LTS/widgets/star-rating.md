---
id: star-rating
title: Star Rating
---

Le composant **Star Rating** peut être utilisé pour recueillir les retours des utilisateurs et fournir une représentation visuelle des notations, aidant les utilisateurs à prendre des décisions informées, à fournir une preuve sociale et à évaluer la qualité ou la popularité d'un produit ou d'un service.

**Pourquoi l'utiliser ?**
- **Collecter les retours utilisateurs** : Idéal pour capturer les avis des utilisateurs sur des produits, services ou contenus dans un format simple et visuel.
- **Afficher des notations** : Parfait pour afficher des scores agrégés, comme les notes moyennes pour des articles, des cours ou des articles de blog.
- **Expérience utilisateur améliorée** : Offre une manière intuitive et interactive pour les utilisateurs d'exprimer leurs préférences, y compris une précision au demi-étoile pour des notations plus précises.

## Data

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :-------------------------------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------- |
| **Label**                               | Texte à afficher comme label pour la notation par étoiles.                                  | `String`                                      |
| **Icon Type**                           | Sélectionnez l'icône à afficher pour la notation.                                         | `stars` ou `heart`                            |
| **Number of stars**                     | Nombre total d'étoiles affichées au chargement initial. La valeur par défaut est 5.                     | `Integer`                                     |
| **Default number of selected stars**    | Définit combien d'étoiles sont sélectionnées par défaut. La valeur par défaut est 3.                         | `Integer` ou `half`                           |
| **Allow editing**                       | Activez pour permettre aux utilisateurs de modifier la notation. |  `Boolean` (`true` / `false`)                  |
| **Enable half star**                    | Activez pour permettre la sélection de demi-étoiles. La valeur par défaut est `false`.                    | `Boolean` (`true` / `false`)                  |
| **Tooltips**                            | Tableau de chaînes utilisées pour afficher des infobulles informatives pour chaque étoile. Associées par index. | `Array` de `String` (par défaut : `["Very Poor","Poor","Average", "Good","Excellent"]`)          |

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On change                                   | Se déclenche chaque fois que l'utilisateur clique sur une étoile.         |

:::info
Consultez la documentation de [référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"100px"}}> **Action** </div> |          **Description**                 |              **RunJS Query**             |
|:------------------------------------------|:------------------------------------------------|:-----------------------------------------|
| **setValue( )**                           | Définit la valeur de notation actuelle de façon programmatique. | `components.starrating1.setValue()`      |
| **resetValue( )**                         | Réinitialise la notation à sa valeur par défaut.         | `components.starrating1.resetValue()`    |
| **setVisibility( )**                      | Contrôle la visibilité du composant.       | `components.starrating1.setVisibility()` |
| **setLoading( )**                         | Place le composant dans un état de chargement.          | `components.starrating1.setLoading()`    |
| **setDisable( )**                         | Désactive l'interaction de l'utilisateur avec le composant.   | `components.starrating1.setDisable()`    |

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :------------------------------------------------| :------------------------------------------------- |
| value | Contient la valeur saisie par l'utilisateur chaque fois qu'une notation est ajoutée sur le composant. | `{{components.starrating1.value}}` |
| label | Contient le nom du label du composant. | `{{components.starrating1.label}}` |
| isLoading | Indique si le composant est en cours de chargement. | `{{components.starrating1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.starrating1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.starrating1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :-------------------------------------------------| :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur chaîne pour l'affichage. | Chaîne de caractères (par ex., `Select an option.` ). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| **Propriété** | **Description** | **Options de configuration** |
| -------------| ----------------| ------------------------- |
| **Style** | Choisissez de conserver le label dans le style **standard** ou **legacy**. | Liste déroulante : *Standard*, *Legacy* |
| **Label color** | Modifiez la couleur du texte du label. | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés |
| **Alignment** | Ajustez le positionnement du label par rapport au composant. | *Side* / *Top* et *Left* / *Right* |
| **Width** | Définit la largeur du label. | Conservez `Auto width` pour un dimensionnement standard, ou désélectionnez pour ajuster à l'aide d'un curseur ou d'une expression **fx** renvoyant une valeur numérique. |

### Icon

| **Propriété**              | **Description**                            | **Options de configuration**                 |
| ------------------------- | ------------------------------------------ | ----------------------------------------- |
| **Selected background**   | Couleur des icônes sélectionnées (étoiles/cœurs).   | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés |
| **Unselected background** | Couleur des icônes non sélectionnées (étoiles/cœurs). | Sélecteur de couleur / HEX / RGBA / Thèmes personnalisés |

### Container

| **Propriété**   | **Description**                                   | **Options de configuration**                                                        |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Box shadow** | Applique un style d'ombre au conteneur du composant.  | Choisissez une couleur d'ombre, ajustez les propriétés, ou définissez-le de façon programmatique avec **fx**. |
| **Padding**    | Conservez un espacement homogène à l'intérieur du conteneur. | *Default* ou *None*                                                              |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

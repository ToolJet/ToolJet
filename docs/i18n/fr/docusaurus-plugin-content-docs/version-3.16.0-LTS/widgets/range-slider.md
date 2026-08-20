---
id: range-slider
title: Range Slider
---

Le composant **Range Slider** permet aux utilisateurs de sélectionner une valeur ou une plage de valeurs en faisant glisser une poignée le long d'un curseur. Il est parfait pour ajuster des saisies numériques telles que le prix, la note ou le volume, de manière intuitive et interactive.

## Propriétés

### Slider

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div>                                                                           | <div style={{ width:"250px"}}> Valeur attendue </div>                |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| Label                                          | Texte à afficher comme label du champ.                                                                                 | Chaîne de caractères                                                              |
| Min value                                      | Définit la valeur minimale du curseur.                                                                                       | Ce champ accepte toute valeur numérique.                             |
| Max value                                      | Définit la valeur maximale du curseur.                                                                                       | Ce champ accepte toute valeur numérique.                             |
| Default value                                  | Définit la valeur par défaut au chargement du composant. Cela permet de préremplir la valeur selon vos données et besoins. | Ce champ accepte toute valeur numérique.                             |
| Step size                                      | Choisissez le pas d'incrémentation du curseur.                                                                                        | Ce champ accepte toute valeur numérique.                             |
| Set marks                                      | Définit des marques sur le curseur.                                                                                  | Accepte un tableau d'objets avec les propriétés `label` et `value`. |

### Range slider

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div>                                                                                 | <div style={{ width:"250px"}}> Valeur attendue </div>                |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| Label                                          | Texte à afficher comme label du champ.                                                                                       | Chaîne de caractères                                                              |
| Min value                                      | Définit la valeur minimale du curseur.                                                                                             | Ce champ accepte toute valeur numérique.                             |
| Max value                                      | Définit la valeur maximale du curseur.                                                                                             | Ce champ accepte toute valeur numérique.                             |
| Default start value                            | Définit la valeur de départ par défaut au chargement du composant. Cela permet de préremplir la valeur selon vos données et besoins. | Ce champ accepte toute valeur numérique.                             |
| Default end value                              | Définit la valeur de fin par défaut au chargement du composant. Cela permet de préremplir la valeur selon vos données et besoins.   | Ce champ accepte toute valeur numérique.                             |
| Step size                                      | Choisissez le pas d'incrémentation du curseur.                                                                                              | Ce champ accepte toute valeur numérique.                             |
| Set marks                                      | Définit des marques sur le curseur.                                                                                        | Accepte un tableau d'objets avec les propriétés `label` et `value`. |

## Événements

| Événement     | Description                             |
| :-------- | :-------------------------------------- |
| On change | Se déclenche chaque fois que la valeur change. |

:::info
Consultez la documentation de [référence des actions](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher via un événement ou à l'aide d'une requête RunJS.

| <div style={{ width:"130px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setValue( )                                  | Définit la valeur du composant.                  | `components.rangeslider1.setValue()`                |
| setRangeValue( )                             | Définit la plage du composant.                  | `components.rangeslider1.setRangeValue()`           |
| setVisibility( )                             | Définit la visibilité du composant.             | `components.rangeslider1.setVisibility(false)`      |
| setLoading( )                                | Définit l'état de chargement du composant.          | `components.rangeslider1.setLoading(true)`          |
| setDisable( )                                | Désactive le composant.                           | `components.rangeslider1.setDisable(true)`          |
| reset( )                                     | Réinitialise le composant à son état par défaut.            | `components.rangeslider1.reset()`                   |

## Variables exposées

| Variables | Description                                                         | Comment y accéder                       |
| :-------- | :------------------------------------------------------------------ | :---------------------------------- |
| value     | Contient la valeur du curseur, ou un tableau lors de l'utilisation du range slider. | `{{components.rangeslider1.value}}` |
| label     | Contient la valeur du label du composant.                           | `{{components.rangeslider1.label}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                       | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state                                | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant. Bascule ou définition dynamique.                                               | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant. Bascule ou définition dynamique.                                           | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol. Définissez une valeur chaîne pour l'affichage.                               | Chaîne de caractères                                                                                                                       |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.      | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.       | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>                                                                                                       |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text                                           | Définit la couleur du label du composant.          | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de façon programmatique un code couleur hexadécimal.                                                                |
| Alignment | Définit la position du label et du champ de saisie.   | Cliquez sur les options bascule, ou cliquez sur **fx** pour saisir du code qui renvoie de façon programmatique une valeur d'alignement - **side** ou **top**. |
| Width | Définit la largeur du champ de saisie. | Activez **Auto width** pour utiliser automatiquement la largeur standard. Désactivez-le pour ajuster manuellement la largeur à l'aide du curseur ou en saisissant une valeur numérique via **fx**. Vous pouvez également choisir si la largeur est calculée par rapport au **Container** ou par rapport au **Field**. |

### Slider

| Propriété      | Description                      | Options de configuration                       |
| :------------ | :------------------------------- | :------------------------------------------ |
| Track         | Définit la couleur de la piste du curseur. | Sélectionnez un thème ou choisissez à l'aide du sélecteur de couleur. |
| Accent        | Définit la couleur d'accentuation.           | Sélectionnez un thème ou choisissez à l'aide du sélecteur de couleur. |
| Handle        | Définit la couleur de la poignée.           | Sélectionnez un thème ou choisissez à l'aide du sélecteur de couleur. |
| Handle border | Définit la couleur de bordure de la poignée.    | Sélectionnez un thème ou choisissez à l'aide du sélecteur de couleur. |
| Market label  | Définit la couleur du label de marqueur.     | Sélectionnez un thème ou choisissez à l'aide du sélecteur de couleur. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de façon programmatique**.
:::

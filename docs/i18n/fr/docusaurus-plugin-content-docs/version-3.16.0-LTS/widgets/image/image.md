---
id: image
title: Image
slug: /widgets/image/
---

Le composant **Image** permet d'afficher des images dans votre application.

## Propriétés

| <div style={{ width:"100px"}}> Propriétés </div> | <div style={{ width:"100px"}}> Description </div>                                                         |
| :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| Image URL                                        | Saisissez l'URL de l'image à afficher sur le composant.                                                    |
| JS Object                                        | Permet de définir une image à l'aide d'un objet JS avec des propriétés telles que name, type, size et des données encodées en base64. |
| Alternative                                      | Utilisé pour le texte alternatif des images.                                                               |

## Événements

| <div style={{ width:"100px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On click                                    | Se déclenche chaque fois que l'utilisateur clique sur une image. |

:::info
Consultez la documentation de la **[Référence des actions](/docs/actions/run-query)** pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"120px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setImageURL( )                               | Définit l'URL de l'image.                          | `components.image1.setImageURL`                     |
| clearImage( )                                | Efface l'URL de l'image.                           | `components.image1.clearImage`                      |
| setVisibility( )                             | Définit la visibilité du composant.                | `components.image1.setVisibility(false)`            |
| setLoading( )                                | Définit l'état de chargement du composant.         | `components.image1.setLoading(true)`                |
| setDisable( )                                | Désactive le composant.                            | `components.image1.setDisable(true)`                |

## Variables exposées

| Variable        | Description                                      | Comment y accéder                           |
| :-------------- | :----------------------------------------------- | :-------------------------------------- |
| imageURL        | Accédez à l'URL de l'image via cette variable.    | `{{components.image1.imageURL}}`        |
| alternativeText | Accédez au texte alternatif via cette variable.   | `{{components.image1.alternativeText}}` |
| isLoading       | Indique si le composant est en cours de chargement. | `{{components.image1.isLoading}}`       |
| isVisible       | Indique si le composant est visible.               | `{{components.image1.isVisible}}`       |
| isDisabled      | Indique si le composant est désactivé.             | `{{components.image1.isDisabled}}`      |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                            | <div style={{ width:"250px"}}> Options de configuration </div>                                                                  |
| :------------------------------------------- | :--------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Zoom button                                  | Activez cette option pour activer les options de zoom dans l'image.          | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Rotate button                                | Activez cette option pour activer le bouton de rotation dans l'image.        | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show loading state                           | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility                                   | Contrôle la visibilité du composant.                                          | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable                                      | Active ou désactive le composant.                                            | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip                                      | Fournit des informations supplémentaires au survol.                          | Chaîne de caractères                                                                                                        |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Rend le composant visible en vue bureau.           | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile                                 | Rend le composant visible en vue mobile.           | Vous pouvez le configurer avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Image

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div>                                                                                  |
| :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------- |
| Image fit                                   | Choisissez un ajustement d'image - similaire à object fit pour l'image parmi les options disponibles : **fill**, **cover**, **contain**, **scale-down** |
| Shape                                       | Choisissez le type de bordure pour l'image.                                                                                     |
| Alignment                                   | Choisissez l'alignement de l'image parmi les options disponibles : **left**, **center**, **right**.                            |

### Container

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------| 
| Background | Ajoutez une couleur de fond au composant en fournissant le `code couleur HEX` ou en choisissant la couleur de votre choix depuis le sélecteur de couleur. |
| Border                                      | Ajoutez une couleur de bordure au composant en fournissant le `code couleur HEX` ou en choisissant la couleur de votre choix depuis le sélecteur de couleur. |
| Border radius                               | Ajoutez le rayon de bordure au composant.                                                                                        |
| Padding                                     | Ajoute un espacement entre l'image et la bordure du composant.                                                                   |
| Box shadow                                  | Définit les propriétés d'ombre de la boîte du composant.                                                                        | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique via **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

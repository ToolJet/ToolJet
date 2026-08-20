---
id: container
title: Container
---

Les containers sont utilisés pour regrouper des composants ensemble. Vous pouvez déplacer un groupe de composants liés à l'intérieur d'un container pour une meilleure organisation des éléments de votre interface utilisateur.

:::caution Composants restreints
Certains composants, à savoir **Calendar** et **Kanban**, ne peuvent pas être placés à l'intérieur du composant Container.
:::

## Show header

Le bouton bascule show header permet d'afficher ou de masquer un en-tête pour le composant. Si vous laissez le bouton bascule activé, le container affichera un en-tête sur lequel vous pouvez placer d'autres composants. Le style de l'en-tête peut être contrôlé séparément sous l'onglet Styles.

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setVisibility()| Définit la visibilité du composant.     | `components.container1.setVisibility(false)` |
| setLoading()   | Définit l'état de chargement du composant.  | `components.container1.setLoading(true)` |
| setDisable()   | Désactive le composant.                   | `components.container1.setDisable(true)` |

## Exposed Variables

| Variable | Description | Comment y accéder |
|:--------|:-----------|:------------|
| isLoading | Indique si le composant est en cours de chargement. | `{{components.container1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.container1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.container1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Active un indicateur de chargement, souvent utilisé avec la propriété isLoading pour indiquer une progression.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du container selon son contenu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip  | Fournit des informations supplémentaires au survol. Définissez une chaîne d'affichage.  | Chaîne |

## Devices

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Header

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Background | Définit la couleur d'arrière-plan de l'en-tête. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Divider | Définit la couleur du séparateur entre l'en-tête et le corps. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Background | Définit la couleur d'arrière-plan du container. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border color | Définit la couleur de la bordure du container. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Border radius | Définit le rayon des coins du container. | Saisissez un nombre (par défaut : `6`) ou cliquez sur **fx** et saisissez un nombre de manière programmatique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

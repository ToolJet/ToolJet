---
id: circular-progress-bar
title: Circular Progressbar
---

Le composant **Circular Progress bar** peut être utilisé pour afficher une progression dans un cercle de progression.

## Properties

| <div style={{ width:"100px"}}> Propriétés </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| ------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------- |
| Label | La valeur du label affichée à l'intérieur du cercle. | Sélectionnez `Auto` pour afficher la valeur de la barre de progression, ou sélectionnez `Custom` pour la personnaliser. |
| Allow negative progress | Activer cette option permet une progression négative, faisant tourner le cercle dans le sens inverse des aiguilles d'une montre. | Activez ou désactivez le bouton bascule, ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Progress | Définit la progression du composant. | Valeur de progression |

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) ; vous pouvez les déclencher à l'aide d'un événement ou d'une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setValue()     | Définit la valeur de la barre de progression circulaire.     | `components.circularprogressbar1.setValue` |
| setVisibility()| Définit la visibilité du composant.     | `components.circularprogressbar1.setVisibility` |
| setLoading()   | Définit l'état de chargement du composant.  | `components.circularprogressbar1.setLoading` |


## Exposed Variables

| Variable | Description | Comment y accéder |
|:--------|:-----------|:------------|
| value | Contient la valeur du composant | `{{components.circularprogressbar1.value}}` |
| isLoading | Indique si le composant est en cours de chargement. | `{{components.circularprogressbar1.isLoading}}` |
| isVisible | Indique si le composant est visible. | `{{components.circularprogressbar1.isVisible}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Active un indicateur de chargement, souvent utilisé avec la propriété isLoading pour indiquer une progression.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip  | Fournit des informations supplémentaires au survol. Définissez une chaîne d'affichage.  | Chaîne |

## Devices

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Valeur attendue </div> |
| ----------- | ----------- | ----------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Color | Définit la couleur du texte du label. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Size | Définit la taille du texte du label. | Saisissez la valeur ou utilisez le curseur. |
 
### Progress Circle

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
|:----------------|:------------|:--------------|
| Track | Définit la couleur de base de la piste du cercle de progression. | Sélectionnez une couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Positive | Définit la couleur de la progression pour les valeurs positives. | Sélectionnez une couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Negative | Définit la couleur de la progression pour les valeurs négatives. | Sélectionnez une couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Completion | Définit la couleur de la portion terminée du cercle de progression. | Sélectionnez une couleur ou cliquez sur **fx** et saisissez du code qui retourne programmatiquement un code couleur hexadécimal. |
| Progress bar width | Détermine l'épaisseur du cercle de progression. | Saisissez une valeur ou utilisez le curseur. |
| Circle ratio | Détermine quelle portion du cercle est visible (cercle partiel/complet). | Saisissez une valeur ou utilisez le curseur. |
| Alignment | Définit l'alignement horizontal du composant. | Choisissez entre gauche, centre ou droite. |
| Counter clockwise rotation | Détermine la direction dans laquelle la progression se déplace. | Activez ou désactivez le bouton bascule, ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la de manière programmatique avec **fx**. |
| Padding | Vous permet de maintenir un remplissage (padding) standard en activant l'option `Default`. | Choisissez entre `Default` ou `None`. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)** activée.
:::

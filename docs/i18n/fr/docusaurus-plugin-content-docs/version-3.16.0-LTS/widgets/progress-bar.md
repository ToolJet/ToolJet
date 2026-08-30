---
id: progress-bar
title: Progress Bar
---

Le composant **Horizontal Progress Bar** affiche une progression sous la forme d'une barre linéaire, idéale pour visualiser l'achèvement d'une tâche, un téléversement de fichier, ou tout processus ayant un point de départ et un point d'arrivée définis.

## Exemple d'utilisation

Un tableau de bord de gestion de projet doit afficher le statut d'achèvement des tâches pour plusieurs projets. En utilisant le composant Horizontal Progress Bar, chaque projet affiche son pourcentage d'achèvement avec une barre visuelle qui se remplit de gauche à droite, changeant de couleur lorsque la tâche atteint 100 % d'achèvement.

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Définit comment l'étiquette de progression est affichée. | Sélectionnez `Auto` pour afficher le pourcentage de progression, ou `Custom` pour afficher un texte personnalisé. |
| Text | Texte personnalisé à afficher comme étiquette. Visible uniquement lorsque Label est défini sur `Custom`. | Chaîne (par ex., `Loading files...`). |
| Progress | Définit la valeur de progression du composant. Les valeurs sont limitées entre 0 et 100. | Nombre (par ex., `50`). |

:::info
Toute propriété disposant du bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

## Component Specific Actions (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des component-specific actions (CSA). Vous pouvez les déclencher via un événement ou via une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| setValue      | Définit la valeur de progression du composant. Les valeurs sont automatiquement limitées entre 0 et 100. | `components.progressbar1.setValue(75)` |
| setVisibility | Définit la visibilité du composant. | `components.progressbar1.setVisibility(false)` |

## Variables exposées

| Variable | Description | Comment y accéder |
|:--------|:-----------|:------------|
| value | Contient la valeur de progression actuelle du composant (0-100). | `{{components.progressbar1.value}}` |
| isVisible | Indique si le composant est visible. | `{{components.progressbar1.isVisible}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Visibility         | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip            | Fournit des informations supplémentaires au survol. | Chaîne (par ex., `Task completion status`). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Color | Définit la couleur du texte de l'étiquette. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Size | Définit la taille de police du texte de l'étiquette. | Saisissez une valeur ou utilisez le curseur. |
| Alignment | Définit la position de l'étiquette par rapport à la barre de progression. | Sélectionnez `side` pour placer l'étiquette à côté de la barre, ou `top` pour la placer au-dessus. |
| Width | Définit la largeur de la zone d'étiquette lorsque l'alignement est réglé sur `side`. | Activez **Auto width** pour utiliser automatiquement la largeur standard, ou désactivez-la pour ajuster manuellement avec le curseur. |

### Progress Bar

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Track | Définit la couleur de fond de la piste de la barre de progression. | Sélectionnez une couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Progress track | Définit la couleur de la portion de progression remplie. | Sélectionnez une couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Completion | Définit la couleur affichée lorsque la progression atteint 100 %. | Sélectionnez une couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Progress bar width | Définit la hauteur/épaisseur de la barre de progression. | Saisissez une valeur ou utilisez le curseur. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |
| Padding | Ajoute un espacement entre le composant et la limite de son conteneur. | Sélectionnez `Default` pour un espacement standard ou `None` pour le retirer. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide des **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un email à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Veuillez le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

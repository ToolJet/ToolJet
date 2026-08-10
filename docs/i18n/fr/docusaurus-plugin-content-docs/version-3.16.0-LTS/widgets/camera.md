---
id: camera
title: Camera
---

Le composant **Camera** permet aux utilisateurs de prendre des photos et d'enregistrer des vidéos directement depuis leur caméra. Il fournit une sélection de périphérique, un mode plein écran et des contrôles pour capturer des images ou enregistrer des vidéos. Dans ce document, nous passerons en revue toutes les options de configuration du composant **Camera**.

## Propriétés
| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Content | Détermine si le composant capture des images ou des vidéos. | Sélectionnez `Image` ou `Video` dans la liste déroulante. |

## Événements

| Événement            | Description  |
|:-----------------|:---------------------------------------------|
| On recording start    | Se déclenche lorsque l'utilisateur commence à enregistrer une vidéo (applicable uniquement lorsque Content est réglé sur Video). |
| On recording save | Se déclenche lorsque l'utilisateur sauvegarde la vidéo enregistrée (applicable uniquement lorsque Content est réglé sur Video). |
| On image save | Se déclenche lorsque l'utilisateur sauvegarde une image capturée (applicable uniquement lorsque Content est réglé sur Image). |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| resetVideo() | Efface la vidéo enregistrée et réinitialise les données vidéo. | `components.camera1.resetVideo()` |
| resetImage() | Efface l'image capturée et réinitialise les données d'image. | `components.camera1.resetImage()` |
| setVisibility()| Définit la visibilité du composant. | `components.camera1.setVisibility(false)` |
| setDisable()   | Désactive le composant. | `components.camera1.setDisable(true)` |

## Variables exposées

| Variable | Description | Comment y accéder |
|:--------|:-----------|:------------|
| imageDataURL | Contient l'image capturée sous forme d'URL de données (encodée en base64). | `{{components.camera1.imageDataURL}}`|
| videoDataURL | Contient la vidéo enregistrée sous forme d'URL de données (encodée en base64). | `{{components.camera1.videoDataURL}}`|
| isVisible | Indique si le composant est visible. | `{{components.camera1.isVisible}}`|
| isDisabled | Indique si le composant est désactivé. | `{{components.camera1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Visibility | Contrôle la visibilité du composant. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | Chaîne (par ex., `Capture photos or record videos.` ). |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Recorder

| <div style={{ width:"100px"}}> Propriété de style </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Text color | Définit la couleur du texte affiché dans le composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex.  |
| Accent color | Définit la couleur d'accent utilisée pour les boutons et les contrôles. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex.  |

### Container

| <div style={{ width:"100px"}}> Propriété de style </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| Background | Définit la couleur d'arrière-plan du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Border | Définit la couleur de la bordure du composant. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement une valeur numérique. |
| Box shadow | Définit les propriétés d'ombre du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées ou définissez-la programmatiquement via **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée via les **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** est disponible uniquement si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

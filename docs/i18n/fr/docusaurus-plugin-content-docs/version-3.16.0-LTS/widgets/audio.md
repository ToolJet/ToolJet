---
id: audio-recorder
title: Audio Recorder
---

Le composant **Audio Recorder** permet aux utilisateurs d'enregistrer de l'audio directement depuis leur microphone. Il fournit des contrôles pour enregistrer, mettre en pause, lire et sauvegarder les enregistrements audio. Dans ce document, nous passerons en revue toutes les options de configuration du composant **Audio Recorder**.

## Propriétés
| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Texte à afficher comme label du composant.           | Chaîne (par ex., `Click to start recording`).         |

## Événements

| Événement            | Description  |
|:-----------------|:---------------------------------------------|
| On recording start    | Se déclenche lorsque l'utilisateur commence à enregistrer de l'audio.                                 |
| On recording save | Se déclenche lorsque l'utilisateur sauvegarde l'audio enregistré. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| resetAudio() | Efface l'audio enregistré et réinitialise le composant à son état initial. | `components.audiorecorder1.resetAudio()` |
| setVisibility()| Définit la visibilité du composant. | `components.audiorecorder1.setVisibility(false)` |
| setLoading()   | Définit l'état de chargement du composant. | `components.audiorecorder1.setLoading(true)` |
| setDisable()   | Désactive le composant. | `components.audiorecorder1.setDisable(true)` |
 
## Variables exposées

| Variable | Description | Comment y accéder |
|:--------|:-----------|:------------|
|  dataURL | Contient l'audio enregistré sous forme d'URL de données (encodée en base64). | `{{components.audiorecorder1.dataURL}}` |
|  isVisible | Indique si le composant est visible. | `{{components.audiorecorder1.isVisible}}` |
|  isLoading | Indique si le composant est en cours de chargement. | `{{components.audiorecorder1.isLoading}}` |
|  isDisabled | Indique si le composant est désactivé. | `{{components.audiorecorder1.isDisabled}}` |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. À activer/désactiver ou à définir dynamiquement.   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. À activer/désactiver ou à définir dynamiquement. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une valeur de chaîne à afficher. | Chaîne (par ex., `Record audio from your microphone.` ). |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Recorder

| <div style={{ width:"100px"}}> Propriété de style </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Icon | Vous permet de sélectionner une icône pour le composant. | Activez la visibilité de l'icône et sélectionnez-en une. Vous pouvez aussi la définir programmatiquement via **fx**.          |
| Icon color | Définit la couleur de l'icône d'enregistrement. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex. |
| Label text | Définit la couleur du texte du label. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex.  |
| Accent color | Définit la couleur d'accent utilisée pour la forme d'onde et les contrôles. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez un code qui retourne programmatiquement un code couleur Hex.  |

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

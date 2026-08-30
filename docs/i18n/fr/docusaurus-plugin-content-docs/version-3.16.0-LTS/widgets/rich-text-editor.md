---
id: rich-text-editor
title: Text Editor
---

# Text Editor

Le composant **Text Editor** est utilisé pour saisir et modifier du texte au format HTML. Il est recommandé pour les articles de blog, les publications de forum ou les sections de notes. Le texte saisi est utilisé comme label pour le radio button.

<div style={{paddingTop:'24px'}}>

## Propriétés

| **Propriété**  | **Description** | **Valeur attendue** |
|:-----------|:-----------|:-----------|
| Placeholder | Une indication affichée pour guider l'utilisateur sur ce qu'il doit saisir. | Chaîne de caractères (par ex., `John Doe`) <br/>HTML (par ex., `<h1>John Doe</h1>`) |
| Default Value | La valeur par défaut que le composant contiendra au chargement de l'application. | Chaîne de caractères (par ex., `Default Text`) <br/>HTML (par ex., `<p>Hello, ToolJet!</p>`).|

### Prise en charge du HTML
Les propriétés Placeholder et Default Value prennent également en charge le contenu HTML, permettant l'utilisation de titres, de paragraphes, de texte en gras et d'autres éléments HTML au sein de l'éditeur de texte.


</div>

<div style={{paddingTop:'24px'}}>

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant Button peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action  </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> Comment y accéder </div> |
|:----------- |:----------- |:---------|
| setValue() | Définit la valeur de l'éditeur de texte. | Utilisez une requête RunJS (par ex., <br/> `await components.richtexteditor1.setValue(<p> Hello ToolJet! </p>)`) ou déclenchez-la via un événement.|
| setVisibility() | Définit la visibilité du composant.            | Utilisez une requête RunJS (par ex.,  <br/> `await components.richtexteditor1.setVisibility(false)`) ou déclenchez-la via un événement. |
| setLoading()   | Définit l'état de chargement du composant.         | Utilisez une requête RunJS (par ex.,  <br/> `await components.richtexteditor1.setLoading(true)`) ou déclenchez-la via un événement. |
| setDisable()   | Désactive le composant.                           | Utilisez une requête RunJS (par ex., <br/> `await components.richtexteditor1.setDisable(true)`) ou déclenchez-la via un événement. |

</div>

<div style={{paddingTop:'24px'}}>

## Variables exposées

| **Variable** | **Description** | **Comment y accéder** |
|:-----------|:-----------|:-----------|
| value | Contient la valeur saisie par l'utilisateur dans le composant. | Accessible dynamiquement en JS (par ex.,`{{components.richtexteditor1.value}}`). |
| isLoading    | Indique si le composant est en cours de chargement. | Accessible dynamiquement en JS (par ex., `{{components.richtexteditor1.isLoading}}`). |
| isVisible    | Indique si le composant est visible. | Accessible dynamiquement en JS (par ex., `{{components.richtexteditor1.isVisible}}`). |
| isDisabled   | Indique si le composant est désactivé. | Accessible dynamiquement en JS (par ex., `{{components.richtexteditor1.isDisabled}}`). |

</div>

<div style={{paddingTop:'24px'}}>

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou définition dynamique.   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Dynamic height | Ajuste automatiquement la hauteur du composant en fonction de son contenu. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

</div>

<div style={{paddingTop:'24px'}}>

## Général
### Tooltip

Une infobulle fournit des informations supplémentaires lorsque l'utilisateur survole le composant. Dans les paramètres **Général**, vous pouvez définir le texte de l'infobulle au format chaîne de caractères. En survolant le composant, cette chaîne s'affichera comme infobulle.

</div>

<div style={{paddingTop:'24px'}}>

## Appareils

| **Propriété** |**Description** | **Valeur attendue** |
|:-----------|:-----------|:-----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir à l'aide du bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir à l'aide du bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

| **Propriété** | **Description** | **Options de configuration** |
|:-----------|:-----------|:-----------|
| Visibility   | Contrôle la visibilité du composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Bascule ou définition dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Box-shadow | Définit les propriétés d'ombre (box shadow) du composant. | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de façon programmatique avec **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée avec les **[Styles personnalisés](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Avancé** est disponible uniquement si votre forfait inclut la fonctionnalité **[Styles personnalisés](/docs/app-builder/customstyles)**.
:::

</div>

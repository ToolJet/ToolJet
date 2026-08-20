---
id: button-group-v2
title: Button Group
---

Le composant Button Group vous permet d'afficher un ensemble de boutons parmi lesquels les utilisateurs peuvent choisir. Il prend en charge la sélection simple ou multiple, des icônes optionnelles, le mappage dynamique des données et des mises en page flexibles — ce qui le rend utile pour les barres de filtres, les commutateurs de mode et les barres d'outils d'action.

## Exemple d'utilisation

Une équipe logistique crée un tableau de bord d'opérations interne où les expéditeurs doivent filtrer rapidement les envois par statut — **Pending**, **In Transit** et **Delivered**. Ils ajoutent un Button Group avec ces trois options. Lorsqu'un expéditeur clique sur un bouton de statut, la valeur sélectionnée alimente une requête qui filtre le tableau des envois. Avec la sélection multiple activée, les expéditeurs peuvent comparer plusieurs statuts à la fois sans avoir besoin d'une liste déroulante ou d'un groupe de cases à cocher séparé.

## Propriétés

|  <div style={{ width:"150px"}}> Propriété </div>  | <div style={{ width:"300px"}}> Description </div> | Valeur attendue |
|:---------|:-----------|:--------------|
| Button group label | Étiquette de texte affichée à côté du groupe de boutons. | Chaîne (par ex., `Status`) |
| Mapped button | Bascule pour activer la génération dynamique de boutons à partir d'un schéma. Lorsqu'elle est activée, un champ **Schema** apparaît. | Booléen : `{{true}}` ou `{{false}}` |
| Schema | Tableau d'objets de boutons utilisé lorsque **Mapped button** est activé. | Tableau (par ex., `{{[{"label":"Button1","value":"1","icon":"IconBolt","iconVisibility":false,"disable":false,"default":true}]}}`) |
| Enable multiple selection | Permet de sélectionner plus d'un bouton à la fois. | Booléen : `{{true}}` ou `{{false}}` |
| Layout | Contrôle la façon dont les boutons sont disposés. | `row`, `column` ou `wrap` |

## Événements

| Événement | Description |
|-------|-------------|
| On click | Se déclenche lorsqu'un bouton du groupe est cliqué. |

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA). Vous pouvez les déclencher via un événement ou via une requête RunJS.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div>|
| :------------ | :---------- | :------------ |
| Select option | Sélectionne un bouton par valeur. | `components.buttongroup1.setSelected(value)` |
| Clear selected options | Efface toutes les sélections actuelles. | `components.buttongroup1.clear()` |
| Set disable | Active ou désactive le composant. | `components.buttongroup1.setDisable(true)` |
| Set loading | Affiche ou masque l'état de chargement. | `components.buttongroup1.setLoading(true)` |
| Set visibility | Affiche ou masque le composant. | `components.buttongroup1.setVisibility(true)` |

## Variables exposées

| Variable | Description | Comment y accéder |
|:---------|:-----------|:-------------|
| selected | Tableau des valeurs du ou des boutons actuellement sélectionnés. Par défaut : `[1]`. | `{{components.buttongroup1.selected}}` |
| isVisible | Indique si le composant est visible. | `{{components.buttongroup1.isVisible}}` |
| isDisabled | Indique si le composant est désactivé. | `{{components.buttongroup1.isDisabled}}` |
| isLoading | Indique si le composant est en état de chargement. | `{{components.buttongroup1.isLoading}}` |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div>|
|:----------------|:------------------------------------------------|:---------------------------|
| Make this field mandatory | Marque le champ comme obligatoire. Affiche une erreur si aucun bouton n'est sélectionné lors de la soumission du formulaire. | Bascule : `{{true}}` ou `{{false}}` |
| Custom validation | Règle personnalisée qui retourne une chaîne de message d'erreur en cas d'échec de la validation, ou `true` en cas de validité. | Expression (par ex., `{{components.buttongroup1.selected.length > 0 && 'Please select an option'}}`) |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:------------------|:------------|:------------------------------|
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. | Chaîne (par ex., `Select a status`). |

## Appareils

|<div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Color | Couleur du texte du label. | Sélecteur de couleur ou valeur hexadécimale. |
| Alignment | Position du label par rapport aux boutons. | `Side` (par défaut) ou `Top` |
| Direction | Direction d'alignement latéral, à gauche ou à droite des boutons. Visible lorsque l'alignement est réglé sur **Side**. | Bascule d'icône gauche ou droite |
| Width | Largeur automatique ou manuelle du label. Visible lorsque l'alignement est **Side**. | Case à cocher — automatique (par défaut) ou curseur manuel |
| Label width | Largeur manuelle du label en pourcentage. Visible lorsque **Width** est réglé sur manuel. | Curseur (0–100) |
| Width type | Indique si la largeur du label est mesurée par rapport au composant ou au champ. Visible lorsque **Width** est réglé sur manuel. | `Of the Component` (par défaut) ou `Of the Field` |

### Buttons

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Background | Couleur d'arrière-plan des boutons non sélectionnés. | Sélecteur de couleur ou valeur hexadécimale. |
| Hover background | Couleur d'arrière-plan au survol. | `Auto` (par défaut) ou `Manual` — en mode Manual, un sélecteur de couleur apparaît. |
| Border | Couleur de bordure des boutons. | Sélecteur de couleur ou valeur hexadécimale. |
| Text | Couleur du texte des labels des boutons. | Sélecteur de couleur ou valeur hexadécimale. |
| Font size | Taille de police du texte des boutons en pixels. | Nombre. Par défaut : `14` |
| Font weight | Épaisseur du texte du label des boutons. | `normal` (par défaut), `medium`, `bold`, `lighter` ou `bolder` |
| Icon | Couleur des icônes des boutons. | Sélecteur de couleur ou valeur hexadécimale. |
| Selected background | Couleur d'arrière-plan du bouton sélectionné. | Sélecteur de couleur ou valeur hexadécimale. |
| Selected text | Couleur du texte du bouton sélectionné. | Sélecteur de couleur ou valeur hexadécimale. |
| Selected icon | Couleur de l'icône du bouton sélectionné. | Sélecteur de couleur ou valeur hexadécimale. |
| Error text | Couleur du message d'erreur de validation. | Sélecteur de couleur ou valeur hexadécimale. |
| Border radius | Arrondi des coins des boutons en pixels. | Nombre. Par défaut : `6` |
| Alignment | Alignement horizontal des boutons dans le groupe. | Gauche (par défaut), centre ou droite |
| Box Shadow | Ombre appliquée au conteneur du groupe de boutons. | Valeur d'ombre. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Padding | Marge interne du conteneur du groupe de boutons. | `Default` ou `None` |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée via les **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** est disponible uniquement si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

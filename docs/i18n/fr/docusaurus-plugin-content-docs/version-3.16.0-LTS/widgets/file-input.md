---
id: file-input
title: File Input
---

Le composant **File Input** permet aux utilisateurs de sélectionner des fichiers depuis leur appareil à l'aide d'un champ de saisie compact avec un bouton **Browse**. À la différence du File Picker, il n'inclut pas de zone de glisser-déposer — il est conçu pour un usage en ligne dans les formulaires, où une sélection de fichier classique déclenchée par un bouton est préférable.

## Exemple d'utilisation

Une équipe achats développe un outil interne de gestion des notes de frais où les employés soumettent des demandes de remboursement. Le formulaire inclut un composant File Input afin que les utilisateurs puissent joindre des reçus en cliquant sur **Browse**, en sélectionnant un ou plusieurs fichiers, puis en soumettant. Le composant impose une taille de fichier maximale de 5 Mo et n'accepte que les PDF et les images, empêchant ainsi les uploads invalides d'atteindre le backend.

## Propriétés

### Data

| <div style={{ width:"150px"}}> Propriété </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"150px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Texte affiché comme libellé du champ. | Chaîne de caractères (ex. `Attach Receipt`). |
| Placeholder | Texte indicatif affiché dans la zone de saisie lorsqu'aucun fichier n'est sélectionné. | Chaîne de caractères (ex. `Click to select file`). |
| Allow uploading multiple files | Permet à l'utilisateur de sélectionner plusieurs fichiers à la fois. | Bouton bascule (par défaut : activé). |
| Enable clear selection | Affiche un bouton d'effacement (×) dans la zone de saisie pour retirer le(s) fichier(s) sélectionné(s). | Bouton bascule (par défaut : désactivé). |
| Enable parsing | Analyse le contenu du fichier et le met à disposition sous forme de données structurées. | Bouton bascule (par défaut : désactivé). |
| File type | Lorsque **Enable parsing** est activé, spécifie la manière dont le fichier est analysé. | Sélectionnez — **Autodetect from extension**, **CSV**, **Microsoft Excel – xls**, **Microsoft Excel – xlsx**, **JSON** (par défaut : Autodetect from extension). |

## Événements

| Événement | Description |
| :---- | :---------- |
| On File Selected | Se déclenche lorsque l'utilisateur sélectionne un ou plusieurs fichiers dans la boîte de dialogue. |
| On File Loaded | Se déclenche lorsqu'un fichier sélectionné a fini de se charger dans le navigateur. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), déclenchées via un événement ou une requête RunJS.

| <div style={{ width:"130px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"220px"}}> Comment y accéder </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| clear() | Efface le(s) fichier(s) actuellement sélectionné(s). | `components.fileinput1.clear()` |
| setFocus() | Déplace le focus vers le composant File Input. | `components.fileinput1.setFocus()` |
| setBlur() | Retire le focus du composant File Input. | `components.fileinput1.setBlur()` |
| setVisibility() | Affiche ou masque le composant. | `components.fileinput1.setVisibility(false)` |
| setDisable() | Active ou désactive le composant. | `components.fileinput1.setDisable(true)` |
| setLoading() | Définit l'état de chargement du composant. | `components.fileinput1.setLoading(true)` |

## Variables exposées

| <div style={{ width:"120px"}}> Variable </div> | <div style={{ width:"220px"}}> Description </div> | <div style={{ width:"220px"}}> Comment y accéder </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| files | Tableau d'objets fichiers sélectionnés par l'utilisateur. Chaque objet inclut le nom du fichier, le contenu et les métadonnées. | `{{components.fileinput1.files}}` |
| isParsing | Indique si le contenu du fichier est en cours d'analyse. | `{{components.fileinput1.isParsing}}` |
| isValid | Indique si le(s) fichier(s) sélectionné(s) respecte(nt) toutes les règles de validation. | `{{components.fileinput1.isValid}}` |
| fileSize | La taille du fichier sélectionné en octets. | `{{components.fileinput1.fileSize}}` |
| isMandatory | Indique si le champ est marqué comme obligatoire. | `{{components.fileinput1.isMandatory}}` |
| isLoading | Indique si le composant est en état de chargement. | `{{components.fileinput1.isLoading}}` |
| isVisible | Indique si le composant est actuellement visible. | `{{components.fileinput1.isVisible}}` |
| isDisabled | Indique si le composant est actuellement désactivé. | `{{components.fileinput1.isDisabled}}` |

## Validation

| <div style={{ width:"130px"}}> Option de validation </div> | <div style={{ width:"230px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Mark as mandatory | Affiche une erreur de validation si aucun fichier n'est sélectionné à la soumission du formulaire. | Bouton bascule (par défaut : désactivé). |
| File type | Restreint les types de fichiers acceptés à l'aide de types MIME ou d'extensions. | Chaîne de caractères (ex. `image/*`, `.pdf`, `*/*`). Par défaut : `*/*`. |
| Min size (Bytes) | La taille de fichier minimale autorisée en octets. | Nombre (par défaut : `50`). |
| Max size (Bytes) | La taille de fichier maximale autorisée en octets. | Nombre (par défaut : `51200000`, ~51 Mo). |
| Min files | Le nombre minimum de fichiers requis. Affiché uniquement lorsque **Allow uploading multiple files** est activé. | Nombre (par défaut : `0`). |
| Max files | Le nombre maximum de fichiers que l'utilisateur peut sélectionner. Affiché uniquement lorsque **Allow uploading multiple files** est activé. | Nombre (par défaut : `2`). |

:::info
Les types de fichiers doivent être des [types MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) ou des extensions de fichier valides. La détection du type MIME peut varier selon les plateformes — par exemple, les fichiers CSV sont signalés comme `text/plain` sur macOS et `application/vnd.ms-excel` sur Windows.
:::

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une chaîne de caractères à afficher. | Chaîne de caractères (ex. `Upload your expense receipt here.`). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label

| <div style={{ width:"120px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"230px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Color | Définit la couleur du texte du libellé. | Sélectionnez une couleur du thème ou choisissez-la dans le sélecteur de couleur. |
| Alignment | Contrôle si le libellé apparaît au-dessus (**Top**) ou à côté (**Side**) du champ de saisie. | Interrupteur — **Top** (par défaut) / **Side**. |
| Direction | Lorsque l'alignement est **Side**, positionne le libellé à gauche ou à droite du champ de saisie. | Bouton bascule à icône — Left (par défaut) / Right. |
| Width | Lorsque l'alignement est **Side**, détermine si la largeur du libellé s'ajuste automatiquement ou utilise une valeur fixe. | Case à cocher — **Auto** (par défaut). Décochez pour définir une largeur personnalisée. |
| Label width | Définit une largeur fixe pour le libellé. Disponible uniquement lorsque l'alignement **Side** est sélectionné et que la largeur **Auto** est décochée. | Curseur (pourcentage de la largeur du composant). |
| Width type | Spécifie si la largeur du libellé est mesurée par rapport à l'ensemble du composant ou uniquement par rapport au champ de saisie. Disponible uniquement lorsque l'alignement **Side** est sélectionné et que la largeur **Auto** est décochée. | Sélectionnez — **Of the Component** (par défaut) / **Of the Field**. |

### Field

| <div style={{ width:"120px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"230px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Icon | Définit l'icône affichée dans le bouton **Browse**. Activez/désactivez le bouton bascule de visibilité pour afficher ou masquer l'icône, et définissez la couleur de l'icône à l'aide du sélecteur de couleur. | Sélecteur d'icône avec bouton bascule de visibilité et sélecteur de couleur. |
| Background | Définit la couleur de fond du champ de saisie. | Sélectionnez une couleur du thème ou choisissez-la dans le sélecteur de couleur. |
| Border | Définit la couleur de la bordure du champ de saisie. | Sélectionnez une couleur du thème ou choisissez-la dans le sélecteur de couleur. |
| Accent | Définit la couleur d'accentuation utilisée pour les éléments interactifs comme le bouton Browse. | Sélectionnez une couleur du thème ou choisissez-la dans le sélecteur de couleur. |
| Text | Définit la couleur du texte du nom de fichier sélectionné. | Sélectionnez une couleur du thème ou choisissez-la dans le sélecteur de couleur. |
| Error text | Définit la couleur des messages d'erreur de validation affichés sous le champ. | Sélectionnez une couleur du thème ou choisissez-la dans le sélecteur de couleur. |
| Border radius | Arrondit les coins du champ de saisie. | Nombre (par défaut : `6`). Saisissez une valeur ou cliquez sur **fx** pour la définir de manière programmatique. |
| Box shadow | Ajoute un effet d'ombre autour du champ de saisie. | Définissez la couleur et les propriétés de l'ombre, ou configurez-les de manière programmatique avec **fx**. |

### Container

| <div style={{ width:"120px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"230px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Padding | Contrôle le padding interne du composant. | Interrupteur (**Default** / **None**). |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Signalez-le via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

---
id: file-button
title: File Button
---

**File Button** est un composant de type bouton qui ouvre la boîte de dialogue de sélection de fichiers au clic, permettant aux utilisateurs de sélectionner et d'uploader des fichiers. Une fois les fichiers sélectionnés, le libellé du bouton se met à jour pour afficher le nombre de fichiers sélectionnés, et les données du fichier sont mises à disposition via des variables exposées pour être utilisées dans les queries et d'autres composants.

## Exemple d'utilisation

Une entreprise de logistique développe un outil interne pour traiter les commandes d'expédition en masse. Les employés cliquent sur le **File Button** pour uploader un fichier CSV contenant des centaines de commandes. Les données CSV analysées sont ensuite liées à une requête de table qui insère chaque ligne dans la base de données, éliminant ainsi complètement la saisie manuelle des données.

## Propriétés

| Propriété | Description | Valeur attendue |
|:---------|:------------|:---------------|
| Button text | Le libellé affiché sur le bouton avant qu'un fichier ne soit sélectionné. Se met à jour pour afficher le nombre de fichiers après la sélection. | Chaîne de caractères (ex. `Upload file`). Par défaut : `Upload file`. |
| Enable multiple files | Permet aux utilisateurs de sélectionner plusieurs fichiers à la fois. | Activez/désactivez le bouton bascule ou utilisez **fx** pour définir `{{true}}` ou `{{false}}`. Par défaut : `false`. |
| Parse file content | Lorsque cette option est activée, ToolJet lit et analyse automatiquement le contenu des fichiers sélectionnés en données structurées. | Activez/désactivez le bouton bascule ou utilisez **fx** pour définir `{{true}}` ou `{{false}}`. Par défaut : `false`. |
| File type | Spécifie le format utilisé par ToolJet pour analyser le contenu du fichier. Affiché uniquement lorsque **Parse file content** est activé. | Sélectionnez l'une des options suivantes : `Autodetect from extension`, `CSV`, `XLS`, `XLSX`, `JSON`. Par défaut : `Autodetect from extension`. |
| Delimiter | Le caractère utilisé pour séparer les valeurs lors de l'analyse des fichiers CSV. Affiché uniquement lorsque **Parse file content** est activé et que **File type** est `CSV`. | Chaîne de caractères (ex. `,` ou `;`). Par défaut : `,`. |

## Événements

| Événement | Description |
|:------|:------------|
| On file selected | Se déclenche immédiatement lorsque l'utilisateur choisit un fichier dans la boîte de dialogue, avant que le contenu ne soit lu. |
| On file loaded | Se déclenche une fois que le fichier a été entièrement lu et traité par ToolJet. |

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant File Button peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA) :

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> Comment y accéder </div> |
|:-------------|:------------|:--------------|
| clear() | Efface tous les fichiers sélectionnés et réinitialise le libellé du bouton. | Utilisez une requête RunJS : `await components.filebutton1.clear()` ou déclenchez-la via un événement. |
| setFocus() | Donne le focus au File Button. | Utilisez une requête RunJS : `await components.filebutton1.setFocus()` ou déclenchez-la via un événement. |
| setBlur() | Retire le focus du File Button. | Utilisez une requête RunJS : `await components.filebutton1.setBlur()` ou déclenchez-la via un événement. |
| setVisibility() | Affiche ou masque le composant. | Utilisez une requête RunJS : `await components.filebutton1.setVisibility(true)` ou déclenchez-la via un événement. |
| setDisable() | Active ou désactive le composant. | Utilisez une requête RunJS : `await components.filebutton1.setDisable(true)` ou déclenchez-la via un événement. |
| setLoading() | Bascule l'indicateur de chargement sur le bouton. | Utilisez une requête RunJS : `await components.filebutton1.setLoading(true)` ou déclenchez-la via un événement. |

## Variables exposées

| Variable | Description | Comment y accéder |
|:---------|:------------|:-------------|
| files | Tableau d'objets fichiers traités. Chaque objet contient `name`, `size`, `type`, `content` (texte brut), `base64Data`, `parsedValue` (données structurées analysées) et `lastModified`. | `{{components.filebutton1.files}}` |
| fileSize | Taille totale en octets de tous les fichiers actuellement sélectionnés. | `{{components.filebutton1.fileSize}}` |
| isParsing | `true` pendant que ToolJet lit et analyse activement le contenu du fichier. | `{{components.filebutton1.isParsing}}` |
| isValid | `true` lorsque les règles de validation du composant sont satisfaites (vérification obligatoire et nombre minimum de fichiers). | `{{components.filebutton1.isValid}}` |
| isMandatory | `true` lorsque l'option de validation **Make this field mandatory** est activée. | `{{components.filebutton1.isMandatory}}` |
| isLoading | `true` lorsque le composant est en état de chargement. | `{{components.filebutton1.isLoading}}` |
| isVisible | `true` lorsque le composant est visible. | `{{components.filebutton1.isVisible}}` |
| isDisabled | `true` lorsque le composant est désactivé. | `{{components.filebutton1.isDisabled}}` |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
|:----------------|:------------------------------------------------|:-----------------------------|
| Make this field mandatory | Marque la sélection de fichier comme obligatoire. Affiche un message d'erreur si l'utilisateur soumet sans sélectionner de fichier. | Activez/désactivez le bouton bascule ou utilisez **fx**. Par défaut : `false`. |
| File type | Restreint les types de fichiers acceptés par le sélecteur. Prend en charge les types MIME et les extensions. | Chaîne de caractères (ex. `image/*`, `.pdf`, `image/png,.pdf`). Par défaut : `*/*` (tous les types). |
| Min size (bytes) | La taille minimale autorisée pour chaque fichier. Les fichiers plus petits sont rejetés. | Nombre (ex. `1024` pour 1 Ko). Par défaut : `0`. |
| Max size (bytes) | La taille maximale autorisée pour chaque fichier. Les fichiers plus volumineux sont rejetés. | Nombre (ex. `1048576` pour 1 Mo). Par défaut : `1048576`. |
| Min file count | Le nombre minimum de fichiers qui doivent être sélectionnés. Affiché uniquement lorsque **Enable multiple files** est activé. | Nombre (ex. `1`). Par défaut : `1`. |
| Max file count | Le nombre maximum de fichiers pouvant être sélectionnés. Affiché uniquement lorsque **Enable multiple files** est activé. | Nombre (ex. `5`). Par défaut : `2`. |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
|:------------------|:------------|:------------------------------|
| Enable clear selection | Affiche un bouton **×** à l'intérieur du File Button après la sélection des fichiers, permettant aux utilisateurs d'effacer la sélection sans re-cliquer sur le bouton. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. | Chaîne de caractères (ex. `Click to upload a file`). |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
|:---------- |:----------- |:----------|
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### Label and Icon

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
|:---------------|:------------|:---------------|
| Label size | Définit la taille de police du libellé du bouton. | Nombre en pixels (ex. `14`). Par défaut : `14`. |
| Label weight | Définit le poids de la police du libellé du bouton. | Sélectionnez `Normal`, `Medium` ou `Bold`. Par défaut : `Medium`. |
| Label color | Définit la couleur du texte du libellé du bouton. | Sélectionnez une couleur à l'aide du sélecteur de couleur ou définissez-la de manière programmatique avec **fx** en utilisant un code hexadécimal. |
| Icon | Définit une icône affichée à côté du libellé du bouton. | Activez la visibilité de l'icône, puis sélectionnez l'icône souhaitée dans le sélecteur d'icônes. |
| Icon color | Définit la couleur de l'icône. | Sélectionnez une couleur à l'aide du sélecteur de couleur ou définissez-la de manière programmatique avec **fx**. |
| Icon direction | Contrôle si l'icône apparaît à gauche ou à droite du libellé. | Sélectionnez `Left` ou `Right`. |
| Loader color | Définit la couleur de l'indicateur de chargement affiché lorsque le bouton est en état de chargement. | Sélectionnez une couleur à l'aide du sélecteur de couleur ou définissez-la de manière programmatique avec **fx**. |
| Content alignment | Contrôle l'alignement horizontal du contenu du bouton (libellé et icône). | Sélectionnez `Left`, `Center` ou `Right`. |

### Button

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
|:---------------|:------------|:---------------|
| Button type | Définit le style visuel du bouton. | Sélectionnez `Solid` pour un bouton plein ou `Outline` pour un bouton transparent avec une bordure. Par défaut : `Solid`. |
| Background | Définit la couleur de fond du bouton. Disponible uniquement lorsque **Button type** est `Solid`. | Sélectionnez une couleur à l'aide du sélecteur de couleur ou définissez-la de manière programmatique avec **fx** en utilisant un code hexadécimal. |
| Border radius | Contrôle l'arrondi des coins du bouton. | Nombre en pixels (ex. `6`). Par défaut : `6`. |
| Box shadow | Ajoute un effet d'ombre au bouton. Disponible uniquement lorsque **Button type** est `Solid`. | Utilisez l'éditeur d'ombre ou définissez-la de manière programmatique avec **fx**. |
| Padding | Contrôle si le bouton utilise le padding par défaut ou aucun padding. | Sélectionnez `Default` ou `None`. |

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

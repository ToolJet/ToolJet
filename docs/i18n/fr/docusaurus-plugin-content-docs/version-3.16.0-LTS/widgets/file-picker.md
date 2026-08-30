---
id: file-picker
title: File Picker
---

Le composant **File Picker** permet à l'utilisateur de glisser-déposer des fichiers ou d'en uploader en parcourant le système de fichiers et en sélectionnant un ou plusieurs fichiers dans un répertoire.

:::info
Les types de fichiers doivent être un type [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) valide selon la spécification de l'élément input, ou une extension de fichier valide.

Pour accepter n'importe quel type de fichier, définissez `Accept file types` sur une valeur vide.
:::

:::tip
La détermination du type [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) n'est pas fiable selon les plateformes. Les fichiers CSV, par exemple, sont signalés comme text/plain sous macOS mais comme application/vnd.ms-excel sous Windows.
:::

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Texte à afficher comme libellé du champ. | Chaîne de caractères |
| Placeholder | Une indication affichée pour guider l'utilisateur. | Chaîne de caractères |
| Use drop zone | Crée une zone de glisser-déposer. Les fichiers peuvent être glissés-déposés dans la zone « drag & drop ». | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Use file picker | Au clic, invoque la boîte de dialogue de fichiers par défaut du système d'exploitation. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Allow picking multiple files | Permet le glisser-déposer (ou la sélection depuis la boîte de dialogue) de plusieurs fichiers. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Enable parsing | Active l'analyse pour convertir automatiquement les fichiers uploadés en données utilisables dans votre application. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| File Type | Lorsque l'analyse est activée, vous pouvez choisir le type de fichier dans la liste déroulante - Autodetect Extension, CSV, TSV, XLS, ou XLSX. Lorsque CSV est sélectionné, vous pouvez également choisir le délimiteur utilisé pour séparer les valeurs. | Choisissez dans la liste déroulante. |

## Événements

| <div style={{ width:"135px"}}> Événement </div> | <div style={{ width:"100px"}}> Description </div>                              |
| :------------------------------------------ | :----------------------------------------------------------------------------- |
| On file selected                            | Se déclenche chaque fois qu'un ou plusieurs fichiers sont sélectionnés via la boîte de dialogue du sélecteur. |
| On file loaded                              | Se déclenche chaque fois qu'un fichier est chargé dans le navigateur.                             |
| On file deselected                          | Se déclenche chaque fois qu'un ou plusieurs fichiers sont retirés du sélecteur.               |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Les actions suivantes du composant peuvent être contrôlées à l'aide des actions spécifiques au composant (CSA), vous pouvez les déclencher via un événement ou utiliser une requête RunJS.

| <div style={{ width:"110px"}}> Actions </div> | <div style={{ width:"200px"}}> Description </div>         | <div style={{ width:"150px"}}> Comment y accéder </div> |
| :-------------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------- |
| clearFiles( )                                 | Efface les fichiers sélectionnés du composant File Picker. | `components.filepicker1.clearFiles()`               |
| setFileName( )                                | Définit le nom de fichier pour le fichier uploadé.                 | `components.filepicker1.setFileName()`              |
| setVisibility( )                              | Définit la visibilité du composant.                     | `components.filepicker1.setVisibility()`            |
| setLoading( )                                 | Définit l'état de chargement du composant.                  | `components.filepicker1.setLoading()`               |
| setDisable( )                                 | Désactive le composant.                                   | `components.filepicker1.setDisable()`               |

## Variables exposées

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"200px"}}> Description </div>         | <div style={{ width:"200px"}}> Comment y accéder </div> |
| :---------------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------- |
| file                                            | Contient les informations du fichier chargé dans le File Picker.      | `{{components.filepicker1.file}}`                   |
| isParsing                                       | Indique si l'analyse est activée                       | `{{components.filepicker1.isParsing}}`              |
| isValid                                         | Indique si le fichier uploadé est valide.                  | `{{components.filepicker1.isValid}}`                |
| fileSize                                        | Stocke la taille du fichier.                                     | `{{components.filepicker1.fileSize}}`               |
| isMandatory                                     | Indique si le composant est obligatoire.                  | `{{components.filepicker1.isMandatory}}`            |
| isLoading                                       | Indique si le composant est en cours de chargement.                    | `{{components.filepicker1.isLoading}}`              |
| isVisible                                       | Indique si le composant est visible.                    | `{{components.filepicker1.isVisible}}`              |
| isDisabled                                      | Indique si le composant est désactivé.                   | `{{components.filepicker1.isDisabled}}`             |
| files                                           | Contient un tableau d'objets fichiers chargés dans le File Picker. | `{{components.filepicker1.files}}`                  |

## Validation

| <div style={{ width:"100px"}}> Option de validation </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Valeur attendue </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Affiche un message « This field is mandatory. Please select a file. » si aucun fichier n'est sélectionné. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| File type | Sélectionnez le type de fichier acceptable. | Choisissez dans la liste déroulante ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Min size limit | Définit la taille minimale de fichier pouvant être uploadée. | Taille de fichier en octets. |
| Max size limit | Définit la taille maximale de fichier pouvant être uploadée. | Taille de fichier en octets. |
| Min file count | Définit le nombre minimum de fichiers à uploader. | Numérique |
| Max file count | Définit le nombre maximum de fichiers pouvant être uploadés. | Numérique |

## Actions supplémentaires

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Active un indicateur de chargement, souvent utilisé avec `isLoading` pour indiquer une progression. Bascule ou configuration dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Contrôle la visibilité du composant. Bascule ou configuration dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Disable | Active ou désactive le composant. Bascule ou configuration dynamique. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Tooltip | Fournit des informations supplémentaires au survol. Définissez une chaîne de caractères à afficher. | Chaîne de caractères |

## Appareils

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Valeur attendue </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Rend le composant visible en vue bureau. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Show on mobile | Rend le composant visible en vue mobile. | Vous pouvez le définir avec le bouton bascule ou configurer dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

## Styles

### File Drop Area

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Title | Définit la couleur du texte du titre. | Sélectionnez un thème ou choisissez dans le sélecteur de couleur. |
| Active color | Définit la couleur de l'état actif. | Sélectionnez un thème ou choisissez dans le sélecteur de couleur. |
| Error color | Définit la couleur du texte d'erreur. | Sélectionnez un thème ou choisissez dans le sélecteur de couleur. |

### Container

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Background | Définit la couleur de fond du composant. | Sélectionnez un thème ou choisissez dans le sélecteur de couleur. |
| Border | Définit la couleur de la bordure du composant. | Sélectionnez un thème ou choisissez dans le sélecteur de couleur. |
| Border radius | Modifie le rayon de bordure du composant. | Saisissez un nombre ou cliquez sur **fx** et saisissez un code qui renvoie de manière programmatique une valeur numérique. |
| Box shadow | Définit les propriétés de l'ombre du composant.  | Sélectionnez la couleur de l'ombre et ajustez les propriétés associées, ou définissez-la de manière programmatique avec **fx**. |
| Padding | Vous permet de maintenir un padding standard. | Valeur numérique. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée à l'aide de **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** n'est disponible que si votre plan a la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)** activée.
:::

:::info
Toute propriété disposant d'un bouton **fx** à côté de son champ peut être **configurée de manière programmatique**.
:::

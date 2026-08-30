---
id: table-columns
title: Table Columns
---

Chaque fois que des données sont chargées dans une Table, les colonnes sont générées automatiquement. Vous pouvez ajouter, supprimer ou modifier des colonnes en accédant aux propriétés de la table dans la section colonnes. Vous pouvez également réorganiser les colonnes par glisser-déposer.

<img className="screenshot-full img-full" src="/img/widgets/table/columns-v3.png" alt="ToolJet - Component Reference - Columns" />

## Use Dynamic Column

Le bouton bascule **Use dynamic column** permet aux utilisateurs de définir dynamiquement les colonnes de la Table à l'aide d'une valeur JSON.

Par exemple, si vous saisissez le JSON ci-dessous, la table affichera une colonne intitulée "Name" où les entrées de données sont des chaînes modifiables, dont la longueur est limitée entre 5 et 20 caractères, affichées en texte blanc sur un fond noir.

```json
{
   "name":"Name",
   "columnType":"string",
   "key":"first_name",
   "cellBackgroundColor":"#000",
   "textColor":"#fff",
   "isEditable":true,
   "regex":"",
   "maxLength":20,
   "minLength":5,
   "customRule":""
}
```

<img className="screenshot-full img-full" src="/img/widgets/table/dynamic-columns-v3.png" alt="ToolJet - Component Reference - Dynamic Columns" />

## Types de colonnes

Le composant table prend en charge les types de colonnes suivants :

- **[String](#string)**
- **[Number](#number)**
- **[Text](#text)**
- **[Date Picker](#date-picker)**
- **[Select](#select)**
- **[Multiselect](#multiselect)**
- **[Tags](#tags)**
- **[Boolean](#boolean)**
- **[Image](#image)**
- **[Link](#link)**
- **[Rating](#rating)**
- **[Button](#button)**
- **[Default](#default-deprecated)** - Obsolète
- **[Dropdown](#dropdown-deprecated)** - Obsolète
- **[Multiselect](#multiselect-deprecated)** - Obsolète
- **[Toggle switch](#toggle-switch-deprecated)** - Obsolète
- **[Radio](#radio-deprecated)** - Obsolète
- **[Badge](#badge-deprecated)** - Obsolète
- **[Multiple Badges](#multiple-badges-deprecated)** - Obsolète
- **[Tags](#tags-deprecated)** - Obsolète

### String

Ce type de colonne est utilisé pour les colonnes contenant des valeurs textuelles. Contrairement au type de colonne text, le type string ne prend pas en charge le texte multi-lignes.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Name`).       |
| Key | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `product_name`).       |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`. | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`. |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	| Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur. |
| Text Color | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Number

Sélectionner le type de colonne number chargera des données numériques dans les cellules de la colonne.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name  | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Quantity`).  |
| Key          | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `quantity`).   |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`. | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.  |
| Decimal places  | Spécifie le nombre de décimales pour les valeurs numériques. | Entier (par ex., `{{2}}`).  |    
| Make Editable  | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne.  | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique.  |
| Visibility   | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment  | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	| Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur. |
| Text Color | Modifie la couleur du texte dans la colonne. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Text

Le type de colonne text peut être utilisé pour du texte multi-lignes.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name  | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Description`).  |
| Key   | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `product_description`). |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`. | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`. |
| Make Editable  | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	| Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur. |
| Text Color     | Modifie la couleur du texte dans la colonne.                                                                             | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule.                                                                                 | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Date Picker

Le type Date Picker peut être utilisé pour afficher des dates.

#### Properties

| Property           | Description     | Expected Value  |
|:-------------------|:----------------|:-----------------|
| Column Name   | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table.   | Date (par ex., `13/09/1990`)  |
| Key    | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `listing_date`)                                       |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.   | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`. |
| Make Editable      | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne.   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility  | Cette option est activée par défaut. La désactiver masque la colonne de la table.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Date format

| Property  | Description | Configuration Options  |
|:----------|:------------|:-----------------|
| Enable date | Active l'option permettant de modifier le format de la date. | Utilisez le bouton bascule ou cliquez sur **fx** et saisissez une expression logique. |
| Date format | Configure le format d'affichage des valeurs de date dans la colonne. | Utilisez la liste déroulante avec des formats courants (par défaut : `DD/MM/YYYY`) ou cliquez sur **fx** et saisissez une expression logique. |
| Enable time | Active l'option permettant de modifier le format de l'heure. | Utilisez le bouton bascule ou cliquez sur **fx** et saisissez une expression logique. |
| Enable 24 hr time format | Active l'option permettant de modifier le format de l'heure sur 24 heures. | Utilisez le bouton bascule ou cliquez sur **fx** et saisissez une expression logique. |
| Time zone | Permet de sélectionner le fuseau horaire. | Utilisez la liste déroulante pour sélectionner le fuseau horaire. |

#### Parse format

| Property | Description | Configuration Options  |
|:---------|:------------|:-----------------|
| Parse in unix timestamp | Active l'analyse et l'affichage des données de date, d'heure et de fuseau horaire. | Utilisez le bouton bascule ou cliquez sur **fx** et saisissez une expression logique. |
| Unix timestamp | Choisissez entre `s` ou `ms` comme format.  | Utilisez la liste déroulante pour sélectionner le format d'horodatage unix souhaité. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment   | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	| Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur. |
| Text Color   | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Select

La colonne select peut être utilisée pour afficher ou sélectionner un seul élément dans une liste.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name   | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Category`).       |
| Key | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `category`).  |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.  |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne.  | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique.  |
| Visibility | Cette option est activée par défaut. La désactiver masque la colonne de la table.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Options 

Les options permettent de fournir les valeurs de la colonne select sous forme de tableau. Vous pouvez cliquer sur le bouton **Add new option** et saisir `Option label` et `Option value` pour créer une nouvelle option. Vous pouvez activer le bouton bascule `Make this option as default` pour marquer une option comme valeur par défaut. Vous pouvez également activer `Dynamic option` et saisir un tableau de valeurs et d'étiquettes. **Auto assign colors** peut être activé pour attribuer un code couleur aux étiquettes afin de distinguer visuellement les informations dans la table.

```js
{{[{ label: "Mobile Phones", value: "mobile-phones" },
  { label: "Smartphones", value: "smartphones" },
  { label: "Compact Cameras", value: "compact-cameras" },
  { label: "DSLR Cameras", value: "dslr-cameras" },
  { label: "Smart Watches", value: "smart-watches" },
]}}
```

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur.   |
| Text Color     | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### MultiSelect

La colonne MultiSelect peut être utilisée pour afficher ou sélectionner plusieurs éléments dans une liste.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name   | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Locations`).       |
| Key   | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `locations`). |
| Transformation  | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.    |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Options 

Les options permettent de fournir les valeurs de la colonne select sous forme de tableau. Vous pouvez cliquer sur le bouton **Add new option** et saisir `Option label` et `Option value` pour définir les valeurs d'options. Vous pouvez activer le bouton bascule `Make this option as default` pour marquer une option comme valeur par défaut. Vous pouvez également activer `Dynamic option` et saisir un tableau de valeurs et d'étiquettes. **Auto assign colors** peut être activé pour attribuer un code couleur aux étiquettes afin de distinguer visuellement les informations dans la table.

```js
{{[{ label: "Technology", value: "technology" },
  { label: "Apparrel", value: "apparrel" },
  { label: "Jewelry", value: "jewelry" },
  { label: "Furniture", value: "furniture" },
]}}
```

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur. |
| Text Color     | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Boolean

Le type de colonne boolean peut être utilisé pour afficher des valeurs booléennes. Si la valeur est true, une coche verte s'affiche, et pour les valeurs false, une croix rouge s'affiche.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column name   | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Validity`).       |
| Key   | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `is_valid`).  |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`. |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique.  |
| Visibility  | Cette option est activée par défaut. La désactiver masque la colonne de la table.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	 | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur.       |
| Checked  | Sélectionnez la couleur pour la case cochée.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Unchecked | Sélectionnez la couleur pour la case non cochée. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color | Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Image

Le type de colonne image peut être utilisé pour afficher des images.

#### Properties

| Property  | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column name  | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Image`).       |
| Key   | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `product_image`).       |
| Transformation  | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.  |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	| Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur. |
| Text Color  | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color | Ajuste la couleur de fond de la cellule.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. | 

### Link

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Description`).       |
| Key         | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `id`).       |
| Transformation  | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.  |
| Display Text | Choisissez le texte d'affichage du lien. | Chaîne |
| Open in new tab | Activez pour ouvrir le lien dans un nouvel onglet à chaque clic. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment  | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur.       |
| Text Color      | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.|

### Rating

Le type de colonne Rating affiche une notation interactive en étoiles ou en cœurs dans les cellules de la table. Ceci est utile pour afficher des avis clients, des évaluations de produits, des niveaux de priorité, ou toute donnée pouvant être représentée sur une échelle numérique.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Customer Rating`). |
| Key | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `rating`). |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`. | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`. |
| Icon | Choisissez entre étoiles ou cœurs comme icône de notation. | Basculez entre `Stars` et `Hearts` (par défaut : `Stars`). |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Options

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Max rating | Définit le nombre maximum d'icônes de notation à afficher. | Entier (par défaut : `5`). |
| Default rating | Définit la valeur de notation par défaut pour les cellules vides ou nulles. | Entier (par ex., `3`). |
| Allow half rating | Active les notations en demi-étoile ou demi-cœur pour des valeurs plus précises. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique (par défaut : `false`). |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Alignment | Aligne les icônes de notation dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur. |
| Selected color | Définit la couleur des icônes de notation sélectionnées (remplies). | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal (par défaut : `#EFB82D` pour les étoiles, `#EE5B67` pour les cœurs). |
| Unselected color | Définit la couleur des icônes de notation non sélectionnées (vides). | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |

### JSON

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Description`).       |
| Key         | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `id`).       |
| Transformation  | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.  |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Indent | Choisissez d'afficher ou non le JSON dans un format indenté. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment  | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur.       |
| Text Color | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color | Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Markdown

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Description`). |
| Key         | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `id`). |
| Transformation  | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.  |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment  | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur.       |
| Text Color | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color | Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### HTML

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Description`). |
| Key         | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie. | Chaîne (par ex., `id`). |
| Transformation  | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.  | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`.  |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment  | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur.       |
| Text Color | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color | Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Tags

Le type de colonne **Tags** affiche les valeurs sous forme de puces (chips) colorées. Il prend en charge à la fois une liste prédéfinie d'options et des tags créés par l'utilisateur au moment de l'exécution.

#### Properties

| Property                | Description                                                                                                                                                     | Expected Value |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Column Name             | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table.                                                                                                                    | Chaîne (par ex., `Status`). |
| Key                     | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise **Column name** si aucune clé n'est fournie.                                                  | Chaîne (par ex., `status`). |
| Options                 | Définissez la liste des options de tag prédéfinies. Chaque option nécessite un **label** (texte affiché) et une **value** (valeur stockée).                                   | Tableau d'objets, par ex., `[{label: "Active", value: "active"}]`. |
| Allow multi-select      | Lorsque cette option est activée, plusieurs tags peuvent être sélectionnés par cellule. Les nouveaux tags ajoutés par l'utilisateur sont ajoutés à la sélection. Lorsqu'elle est désactivée, un nouveau tag remplace le tag actuel. | Bouton bascule ou expression **fx**. |
| Auto-assign colors      | Attribue automatiquement une couleur unique à chaque tag en fonction de sa valeur.                                                                                            | Bouton bascule ou expression **fx**. |
| Make Editable           | Permet aux utilisateurs finaux de choisir parmi les options prédéfinies ou d'ajouter de nouveaux tags en saisissant du texte dans la zone de recherche et en appuyant sur **Enter** ou en cliquant sur **Add**. Une icône de croix apparaît sur chaque puce lorsque la colonne est modifiable. | Bouton bascule ou expression **fx**. |
| Visibility              | Contrôle la visibilité de la colonne.                                                                                                                                     | Bouton bascule ou expression **fx**. |

:::info
Lorsqu'un utilisateur ajoute un nouveau tag qui ne figure pas dans la liste prédéfinie, le `label` et la `value` de ce tag sont tous deux définis sur le texte saisi par l'utilisateur. Les nouveaux tags se propagent dans `changeSet`, `dataUpdates` et les variables exposées associées de la même manière que les modifications apportées aux colonnes **Select** ou **MultiSelect**.
:::

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment  | Aligne les puces de tag dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`. |
| Cell Color | Ajuste la couleur de fond de la cellule. | Sélectionnez une couleur ou utilisez **fx** pour renvoyer un code couleur hexadécimal. |

---

### Button

Le type de colonne **Button** affiche un ou plusieurs boutons d'action à l'intérieur de chaque cellule de la table. Il remplace l'ancienne section Action Buttons par une configuration de bouton entièrement paramétrable par colonne, prenant en charge les icônes, les infobulles, les états de chargement, la visibilité et des styles programmables.

Vous pouvez ajouter **plusieurs colonnes Button** à la même table et positionner chaque colonne où vous le souhaitez en la faisant glisser dans la liste des colonnes.

#### Ajouter et réorganiser les boutons dans une colonne

Cliquez sur l'option **+ Add button** à l'intérieur d'une colonne Button pour ajouter des boutons. Utilisez les poignées de glissement dans la liste des boutons pour les réorganiser au sein de la colonne.

#### Properties (par bouton)

| Property              | Description                                                                                                                          | Expected Value |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Button label          | Définit le texte affiché sur le bouton. Prend en charge **fx** pour des valeurs dynamiques.                                                           | Chaîne ou expression **fx** (par ex., `{{rowData.status === 'active' ? 'Deactivate' : 'Activate'}}`). |
| Tooltip               | Affiche une infobulle lorsque l'utilisateur survole le bouton. Prend en charge **fx**.                                                               | Chaîne ou expression **fx**. |
| Loading state         | Affiche un indicateur de chargement sur le bouton. Prend en charge **fx** pour un contrôle programmatique (par ex., lier à la propriété `isLoading` d'une requête).      | Bouton bascule ou expression **fx**. |
| Visibility            | Contrôle la visibilité du bouton. Utilisez **fx** pour l'afficher ou le masquer conditionnellement selon les données de la ligne.                                  | Bouton bascule ou expression **fx** (par ex., `{{rowData.role === 'admin'}}`). |
| Disable action button | Désactive le bouton lorsque l'expression est `true`.                                                                                   | Bouton bascule ou expression **fx** (par ex., `{{rowData.status === 'locked'}}`). |
| On click              | Gestionnaire d'événement déclenché lorsque le bouton est cliqué. Le clic met également à jour la variable exposée `selectedRow` de la Table.                    | Gestionnaire d'événement. |

#### Styles (par bouton)

| Style Property    | Description                                                                              | Configuration Options |
| :---------------- | :--------------------------------------------------------------------------------------- | :--------------------- |
| Button type       | Définit la variante du bouton.                                                                 | **Solid** ou **Outline**. |
| Background        | Définit la couleur de fond (mode Solid uniquement). Prend en charge **fx**.                            | Sélecteur de couleurs ou expression **fx**. |
| Label color       | Définit la couleur du texte du bouton. Prend en charge **fx**.                                             | Sélecteur de couleurs ou expression **fx**. |
| Border color      | Définit la couleur de bordure. Prend en charge **fx**.                                                  | Sélecteur de couleurs ou expression **fx**. |
| Loader color      | Définit la couleur de l'indicateur de chargement. Prend en charge **fx**.                                  | Sélecteur de couleurs ou expression **fx**. |
| Icon              | Attache une icône au bouton. Utilisez le sélecteur d'icônes pour en choisir une, et activez/désactivez sa visibilité. | Sélecteur d'icônes. |
| Icon color        | Définit la couleur de l'icône. Prend en charge **fx**.                                                    | Sélecteur de couleurs ou expression **fx**. |
| Icon alignment    | Positionne l'icône à gauche ou à droite de l'étiquette.                                   | Bascule Gauche / Droite. |
| Border radius     | Définit le rayon de bordure du bouton en pixels. Prend en charge **fx**.                                | Nombre ou expression **fx**. |

---

### Default (Deprecated)

Cette colonne par défaut est utilisée pour afficher du texte.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name  | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Product Description`).       |
| Key  | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `product_description`).       |
| Transformation | Permet de transformer la valeur d'une cellule. La valeur par défaut est `{{cellValue}}`.   | Utilisez JavaScript pour générer une valeur dynamique, par ex., `{{cellValue > 4.5 ? 5 : 4}}`. |
| Make Editable  | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Cette option est activée par défaut. La désactiver masque la colonne de la table.   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles
| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	| Réglez l'alignement sur `left`, `center`, ou `right`, spécifiable via le sélecteur.       |
| Text Color     | Modifie la couleur du texte dans la colonne. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color | Ajuste la couleur de fond de la cellule.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Dropdown (Deprecated)

Le type de colonne **Dropdown** est utilisé pour afficher une liste déroulante dans les cellules de la colonne à partir des données de la colonne.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name  | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Category`). |
| Key  | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `category_id`).       |
| Values | Fournissez les valeurs de la liste déroulante sous forme de tableau. | Tableau (par ex., `[1, 2, 3]`). |
| Labels | Fournissez les étiquettes des valeurs de la liste déroulante sous forme de tableau.  | Tableau (par ex., `["Option 1", "Option 2", "Option 3"]`). |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne.  | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique.  |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment   | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	 | Réglez l'alignement sur `left`, `center`, ou `right`.    |
| Text Color    | Modifie la couleur du texte dans la colonne.   | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Multiselect (Deprecated)

Le type de colonne multiselect est utilisé pour afficher plusieurs sélections ou une liste déroulante dans les cellules de la colonne à partir des données de la colonne.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name  | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Tags`).       |
| Key  | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.            | Chaîne (par ex., `tag_ids`).       |
| Values | Fournissez les valeurs de la liste déroulante sous forme de tableau.  | Tableau (par ex., `[1, 2, 3]`).          |
| Labels   | Fournissez les étiquettes des valeurs de la liste déroulante sous forme de tableau.  | Tableau (par ex., `["Tag 1", "Tag 2", "Tag 3"]`). |
| Make Editable  | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique.  |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table.   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |


#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment  | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	 | Réglez l'alignement sur `left`, `center`, ou `right`.   |
| Text Color  | Modifie la couleur du texte dans la colonne. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Toggle Switch (Deprecated)

Le type de colonne **Toggle Switch** est utilisé pour afficher un interrupteur à bascule dans les cellules de la colonne, offrant un indicateur visuel clair pour les valeurs booléennes.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name          | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Active Status`).       |
| Key                  | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.            | Chaîne (par ex., `active`).       |
| Active Color         | Définissez la couleur de l'interrupteur lorsqu'il est actif.          | Code couleur (par ex., `#76D7C4`).         |
| Make Editable        | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne.  | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique.  |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	 | Réglez l'alignement sur `left`, `center`, ou `right`.  |
| Text Color | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color | Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Radio (Deprecated)

Le type de colonne **Radio** est utilisé pour afficher des boutons radio dans les cellules de la colonne, offrant une sélection à choix unique parmi plusieurs options.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Membership Type`).       |
| Key | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `membership_type`). |
| Values  | Fournissez les valeurs des boutons radio sous forme de tableau. | Tableau (par ex., `[1, 2, 3]`). |
| Labels  | Fournissez les étiquettes des valeurs des boutons radio sous forme de tableau.  | Tableau (par ex., `["Gold", "Silver", "Bronze"]`). |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique.  |
| Visibility | Cette option est activée par défaut. La désactiver masque la colonne de la table.  | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |


#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	 | Réglez l'alignement sur `left`, `center`, ou `right`.       |
| Text Color | Modifie la couleur du texte dans la colonne. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Badge (Deprecated)

Le type de colonne **Badge** est utilisé pour afficher des étiquettes ou des tags sur les colonnes, distinguant visuellement les données.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name  | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Status`).  |
| Key  | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `status`). |
| Values | Fournissez les valeurs du badge sous forme de tableau.  | Tableau (par ex., `["new", "in_progress", "completed"]`).  |
| Labels | Fournissez les étiquettes des valeurs du badge sous forme de tableau.  | Tableau (par ex., `["New", "In Progress", "Completed"]`). |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |


#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne. | Réglez l'alignement sur `left`, `center`, ou `right`.       |
| Text Color | Modifie la couleur du texte dans la colonne. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Multiple Badges (Deprecated)

Similaire au type **Badge**, le type **Multiple Badges** est utilisé pour afficher plusieurs badges dans une cellule de colonne, offrant un affichage plus nuancé des statuts ou catégories.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Features`). |
| Key  | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `features`).  |
| Values | Fournissez les valeurs des badges multiples sous forme de tableau. | Tableau (par ex., `["wifi", "bluetooth", "gps"]`).  |
| Labels | Fournissez les étiquettes des valeurs des badges multiples sous forme de tableau.  | Tableau (par ex., `["WiFi", "Bluetooth", "GPS"]`). |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility | Cette option est activée par défaut. La désactiver masque la colonne de la table. | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |


#### Styles

| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	 | Réglez l'alignement sur `left`, `center`, ou `right`.       |
| Text Color     | Modifie la couleur du texte dans la colonne.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule.  | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Tags (Deprecated)

Le type de colonne **Tags** est utilisé pour afficher un tableau de tags dans les cellules de la colonne, offrant un moyen flexible de catégoriser ou d'étiqueter les éléments dynamiquement.

#### Properties

| Property       | Description     | Expected Value |
|:--------------|:----------------|:----------------------|
| Column Name | Spécifiez le nom à afficher dans l'en-tête de la colonne de la table. | Chaîne (par ex., `Tags`).       |
| Key | Spécifiez le nom de la clé associée aux données chargées dans la table. Utilise `Column name` si aucune clé n'est fournie.  | Chaîne (par ex., `tag_list`).       |
| Make Editable | Cette option est désactivée par défaut. L'activer permet aux utilisateurs de l'application de modifier la colonne. | Activez/désactivez le bouton bascule ou configurez dynamiquement le paramètre en cliquant sur **fx** et en saisissant une expression logique. |
| Visibility    | Cette option est activée par défaut. La désactiver masque la colonne de la table.   | Activez/désactivez le bouton bascule ou configurez dynamiquement la valeur en cliquant sur **fx** et en saisissant une expression logique. |

#### Styles
| Property       | Description     | Configuration Options |
|:--------------|:----------------|:----------------------|
| Text Alignment | Aligne le texte dans les cellules de la colonne et l'en-tête de la colonne.	 | Réglez l'alignement sur `left`, `center`, ou `right`.       |
| Text Color  | Modifie la couleur du texte dans la colonne. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal. |
| Cell Color| Ajuste la couleur de fond de la cellule. | Sélectionnez la couleur ou cliquez sur **fx** et saisissez du code qui renvoie de manière programmatique un code couleur hexadécimal.| 

### Freeze Column

Chaque colonne dispose d'un paramètre **Freeze column** qui l'épingle au bord gauche ou droit de la table afin qu'elle reste visible pendant le défilement horizontal. Ceci est utile pour garder les colonnes d'identifiants clés (comme Name ou ID) toujours visibles lorsque la table comporte de nombreuses colonnes.

| Option      | Comportement                                                                 |
| :---------- | :----------------------------------------------------------------------- |
| **Left**    | La colonne reste collée au bord gauche pendant que le reste de la table défile.     |
| **Unpinned** | Par défaut — la colonne défile normalement.                                      |
| **Right**   | La colonne reste collée au bord droit pendant que le reste de la table défile.    |

Vous pouvez figer un nombre quelconque de colonnes de part et d'autre. Les colonnes figées affichent une ombre discrète à leur limite pour les distinguer visuellement des colonnes défilantes.

### Add Column

Vous pouvez ajouter une nouvelle colonne à la table en cliquant sur le bouton **+ Add new column**. En cliquant sur ce bouton, une nouvelle colonne sera ajoutée à la Table et vous pourrez modifier ses propriétés dans la section colonnes.

### Duplicate Column

En survolant une colonne, vous pouvez voir une icône de duplication à côté de l'icône de suppression, qui permet de créer une copie de la même colonne.

### Delete Column

En survolant une colonne, vous pouvez voir une icône de suppression à droite qui permet de supprimer une colonne.

### Hide columns

Vous pouvez choisir quelles colonnes afficher ou masquer dans la Table à l'aide de cette option. Vous avez également la possibilité de **[masquer le bouton du sélecteur de colonnes](/docs/widgets/table/#additional-actions)** dans les propriétés de la Table.


## Make all columns editable

Pour rendre toutes les colonnes modifiables dans votre table, vous pouvez activer le bouton bascule `Make all columns editable`. Si vous désactivez la propriété `Make editable` d'une colonne individuelle, `Make all columns editable` passera automatiquement à l'état désactivé.

## Validation

Dans les propriétés de colonne, lorsque vous activez le bouton bascule `Make editable`, vous pourrez voir des options de validation qui différeront selon le type de colonne. Par exemple, une colonne de type `string` disposera des validations suivantes.

### Regex
Utilisez ce champ pour saisir une expression régulière qui validera le contenu.

### Min length

Saisissez le nombre correspondant à la longueur minimale de caractères autorisée.

### Max length

Saisissez le nombre correspondant à la longueur maximale de caractères autorisée.

### Custom rule

Si la condition est vraie, la validation réussit ; sinon, renvoyez une chaîne qui sera affichée comme message d'erreur. Par exemple : `{{components.table1.selectedRow.id==1&&"This row can't be deleted"}}`

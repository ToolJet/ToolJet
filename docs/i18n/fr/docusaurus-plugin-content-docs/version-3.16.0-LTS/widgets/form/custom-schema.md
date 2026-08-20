---
id: schema
title: Custom Schema
---

Dans ce guide, nous allons couvrir certains des schémas personnalisés les plus couramment utilisés.
Pour plus d'informations :
- Sur la façon de générer un formulaire, consultez le guide [Generate Form](/docs/widgets/form/).
- Pour les propriétés disponibles du formulaire, consultez le guide [Properties](/docs/widgets/form/properties).
- Pour les CSA et les variables exposées, consultez le guide [CSA and Exposed Variables](/docs/widgets/form/csa).

## Datepicker

Les propriétés qui peuvent être utilisées dans le schéma Datepicker sont :

```js
  "datepicker1": {
    "type": "datepicker",
    "styles": {
      "borderRadius": 5,
      "disabled": false,
      "visibility": "true"
    },
    "value": "09/09/2025",
    "disabledDates": ["08/09/2025"],
    "enableTime": true,
    "format": "DD/MM/YYYY",
    "label": "Date of Birth"
  }
```

|  Clé | Description | Valeur attendue  |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `datepicker` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *borderRadius*, *disabled*, *visibility*, etc. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique comme 5, 10, 20 etc. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| value | Spécifie la date par défaut du datepicker. | Date dans le format correct. |
| disabledDates | Spécifie les dates que vous souhaitez désactiver. | Dates dans un tableau, dans le format correct. |
| enableTime | Spécifie s'il faut activer l'heure ou non. | Définissez `true` pour activer l'heure ou `false` pour la désactiver. |
| format | Spécifie le format de la date. | 'DD/MM/YYYY' |
| label | Spécifie le label du composant. | Toute valeur de chaîne. |

## Number Input

```js
"numberInput1": {
  "type": "number",
  "styles": {
    "backgroundColor": "#f6f5ff",
    "borderRadius": 3,
    "textColor": "#025aa3",
    "borderColor": "blue",
    "disabled": false,
    "visibility": "true"
  },
  "value": 10,
  "maxValue": 12,
  "minValue": 6,
  "placeholder": "Enter a Number",
  "label": "Number Input"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | 'number' |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *backgroundColor*, *borderRadius*, *textColor*, *borderColor*, *disabled*, *visibility* etc. |
| backgroundColor | Spécifie la couleur d'arrière-plan du composant. | Nom de couleur ou code couleur hexadécimal. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique comme 5, 10, 20 etc. |
| textColor | Spécifie la couleur du texte du composant. | Nom de couleur ou code couleur hexadécimal. |
| borderColor | Spécifie la couleur de la bordure du composant. | Nom de couleur ou code couleur hexadécimal. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| value | Spécifie la valeur par défaut du champ de saisie numérique. | Valeur numérique |
| maxValue | Spécifie la valeur maximale du champ de saisie numérique. | Valeur numérique |
| minValue | Spécifie la valeur minimale du champ de saisie numérique. | Valeur numérique |
| placeholder | Spécifie le texte d'espace réservé du champ de saisie numérique. | Toute valeur de chaîne |
| label | Spécifie le label du composant. | Toute valeur de chaîne |

## Password

```js
"passwordInput1": {
  "type": "password",
  "styles": {
    "backgroundColor": "#f6f5ff",
    "borderRadius": 5,
    "disabled": false,
    "visibility": "true"
  },
  "validation": {
    "maxLength": 9,
    "minLength": 5,
    "regex": "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$"
  },
  "placeholder": "Enter Password",
  "label": "Password"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `password` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *backgroundColor*, *borderRadius*, *disabled*, *visibility* etc. |
| backgroundColor | Spécifie la couleur d'arrière-plan du composant. | Nom de couleur ou code couleur hexadécimal. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique comme 10. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| validation | Spécifie les règles de validation pour le mot de passe. | Objet contenant les propriétés *maxLength*, *minLength*, et *regex*. |
| maxLength | Spécifie la longueur maximale du mot de passe. | Valeur numérique comme 9. |
| minLength | Spécifie la longueur minimale du mot de passe. | Valeur numérique comme 5. |
| regex | Spécifie l'expression régulière pour la validation du mot de passe. | Modèle d'expression régulière comme `'^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$'` |
| placeholder | Spécifie le texte d'espace réservé du champ de saisie du mot de passe. | Toute valeur de chaîne comme 'Enter a password'. |
| label | Spécifie le label du composant. | Toute valeur de chaîne. |

## Checkbox

```js
"checkbox1": {
  "type": "checkbox",
  "styles": {
    "checkboxColor": "#025aa3",
    "disabled": false,
    "textColor": "#025aa3",
    "visibility": "true"
  },
  "value": false,
  "label": "Checkbox"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `checkbox` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *checkboxColor*, *disabled*, *textColor*, *visibility*, etc. |
| checkboxColor | Spécifie la couleur de la case à cocher. | Nom de couleur ou code couleur hexadécimal.  |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| textColor | Spécifie la couleur du texte du composant. | Nom de couleur ou code couleur hexadécimal.  |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| value | Spécifie la valeur par défaut de la case à cocher. | Valeur booléenne (true ou false). |
| label | Spécifie le label du composant. | Toute valeur de chaîne comme 'Accept T&C'. |

## Toggle

```js
"toggleswitch1": {
  "type": "toggle",
  "styles": {
    "textColor": "#025aa3",
    "disabled": false,
    "visibility": "true",
    "toggleSwitchColor": "#025aa3"
  },
  "value": true,
  "label": "Toggle switch"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `toggle` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *textColor*, *disabled*, *visibility*, *toggleSwitchColor* etc. |
| textColor | Spécifie la couleur du texte du composant. | Nom de couleur ou code couleur hexadécimal.  |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| toggleSwitchColor | Spécifie la couleur de l'interrupteur à bascule. | Nom de couleur ou code couleur hexadécimal.  |
| value | Spécifie la valeur par défaut de l'interrupteur à bascule. | Valeur booléenne (true ou false) |
| label | Spécifie le label du composant. | Toute valeur de chaîne. |

## Text Area

```js
"textArea1": {
  "type": "textarea",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "borderRadius": 5
  },
  "value": "This is a text area",
  "placeholder": "Enter Text Here",
  "label": "Text Area"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `textarea` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *disabled*, *visibility*, *borderRadius*, etc. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique. |
| value | Spécifie la valeur par défaut de la zone de texte. | Valeur de type chaîne. |
| placeholder | Spécifie le texte d'espace réservé de la zone de texte. | Valeur de type chaîne. |
| label | Spécifie le label du composant. | Valeur de type chaîne. |

## Date Range Picker

```js
"daterangepicker1": {
  "type": "daterangepicker",
  "styles": {
    "disabled": true,
    "visibility": "true",
    "borderRadius": 5
  },
  "defaultEndDate": "12/04/2022",
  "defaultStartDate": "1/04/2022",
  "format": "DD/MM/YYYY",
  "label": "Select a Date Range"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | *daterangepicker* |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *disabled*, *visibility*, *borderRadius*, etc. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique. |
| defaultEndDate | Spécifie la date de fin par défaut. | Date dans le format correct. |
| defaultStartDate | Spécifie la date de début par défaut. | Date dans le format correct. |
| format | Spécifie le format de la date. | 'DD/MM/YYYY' |
| label | Spécifie le label du composant. | Valeur de type chaîne. |

## Multiselect

```js
"multiselect1": {
  "type": "multiselect",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "borderRadius": 5
  },
  "displayValues": ["one", "two", "three"],
  "label": "Select Options of Your Choice",
  "value": [2, 3],
  "values": [1, 2, 3],
  "showAllOption": true
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `multiselect` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *disabled*, *visibility*, *borderRadius* etc. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique. |
| displayValues | Spécifie la valeur pour les labels des options sous forme de tableau. | Tableau de chaînes comme `["one", "two", "three"]`. |
| label | Spécifie le label du composant. | Valeur de type chaîne. |
| value | Spécifie la ou les valeurs par défaut dans un tableau. | Tableau de valeurs comme `[2, 3]`. |
| values | Spécifie les valeurs dans un tableau. | Tableau de valeurs comme `[1, 2, 3]`. |
| showAllOption | Spécifie s'il faut afficher l'option 'All' dans le composant ou non. | Définissez `true` pour afficher l'option 'All' ou `false` pour la masquer. |

## Star Rating

```js
"starRating1": {
  "type": "starrating",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "textColor": "gold",
    "labelColor": "#025aa3"
  },
  "allowHalfStar": true,
  "defaultSelected": 3.5,
  "maxRating": 5,
  "tooltips": ["one", "two", "three", "four"],
  "label": "Select a Rating"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `starrating` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *disabled*, *visibility*, *textColor*, *labelColor* etc. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| textColor | Spécifie la couleur des étoiles. | Nom de couleur ou code couleur hexadécimal.  |
| labelColor | Spécifie la couleur du label. | Nom de couleur ou code couleur hexadécimal.  |
| allowHalfStar | Spécifie s'il faut permettre la sélection d'une demi-étoile ou non. | Définissez `true` pour autoriser les notes en demi-étoiles ou `false` pour désactiver cette option. |
| defaultSelected | Spécifie la valeur par défaut de la notation par étoiles. | Valeur numérique |
| maxRating | Spécifie la note maximale. | Valeur numérique |
| tooltips | Spécifie les infobulles pour chaque étoile dans un tableau. | Tableau de chaînes comme `['one', 'two', 'three', 'four']`. |
| label | Spécifie le label du composant. | Valeur de type chaîne. |

## File Picker

```js
"filepicker1": {
  "type": "filepicker",
  "styles": {
    "visibility": "true",
    "borderRadius": 10
  },
  "enableMultiple": true,
  "fileType": "*/*",
  "instructionText": "Click here to select files",
  "maxFileCount": 5,
  "maxSize": 6000000,
  "minSize": 25,
  "parseContent": true,
  "parseFileType": "csv",
  "label": "Select a File"
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `filepicker` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *visibility*, *borderRadius* etc. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique |
| enableMultiple | Spécifie s'il faut activer la sélection multiple de fichiers ou non. | Définissez `true` pour activer la sélection multiple de fichiers ou `false` pour la désactiver. |
| fileType | Spécifie le type de fichier MIME. | Types MIME comme '*/*' (accepte tous les types de fichiers). |
| instructionText | Spécifie le texte d'instruction du sélecteur de fichiers. | Valeur de type chaîne |
| maxFileCount | Spécifie le nombre maximum de fichiers qui peuvent être sélectionnés. | Valeur numérique |
| maxSize | Spécifie la taille maximale du fichier en octets. | Valeur numérique comme 6000000 (6 Mo). |
| minSize | Spécifie la taille minimale du fichier en octets. | Valeur numérique comme 25. |
| parseContent | Spécifie s'il faut analyser le contenu du fichier ou non. | Définissez `true` pour analyser le contenu ou `false` pour désactiver cette option. |
| parseFileType | Spécifie le type de fichier à analyser (par ex., csv, text, xlsx). | Type de fichier |
| label | Spécifie le label du composant. | Valeur de type chaîne. |

## Text Input

```js
"textinput1": {
  "type": "textinput",
  "value": "John",
  "placeholder": "Enter the Name Here",
  "label": "First Name",
  "validation": {
    "maxLength": 6
  },
  "styles": {
    "backgroundColor": "#f6f5ff",
    "borderRadius": 5,
    "errorTextColor": "#025aa3",
    "disabled": false,
    "visibility": false,
    "textColor": "#025aa3"
  }
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `textinput` |
| value | Spécifie la valeur par défaut du champ de saisie de texte. | Valeur de type chaîne |
| placeholder | Spécifie le texte d'espace réservé du champ de saisie de texte. | Valeur de type chaîne |
| label | Spécifie le label du composant. | Valeur de type chaîne |
| validation | Spécifie les règles de validation pour le champ de saisie de texte. | Objet contenant la propriété `maxLength`. |
| maxLength | Spécifie la validation de longueur maximale du champ de saisie de texte. | Valeur numérique |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *backgroundColor*, *borderRadius*, *errorTextColor*, *disabled*, *visibility*, *textColor* etc. |
| backgroundColor | Spécifie la couleur d'arrière-plan du composant. | Nom de couleur ou code couleur hexadécimal.  |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique |
| errorTextColor | Spécifie la couleur du texte d'erreur. | Nom de couleur ou code couleur hexadécimal.  |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `false` pour masquer le composant ou `true` pour l'afficher. |
| textColor | Spécifie la couleur du texte du composant. | Nom de couleur ou code couleur hexadécimal.  |

## Dropdown

```js
"dropdown1": {
  "type": "dropdown",
  "displayValues": ["One", "Two", "Three"],
  "values": [1, 2, 3],
  "loading": false,
  "value": 2,
  "label": "Select a Number",
  "styles": {
    "disabled": false,
    "visibility": "true",
    "borderRadius": 5,
    "justifyContent": "start"
  }
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `dropdown` |
| displayValues | Spécifie la valeur pour les labels des options sous forme de tableau. | Tableau de valeurs comme `[1, 2, 3]`. |
| values | Spécifie les labels des options dans un tableau. | Tableau de chaînes comme `['one', 'two', 'three']`. |
| loading | Spécifie s'il faut afficher l'état de chargement ou non. | Définissez `true` pour afficher l'état de chargement ou `false` pour le masquer. |
| value | Spécifie la valeur sélectionnée par défaut du dropdown. | Toute valeur du tableau `values`. |
| label | Spécifie le label du composant. | Valeur de type chaîne |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *disabled*, *visibility*, *borderRadius*, *justifyContent* etc. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| borderRadius | Spécifie le rayon de bordure du composant. | Valeur numérique |
| justifyContent | Spécifie l'alignement des options du dropdown. | `start`, `center`, ou `end` |

## Button

```js
"button1": {
  "type": "button",
  "value": "Submit",
  "label": "",
  "styles": {
    "backgroundColor": "#3A433B",
    "textColor": "white",
    "borderRadius": 5,
    "borderColor": "#595959",
    "loaderColor": "gray",
    "visibility": "true",
    "disabled": true
  }
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `button` |
| value | Spécifie le texte du bouton. | Valeur de type chaîne |
| label | Spécifie le label du composant. | Valeur de type chaîne |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *backgroundColor*, *textColor*, *borderRadius*, *borderColor*, *loaderColor*, *visibility*, *disabled* etc. |
| backgroundColor | Spécifie la couleur d'arrière-plan du bouton. | Nom de couleur ou code couleur hexadécimal.  |
| textColor | Spécifie la couleur du texte du bouton. | Nom de couleur ou code couleur hexadécimal.  |
| borderRadius | Spécifie le rayon de bordure du bouton. | Valeur numérique |
| borderColor | Spécifie la couleur de la bordure du bouton. | Nom de couleur ou code couleur hexadécimal.  |
| loaderColor | Spécifie la couleur du loader sur le bouton. | Nom de couleur ou code couleur hexadécimal.  |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |

## Text

```js
"text1": {
  "type": "text",
  "value": "This is a text component",
  "label": "",
  "styles": {
    "backgroundColor": "#f6f5ff",
    "textColor": "#025aa3",
    "fontSize": 12,
    "fontWeight": 500
  }
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `text` |
| value | Spécifie la valeur du composant texte. | Valeur de type chaîne |
| label | Spécifie le label du composant. | Valeur de type chaîne |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *backgroundColor*, *textColor*, *fontSize*, *fontWeight* etc. |
| backgroundColor | Spécifie la couleur d'arrière-plan du texte. | Nom de couleur ou code couleur hexadécimal.  |
| textColor | Spécifie la couleur du texte. | Nom de couleur ou code couleur hexadécimal.  |
| fontSize | Spécifie la taille de police du texte. | Valeur numérique |
| fontWeight | Spécifie l'épaisseur de police du texte. | Valeur numérique |

## Radio

```js
"radioButton1": {
  "type": "radio",
  "styles": {
    "textColor": "black",
    "disabled": false,
    "visibility": "true"
  },
  "displayValues": ["Yes", "No"],
  "label": "Radio Buttons",
  "value": 1,
  "values": [1, 2]
}
```

| <div style={{ width:"100px"}}> Clé </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Valeur attendue </div> |
| :----------- | :----------- | :-----------|
| type | Spécifie le type de composant. | `radio` |
| styles | Spécifie les styles du composant. | Objet qui contiendra les styles du composant comme *textColor*, *disabled*, *visibility*, etc. |
| textColor | Spécifie la couleur du texte des options radio. | Nom de couleur ou code couleur hexadécimal.  |
| disabled | Spécifie s'il faut désactiver le composant ou non. | Définissez `true` pour désactiver le composant ou `false` pour l'activer. |
| visibility | Spécifie s'il faut afficher le composant ou non. | Définissez `true` pour afficher le composant ou `false` pour le masquer. |
| displayValues | Spécifie la valeur pour les labels sous forme de tableau. | Tableau de chaînes comme `['option 1', 'option 2', 'option 3']`. |
| label | Spécifie le label du composant. | Valeur de type chaîne |
| value | Spécifie la valeur sélectionnée par défaut du bouton radio. | Toute valeur du tableau `values`. |
| values | Spécifie les valeurs dans un tableau. | Tableau de valeurs comme `[1, 2, 3]`. |

---
id: dynamic-column
title: Dynamic Columns
---

ToolJet permet aux utilisateurs de définir dynamiquement les colonnes d'un composant **Table** à l'aide d'une valeur JSON. Ce guide explique comment configurer des colonnes dynamiques dans ToolJet.

## Utiliser Dynamic Column

1. Faites glisser un composant **Table** depuis la bibliothèque de composants à droite sur le canevas.
2. Peuplez le composant **Table** avec des données en le connectant à une requête.
3. Activez l'option Use dynamic column.
4. Saisissez du JSON pour définir dynamiquement les colonnes de la **Table**. Par exemple :

```json 
{
  "name": "Name",
  "columnType": "string",
  "key": "first_name",
  "cellBackgroundColor": "#000",
  "textColor": "#fff",
  "isEditable": true,
  "regex": "",
  "maxLength": 20,
  "minLength": 5,
  "customRule": ""
}
```

Cette configuration affiche une colonne intitulée Name avec des données de type string modifiables, dont la longueur est limitée entre 5 et 20 caractères, en texte blanc sur fond noir.

## Afficher un schéma de table différent selon l'utilisateur actuel

Vous pouvez utiliser les colonnes dynamiques pour afficher des schémas de table différents selon l'utilisateur actuel. Prenons un exemple avec le schéma ci-dessous :

| ID | Name | Email | Department | Salary | Performance | Login |
|----|------|-------|------------|--------|-------------|-------|

Ici, deux schémas différents doivent être affichés selon l'utilisateur actuel.

**Pour un administrateur :**

| ID | Name | Email | Department | Salary | Performance | Login |
|----|------|-------|------------|--------|-------------|-------|

**Pour les employés :**

| ID | Name | Email | Department | Login |
|----|------|-------|------------|-------|

1. Pour configurer le schéma selon l'utilisateur, activez la propriété Use dynamic column.

2. Utilisez la logique JSON suivante pour ajuster dynamiquement le schéma selon le rôle de l'utilisateur actuel :

```json
{{globals.currentUser.groups.includes("admin") ? [
  { name: 'id', key: 'id', id: '1' },
  { name: 'Name', key: 'name', id: '2' },
  { name: 'Email', key: 'email', id: '3' },
  { name: 'Department', key: 'department', id: '4' },
  { name: 'Salary', key: 'salary', id: '5' },
  { name: 'Performance Rating', key: 'performance', id: '6' },
  { name: 'Last Login', columnType:"datePicker", key: 'login', id: '7' }
] : [
  { name: 'id', key: 'id', id: '1' },
  { name: 'Name', key: 'name', id: '2' },
  { name: 'Email', key: 'email', id: '3' },
  { name: 'Department', key: 'department', id: '4' },
  { name: 'Last Login', columnType:"datePicker", key: 'login', id: '5' }
]}}
```

## Spécifier le type de colonne

Les colonnes dynamiques dans ToolJet prennent en charge divers types, tels que les chaînes, les nombres, les dates et les liens.

Dans cet exemple, vous pouvez voir comment spécifier un type de colonne à l'aide des colonnes dynamiques.

1. Ajoutez un composant **Table** avec les colonnes et types de colonnes suivants :
    - Profile Photo - Image
    - Name - String
    - Contact Number - Number
    - Date of Birth - Datepicker
    - Website URL - Link

2. Activez l'option Use dynamic column.

3. Ajoutez le JSON suivant pour définir les colonnes :

```json
{{[
  {name: 'Profile', key: 'photo',columnType: 'image', id: '1'},
  {name: 'Name', key: 'name', columnType:'string', id: '2'},
  {name: 'Contact', key: 'mobile_number', columnType:'number', id: '3'},
  {name: 'DOB', key: 'date', columnType:'datepicker', id: '4'}, 
  {name: 'Website', key: 'website', columnType:'link', id: '5'}
]}}
```

Cette configuration créera une table avec les types de colonnes spécifiés.

## Définir une largeur de colonne par défaut

Vous pouvez définir la largeur par défaut d'une colonne en pixels en ajoutant une propriété `width` à l'objet colonne. Ceci est particulièrement utile pour les colonnes dynamiques, pour lesquelles vous ne pouvez pas redimensionner les en-têtes dans l'éditeur.

```json
{{[
  {
    "name": "Item Name",
    "key": "item_name",
    "columnType": "string",
    "width": 150,
    "id": "1"
  },
  {
    "name": "Price",
    "key": "price",
    "columnType": "number",
    "width": 100,
    "id": "2"
  }
]}}
```

Si un utilisateur redimensionne manuellement une colonne dans l'éditeur, sa préférence est enregistrée. Au prochain rechargement, la valeur `width` du JSON est appliquée à nouveau comme valeur par défaut, remplaçant tout redimensionnement précédemment enregistré. Cela fait de la configuration JSON la source de référence pour les largeurs de colonnes.

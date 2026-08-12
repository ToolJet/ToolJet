---
id: baserow
title: Baserow
---

ToolJet peut se connecter à votre compte Baserow pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données **Baserow**, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à Baserow :

- **API token**
- **Host**
- **Base URL**

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-connection.png" alt="Baserow intro" />

## Interroger Baserow

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Baserow** ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée dans la liste déroulante et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-listops.png" alt="Query Operations of Baserow" />

## Opérations prises en charge

- **[List fields](#list-fields)**
- **[List rows](#list-rows)**
- **[Get row](#get-row)**
- **[Create row](#create-row)**
- **[Update row](#update-row)**
- **[Move row](#move-row)**
- **[Delete row](#delete-row)**

### List Fields

Cette requête liste tous les champs d'une table.

#### Paramètre requis

- **Table ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-listf.png" alt="Baserow list fields" />

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>

  ```yaml
  [
    {
      "id": 331156,
      "table_id": 56472,
      "name": "Name",
      "order": 0,
      "type": "text",
      "primary": true,
      "text_default": ""
    },
    {
      "id": 331157,
      "table_id": 56472,
      "name": "Last name",
      "order": 1,
      "type": "text",
      "primary": false,
      "text_default": ""
    },
    {
      "id": 331158,
      "table_id": 56472,
      "name": "Notes",
      "order": 2,
      "type": "long_text",
      "primary": false
    },
    {
      "id": 331159,
      "table_id": 56472,
      "name": "Active",
      "order": 3,
      "type": "boolean",
      "primary": false
    }
  ]
  ```

</details>

### List Rows

Cette requête liste toutes les lignes d'une table.

#### Paramètre requis

- **Table ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-listr.png" alt="Baserow list rows"/>

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  
  ```json
  {
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 2,
        "order": "0.99999999999999999991",
        "Name": "Bill",
        "Last name": "Gates",
        "Notes": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce dignissim, urna eget rutrum sollicitudin, sapien diam interdum nisi, quis malesuada nibh eros a est.",
        "Active": false
      },
      {
        "id": 3,
        "order": "0.99999999999999999992",
        "Name": "Mark",
        "Last name": "Zuckerberg",
        "Notes": null,
        "Active": true
      },
      {
        "id": 1,
        "order": "0.99999999999999999997",
        "Name": "Elon",
        "Last name": "Musk",
        "Notes": null,
        "Active": true
      }
    ]
  }
  ```

</details>

### Get Row

#### Paramètres requis

- **Table ID**
- **Row ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-getrow.png" alt="Baserow get" />

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  
  ```json
  {
    "id": 1,
    "order": "0.99999999999999999997",
    "Name": "Elon",
    "Last name": "Musk",
    "Notes": null,
    "Active": true
  }
  ```

</details>

### Create Row

#### Paramètres requis
- **Table ID**
- **Records**

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-createrow.png"  alt="Bserow create"/>

#### Exemple

```json
{
  "Name": "Test",
  "Last name": "Test Name",
  "Notes": "Test Note",
  "Active": true
}
```

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  
  ```json
  {
    "id": 19,
    "order": "0.99999999999999999996",
    "Name": "Test",
    "Last name": "Test Name",
    "Notes": "Test Note",
    "Active": true
  }
  ```

</details>

### Update Row

#### Paramètres requis

- **Table ID**
- **Row ID**
- **Records**

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-updaterow.png" alt="Baserow update" />

#### Exemple

```json
{
  "Name": "Test",
  "Last name": "Test Name",
  "Notes": "Test Note",
  "Active": true
}
```

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  
  ```json
  {
    "id": 19,
    "order": "0.99999999999999999996",
    "Name": "Test",
    "Last name": "Test Name",
    "Notes": "Test Note",
    "Active": true
  }
  ```

</details>

### Move Row

#### Paramètres requis

- **Table ID**
- **Row ID**

#### Paramètres optionnels

- **Before ID** (la ligne sera déplacée avant l'ID saisi. Si aucune valeur n'est fournie, la ligne sera déplacée à la fin)

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-moverow.png" alt="Baserow move row" />

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
    
  ```json
  {
    "id": 3,
    "order": "2.00000000000000000000",
    "Name": "Mark",
    "Last name": "Zuckerburg",
    "Notes": null,
    "Active": true
  }
  ```

</details>

### Delete Row

#### Paramètres requis
- **Table ID**
- **Row ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/baserow/baserow-deleterow.png" alt="Baserow delete" />

Lors de la suppression d'une ligne, la réponse renvoyée par Baserow sera soit un succès, soit un échec.

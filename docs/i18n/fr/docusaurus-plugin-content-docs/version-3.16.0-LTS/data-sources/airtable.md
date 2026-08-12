---
id: airtable
title: Airtable
---

ToolJet peut se connecter à votre compte **Airtable** pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données **Airtable**, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview/)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à votre Airtable :
- **Personal Access Token**

Vous pouvez générer le Personal Access Token en vous rendant sur le **[Developer Hub depuis votre profil Airtable](https://support.airtable.com/docs/creating-and-using-api-keys-and-access-tokens#understanding-personal-access-token-basic-actions)**.

<img className="screenshot-full img-full" src="/img/datasource-reference/airtable/airtable-connection.png" alt="Airtable Data Source Connection" />

:::info
L'API Airtable applique une limite de débit, et au moment de la rédaction de cette documentation, cette limite est de cinq (5) requêtes par seconde et par base. Vous pouvez en savoir plus sur les limites de débit ici : **[Airtable API](https://airtable.com/api)**.
:::

## Interroger Airtable

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **Airtable** ajoutée à l'étape précédente.
3. Sélectionnez l'opération souhaitée dans la liste déroulante et saisissez les paramètres requis.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/airtable/airtable-listops.png" alt="Airtable Data Source list Operations" />

## Opérations prises en charge

- **[List records](#list-records)**
- **[Retrieve record](#retrieve-record)**
- **[Create record](#create-record)**
- **[Update record](#update-record)**
- **[Delete record](#delete-record)**

### List Records

Cette opération récupère une liste d'enregistrements depuis la table spécifiée.

#### Paramètres requis

- **Base ID** : l'identifiant unique de la base Airtable.
- **Table name** : le nom ou l'ID de la table depuis laquelle récupérer les enregistrements.

#### Paramètres optionnels*

- **Page size** : le nombre d'enregistrements à retourner par page.
- **Offset** : utilisé pour la pagination afin de récupérer l'ensemble suivant d'enregistrements.
- **Filter by formula** : une formule permettant de filtrer les enregistrements.
- **Fields** : indique les champs à inclure dans la réponse.
- **Timezone** : le fuseau horaire à utiliser pour les champs de date et d'heure.
- **User locale** : la locale à utiliser pour le formatage des champs de date et d'heure.
- **Cell format** : détermine la façon dont les valeurs des cellules sont retournées. Les valeurs possibles sont :
      - **json** : retourne les valeurs des cellules sous forme d'objets JSON, selon le type de champ.
      - **string** : retourne les valeurs des cellules sous forme de chaînes de caractères.
- **View** : indique la vue depuis laquelle récupérer les enregistrements.
- **Sort** : définit l'ordre de tri des enregistrements.

:::info
Timezone et User locale sont interdépendants. Si vous fournissez un fuseau horaire, vous devez également fournir une locale utilisateur, et vice versa. Ces propriétés ne sont appliquées que lorsque le format de cellule est défini sur string. Pour formater correctement les champs de date et d'heure, assurez-vous que le type de colonne est défini sur Date ou Date Time dans Airtable.
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/airtable/airtable-listrec.png" alt="Airtable List Records Query" />

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  
  ```json
  {
    "records": [
      {
        "id": "recToGRP6bWUG6djd",
        "createdTime": "2016-11-21T20:21:40.000Z",
        "fields": {
          "Usage (# Weeks)": "3",
          "Email": "Edith Lindon",
          "Date": "11-21-2016"
        }
      },
      {
        "id": "recnUVJ8wwZbdECLk",
        "createdTime": "2016-11-21T20:21:40.000Z",
        "fields": {
          "Usage (# Weeks)": "3",
          "Email": "Marcellus Wong",
          "Date": "11-21-2016"
        }
      },
      {
        "id": "recStKhQYw4Fn2qpj",
        "createdTime": "2016-11-21T20:21:40.000Z",
        "fields": {
          "Usage (# Weeks)": "2",
          "Email": "Lorraine Ljuba",
          "Date": "11-21-2016"
        }
      }
    ]
  }
  ```
</details>

### Retrieve Record

Cette opération récupère un enregistrement spécifique depuis la table spécifiée.

#### Paramètres requis

- **Base ID**
- **Table name**
- **Record ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/airtable/retrieve-rec.png" alt="Airtable Retrieve Record Query" />

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  ```json
  {
    "id": "recu9xMnUdr2n2cw8",
    "fields": {
      "Notes": "Discuss project timeline",
      "Name": "Michael Scott"
    },
    "createdTime": "2021-05-12T14:30:33.000Z"
  }
  ```
</details>

### Create Record

Cette opération crée un nouvel enregistrement dans la table spécifiée.

#### Paramètres requis

- **Base ID**
- **Table name**
- **Records**

<img className="screenshot-full img-full" src="/img/datasource-reference/airtable/create-rec.png" alt="Airtable Create Record Query" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json title="Records"
[{
    "fields": {
      "Name": "Katrina Petersons",
      "Email": "katrina.petersions@example.com"
    }
}]
```
</details>

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  ```json
  {
    "records": [
      {
        "id": "recu6jhA7tzv4K66s",
        "createdTime": "2024-06-11T06:01:44.000Z",
        "fields": {
          "Name": "Katrina Petersons",
          "Email": "katrina.petersions@example.com",
          "Date": "06-11-2024",
        }
      }
    ]
  }
  ```
</details>

### Update record

Met à jour un enregistrement spécifique en fournissant de nouvelles données.

#### Paramètres requis :

- **Base ID**
- **Table name**
- **Record ID**
- **Body**

<img className="screenshot-full img-full" src="/img/datasource-reference/airtable/update-rec.png" alt="Airtable Update Record Query" />

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "Email": "katrina.petersions2@example.com"
}
```
</details>

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  ```json
  {
    "records": [
      {
        "id": "recu6jhA7tzv4K66s",
        "createdTime": "2024-06-11T07:01:44.000Z",
        "fields": {
          "Name": "Katrina Petersons",
          "Email": "katrina.petersions2@example.com",
          "Date": "06-11-2024",
        }
      }
    ]
  }
  ```
</details>

### Delete record

Cette opération supprime un enregistrement de la table spécifiée.

#### Paramètres requis :

- **Base ID**
- **Table name**
- **Record ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/airtable/delete-rec.png" alt="Airtable Delete Record Query" />

<details id="tj-dropdown">
  <summary>**Exemple de réponse**</summary>
  ```json
  {
      deleted: true
      id: "recIKsyZgqI4zoqS7"
  }
  ```
</details>

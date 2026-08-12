---
id: bigquery
title: BigQuery
---

ToolJet peut se connecter à des bases de données **BigQuery** pour exécuter des requêtes BigQuery.

## Connexion

Pour établir une connexion avec la source de données **BigQuery**, vous pouvez soit cliquer sur le bouton **+ Add new Data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet et choisir BigQuery comme source de données.

### OAuth 2.0 

ToolJet requiert les éléments suivants pour établir une connexion OAuth avec votre BigQuery :

- **Project ID** : saisissez l'ID du projet Google Cloud contenant vos jeux de données BigQuery.
- **Region** : sélectionnez la région où se trouvent vos ressources BigQuery.
- **Client ID** : saisissez l'ID client OAuth 2.0 obtenu depuis votre projet Google Cloud.
- **Client Secret** : saisissez le secret client OAuth 2.0 associé à l'ID client.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/connection-oauth.png" alt=" Bigquery Oauth connection " />

### Service Account

ToolJet requiert les éléments suivants pour établir une connexion par compte de service (Service Account) avec votre BigQuery :

- **Private Key** : saisissez la clé privée JSON de votre compte de service Google Cloud.
- **Scope** : indiquez le scope OAuth requis pour accéder aux ressources BigQuery.
- **Region** : sélectionnez la région où se trouvent vos ressources BigQuery.

:::warning
Lorsque vous saisissez plusieurs scopes, séparez-les par des espaces. L'utilisation de tout autre caractère peut provoquer des erreurs.

Exemple : `https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/drive`
:::

Comment obtenir une clé privée ?

1. Vous devez activer l'API BigQuery dans votre console Google Cloud. Vous pouvez suivre les étapes pour activer l'API BigQuery depuis **[Google Cloud](https://cloud.google.com/bigquery/docs/bigquery-web-ui)**.
2. Vous devez créer un compte de service et générer une clé pour celui-ci. Vous pouvez suivre les étapes pour créer un compte de service depuis **[Google Cloud](https://cloud.google.com/iam/docs/creating-managing-service-accounts)**.
3. Une fois le compte de service créé en suivant les étapes mentionnées dans le guide Google Cloud, créez une nouvelle **Key** et téléchargez-la sous forme de fichier JSON.
4. Ensuite, copiez et collez les données du fichier JSON téléchargé dans le champ **Private key** du formulaire de la source de données BigQuery.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/connection-service-acc.png" alt="Bigquery service account connection" />

**Le fichier JSON devrait ressembler à ceci :**

```json
{
  "type": "service_account",
  "project_id": "long-sonar-324407",
  "private_key_id": "63f4415e600bd7879bc14fd1157a4aabe227c204",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDRGgDmfwYcKp4q\n3ce4DkrKv0vTn/Jn2Z2vEHp+oOz5ebZqmE3v56c6YIvtVRblANILPrOsB5ZvkF5f\nEzZBXn7ZI3+dqKBrpxbJqF6bKTLENdgFZRTbXHtGDpmwX4A+ufir9QNoezRw0i5L\nnVZiVC54f/Qt/cKT8794qSnrxNX1TneZLGxJWou9VAl3xT9h2HdL56gYIuleWXDK\nnXkb3Leh9AMZCdFPMyC24MWefWrUbNkqJ7V8FHo7bMrAcFNuSoF2NfK1v6IPLkEs\nwAU0CJ9VSg6rrahQOqIJ04cdYs2OUh4lRvRB6pqlVvtl6EdJB6dHln1nDzpgHbnb\n+acfwEDnAgMBAAECggEAGs/mSKgGDQuL73wztU6j2X6RBwhN6XIWjZGj22PgLxcj\nxGRWLgp6v3oMxzhvcJrb1BRMrqTkbdbJuxA4F0a6JjaukPVD6Lnqqp37z5KHT3CG\nDB8LfxtLNU7+9wYv6Bspn0cSEk4mCcdxp0F8B6y6rrndgh41WopZRWwPk4tQUh1r\nor67AAYd3rtzGMLoghs+8UE+UYa8wbpsbmHEYgqvXQAkNsl8WdNwqmI0G4lf+pgx\n7Rm27LJrtdBBHc48RUhg2eiN05HLCsnwkrnSj0rLL/L7T1yoSfCSUuv1mTUesxQ1\nXUEsPQQTTsNsqKOxT71CzQLElrPfwZkN4Y/IOJqX3QKBgQD6u0idi2r54hMjBSuk\npLgXygH5AWfHc4QqMCui7HZrFOJ4U4AreI/zZrM3Gemgs+1l27wsUjoxADW2Egyq\nX5AVe94RKSV3cCIIty38VOUBVsgyxj38d8yWkpJKJ2FcAgqEzPDDo0TCaOEq01oA\nYqjkgBz7Sh4XhQ5xwzfnOPRPtQKBgQDVfsly/k03wAJo1xlUZeq9mAnba5Hz07x9\nJ3REAwrtOaD891rKbkqDZKdGHTMweFGeEW2Hx7Q5iRS4WDKFO14wgSHFTkkVoSKR\n2W7XMomUQPFojQwgkDhrxsGE8O1DqfQ0+A5AJn2ASv/cyVGE3V2xg2rGr/HWi6Wq\nUp4FxebXqwKBgQDNIcCNNG03N6EUe7xzHViIDfuDL4UqhvXQVky9JNzVSubmLtqj\ntiV/q7xgDlE36z0EorvXPwbg5B0NcsLt+PU2vnq2a4V9rD4MB2IWGZaqe8ea0toP\n3iuB3TTWelWLIxhcAhfQ15j/vTLLCNOPkShAmhgb902bTH6+0ErCX7RyKQKBgQCe\nDOeLpvF5VT8zaBILZgva4eRiOQdqz5RZvsyW0P3U0vX4cBIZjH7DOM+Q22sa9efO\nMi6490HX2kCpnDmCYon/NInQrHz0cz7JZINm8rXhOBa/hLO2o63xM8nt5gJwNjBg\nykaafSQpxtwWEj+0McD7+kMg5f4OC4HQTqtHsNONUwKBgAoWGGRPja068BPIiUMB\nezsdYPP5TdASiBeAEPaQXQHlJxPDu9KoKqM5xvWIdR8eH1z7cuQ3RP89hYT03/UT\nBvWXHk2MJQZK7BZDw9KMZAKexK9/qxwHS6i7HhErD+Au3UaRX8dfjJzX8WAwuAwp\nVDwHncN3n4mPFQl7eijnQZ/F\n-----END PRIVATE KEY-----\n",
  "client_email": "tooljettest@long-sonar-324407.iam.gserviceaccount.com",
  "client_id": "103664451567222591066",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tooljettest%40long-sonar-324407.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## Interroger BigQuery en mode SQL

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **BigQuery** ajoutée à l'étape précédente.
3. Sélectionnez **SQL mode** dans la liste déroulante.
4. Saisissez la requête SQL et configurez les paramètres optionnels si nécessaire.
5. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour déclencher la requête.

### Syntaxe des paramètres SQL

Lorsque vous utilisez des paramètres dans les requêtes SQL BigQuery, utilisez la syntaxe `@parameter_name` pour les paramètres nommés. Contrairement aux autres sources de données SQL de ToolJet, BigQuery n'utilise pas la syntaxe `:parameter_name`.

**Exemple :**

```sql
SELECT
    word,
    word_count
  FROM
    `bigquery-public-data.samples.shakespeare`
  WHERE
    corpus = @corpus
  AND
    word_count >= @min_word_count
  ORDER BY
    word_count DESC;
```

Dans cet exemple, `@corpus` et `@min_word_count` sont des paramètres de requête nommés.

BigQuery prend en charge les paramètres de requête uniquement lors de l'utilisation de GoogleSQL. Les paramètres de requête ne peuvent être utilisés que pour des valeurs et ne peuvent pas remplacer des identifiants tels que des noms de table, des noms de colonne ou d'autres parties de l'instruction SQL.

**Paramètre requis**
- SQL Query : la requête GoogleSQL à exécuter.

**Paramètres optionnels**
- SQL Parameters : définit les paramètres de requête nommés utilisés dans la requête SQL.
- Query options : configure des options d'exécution telles que la location, le dry run, la priorité, etc.
- Query results options : configure la façon dont les résultats de la requête sont retournés.

<img style={{marginBottom:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/bigquery/sql-mode.png" alt="Bigquery sql mode" />

:::tip
Les résultats de la requête peuvent être transformés à l'aide des transformations. Consultez notre documentation sur les transformations pour savoir comment faire : [lien](/docs/app-builder/custom-code/transform-data)
:::

## Interroger BigQuery en mode GUI

Le mode GUI permet d'interroger la source de données BigQuery sans écrire de requêtes.

1. Créez une nouvelle requête et sélectionnez la source de données BigQuery.
2. Sélectionnez **GUI mode** dans la liste déroulante.
3. Choisissez l'opération que vous souhaitez effectuer.
4. Saisissez les paramètres requis pour l'opération sélectionnée.
5. Cliquez sur le bouton **Preview** pour afficher le résultat, ou sur le bouton **Run** pour déclencher la requête.

### Query

Récupère des données d'une table BigQuery en configurant les options de requête.

**Paramètre requis**
- Query : saisissez la requête GoogleSQL à exécuter.

**Paramètres optionnels**
- SQL Parameters : indique les valeurs des paramètres de requête nommés référencés dans la requête SQL.
- Query options : configure les options d'exécution de la requête telles que la location ou la priorité.
- Query result options : configure la façon dont les résultats de la requête sont retournés.

<img className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-query.png" alt="Bigquery GUI mode Query" />

### List Datasets

Récupère tous les jeux de données disponibles dans le projet BigQuery sélectionné.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-list.png" alt="Bigquery GUI mode List datasets" />

### List Tables

Récupère toutes les tables d'un jeu de données sélectionné.

**Paramètre requis**
- Dataset ID : sélectionnez le jeu de données dont vous souhaitez lister les tables.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-list-tables.png" alt="Bigquery GUI mode List tables" />

### Get Dataset Info

Récupère les métadonnées et les détails d'un jeu de données sélectionné.

**Paramètre requis**
- Dataset ID : sélectionnez le jeu de données dont vous souhaitez récupérer les détails.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-get-dataset.png" alt="Bigquery GUI mode Get dataset info" />

### Create Table

Crée une nouvelle table au sein d'un jeu de données sélectionné.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données dans lequel la table sera créée.
- Table ID : saisissez un identifiant unique pour la nouvelle table.
- Options : indiquez le schéma de la table ainsi que toute autre option de création de table BigQuery, au format JSON.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "schema": [
    {
      "name": "order_id",
      "type": "STRING"
    },
    {
      "name": "customer_name",
      "type": "STRING"
    },
    {
      "name": "product_name",
      "type": "STRING"
    },
    {
      "name": "quantity",
      "type": "INTEGER"
    },
    {
      "name": "order_amount",
      "type": "FLOAT"
    },
    {
      "name": "order_status",
      "type": "STRING"
    },
    {
      "name": "order_date",
      "type": "DATE"
    }
  ],
  "location": "US"
}
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-create.png" alt="Bigquery GUI mode Create table" />

### Delete Table

Supprime une table existante d'un jeu de données.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données dans lequel la table sera supprimée.
- Table ID : sélectionnez la table à supprimer.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-delete-table.png" alt="Bigquery GUI mode Delete table" />

### Create View

Crée une vue BigQuery à l'aide d'une requête SQL.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données dans lequel la vue sera créée.
- Table ID : sélectionnez la table source à partir de laquelle la vue sera créée.
- View name : saisissez un nom unique pour la vue.
- View columns : indiquez les colonnes à inclure dans la vue.

**Paramètres optionnels**
- Condition : filtre les lignes incluses dans la vue.
- Query options : configure les options d'exécution de la requête telles que la location ou le dry run.
- Query results options : configure la façon dont les résultats de la requête sont retournés.

<img className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-create-view.png" alt="Bigquery GUI mode Create view" />

### Insert Record

Insère une seule ligne dans une table.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données contenant la table.
- Table ID : sélectionnez la table dans laquelle l'enregistrement sera inséré.
- Rows : indiquez l'enregistrement à insérer, au format JSON.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
[
  {
  "employee_id": "1001",
  "employee_name": "John Smith",
  "department": "Engineering",
  "email": "john.smith@example.com",
  "salary": 85000,
  "is_active": true
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-insert.png" alt="Bigquery GUI mode Insert record" />

### Delete Record

Supprime des lignes d'une table selon des conditions spécifiées.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données depuis lequel l'enregistrement sera supprimé.
- Table ID : sélectionnez la table source depuis laquelle l'enregistrement sera supprimé.

**Paramètres optionnels**
- Condition : indique un filtre pour supprimer les enregistrements correspondants. Si ce paramètre est omis, tous les enregistrements de la table sélectionnée sont supprimés.
- Query options : configure les options d'exécution de la requête telles que la location ou le dry run.
- Query results options : configure la façon dont les résultats de la requête sont retournés.

<img className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-delete-record.png" alt="Bigquery GUI mode Delete record" />

### Update Record

Met à jour des lignes existantes d'une table selon des conditions spécifiées.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données contenant la table.
- Table ID : sélectionnez la table dans laquelle les enregistrements seront mis à jour.
- Columns : indiquez les valeurs de colonnes à mettre à jour.

**Paramètres optionnels**
- Condition : indique un filtre pour ne mettre à jour que les enregistrements correspondants. Si ce paramètre est omis, tous les enregistrements de la table sélectionnée sont mis à jour.
- Query options : configure les options d'exécution de la requête telles que la location.
- Query results options : configure la façon dont les résultats de la requête sont retournés.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
{
  "department": "Engineering",
  "designation": "Senior Software Engineer",
  "salary": 95000,
  "is_active": true
}
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-update.png" alt="Bigquery GUI mode Update record" />

### Bulk Insert

Insère plusieurs lignes dans une table en une seule opération.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données contenant la table.
- Table ID : sélectionnez la table dans laquelle les enregistrements seront insérés.
- Records to Insert : indiquez les enregistrements à insérer sous forme de tableau d'objets JSON.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
[
  {
    "employee_id": "1001",
    "employee_name": "John Smith",
    "department": "Engineering",
    "designation": "Software Engineer",
    "salary": 85000,
    "joining_date": "2026-01-15"
  },
  {
    "employee_id": "1002",
    "employee_name": "Emily Johnson",
    "department": "Sales",
    "designation": "Sales Executive",
    "salary": 72000,
    "joining_date": "2026-02-01"
  },
  {
    "employee_id": "1003",
    "employee_name": "Michael Brown",
    "department": "Human Resources",
    "designation": "HR Manager",
    "salary": 90000,
    "joining_date": "2025-11-10"
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-bulk-insert.png" alt="Bigquery GUI mode Bulk insert" />

### Bulk Update using Primary Key

Met à jour plusieurs lignes en faisant correspondre leurs valeurs de clé primaire.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données contenant la table.
- Table ID : sélectionnez la table contenant les enregistrements à mettre à jour.
- Primary key column(s) : indiquez la ou les colonnes utilisées pour identifier les enregistrements à mettre à jour.
- Records to update : indiquez les enregistrements à mettre à jour sous forme de tableau d'objets JSON.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
[
  {
    "employee_id": "101",
    "designation": "Senior Software Engineer",
    "salary": 95000,
    "department": "Engineering"
  },
  {
    "employee_id": "102",
    "designation": "Sales Manager",
    "salary": 82000,
    "department": "Sales"
  },
  {
    "employee_id": "103",
    "designation": "HR Director",
    "salary": 110000,
    "department": "Human Resources"
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-bulk-update.png" alt="Bigquery GUI mode Bulk update" />

### Bulk Upsert using Primary Key

Insère de nouvelles lignes ou met à jour les lignes existantes en fonction de leurs valeurs de clé primaire.

**Paramètres requis**
- Dataset ID : sélectionnez le jeu de données contenant la table.
- Table ID : sélectionnez la table dans laquelle les enregistrements seront insérés ou mis à jour.
- Primary key column(s) : indiquez la ou les colonnes utilisées pour identifier les enregistrements existants.
- Records to upsert : indiquez les enregistrements à insérer ou à mettre à jour sous forme de tableau d'objets JSON.

<details id="tj-dropdown">
<summary>**Exemple de valeurs**</summary>
```json
[
  {
    "employee_id": "101",
    "designation": "Senior Software Engineer",
    "salary": 95000,
    "department": "Engineering"
  },
  {
    "employee_id": "104",
    "designation": "Operations Head",
    "salary": 77000,
    "department": "HR"
  },
  {
    "employee_id": "105",
    "designation": "Developer Advocate",
    "salary": 65000,
    "department": "Development"
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-bulk-upsert.png" alt="Bigquery GUI mode Bulk upsert" />
